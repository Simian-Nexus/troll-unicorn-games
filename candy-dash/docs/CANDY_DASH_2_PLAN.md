# Candy Dash 2.0 — Design & Production Plan

Created 2026-07-15. Companion to `GAME_BIBLE.md` (canon) — this file is the build plan.
Status key: each phase ends with something playable and shippable.

## Vision

Turn the current endless-runner prototype into **the playable version of episode 7.5**:
Troll runs through King Angus's corrupted realms, collecting floating candy (Matrix
fragments) to charge Sparkles's horn, purifying corrupted creatures back into good ones,
and delivering the collected energy to Sparkles at a level-ending portal.
Web-based, mobile-friendly, zero-install — built to be linked from YouTube videos and the
T&U website.

Think **Lep's World / classic runner-platformer hybrid**: auto-scroll pressure of a runner,
but real level goals (reach the portal) instead of "survive until you die".

## What the prototype already gets right (keep)

- Clean vanilla-JS canvas loop, no build step — deploys to Bluehost by copying files
- Solid feel: acceleration, squash-and-stretch, dust, parallax hills
- Horn-charge meter (10 candy → blast) — this IS the core mechanic, keep it
- Touch controls + keyboard, localStorage highscore, character quotes on menu/gameover

## What changes (the big five)

1. **Troll is the player, not the unicorn.** All the run/jump/idle art already exists
   (256×256 frames). Sparkles becomes the floating companion whose horn fires the blast.
2. **Levels with endings, not an endless treadmill.** Each level: fixed length, end portal.
   Portal opens only if enough candy was banked (Matrix threshold). Endless "Dash Mode"
   stays as a bonus mode — it's great for highscore/replay value.
3. **Purify, don't destroy.** Horn blast turns an enemy into a good critter that hops away
   (+Goodness bonus). Canon-locked framing; also what makes the game feel like T&U.
4. **Real art.** Whispering Forest parallax layers + terrain tiles replace the procedural
   hills for Realm 1. Enemy sprites for drone/grunt/spitter/brute generated in the same
   painterly style (ComfyUI/Flux workflows already exist in the Unity project's Scripts/Docs).
5. **Story wrapper.** 30-second comic-panel intro (episode 7.5 stills + captions), Angus VO
   text between realms, Sparkles portal-stabilization cinematic on level clear.

## Structure

- **5 realms × 3 levels + boss level** (bible §4). Realm 1 = Whispering Forest.
- Hub screen = the Wood Between Worlds: five numbered pools, red → gold as realms heal.
- Per-level goals: reach portal + candy threshold; stars for Goodness (purifies),
  no-hit, and full candy collection → replayability without punishment.
- Difficulty: realm 1 welcoming, one new enemy concept per realm (GDD escalation rule).

## Mechanics spec (delta from current game.js)

- Player: Troll run cycle (8 frames), jump frames, idle for menus. Hitbox ~same as now.
- Sparkles: follows Troll with spring-damped hover; horn glows as meter fills; blast
  originates from her horn. (Phase 3; until then meter stays on HUD.)
- Candy: banked counter (level goal) + horn charge (spend 10 to blast). Same pickup,
  two meanings — no new player burden.
- Purified critters: enemy swaps to critter sprite, hops off-screen, +Goodness.
- Lives/health: 3 hearts per level (Lep's World convention) instead of one-hit death;
  invulnerability flicker on hit. Keeps it kind for kids.
- Level format: JSON level strips (spawn tables + handcrafted set pieces) so levels are
  data, not code. One shared loader; realm themes swap sprite sets + palettes.
- Boss: single-screen arena at realm end; 3-phase pattern fight; ends in redemption beat.

## Production phases

### Phase 1 — Troll takes the stage (small, immediate)
- Swap player sprites to Troll run/jump/idle frames (copied into `assets/troll/`)
- Retitle copy so the fiction reads correctly (Troll runs, horn blast is Sparkles's)
- DONE 2026-07-15 (first slice: sprites wired in; copy pass pending)

### Phase 2 — Whispering Forest looks real
- Import forest parallax layers (Sky/Far/Mid/Near/FG) scaled for the 800×450 canvas
- Ground/platform tiles from `GRD_W01_*` / `PLT_W01_*` — note the moss-platform PNGs in
  `02_Art_and_Audio\AI_Art` already have real alpha and are game-ready too
- Candy sprite + glow; enemy art pass
- PARTIAL 2026-07-15: corrupted-critter enemy sprites live (rabbit/raccoon/snail/lizard →
  drone/grunt/spitter/brute), cut out with `tools/cutout_critters.py` (rembg venv in the
  session scratchpad; u2net model cached at `~\.u2net`). Swap art by replacing
  `assets/enemies/<kind>.png` — see `assets/enemies/README.md`. Shooting also changed:
  horn bolt projectile, 3 candy per shot, fires in facing direction (replaces the old
  full-charge auto-blast).

### Phase 3 — Level mode
- JSON level loader, fixed-length levels, end portal + candy threshold
- Hearts, checkpoints at thirds, level-clear portal cinematic (Sparkles trance → gold)
- Hub screen with 5 pools (realm 1 unlocked); Dash Mode kept as bonus
- localStorage save (realms cleared, stars)
- DONE 2026-07-15 (free-roam slice, no thresholds/hearts/hub yet): the endless auto-scroll
  runner is gone. `game.js` now runs 4 hand-authored levels (`LEVELS` array) = Realm 1,
  "The Whispering Forest" (5 realms × 4 levels per the GDD). Player moves freely in world
  space; a camera follows and clamps to level bounds — no timer-driven scroll. Canvas is
  now 960×600 with two platform tiers (`TIER1_Y`/`TIER2_Y`) so there's real vertical
  platforming, not just a ground lane. Enemies patrol fixed ranges instead of streaming in
  on a spawn timer. Reaching the level's portal (instant, no candy threshold yet) loads the
  next level; horn charge carries over between levels. Still open: candy thresholds, hearts,
  the 5-pool hub screen, and localStorage progress (currently only best score persists).
- Level 4 ends in **the Forest Captain** — a Saurosapien boss (LevelConcepts.md's world-1
  boss), built by reusing the `brute` cutout sprite at 2.2x scale with a 4-hit health bar.
  Horn bolts damage instead of instantly purifying when a target has `hp`; on defeat the
  boss vanishes in a big sparkle burst and the game cuts to a `finale` state after a 1.4s
  beat — a static storybook scene (forest, active portal, Sparkles, Troll, and the
  redeemed Forest Captain sitting calmly) built from real assets, matching the "portal
  restoration" beat in LevelConcepts.md. No in-arena purify-swap animation yet (out of
  scope this pass) — the payoff is the finale composition instead.
- Real Whispering Forest art is in: 5 parallax layers (`assets/forest/parallax/`, resized
  from the Unity project's 4096px production art to 2048px wide) tiled with per-layer
  scroll multipliers (0.05–0.85) for true depth parallax; a tiled ground texture and a
  branch-platform sprite (`assets/forest/terrain/`) replace the old procedural hills/pills.
  Resize/cutout tooling: `tools/cutout_critters.py` (enemies) and
  `tools/prep_forest_assets.py` (parallax/terrain downscale + redeemed-lizard cutout).
- **No art file exists for the portal itself** (Unity's Common/Portal and
  World01/Portal folders are placeholder `.meta` only, no PNGs) — the portal is drawn
  procedurally (radial-gradient glow + rotating sparkle ring, sealed grey vs. active gold).
  Good enough for now; a real portal sprite would be a nice upgrade.
- No pit/chasm hazards exist in any level — the ground is one continuous walkable floor
  under all platforms, so a missed jump just means falling back to solid ground, not death.
  This was a deliberate simplification to keep the free-roam levels always completable
  without needing precise jump tuning on the first pass.
- Not yet browser-playtested (no browser-automation tool available this session) — jump
  reachability between platform tiers is calculated from the physics constants (max jump
  height ≈185px, so TIER1 is reachable from ground and TIER2 only via a TIER1 platform)
  but should be played and retuned by hand. A `.mcp.json` (Playwright MCP server) was
  added to the project root 2026-07-15 for a future session to actually drive a browser —
  needs a Claude Code restart/reload to activate.
- Polish pass 2026-07-15:
  - **Parallax seam fixed.** Every `PA_Forest_*_A` source is a mirrored pair (left half +
    its own mirror) baked into one file; the mirror axis was the jarring vertical seam.
    Cropped all 5 layers to the clean left half and tile plainly now (`tools/prep_forest_assets.py`
    updated to do this crop automatically on regeneration).
  - **Idle animation fixed** — Troll now stands idle when not moving instead of running in
    place (the run-frame check only tested `grounded`, not actual velocity).
  - **Crouch** (Down/S, using the Unity project's `CrouchWalk` frames) lowers the horn
    bolt's spawn height so low targets are hittable.
  - **Double jump** — press jump again mid-air; costs `DOUBLE_JUMP_COST` (4) candy, so the
    move scales with collected Matrix energy per Jonathan's request.
  - **Purify has a payoff now.** Hit enemies swap to real purified art and hop away over
    ~1.1s (1.5s for the boss) instead of vanishing instantly — collision, spitting, and
    re-targeting are all suppressed while purifying.

### Bugfix + content pass (same day, continued)
- **Fixed:** "shoot doesn't work while crouching, crouch gets stuck" — `ArrowDown` wasn't
  calling `preventDefault()`, so the browser's default scroll could steal keyboard focus,
  losing the `X` (shoot) keydown and the eventual keyup (uncrouch). Fixed, plus a
  `window blur` handler that clears all input flags as a safety net against any future
  focus-loss/stuck-key scenario.
- **Fixed ground tiles.** The original single ground texture turned out to be a rounded
  grass-mound clip on a **plain white RGB background** (no alpha at all) — never designed
  for edge-to-edge tiling, hence the white gaps. Lesson: verify alpha with PIL directly:
  the Read tool's preview isn't a reliable transparency indicator, and even the Unity ROC
  terrain's "Top_Flat"/"Body_Rooty" pieces were the same trap despite looking transparent
  in a first look. Rebuilt ground as a 3-image real-alpha pool (`buildGroundStrip`), cut
  from `TAU_RealmsOfCorruption_25D/.../Prompts/Results` "Mossy Ground Shelf" art —
  richer detail than the Unity blocks and genuinely tileable.
- **Real portal art.** Replaced the procedural gradient ellipse with "25 Golden Portal
  Core.png" (same 25D Results folder) — sealed (dim/grey) vs active (full colour, pulsing).
- **New enemy roster.** `Media/Critters/_Incoming` held 7 matched corrupted/healed creature
  pairs (better art, and — critically — silhouette-matched, unlike the old rabbit reused as
  a raccoon placeholder). drone/grunt/spitter/brute now map to Gleamleaf Soarer / Canopy
  Skitterkin / MossNibble Sproutling / Skybark Stonetooth. The Level 4 boss and its finale
  "redeemed" portrait both reuse `brute`, so they followed automatically and now agree with
  each other (previously the finale showed a lizard while the boss was a scaled-up brute of
  unspecified species — now both are explicitly Skybark Stonetooth).
- **Idle fidget animation.** 29-frame loop: look-left (16) → scratch-bum (7) from the clean
  Unity Idle folders, plus 6 hand-picked, rembg-cut, canvas-normalized frames from raw
  `Idle Cycle` reference footage (a grumpy hand-on-hip beat). Plays once Troll has stood
  still for 0.35s.
### Polish wave 3 (same day, from Jonathan's screenshot feedback)
- Ground alignment fixed (per-tile `surfaceFrac` anchoring — foliage overhang height
  varies per chunk, so bounding-box-top anchoring made the walkable line jagged).
- Removed leftover idle bob/tilt now that the fidget animation carries its own motion.
- Fixed Soarer/Skitterkin facing backwards (source art already faced left; the earlier
  blanket `flip=True` in `cutout_critters.py` was wrong for those two — rewritten with a
  per-kind flip flag and a warning to check orientation first).
- Parallax: found a second seam source beyond the mirror axis — each layer's own outer-
  edge vignette near its original x=0. Re-cropped all 5 with per-layer bounds clearing
  both; `tools/prep_forest_assets.py` rewritten to match the actual current pipeline.
- Spitter projectiles now aim at Troll (solve for vx using the arc's fixed airtime)
  instead of popping straight up and falling back to the same spot.
- **New: passive horn-charge regen** (0.4/sec) so running dry isn't a dead end.
- **New: vertical power bar** — the DOM horn-meter is now a vertical gauge (fill grows
  bottom-to-top) instead of horizontal.
- **New: final portal is charge-gated.** Level 4's portal now needs boss-defeated AND a
  full charge (`PORTAL_OPEN_COST`) to activate — removed the automatic boss-defeat→finale
  timer; walking into the portal (same as levels 1-3) triggers the finale instead. Ties
  the candy resource directly to "give Sparkles the power to open the portal."
- **New: portal swirl rotates.** Split into `portal-frame.png` (ring/wisps, original
  swirl blurred to a soft glow) + `portal-swirl.png` (spiral cropped, circular-masked).
  Rotated with a rotate-then-squash transform (rotate the raw circular content first,
  squash to the oblique ellipse after) — rotating the flat elliptical bitmap directly
  would have made the whole oval tumble, which is wrong.

### Polish wave 4 (same day, from Jonathan's continued screenshot feedback)
- Removed the dark ground accent line (redundant now the real ground art shows its own edge).
- **Ground-3 mound now has real collision.** "Broken Edge" is drawn as a raised mound, not
  a flat strip; it was decorative-only before (Troll clipped through it at the flat
  `surfaceFrac` line). Added a `bump` descriptor per ground-pool tile — one approximate
  flat-step platform collider generated wherever that tile is placed, pushed into the same
  `platforms` array (skipped in `drawPlatform`'s render pass since the art already shows
  it). True continuous slope physics (foot height interpolated along an arbitrary ramp)
  would be a bigger lift — noted as a possible future upgrade if more sloped terrain pieces
  get used, but this single-step approximation was the right scope for one mound.
- **Root-caused the remaining parallax banding**, independent of the earlier mirror-seam
  and outer-vignette fixes: sky and near were simply narrower than the 960px canvas after
  cropping, so a repeat boundary showed even at cameraX=0 (level start) — this is a
  hard-minimum requirement (tileW >= canvas W) that has nothing to do with mult or level
  width. Fixed at the code level with a "cover" scale (`Math.max(H/naturalHeight,
  W/naturalWidth)`, i.e. CSS `background-size:cover`): guarantees no layer ever renders
  narrower than the canvas, with zero distortion (uniform scale, just extends past the
  bottom edge when width is the binding constraint, same pattern the ground band already
  used). This also means crop width no longer needs to hit an exact target — safe to crop
  as narrow as needed to dodge a seam.
- **Added a second, closer treeline** (`near2.png`, mult 0.75, between the existing
  near/fg layers) for more depth, sourced from Unity's own `PA_Forest_Near_B` specimen
  before considering external art, per Jonathan's preference. Turned out to have an even
  shorter internal repeat unit than the `_A` layers (~410px vs ~1000px on the 2048 resize)
  — a wider crop reintroduced a seam partway through: narrowed the crop, which the new
  cover-scale guarantee makes perfectly safe to do.

### Design update (same day): artifacts, tree exits, scripted portal activation
- **Levels 1-3 end at a hollow tree, not a portal.** Superseded the earlier "reach the
  portal + candy threshold" Phase-3 plan for non-final levels. Each hides an **artifact**
  (a Lore Stone — canon collectible type from `LevelConcepts.md`) on a high platform;
  reaching the tree without it triggers Troll's own blocking line instead of transitioning.
  Art: `09 Hollow Root Tunnel.png` (tree) and `37 Cartographer Shrine Stone.png` (artifact),
  both from the 25D Results library, cut out the same way as everything else this session.
- **Level 4's portal is scripted, not threshold-gated.** Removed the `PORTAL_OPEN_COST`
  candy-threshold design — defeating the Forest Captain now grants Troll a full charge
  outright, and walking to the (dark, sealed) portal starts a ~1.7s scripted beat: Sparkles
  flies in, a beam connects her to the portal, the portal flips from dark to active gold,
  then the finale cuts in. See `updatePortalActivation()` / `drawPortalBeam()` in game.js.
- **Boss now hunts Troll** within his arena instead of pure back-and-forth patrol, and got
  a lightweight procedural breathing/roar-lunge scale animation — no multi-frame boss art
  exists, so true arm-raise/mouth-open animation isn't possible without either dedicated
  frames or a properly rigged/segmented source image (flagged as a real future option, not
  attempted this pass).
- **Saurosapien look is still TBD.** Jonathan shared two style-reference images for what
  the Forest Captain (and future Saurosapiens) should actually look like — both are
  copyrighted third-party concept art (a Jupiter Ascending piece by Tsvetomir Georgiev/The
  Aaron Sims Company, and one watermarked "niclas dreie creative"), used as prompt/style
  reference only, not copied into the project (see `GAME_BIBLE.md` §8 for the description).
  No image-generation tool is available in a Claude Code session — generating the real
  sprite needs the project's own local Flux/ComfyUI workflow, then a `cutout_critters.py`-
  style pass. Skybark Stonetooth remains the functional placeholder until then.

- **Found, not yet integrated:** `TAU_RealmsOfCorruption_25D/.../Prompts/Results` is a
  ~40-piece numbered forest asset library (only ~5 pieces used so far: portal + 2 ground
  shelves) — mossy boulders, root bridges, stepping stones, matched corrupted/healed
  bramble and moss patches, a Matrix Fragment Orb (candy art?), spell-impact/cleanse VFX.
  Also `02_Art_and_Audio/AI_Art/Troll/Animation` — a much bigger Troll animation set (idle
  wave, spellcast, crawl-transform, run-to-jump) as raw MP4s/video frames, not pre-cutout
  like the Unity folders, so each use needs its own rembg + normalization pass first.

### Phase 4 — Cast & fiction
- Sparkles companion follower + horn-origin blast
- Purify animations + critter sprites; Goodness stars
- Episode 7.5 intro panels; Angus/Cerebra interstitial lines (text first, VO later)
- Real audio: Celtic-flavoured loop + chime SFX (replace beeps)

### Phase 5 — Realms 2–5 + bosses
- One realm at a time, each fully shippable before starting the next
- Boss framework once, four bosses + Captain finale from it

### Phase 6 — Reach
- Deploy to trollandunicorn site (Bluehost, static copy)
- YouTube integration: end-screen links, gameplay shorts, "play the episode" CTA
- Optional later: itch.io / CrazyGames / Poki submission for discovery

## Story_planner tie-in

- `GAME_BIBLE.md` is Markdown on purpose: ingest it via the Canon Engine's Canon Ingest
  pipeline (Markdown is a supported format) next time StoryForge's local DB is running,
  so game canon and episode canon live in one queryable bible.
- New lore invented for the game (boss names, realm details) should be added to the bible
  first, then ingested — one source of truth.

## Risks / open decisions for Jonathan

- **Sprite style match:** Troll frames are painterly; current enemies are vector shapes.
  Phase 2 needs a style-consistent enemy set (AI-gen workflow exists; needs curation time).
- **Scope discipline:** Realm 1 complete (Phases 1–4) is the YouTube-linkable milestone.
  Realms 2–5 only start after that ships.
- **Unity projects:** recommend formally marking both Unity projects "paused — HTML5 first"
  in their Brain docs so future sessions don't split effort.
- **Name check:** is "Candy Dash" final, or does the level-based game want the
  "Realms of Corruption" branding? (Marketing question, not blocking.)
