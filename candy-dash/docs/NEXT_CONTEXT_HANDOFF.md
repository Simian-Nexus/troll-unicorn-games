# Candy Dash — Next Context Handoff

Written 2026-07-16, end of a long single-day session. Read this first if you're
picking up Candy Dash work; it's the "what's true right now" doc. `GAME_BIBLE.md`
is canon/lore, `CANDY_DASH_2_PLAN.md` is the full phase-by-phase history — this
file is the short version plus the one urgent housekeeping item (git).

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
