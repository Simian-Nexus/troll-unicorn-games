param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot 'bluehost-publish.config.json'),
    [string]$Target = 'candyDashApi',
    [string[]]$Files,
    [switch]$ChangedOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Not candy-dash's own folder — the T&U-root config's target paths (see
# Troll_and_Unicorn/tools/bluehost-publish.config.json) are written relative
# to the Troll & Unicorn project root, not this game's own folder, since
# that one config covers every T&U sub-project's FTP targets. tools/ is
# 4 levels under that root: tools -> candy-dash -> TAU_HTML5_Games ->
# 03_Games -> Troll_and_Unicorn.
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
# Troll & Unicorn-wide Bluehost FTP config — one place for every T&U
# sub-project's upload targets (candy-dash today, future T&U games/sites
# later), sharing the same studio Bluehost account credentials the
# budgeting app and spinningmonkeystudios-wp-site publishers already use.
$sharedStudioConfig = Join-Path $repoRoot 'tools\bluehost-publish.config.json'

function Get-Config {
    param([string]$PrimaryPath, [string]$FallbackPath)

    if (Test-Path $PrimaryPath) {
        return Get-Content $PrimaryPath -Raw | ConvertFrom-Json
    }

    if (Test-Path $FallbackPath) {
        return Get-Content $FallbackPath -Raw | ConvertFrom-Json
    }

    throw "Publish config not found. Checked: $PrimaryPath and $FallbackPath"
}

function Get-RemoteBaseInfo {
    param([pscustomobject]$Config)

    $account = $null
    if ($Config.PSObject.Properties.Name -contains 'apiPublish') {
        $account = $Config.apiPublish
    }
    elseif ($Config.PSObject.Properties.Name -contains 'filePublish') {
        $account = $Config.filePublish
    }
    else {
        throw 'No compatible publish account was found in the config file.'
    }

    $rawBaseUrl = [string]$account.baseUrl
    if ([string]::IsNullOrWhiteSpace($rawBaseUrl)) {
        throw 'publish baseUrl must be set.'
    }

    try {
        $baseUri = [Uri]$rawBaseUrl
    }
    catch {
        throw "publish baseUrl is not a valid FTP URL: $rawBaseUrl"
    }

    if ($baseUri.Scheme -notin @('ftp', 'ftps')) {
        throw "publish baseUrl must use ftp:// or ftps://. Current value: $rawBaseUrl"
    }

    if ($baseUri.AbsolutePath -and $baseUri.AbsolutePath -ne '/') {
        throw "publish baseUrl must point at the FTP root host only. Current value: $rawBaseUrl"
    }

    return [pscustomobject]@{
        BaseUrl = 'ftp://' + $baseUri.Authority
        Credential = '{0}:{1}' -f $account.username, $account.password
        IsExplicitFtps = $baseUri.Scheme -eq 'ftps'
    }
}

function Invoke-CurlUpload {
    param(
        [pscustomobject]$RemoteInfo,
        [string]$LocalPath,
        [string]$RemotePath
    )

    $commonArgs = @(
        '--silent',
        '--show-error',
        '--fail',
        '--tlsv1.2',
        '--user',
        $RemoteInfo.Credential,
        '--ftp-create-dirs',
        '--upload-file',
        $LocalPath,
        $RemotePath
    )

    if ($RemoteInfo.IsExplicitFtps) {
        $commonArgs = @('--ssl-reqd', '--ssl-no-revoke') + $commonArgs
    }

    # Bluehost's FTPS (box5132, ProFTPD) intermittently drops the final
    # control-channel ACK after a successful STOR, which curl reports as
    # "server did not report OK, got 451" (exit 18) even though the file
    # transferred. Retrying clears it within a couple of attempts.
    $maxAttempts = 4
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        & curl.exe @commonArgs
        if ($LASTEXITCODE -eq 0) { return }
        if ($attempt -lt $maxAttempts) {
            Write-Host "  upload attempt $attempt failed (exit $LASTEXITCODE), retrying..."
            Start-Sleep -Seconds 2
        }
    }

    throw "curl failed while uploading $LocalPath to $RemotePath after $maxAttempts attempts (exit code $LASTEXITCODE)"
}

function Invoke-CurlDownload {
    param(
        [pscustomobject]$RemoteInfo,
        [string]$RemotePath,
        [string]$DestinationPath
    )

    $commonArgs = @(
        '--silent',
        '--show-error',
        '--fail',
        '--tlsv1.2',
        '--user',
        $RemoteInfo.Credential,
        $RemotePath,
        '-o',
        $DestinationPath
    )

    if ($RemoteInfo.IsExplicitFtps) {
        $commonArgs = @('--ssl-reqd', '--ssl-no-revoke') + $commonArgs
    }

    $maxAttempts = 4
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        & curl.exe @commonArgs
        if ($LASTEXITCODE -eq 0) { return }
        if ($attempt -lt $maxAttempts) {
            Write-Host "  download attempt $attempt failed (exit $LASTEXITCODE), retrying..."
            Start-Sleep -Seconds 2
        }
    }

    throw "curl failed while downloading $RemotePath after $maxAttempts attempts (exit code $LASTEXITCODE)"
}

function Get-TargetConfig {
    param(
        [pscustomobject]$Config,
        [string]$TargetName
    )

    $targetConfig = $null
    if ($Config.PSObject.Properties.Name -contains 'targets') {
        $targetConfig = $Config.targets.$TargetName
    }

    if (-not $targetConfig -and $TargetName -eq 'candyDashApi' -and ($Config.PSObject.Properties.Name -contains 'apiPublish' -or $Config.PSObject.Properties.Name -contains 'filePublish')) {
        $targetConfig = [pscustomobject]@{
            localPath = '03_Games/TAU_HTML5_Games/candy-dash/backend/api/public'
            remotePath = '/games/candydash'
            healthCheckUrl = 'https://api.spinningmonkeystudios.com/games/candydash/health'
        }
    }

    if (-not $targetConfig) {
        throw "Target '$TargetName' was not found in the publish config."
    }

    if (-not $targetConfig.localPath -or -not $targetConfig.remotePath) {
        throw "Target '$TargetName' must define localPath and remotePath."
    }

    return $targetConfig
}

function Get-ChangedFilesForTarget {
    param(
        [string]$RepoRoot,
        [string]$LocalRoot
    )

    $statusLines = git -C $RepoRoot status --short
    $relativeRoot = [IO.Path]::GetRelativePath($RepoRoot, $LocalRoot).Replace('\', '/')
    $publishable = @()

    foreach ($line in $statusLines) {
        if ($line.Length -lt 4) { continue }
        $relative = $line.Substring(3).Trim().Replace('\', '/')
        if (-not $relative.StartsWith($relativeRoot + '/')) { continue }

        $candidate = Join-Path $RepoRoot $relative
        if (Test-Path $candidate -PathType Leaf) {
            $publishable += $relative
        }
    }

    return $publishable | Sort-Object -Unique
}

function Get-RelativePathSafe {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $baseFull = [IO.Path]::GetFullPath($BasePath).TrimEnd('\')
    $targetFull = [IO.Path]::GetFullPath($TargetPath)

    if ($targetFull.StartsWith($baseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $targetFull.Substring($baseFull.Length).TrimStart('\').Replace('\', '/')
    }

    throw "Could not compute relative path from $BasePath to $TargetPath"
}

function Test-RemoteFileMatchesLocal {
    param(
        [pscustomobject]$RemoteInfo,
        [string]$LocalPath,
        [string]$RemoteUrl
    )

    $tempFile = Join-Path $env:TEMP ([IO.Path]::GetRandomFileName())
    try {
        Invoke-CurlDownload -RemoteInfo $RemoteInfo -RemotePath $RemoteUrl -DestinationPath $tempFile
        $localHash = (Get-FileHash -LiteralPath $LocalPath -Algorithm SHA256).Hash
        $remoteHash = (Get-FileHash -LiteralPath $tempFile -Algorithm SHA256).Hash
        return $localHash -eq $remoteHash
    }
    finally {
        if (Test-Path $tempFile) {
            Remove-Item -LiteralPath $tempFile -Force
        }
    }
}

$config = Get-Config -PrimaryPath $ConfigPath -FallbackPath $sharedStudioConfig
$remoteInfo = Get-RemoteBaseInfo -Config $config
$targetConfig = Get-TargetConfig -Config $config -TargetName $Target
$localRoot = Join-Path $repoRoot $targetConfig.localPath

if (-not (Test-Path $localRoot -PathType Container)) {
    throw "Local target folder not found: $localRoot"
}

$pathsToPublish = @()
if ($Files -and $Files.Count -gt 0) {
    $pathsToPublish = $Files
}
elseif ($ChangedOnly) {
    $pathsToPublish = @(Get-ChangedFilesForTarget -RepoRoot $repoRoot -LocalRoot $localRoot)
}
else {
    $pathsToPublish = Get-ChildItem -Path $localRoot -Recurse -File | ForEach-Object {
        Get-RelativePathSafe -BasePath $repoRoot -TargetPath $_.FullName
    }
}

if (@($pathsToPublish).Count -eq 0) {
    Write-Host 'No backend files to publish.'
    exit 0
}

foreach ($relativePath in ($pathsToPublish | Sort-Object -Unique)) {
    $localPath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path $localPath -PathType Leaf)) {
        throw "Local file not found: $localPath"
    }

    $relativeFromTarget = Get-RelativePathSafe -BasePath $localRoot -TargetPath $localPath
    $remoteBase = ([string]$targetConfig.remotePath).TrimEnd('/')
    $remoteUrl = "$($remoteInfo.BaseUrl)$remoteBase/$relativeFromTarget"

    Write-Host "Uploading $relativePath"
    Invoke-CurlUpload -RemoteInfo $remoteInfo -LocalPath $localPath -RemotePath $remoteUrl

    if (-not (Test-RemoteFileMatchesLocal -RemoteInfo $remoteInfo -LocalPath $localPath -RemoteUrl $remoteUrl)) {
        throw "Remote verification failed for $relativePath"
    }
}

if ($targetConfig.healthCheckUrl) {
    Write-Host "Health check URL: $($targetConfig.healthCheckUrl)"
}

Write-Host 'Candy Dash backend publish complete.'
