# Castle Smash — Status

Last updated: 2026-07-15

## Current state

- Project scaffolded from the idea note
  `07_Potential_Projects/00_Ideas_Inbox/1016-07-15_Angry_birds_style_html5_game.md`.
- Design docs written: `GAME_DESIGN.md` (loop, levelling, monetisation brainstorm),
  `ARCHITECTURE.md` (client/server split, level JSON, REST contract).
- Playable smash-phase prototype exists: Matter.js slingshot, destructible demo
  castle (wood/stone/crystals), HP-based damage, 3 shots, mid-flight sparkle burst,
  score + win/lose overlay. PHP-lint-level only — needs a manual playtest.
- `tu-games` WordPress plugin scaffolded in the site repo (uncommitted): guest
  players, level storage, async opponent fetch, match reporting, leaderboard.
  PHP files lint clean; not yet activated or tested against local WP.

## Decisions taken so far

- **Guest-token PvP identity — confirmed by Jonathan 2026-07-15** (upgradeable to WP
  accounts later; no PII in plugin tables).
- Async PvP against stored builds, not realtime (Bluehost constraint).
- Client is self-contained vanilla JS + vendored Matter.js 0.20.0, no build step.
- Plugin is game-agnostic (`game` slug) for reuse by other T&U HTML5 games.
- Prototype playtested by Jonathan 2026-07-15 via `file://` — renders and plays;
  art pass is the visible gap. Asset spec now at `docs/ART_ASSETS.md`.

## Next actions (priority order)

1. Playtest the prototype in a browser; tune damage/impulse thresholds and sling feel.
2. Activate `tu-games` on local WP (127.0.0.1:8091) and smoke-test the REST flow
   end to end (register → submit level → fetch opponent → report match).
3. Build phase in the client: component palette, budget, drag placement, timer,
   serialize to the level JSON format.
4. Wire client ↔ server (register/token storage, submit build, attack opponent).
5. Produce Priority 1 art from `docs/ART_ASSETS.md` (unicorn/troll face projectiles,
   block textures, crystal) and wire via `render.sprite.texture`.
6. Jonathan decisions pending: title, age-rating target (see GAME_DESIGN.md
   "Open questions").

## Blockers

None. All work so far is local and additive.
