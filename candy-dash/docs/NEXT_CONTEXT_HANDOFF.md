# Candy Dash — Next Context Handoff

Written 2026-07-16, end of a long single-day session. Read this first if you're
picking up Candy Dash work; it's the "what's true right now" doc. `GAME_BIBLE.md`
is canon/lore, `CANDY_DASH_2_PLAN.md` is the full phase-by-phase history — this
file is the short version plus the one urgent housekeeping item (git).

> **2026-07-19 (even later, same day): newsletter permission gap found +
> fixed, obfuscated deployment build added, Brain docs closeout, git
> committed and pushed.**
> - The new gameover newsletter endpoint 500'd even after the table existed
>   — `hpnouimy_gameApi` had only `SELECT`+`INSERT` on `hpnouimy_candydash`
>   (deliberately, per earlier least-privilege advice), but the upsert
>   (`ON DUPLICATE KEY UPDATE`) needs `UPDATE` too. Jonathan added the grant
>   in cPanel; confirm it's also been added on `hpnouimy_wp68748` if the
>   WP-side mirror should handle repeat signups gracefully too.
> - **New: `npm run build`** (`package.json` + `tools/build-obfuscated.js`,
>   using `javascript-obfuscator`) produces `dist/game.js` — an obfuscated
>   build for actual deployment. `game.js` itself stays the readable source
>   or truth and is what `index.html` always loads locally; nothing about
>   local dev changed. Deliberately skips the obfuscator's heavier
>   transforms (`controlFlowFlattening`, `deadCodeInjection`,
>   `selfDefending`, `splitStrings`) since this is a real 60fps canvas game
>   with a per-frame physics loop, not a script where runtime cost doesn't
>   matter — verified via Playwright that the obfuscated build renders and
>   plays identically (movement, jump, candy pickup all confirmed) before
>   committing it. `dist/game.js` **is** committed to git on purpose (see
>   `.gitignore`'s comment) since deploys are manual FileZilla, not a CI
>   step — **when deploying, upload `dist/game.js` renamed to `game.js` on
>   the server, not the readable source file.**
> - Brain docs closeout done at the T&U project level too (separate from
>   this file) — `06_Planning/Brain/30_ACTIVE_WORK.md`,
>   `Areas/GAMES.md` (previously just a "Needs audit" stub),
>   `20_DECISIONS_AND_GOTCHAS.md`, `40_SESSION_LOG.md`, and
>   `NEXT_CONTEXT_BRIEF.md` (which had a stale "not in git at all" claim —
>   fixed) all updated. `00_CURRENT_STATE.md` deliberately left untouched —
>   that file is website-scoped and out of this session's territory.
> - This repo (`candy-dash`, own git repo with GitHub remote
>   `Simian-Nexus/troll-unicorn-games.git`) committed and pushed at the end
>   of this session — check `git log` for the actual commit messages rather
>   than assuming this doc lists every change; this handoff is the
>   narrative, git history is the record.
> - **Real bug, found live**: "shot a World-2 critter, it died and stayed
> purple" — `enemySprites`/`purifiedSprites` were populated via bare
> `new Image()` calls with only `onload`, no `onerror`, unlike every other
> asset in the file (which goes through `loadImg()`'s 2-retry logic). A
> single dropped request left that kind's purified sprite permanently
> undefined for the rest of the session — the critter was correctly healed
> in game *state* (`healed=true`, unhittable, wanders) but
> `drawEnemy()`'s `purifiedSprites[kind] || enemySprites[kind]` fallback
> silently kept drawing the corrupted look forever. Likely present for a
> while but only surfaced now because bumping `ASSET_VERSION` (this
> session, for the unicorn images) forced every sprite to refetch instead
> of serving from cache. Fixed by routing both through `loadImg()`.
> - **New: gameover-screen newsletter CTA** — death is far more common than
>   finishing the game, so it's a much bigger opt-in opportunity than the
>   leaderboard's own checkbox. Dismissible/remembered via localStorage
>   (`NEWSLETTER_ASKED_KEY`) so it doesn't nag every retry. New backend
>   route `POST /v1/candydash/newsletter/optin` (email only, no score)
>   writes into the **primary** database's own `candydash_newsletter_optins`
>   table (needs `backend/sql/candydash_newsletter_optins_schema.sql`
>   applied to `hpnouimy_candydash` too now, not just the WP DB — this is a
>   new requirement, wasn't needed before this endpoint existed) and
>   best-effort mirrors to `newsletterDatabase` if configured, same as the
>   leaderboard-linked opt-in.
> - **New: social share buttons** on all three screens (menu/gameover/
>   finale) — `.share-btn` elements, one `shareGame()` in `game.js` using
>   `navigator.share` where available, falling back to clipboard-copy (or a
>   new-tab open if clipboard access fails) on desktop. Buttons now sit in
>   a horizontal `.btn-row` alongside each screen's main action button
>   (Play/Settings, Retry Level, Play Again) rather than stacking.
> - Sparkles' `UNICORN_CALL_LINE` said "bring me that energy" — changed to
>   "candy" (Jonathan, 2026-07-19) to match the game's own terminology
>   (Matrix-energy *candies*, not "energy" alone). The Troll gameover quote
>   with "Same energy" was left alone — unrelated idiom, not the mechanic.
> - **Not yet done**: `candydash_newsletter_optins_schema.sql` needs
>   running against `hpnouimy_candydash` (the primary DB) for the new
>   gameover CTA to actually persist signups — right now that endpoint will
>   500 until that table exists there. Usual FileZilla upload still needed
>   for `game.js`/`index.html`/`style.css`; backend changes need the usual
>   `tools/publish-candydash-backend.ps1` (or Jeeves can run it).

> **2026-07-19 (later still, same day): World-2 sink-platform sprite flicker
> fixed, boss defeat sequence actually persists now, new boss-redemption
> dialogue system.**
> - **Sink-platform flicker (root cause found by a background Explore
>   agent, fix verified by hand-tracing the arithmetic — not live-verified
>   in a real playtest; blind-scripted Playwright input proved too
>   imprecise to reliably land Troll on a specific platform within
>   reasonable effort, so **please confirm live** next time you're in
>   World 2).** `updatePlayerVertical()`'s landing test only gave
>   `sink: true` platforms extra slack on the *re-land* side
>   (`prevFootY <= surfY + slack`), not the *penetration* side
>   (`footY >= surfY`) — so standing still on a sinking platform, gravity's
>   ~0.7px/frame fall couldn't out-pace the surface receding at
>   `SINK_RATE*dt` (~1px/frame), `grounded` flipped false for a frame,
>   `standPlatform` reset to null so the platform started *recovering*
>   (popping back up) that same frame, Troll re-landed next frame, and the
>   whole 1-2 frame cycle repeated — rendered as the idle/jump sprite
>   visibly flashing. Fixed with a matching `penetrationSlack` on the other
>   side of the test (`game.js`, `updatePlayerVertical`).
> - **Boss defeat sequence was quietly broken** — canon/comments said the
>   boss "collapses, then sits up dejected" and stays through the finale,
>   but the actual code reused the generic critter-purify pipeline
>   unconditionally: `BOSS_PURIFY_DURATION` (1.5s) faded him to invisible
>   via `globalAlpha` and then spliced him out of `obstacles` entirely,
>   regardless of whether the player had even reached the portal yet.
>   Fixed: the boss is now excluded from both the alpha fade and the
>   removal filter once purifying; the "falling" → "dejected" phase timer
>   (unchanged, `BOSS_DEFEAT_FALL_TIME`) now also **snaps him to a resting
>   y and zeroes his hop velocity** on that transition, since nothing was
>   previously clamping his fall — without that he'd have plummeted through
>   the floor forever now that nothing removes him.
> - **New: boss redemption dialogue**, per comic canon (Jonathan,
>   2026-07-19) — a defeated boss speaks in untranslated static first
>   (`BOSS_GARBLED_LINE`), then Troll's translation spell plays (a green
>   radial glow + green-tinted sparkles, `spawnBossSpellSparkles` —
>   sparkles gained an optional `color` field for this, default unchanged),
>   then the bubble swaps to his actual redeemed line
>   (`lvl.boss.redeemedLine`, per-boss-level data). Phase machine lives on
>   the boss object itself (`dialoguePhase`/`dialogueT`), ticked in the
>   same `update()` purifying loop, drawn via new `drawBossDialogue()`
>   called from `drawEnemy()`. Lines drafted for both existing bosses,
>   tied to their established agendas (GAME_BIBLE §9 /
>   STORY_ARC_PROPOSAL_10_WORLDS.md) — Forest Captain: disoriented relief
>   ("The Spillover" theme, corruption as accident); Dune Warden: relief at
>   finally being freed from guarding water for troops who never came.
>   Deliberately did *not* give either of them the "who built the
>   corruption?" question — that's reserved for World 6's Winder per the
>   story arc doc, and giving it to World 2 would jump the escalation.
> - **Not yet done**: live playtest of the flicker fix and a full real boss
>   fight through to "translated" dialogue (both needed — see above), and
>   this session's game.js/index.html/style.css/asset changes still need
>   Jonathan's usual FileZilla upload to go live.

> **2026-07-19 (later, same day): Leaderboard fully live end-to-end, plus a
> Sparkles "end of content" beat on the true finale, plus OG/share-preview
> tags.**
> - **Leaderboard resolved for real this time.** The actual root cause of
>   the entire "200 OK, empty body" saga: the FTP account's remotePath was
>   getting resolved against the wrong base — there are TWO folders on the
>   account both named similarly, and uploads were landing in a disconnected
>   decoy (`/public_html/spinningmonkeystudios.com/api.spinningmonkeystudios.com/games/candydash/`)
>   while the live site actually serves from `/games/candydash/` (unprefixed,
>   directly at the FTP account's own root). `Troll_and_Unicorn/tools/bluehost-publish.config.json`
>   already had the right value; several manual ad-hoc `curl` commands during
>   debugging just weren't using it. Also found and fixed along the way: a
>   username-casing mismatch (`hpnouimy_gameAPI` vs the actually-created
>   `hpnouimy_gameApi` — MySQL usernames are case-sensitive) and an empty
>   `newsletterDatabase.host`. Full round trip (submit → top-scores, plus a
>   real Playwright test against the live `trollandunicorn.com` game hitting
>   the live API) confirmed working. Two harmless test rows
>   (`LiveTest`/`OptinTest`/`PlaywrightE2E`) are sitting in the real
>   `candydash_leaderboard` table pending manual cleanup via phpMyAdmin.
> - **`backend/api/public/index.php`'s config-candidate paths were also
>   genuinely buggy** (separate from the FTP-path issue) — none of them
>   checked `__DIR__` itself, only `dirname(__DIR__)`/`dirname(__DIR__, 2)`,
>   which assumed the local repo's `backend/api/public/` nesting gets
>   preserved on deploy. It doesn't (the publish script ships `api/public/`'s
>   *contents*, flattened). Fixed: `__DIR__ . '/candydash-api.config.php'`
>   is now checked first.
> - **New: Sparkles "end of content" beat** on the true final finale (after
>   World 2's boss, `finaleNextLevel === null` only — not the World 1→2
>   transition). New `#finale-eoc` block in `index.html`, shown alongside the
>   leaderboard entry: confused-unicorn image (`assets/unicorn-confused.png`)
>   + "Lookth like we haventh finithed the game yeth!" for ~2.8s, then a
>   CSS-fade swap to a cheering pose (`assets/unicorn-candy-cheer.png`) with
>   a lisped "thanks for playing, more realms coming, go join the
>   leaderboard" line — see `enterFinale()` in `game.js`. Also swaps the
>   music to a new one-off `playVictoryMusic()` track
>   (`assets/Music/End_of_game_victory_music.mp3`, loops). Both new PNGs
>   were copied in from `02_Art_and_Audio/` — the candy-cheer one was a
>   5.25 MB, 8000×8000 print-resolution source file, downscaled to 400×400
>   (~99 KB) with ImageMagick before use; don't reuse the original
>   `02_Art_and_Audio` files directly for anything web-facing without
>   checking their size first. Visually verified locally via Playwright
>   (screenshot both stages) — not yet seen live since the game itself is
>   deployed by Jonathan via FileZilla, not by Claude (no FTP target
>   configured for the game's own hosting, only the backend API's).
> - **New: Open Graph / Twitter Card meta tags** in `index.html` — link
>   shares had no preview image at all (none ever existed in this file's git
>   history). Points at `assets/logo.png` for now (480×355, not the ideal
>   1200×630 OG ratio — ask Jonathan if he's made a better one before
>   assuming `logo.png` is still the source).
> - **Logo split into two assets, same day, right after the above.**
>   Jonathan replaced `logo.png` with a beautiful but highly detailed
>   1731×909 illustration — great as a large share-preview image, illegible
>   shrunk to the ~320px in-game menu header (`.logo`). Resolved by
>   splitting: he renamed the full image to `assets/splash_full.png` (now
>   what `og:image`/`twitter:image` point at — near-perfect OG aspect ratio
>   already, 1.90:1), and a new `assets/logo.png` was cropped tight to just
>   the "CandyDash / A Troll & Unicorn GAME" wordmark (640×320, ~400KB,
>   downscaled from an unusably large 1.17MB raw crop) for the menu header
>   and favicon. Verified locally via Playwright side-by-side screenshots
>   before finalizing — cropped version reads clearly at actual in-page
>   size, full version didn't.
> - **Still needs Jonathan's FileZilla upload**: `index.html`, `game.js`,
>   `style.css`, `assets/logo.png` (replaced), `assets/splash_full.png`
>   (new), and the two new `assets/unicorn-*.png` files, to
>   `trollandunicorn.com/Games/candydash/`. None of this session's game-side
>   changes are live yet, only the backend API changes (which use the
>   separate, Claude-accessible `candyDashApi` FTP target).

> **2026-07-19: Backend API is now actually deployed and live — the
> `/games/candydash` 404s are resolved.** This was done from the
> Spinning_Monkey_Studios super-root context (Jeeves), not from inside this
> game folder, because it needed visibility into the FTP account structure
> and the working `budgeting` deploy to diagnose against.
> - **There was no Node.js/Passenger gateway** intercepting requests — that
>   theory was wrong. `api.spinningmonkeystudios.com` is plain Apache
>   `.htaccess` rewrite + a per-product PHP front controller, identical
>   pattern to the budgeting app. The nested duplicate
>   `api.spinningmonkeystudios.com/api.spinningmonkeystudios.com/` folder
>   visible in FileZilla is unrelated stale content dated April 10 (predates
>   this game's work) — not in the live request path, not the cause of
>   anything. Leave it alone.
> - **Real root cause #1**: `Troll_and_Unicorn/tools/bluehost-publish.config.json`
>   (and its `.template.json`) had `candyDashApi.remotePath` set to
>   `/api.spinningmonkeystudios.com/games/candydash` — double-including the
>   subdomain segment, since the `WebHelperAPI` FTP account's own docroot
>   *is* `api.spinningmonkeystudios.com` already (same reason the working
>   `budgetingApi` target is just `/budgeting`, not
>   `/api.spinningmonkeystudios.com/budgeting`). Fixed to `/games/candydash`
>   in the config, template, and `tools/publish-candydash-backend.ps1`'s
>   fallback default.
> - **Real root cause #2**: Bluehost's FTPS server (box5132, ProFTPD)
>   intermittently drops the post-STOR control-channel ACK — curl reports
>   `curl: (18) server did not report OK, got 451` on roughly half of all
>   uploads, regardless of path, even to the already-working `budgeting`
>   folder when tested directly. Not a permissions or TLS-version issue (a
>   `--tlsv1.2` flag was tried and didn't reliably fix it either — the
>   failure is genuinely random). Fixed by adding a 4-attempt retry loop
>   (2s backoff) around both the curl upload and the post-upload hash-verify
>   download in `publish-candydash-backend.ps1`. This same flakiness likely
>   affects the other studio publish scripts (`publish-budgeting-backend.ps1`,
>   the WordPress/apps/dashboard publishers) if they ever get re-run against
>   this FTP account — none of them have this retry logic yet, only
>   candy-dash's does now.
> - **Deployed and verified**: `backend/api/public/.htaccess` +
>   `backend/api/public/index.php` uploaded, hash-verified against the
>   server, and `https://api.spinningmonkeystudios.com/games/candydash/health`
>   returns `200 OK` with `{"ok": true, "service": "candydash-api", ...}`.
> - **Still not done — needs Jonathan, not an AI session**: real DB
>   credentials. The health check currently reports
>   `"database": {"configured": false}` because `backend/config/
>   candydash-api.config.php` still doesn't exist — only the
>   `.template.php` with `replace_me_*` placeholders. Someone with cPanel
>   access needs to create a MySQL database + user (or reuse an existing
>   one), fill in the template, upload the filled config beside the
>   deployed `index.php` (or in a sibling `candydash-config/` folder, same
>   convention as budgeting's `budgeting-config/`), and import
>   `backend/sql/candydash_schema.sql`. Until then the API runs but every
>   leaderboard/score-submission request will fail at the DB step.
>   `game.js`'s `LEADERBOARD_API_BASE` should already point at the right
>   URL per the 2026-07-19 (earlier, same-day) entry below — worth
>   confirming a real end-to-end submit-score round trip once the DB
>   exists.

> 2026-07-17: `STORY_ARC_PROPOSAL_10_WORLDS.md` — 10-world story arc + 5 plot
> threads, written from a full read of episodes 1–8. **APPROVED AS CANON by
> Jonathan same day**; `GAME_BIBLE.md` §9 summarizes what's now in-game.
>
> **World 2 (Sun-Blasted Dunes) built 2026-07-17, same session:**
> - 5 new levels (2-1..2-5) with placeholder art (procedural dune parallax +
>   hue-shifted forest terrain — `tools/make_dunes_placeholders.py`;
>   real-art prompt pack in `docs/WORLD2_ASSET_PROMPTS.md`).
> - Per-level intro cutscene system (`lvl.intro`); Angus's World-2 beat
>   ("shootin' those critters TOO HARD — they're PATIENTS!") plays at 2-1,
>   and Angus now always appears inside the spinning vortex.
> - **Purified critters persist**: settle + wander harmlessly instead of
>   despawning (all worlds). New: sinking-sand platforms (`sink: true`).
> - World 1 finale now continues into World 2 (per-boss-level `finale` text,
>   button becomes "Onward to the next realm ▶").
> - **Bugfix (found live by Jonathan): shield made Troll immortal** — any
>   sliver of shield absorbed a whole hit and always regenerated in time.
>   Now absorbs only what it holds; overflow hits health. Verified in-browser:
>   health drains to game-over under sustained drone contact.
> - Dev shortcut: `?level=2-1` (name prefix) or `?level=6` starts there;
>   index ≥5 implies World 1's rune already assembled.
> - Playwright-verified: 2-1 renders (dunes parallax, shelves, bleached tree
>   exit), intro beat plays, tree exit blocks without artifact, game-over
>   works. NOT yet play-verified: purify-swap→wander visual (code path is
>   straightforward but nobody has SEEN a healed critter wander yet),
>   sinking-platform feel/tuning, levels 2-2..2-5, the 2-5 boss+portal flow.
> - Known cosmetic: drone swoop logic can perma-camp Troll ("press the
>   attack" retrigger) — reads oddly when he parks on the player; consider a
>   cooldown. Pre-existing `assets/rune-eihwaz.png` 404 (procedural fallback
>   covers it). Desert worlds still reuse forest critters/enemies — per-theme
>   enemy sprite sets are a small follow-up once desert critter art exists.

> **2026-07-18: Jump-to-trigger stump/tree exit, redeemed/lost/speedrun
> tracking, and a leaderboard API — same session as the World-1 stump
> revisit fix.**
> - `jump()` now checks for stump/tree-exit overlap first and, if found,
>   commits to the level transition immediately — bypasses
>   `exitPrimed`/`backExitPrimed` (see `EXIT_PRIME_DISTANCE`), which exists
>   only to stop an *incidental* walk-in from re-triggering, not to gate a
>   deliberate jump onto the stump.
> - New run-wide counters `crittersRedeemed` / `crittersLost` (killing an
>   already-redeemed critter via `killRedeemedCritter`/`finalDeath` is what
>   "lost" means — there's no violence-kill in this game, see `purifyBoss`'s
>   "Redemption, not a kill" comment) and `runPlayTime` (ticks only while
>   `state === "playing"`, so menus/pauses don't count — a clean speedrun
>   clock). Shown on the finale screen; reset in `startGame()`.
> - Leaderboard: name-entry UI on the finale screen (only shown at true game
>   completion, `finaleNextLevel === null`, not the mid-run realm-healed
>   checkpoint), with an optional newsletter opt-in checkbox + email field.
>   Backed by a new standalone PHP + MySQL API — see `api/README.md` for
>   full setup/deploy notes. Built and tested locally against WAMP's MySQL
>   (schema applied, both endpoints exercised via curl, validation and the
>   email-exclusion-from-top-scores behavior confirmed).
> - **Newsletter is explicitly out of scope here**: the API only records
>   `email`/`newsletter_optin` in the same `leaderboard` table. Nothing
>   pushes it into WordPress or sends anything — that's separate work
>   Jonathan is tackling later (see `api/README.md`'s scope note).
> - To actually play-test the leaderboard locally: start WampServer (the
>   PHP files are already copied to `C:\wamp64\www\candy-dash-api\` and the
>   `candydash` DB/table already exist), then load the game over
>   `http://localhost/...` rather than `file://`.
> - Not yet done: production deploy of the API (still points at
>   `http://localhost/candy-dash-api` in `game.js`), rate limiting on
>   `submit-score.php`, and the actual newsletter automation.

> **2026-07-19: Leaderboard API rebuilt to match the studio's shared backend
> pattern — same session, immediately after the above.** Jonathan had
> already manually uploaded the flat `api/` folder to
> `trollandunicorn.com/Games/candydash/api/` on Bluehost, then pointed out
> the studio convention (see `Budgeting_App/02_Android_Src/backend/`): a
> single framework-free PHP front controller per product, hosted under the
> shared `api.spinningmonkeystudios.com` subdomain rather than living beside
> each game/app, with real config gitignored (only `.template.*` files
> committed) and a shared PowerShell+curl FTP publish script.
> - **`api/` folder deleted, replaced by `backend/`** — `backend/api/public/
>   index.php` (single front controller, mirrors
>   `budgeting-api/backend/api/public/index.php`'s config-candidate loading,
>   `respond()` envelope, and switch-based routing, with CORS added since
>   this one's called from a browser rather than a native app),
>   `backend/config/candydash-api.config.template.{php,json}`,
>   `backend/sql/candydash_schema.sql` (table `candydash_leaderboard` —
>   prefixed so it can share a database with other studio products, same
>   convention as `budgeting_*`), `backend/README.md`.
> - Mounted at `/games/candydash` in production
>   (`https://api.spinningmonkeystudios.com/games/candydash/`) — the
>   front-controller prefix-stripping means it also works unprefixed for
>   local dev with no code changes.
> - `tools/publish-candydash-backend.ps1` + `.template.json` added, copied
>   from the budgeting app's publisher — falls back to the same shared,
>   gitignored Bluehost FTP credentials file the budgeting/WordPress
>   publishers already use, so no new credentials needed.
> - `game.js`'s `LEADERBOARD_API_BASE` now points at
>   `https://api.spinningmonkeystudios.com/games/candydash`; the client also
>   had to change shape — `top-scores` now returns `{ok, scores: [...]}`
>   instead of a bare array, `submit` returns the full envelope (still has
>   `.id`).
> - **Full round-trip re-verified locally**, including a real gotcha: PHP's
>   built-in dev server (`php -S`) doesn't read `.htaccess`, so testing the
>   front controller needs `php -S host:port -t backend/api/public
>   backend/api/public/index.php` (router script as the trailing arg) or
>   every non-file path 404s. Apache (WAMP/Bluehost) doesn't have this
>   issue — `.htaccess`'s rewrite rule handles it. Documented in
>   `backend/README.md`.
> - **Not yet done**: nobody has actually deployed `backend/` to Bluehost
>   yet (the publish script is untested against the real FTP account this
>   session — no credentials available here to run it). The old
>   `trollandunicorn.com/Games/candydash/api/` upload is now stale and
>   should be deleted via cPanel once the new one is confirmed live. Still
>   open: same rate-limiting gap as before, still no newsletter automation
>   (this backend only records `email`/`newsletter_optin` in
>   `candydash_leaderboard`).

## Read first

1. This file
2. `GAME_BIBLE.md` — canon reference (episode 7.5, characters, enemy roster, asset inventory)
3. `CANDY_DASH_2_PLAN.md` — full build log if you need the "why" behind a specific decision

## Urgent: this whole games folder has no version control

**`03_Games/TAU_HTML5_Games/` (both `candy-dash/` and `castle-smash/`) is not
tracked by git anywhere.** Checked 2026-07-16:

- `Troll_and_Unicorn` (project root) is not a git repo, and never has been — this
  is documented/expected per the project's own `AGENTS.md`.
- `03_Games/TAU_RealmsOfCorruption` (the Unity 2D project) **does** have its own
  git repo, with some pre-existing uncommitted changes from Jonathan's own prior
  work (modified Codex_Brain docs, an untracked new Terrain folder) — not
  touched by any Candy Dash session, only read from for source art.
- `03_Games/TAU_RealmsOfCorruption_25D` has no git repo either, despite being a
  second major art source for this game.
- `03_Games/TAU_HTML5_Games` (candy-dash + castle-smash) has **no git repo**.
  candy-dash alone is 83 files: all of `game.js`, the docs, the tools, and every
  asset generated across this entire session (parallax crops, ground shelves,
  critter cutouts, portal art, tree exit, artifact stone, ~30 idle-fidget
  frames) is sitting on disk with **zero version history and zero backup**. One
  bad overwrite, a botched `git init` done wrong, or a disk issue and this work
  has no recovery path.

**Recommendation:** initialize a git repo scoped to `03_Games/TAU_HTML5_Games/`
(covers both candy-dash and castle-smash, matches how `TAU_RealmsOfCorruption`
already has its own independent repo one level up) and make a first commit of
the current state before any further work touches these files. This needs your
go-ahead since it's a repo-structure decision, not something to do silently —
happy to do it in the next session (or this one, if you confirm) with a plain
`git init` + `.gitignore` (exclude nothing unusual here — no node_modules, no
build output, it's all vanilla JS/HTML/CSS/PNG) + one commit.

## Current state (verified 2026-07-16 via a real browser, not screenshots)

First actual playtest of this session happened via a Playwright MCP server
(`.mcp.json` at the `Troll_and_Unicorn` project root — needs a Claude Code
restart to activate in a fresh session if it isn't already). Served candy-dash
with `python -m http.server` from within the `candy-dash/` folder (file://
URLs are blocked by the MCP browser) and drove it directly:

- Menu loads, correct title/quote/instructions text, Play button works.
- Level 1 loads and renders correctly: parallax is genuinely seam-free now,
  ground segments align (Troll stands on the surface properly, no floating
  gap), the Gleamleaf Soarer (bird enemy) faces the correct direction, the
  vertical power bar renders and fills.
- Jump works, no console errors from any game code.
- Two console messages appeared, neither a real bug:
  - `favicon.ico` 404 — cosmetic, no favicon file exists, harmless.
  - One `ERR_CONNECTION_RESET` fetching `assets/enemies/brute.png` — the file
    itself is valid (confirmed via `curl`, 210KB valid PNG, fetches fine on
    retry). Almost certainly Python's single-threaded dev server dropping a
    request under the initial asset-loading burst, not a game bug. If this
    recurs with a proper server, investigate further; otherwise ignore.

**Not yet tested this session:** crouch, double jump, horn bolts actually
hitting/purifying an enemy, candy pickup, the artifact/tree-exit gate, the
level-4 boss fight and portal-activation sequence, the finale scene, touch
controls, or any level beyond 1-1. All of that is new or changed this session
(see below) and should be driven end-to-end before trusting it further.

## What changed this session (very high level — see CANDY_DASH_2_PLAN.md for detail)

Starting point was a working endless-runner prototype. By the end of this
session it's a 4-level platformer:

- Free-roam movement + camera (no more auto-scroll), two platform tiers
- Real Whispering Forest art throughout: parallax (5+1 layers), ground-shelf
  variety, branch platforms, portal, tree exit, artifact stone
- 4 matched corrupted/healed critter pairs from `Media/Critters/_Incoming`
  (Gleamleaf Soarer, Canopy Skitterkin, MossNibble Sproutling, Skybark
  Stonetooth) replacing earlier mismatched placeholders
- Troll: run/jump/crouch/idle-fidget (29-frame loop) using the Unity project's
  own sprite sheets, plus a few curated frames from raw AI Art reference footage
- Mechanics: horn-bolt shooting (crouch lowers the shot), double jump (costs
  candy), passive candy regen, purify-not-kill with a real hop-away animation
- **New this session's last stretch:** levels 1-3 now end at a hollow tree
  gated by a per-level hidden artifact (find it or Troll refuses to leave,
  with a dialogue bubble); level 4 ends at a real portal that stays dark until
  a scripted Sparkles energy-beam sequence lights it up (triggered by
  boss-defeat + full charge, no more candy-threshold gating); the boss now
  hunts Troll instead of just pacing, plus a procedural breathing/roar pulse
  since no multi-frame boss art exists yet.
- `node --check` has passed after every change; this Playwright pass is the
  first real render-and-play verification.

## Known gaps / honest limitations

- **No real Saurosapien sprite yet.** The boss (Skybark Stonetooth) is a
  functional placeholder — Jonathan wants a proper armored-reptilian look and
  shared two copyrighted reference images (Jupiter Ascending / Aaron Sims Co;
  "niclas dreie creative" — neither copied into the project, style reference
  only, see `GAME_BIBLE.md` §8). No image-generation tool is available in a
  Claude Code session — this needs the project's own local Flux/ComfyUI
  workflow, then a `cutout_critters.py`-style pass.
- **No true limb/mouth animation on the boss** — single static painting, so
  only a procedural scale-pulse exists. Real rigging would need either
  dedicated frames or a segmented/layered source image.
- **Level 4 artifact:** deliberately not added (level 4's own boss+portal flow
  was judged sufficient content) — revisit if Jonathan wants consistency.
- **Ground-3's slope is an approximation** (one flat elevated step, not true
  continuous slope collision) — fine for the current single mound piece, would
  need real slope physics if more ramped terrain art gets used.
- **`assets/enemies/purified/grunt.png`** — check this is still the real
  Healed Canopy Skitterkin and not a leftover placeholder; it was correct as of
  the critter-roster replacement but hasn't been re-verified visually this pass.
- 25D asset library (`TAU_RealmsOfCorruption_25D/.../Prompts/Results`) still
  has ~35 of ~40 pieces unused — mossy boulders, root bridges, stepping
  stones, matched bramble/moss-patch pairs, a candy-orb candidate, spell VFX.
  Good next-session source before reaching for anything external.
- Touch controls (mobile) haven't been touched or tested this session at all.

## Suggested next steps, in order

1. **Get this folder into git** (see above — needs your go-ahead on scope).
2. Full manual/Playwright playtest of everything in "not yet tested" above,
   especially the brand-new artifact/tree-exit/portal-activation flow — it's
   the least-proven part of the current build.
3. If the game holds up, revisit `castle-smash`'s status (untouched this
   session, also ungitted) before it's forgotten.
