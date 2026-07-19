<?php
declare(strict_types=1);

// Candy Dash leaderboard backend — same framework-free single-front-controller
// pattern as the budgeting app backend (see
// Budgeting_App/02_Android_Src/backend/api/public/index.php), mounted under
// api.spinningmonkeystudios.com instead of its own bespoke API.

ini_set('display_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL);
ob_start();

$config = [
    'environment' => 'production-like',
    'database' => [
        'host' => '',
        'port' => 3306,
        'database' => '',
        'username' => '',
        'password' => '',
        'charset' => 'utf8mb4',
        'table' => 'candydash_leaderboard',
    ],
    // Optional second connection — e.g. the Troll & Unicorn WordPress
    // database — so newsletter opt-ins can land somewhere the website's own
    // DB can read directly, instead of only inside the game's own database.
    // Left blank, this is skipped entirely and opt-ins still get recorded
    // in the primary leaderboard table's email/newsletter_optin columns.
    'newsletterDatabase' => [
        'host' => '',
        'port' => 3306,
        'database' => '',
        'username' => '',
        'password' => '',
        'charset' => 'utf8mb4',
        'table' => 'candydash_newsletter_optins',
    ],
    'cors' => [
        'allowedOrigins' => '*',
    ],
];

$runtimeHost = strtolower(trim(explode(':', $_SERVER['HTTP_HOST'] ?? 'localhost')[0]));
$isPrivateIpv4 = filter_var($runtimeHost, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false
    && filter_var(
        $runtimeHost,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    ) === false;
$isLocalRuntime = in_array(
    $runtimeHost,
    ['localhost', '127.0.0.1', 'api.spinningmonkeystudios.test'],
    true
) || $isPrivateIpv4;

// dirname(__DIR__, 2) / dirname(__DIR__) match the *local repo* layout
// (backend/config/, backend/api/), which assumes backend/api/public/'s
// parent folders get deployed too. They don't — the publish script only
// ships api/public/'s contents, flattened directly into the remote
// games/candydash/ folder — so on the live server, __DIR__ *is* that
// folder and "beside index.php" literally means __DIR__ itself. Checked
// first since it's what actually matches production; the dirname(...)
// variants are kept as harmless fallbacks in case a future deploy ever
// preserves the fuller backend/ nesting instead.
$configCandidates = $isLocalRuntime
    ? [
        dirname(__DIR__, 2) . '/config/candydash-api.config.json',
        dirname(__DIR__, 2) . '/config/candydash-api.config.php',
        dirname(__DIR__) . '/candydash-api.config.json',
        dirname(__DIR__) . '/candydash-api.config.php',
    ]
    : [
        __DIR__ . '/candydash-api.config.php',
        __DIR__ . '/candydash-api.config.json',
        dirname(__DIR__, 2) . '/config/candydash-api.config.php',
        dirname(__DIR__, 2) . '/config/candydash-api.config.json',
        dirname(__DIR__) . '/candydash-api.config.php',
        dirname(__DIR__) . '/candydash-api.config.json',
        dirname(__DIR__) . '/candydash-config/candydash-api.config.php',
        dirname(__DIR__) . '/candydash-config/candydash-api.config.json',
    ];

foreach ($configCandidates as $configPath) {
    if (!is_file($configPath)) {
        continue;
    }

    $loadedConfig = null;
    if (str_ends_with($configPath, '.php')) {
        $loadedConfig = require $configPath;
    } else {
        $jsonContents = (string) file_get_contents($configPath);
        $jsonContents = preg_replace('/^\xEF\xBB\xBF/', '', $jsonContents);
        $loadedConfig = json_decode($jsonContents, true);
    }

    if (is_array($loadedConfig)) {
        $config = array_replace_recursive($config, $loadedConfig);
        break;
    }
}

// Not user input — comes only from config — safe to interpolate into SQL
// directly (PDO can't bind identifiers), but whitelisted anyway as cheap
// insurance against a bad config value.
$LB_TABLE = preg_replace('/[^a-zA-Z0-9_]/', '', (string) ($config['database']['table'] ?? 'candydash_leaderboard'));
$NEWSLETTER_TABLE = preg_replace('/[^a-zA-Z0-9_]/', '', (string) ($config['newsletterDatabase']['table'] ?? 'candydash_newsletter_optins'));

header('Access-Control-Allow-Origin: ' . (string) ($config['cors']['allowedOrigins'] ?? '*'));
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$path = parse_url($requestUri, PHP_URL_PATH);
$path = is_string($path) ? rtrim($path, '/') : '';
$path = $path === '' ? '/' : $path;

$knownPrefix = '/games/candydash';
if ($path === $knownPrefix) {
    $path = '/';
} elseif (str_starts_with($path, $knownPrefix . '/')) {
    $path = substr($path, strlen($knownPrefix));
}

$now = gmdate('c');
$databaseConfig = $config['database'] ?? [];
$basePayload = [
    'ok' => true,
    'service' => 'candydash-api',
    'environment' => (string) ($config['environment'] ?? 'production-like'),
    'timestamp' => $now,
];

function respond(int $statusCode, array $payload): void
{
    if ($statusCode >= 400) {
        $payload['ok'] = false;
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function createPdo(array $databaseConfig): ?PDO
{
    $isConfigured = !empty($databaseConfig['host']) && !empty($databaseConfig['database']) && !empty($databaseConfig['username']);
    if (!$isConfigured) {
        return null;
    }

    $charset = (string) ($databaseConfig['charset'] ?? 'utf8mb4');
    $port = (int) ($databaseConfig['port'] ?? 3306);
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        (string) $databaseConfig['host'],
        $port,
        (string) $databaseConfig['database'],
        $charset
    );

    try {
        return new PDO(
            $dsn,
            (string) $databaseConfig['username'],
            (string) ($databaseConfig['password'] ?? ''),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    } catch (PDOException $e) {
        return null;
    }
}

function databaseHealth(array $databaseConfig, string $table): array
{
    $isConfigured = !empty($databaseConfig['host']) && !empty($databaseConfig['database']) && !empty($databaseConfig['username']);
    if (!$isConfigured) {
        return [
            'configured' => false,
            'reachable' => false,
            'message' => 'Database credentials are not configured.',
        ];
    }

    $pdo = createPdo($databaseConfig);
    if (!$pdo) {
        return [
            'configured' => true,
            'reachable' => false,
            'message' => 'Could not connect.',
        ];
    }

    try {
        $pdo->query('SELECT 1');
        $tableQuery = $pdo->prepare(
            'SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name = ?'
        );
        $tableQuery->execute([(string) $databaseConfig['database'], $table]);
        $tableExists = $tableQuery->fetchColumn() !== false;

        return [
            'configured' => true,
            'reachable' => true,
            'message' => 'Database connection succeeded.',
            'database' => (string) $databaseConfig['database'],
            'schema' => ['complete' => $tableExists, 'missingTables' => $tableExists ? [] : [$table]],
        ];
    } catch (Throwable $exception) {
        return [
            'configured' => true,
            'reachable' => false,
            'message' => $exception->getMessage(),
        ];
    }
}

function boundedInt($value, int $min, int $max, int $default = 0): int
{
    if (!is_numeric($value)) {
        return $default;
    }
    return max($min, min($max, (int) $value));
}

function readJsonPayload(): array
{
    $payload = json_decode((string) file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function submitLeaderboardScore(PDO $pdo, string $table, array $body): array
{
    // Name: required, trimmed, tags stripped, capped to match the client's
    // maxlength (see index.html #lb-name).
    $name = trim(strip_tags((string) ($body['name'] ?? '')));
    $name = mb_substr($name, 0, 20);
    if ($name === '') {
        return ['error' => 'Name is required.'];
    }

    // Sanity caps, not real anti-cheat — a casual browser game, not a
    // competitive one, so trusting the client's reported numbers within a
    // plausible range is an acceptable trade for staying simple.
    $score = boundedInt($body['score'] ?? null, 0, 999999);
    $crittersRedeemed = boundedInt($body['critters_redeemed'] ?? null, 0, 9999);
    $crittersLost = boundedInt($body['critters_lost'] ?? null, 0, 9999);
    $timeSeconds = isset($body['time_seconds']) ? boundedInt($body['time_seconds'], 0, 36000) : null;

    $newsletterOptin = !empty($body['newsletter_optin']);
    $email = null;
    if ($newsletterOptin) {
        $candidate = trim((string) ($body['email'] ?? ''));
        $email = filter_var($candidate, FILTER_VALIDATE_EMAIL) ?: null;
        if ($email === null) {
            return ['error' => 'A valid email is required to opt in to the newsletter.'];
        }
    }

    $stmt = $pdo->prepare(
        "INSERT INTO `$table`
            (name, score, critters_redeemed, critters_lost, time_seconds, email, newsletter_optin)
         VALUES (:name, :score, :redeemed, :lost, :time, :email, :optin)"
    );
    $stmt->execute([
        'name' => $name,
        'score' => $score,
        'redeemed' => $crittersRedeemed,
        'lost' => $crittersLost,
        'time' => $timeSeconds,
        'email' => $email,
        'optin' => $newsletterOptin ? 1 : 0,
    ]);

    return [
        'id' => (int) $pdo->lastInsertId(),
        'email' => $email,
        'newsletterOptin' => $newsletterOptin,
        'name' => $name,
    ];
}

// Best-effort mirror into a second database (e.g. the WordPress one) so the
// website side has its own copy to read without cross-database access. This
// never blocks or fails the leaderboard submit — the opt-in is already safe
// in the primary table's email/newsletter_optin columns either way.
function recordNewsletterOptinElsewhere(array $newsletterDatabaseConfig, string $table, string $name, string $email): void
{
    $pdo = createPdo($newsletterDatabaseConfig);
    if (!$pdo) {
        return;
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO `$table` (email, name, source)
             VALUES (:email, :name, 'candy-dash')
             ON DUPLICATE KEY UPDATE name = VALUES(name)"
        );
        $stmt->execute(['email' => $email, 'name' => $name]);
    } catch (Throwable $exception) {
        // Swallowed on purpose — see comment above.
    }
}

function fetchTopScores(PDO $pdo, string $table, int $limit): array
{
    // email is intentionally never selected — that stays server-side for
    // the newsletter list only.
    $stmt = $pdo->prepare(
        "SELECT id, name, score, critters_redeemed, critters_lost, time_seconds
         FROM `$table`
         ORDER BY score DESC, (time_seconds IS NULL) ASC, time_seconds ASC
         LIMIT :limit"
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

if ($path === '/v1/candydash/leaderboard/submit' && $method === 'POST') {
    $pdo = createPdo($databaseConfig);
    if (!$pdo) {
        respond(500, $basePayload + ['path' => $path, 'error' => 'database_not_configured']);
    }

    $result = submitLeaderboardScore($pdo, $LB_TABLE, readJsonPayload());
    if (isset($result['error'])) {
        respond(400, $basePayload + ['path' => $path, 'error' => $result['error']]);
    }

    if ($result['newsletterOptin'] && $result['email'] !== null) {
        recordNewsletterOptinElsewhere(
            $config['newsletterDatabase'] ?? [],
            $NEWSLETTER_TABLE,
            $result['name'],
            $result['email']
        );
    }

    respond(200, $basePayload + ['path' => $path, 'id' => $result['id']]);
}

if ($path === '/v1/candydash/leaderboard/top' && $method === 'GET') {
    $pdo = createPdo($databaseConfig);
    if (!$pdo) {
        respond(500, $basePayload + ['path' => $path, 'error' => 'database_not_configured']);
    }

    $limit = boundedInt($_GET['limit'] ?? 10, 1, 50, 10);
    respond(200, $basePayload + ['path' => $path, 'scores' => fetchTopScores($pdo, $LB_TABLE, $limit)]);
}

// Standalone newsletter signup — no score attached, unlike the leaderboard
// submit's optional opt-in. Shown on the gameover screen (death is far more
// common than finishing the game, so it's a much bigger opt-in opportunity
// than the leaderboard's). Writes into the PRIMARY database's own
// candydash_newsletter_optins table (needs schema/candydash_newsletter_optins_schema.sql
// applied there too, not just newsletterDatabase), and best-effort mirrors
// to newsletterDatabase the same way the leaderboard-linked opt-in does.
if ($path === '/v1/candydash/newsletter/optin' && $method === 'POST') {
    $body = readJsonPayload();
    $email = filter_var(trim((string) ($body['email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: null;
    if ($email === null) {
        respond(400, $basePayload + ['path' => $path, 'error' => 'A valid email is required.']);
    }
    $name = mb_substr(trim(strip_tags((string) ($body['name'] ?? ''))), 0, 20);

    $pdo = createPdo($databaseConfig);
    if (!$pdo) {
        respond(500, $basePayload + ['path' => $path, 'error' => 'database_not_configured']);
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO `$NEWSLETTER_TABLE` (email, name, source)
             VALUES (:email, :name, 'candy-dash-gameover')
             ON DUPLICATE KEY UPDATE name = VALUES(name)"
        );
        $stmt->execute(['email' => $email, 'name' => $name !== '' ? $name : null]);
    } catch (Throwable $exception) {
        respond(500, $basePayload + ['path' => $path, 'error' => 'signup_failed']);
    }

    recordNewsletterOptinElsewhere($config['newsletterDatabase'] ?? [], $NEWSLETTER_TABLE, $name, $email);

    respond(200, $basePayload + ['path' => $path, 'ok' => true]);
}

switch ($path) {
    case '/':
        respond(200, $basePayload + [
            'message' => 'Candy Dash leaderboard API is live.',
            'routes' => [
                '/health',
                '/v1/candydash/version',
                'POST /v1/candydash/leaderboard/submit',
                'GET /v1/candydash/leaderboard/top',
            ],
        ]);

    case '/health':
    case '/v1/candydash/health':
        respond(200, $basePayload + [
            'path' => $path,
            'database' => databaseHealth($databaseConfig, $LB_TABLE),
            'newsletterDatabase' => databaseHealth($config['newsletterDatabase'] ?? [], $NEWSLETTER_TABLE),
        ]);

    case '/v1/candydash/version':
        respond(200, $basePayload + [
            'version' => '1.0.0',
            'path' => $path,
            'features' => ['leaderboard'],
        ]);

    default:
        respond(404, [
            'ok' => false,
            'service' => 'candydash-api',
            'path' => $path,
            'timestamp' => $now,
            'error' => 'Not found',
        ]);
}
