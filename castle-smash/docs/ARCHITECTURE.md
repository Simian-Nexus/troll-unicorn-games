# Castle Smash — Architecture

Status: first-pass, 2026-07-15.

## Overview

Two halves, deliberately decoupled:

1. **Client** — self-contained HTML5 game (this folder). Vanilla JS + Matter.js,
   canvas rendering, no build step, no external network dependencies. Must run
   standalone (solo campaign) so the same bundle works on the website, YouTube
   Playables, and a future webview app.
2. **Server** — `tu-games` WordPress plugin in the site repo
   (`04_Websites/troll-unicorn-wp-site/wp-content/plugins/tu-games/`). Exposes a
   REST API under `/wp-json/tu-games/v1/` for accounts, level storage, async
   matchmaking, scores, and leaderboards. Designed for Bluehost shared hosting:
   plain PHP + MySQL, no websockets, no long-running processes, FTP-deployable with
   the existing `tools/publish-bluehost-files.ps1` workflow.

The plugin is game-agnostic where cheap: tables and endpoints carry a `game` slug so
future T&U HTML5 games (e.g. candy-dash scores) can reuse the same plugin.

## Client architecture

- `src/main.js` — entry point; owns the game-state machine:
  `menu → build → smash → results`.
- Physics: Matter.js engine, fixed timestep; logical resolution 1280×720 scaled to
  fit the viewport (mobile-friendly letterboxing).
- Levels are pure data (JSON): component list, placements, crystal positions,
  projectile loadout. The same format is used for campaign levels, saved player
  builds, and PvP payloads — this is the contract with the server.
- Determinism note: physics replays are *not* guaranteed deterministic across
  devices. Server therefore stores submitted results, not replays, and applies
  plausibility caps (see anti-cheat).

### Level JSON (v0 draft)

```json
{
  "format": 1,
  "game": "castle-smash",
  "components": [
    {"type": "wood-beam", "x": 900, "y": 600, "angle": 0},
    {"type": "stone-block", "x": 940, "y": 560, "angle": 0}
  ],
  "crystals": [{"x": 920, "y": 580}],
  "budget": {"wood-beam": 10, "stone-block": 6, "crystal": 2},
  "timeLimitSec": 90
}
```

## Server API contract (v0 draft)

Namespace: `tu-games/v1`. Auth: guest player token (random 32-byte, issued at
register, sent as `X-TU-Player-Token` header), optionally linked to a WP user later.

| Endpoint | Method | Purpose |
|---|---|---|
| `/player/register` | POST | Create guest player, returns player id + token |
| `/player/me` | GET | Profile: points, trophies, unlocks |
| `/levels` | POST | Submit a build (level JSON) for the current round |
| `/levels/opponent` | GET | Fetch an opponent build to attack (bracket-matched) |
| `/matches` | POST | Report an attack result (level id, score, crystals destroyed, shots used) |
| `/leaderboard` | GET | Top players for a game + period |

All request/response bodies JSON. Level JSON validated server-side against the
component budget before storage (a build using parts you don't have is rejected).

### Anti-cheat posture (shared-hosting realistic)

Trust-but-verify: scores are capped by what's theoretically possible for the level
(max crystals, max destruction score), rate limits per token, and outlier flagging.
Perfect validation would require server-side physics simulation — out of scope on
Bluehost; leagues + caps keep damage bounded.

## Storage (custom tables, `dbDelta` on activation)

- `{prefix}tu_game_players` — id, wp_user_id (nullable), token_hash, display_name,
  points, trophies, created/last_seen
- `{prefix}tu_game_levels` — id, game, player_id, round_key, level_json, times_attacked,
  times_survived, status
- `{prefix}tu_game_matches` — id, game, attacker_id, level_id, score, crystals_destroyed,
  shots_used, outcome, created
- `{prefix}tu_game_scores` — id, game, player_id, period (e.g. `2026-W29`), score
  (simple leaderboard for arcade-style games like candy-dash)

Tokens stored hashed. No PII beyond a self-chosen display name (kid-safety: filter it,
never collect real names/emails at the plugin level — account upgrade goes through
normal WP registration).

## Deployment

- Client: upload the `castle-smash` folder to the site (or serve via a theme page
  template embedding it in an iframe). YouTube Playables build = zip of the same
  folder (verify current Playables SDK requirements first).
- Plugin: FTP via existing `publish-bluehost-files.ps1` flow, same as tu-core.

## Explicitly out of scope for now

Realtime multiplayer, server-side replay validation, push notifications, payments.
