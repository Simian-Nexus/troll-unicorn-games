# Candy Dash — Next Context Handoff

Written 2026-07-16, end of a long single-day session. Read this first if you're
picking up Candy Dash work; it's the "what's true right now" doc. `GAME_BIBLE.md`
is canon/lore, `CANDY_DASH_2_PLAN.md` is the full phase-by-phase history — this
file is the short version plus the one urgent housekeeping item (git).

> **2026-07-21 (latest): 1-1's first window-tree now speaks automatically
> once; tree and Troll dialogue bubbles have speaker tints.**
> - The first talkable platform window-tree in `1-1 Into the Wood` now calls
>   `sayTreeLine()` automatically when Troll enters the existing 160x220px
>   tree-talk range. A run-wide `hasAutoTalkedFirstTree` latch prevents the
>   introduction from repeating when Troll walks back past it or retries after
>   already hearing it; it resets only on a genuinely new game.
> - Dialogue now tracks its speaker. Tree lines use a very faint green fill
>   (`rgba(243,252,244,0.96)`); Troll's normal lines, queued follow-ups, and
>   intro line use a very faint orange fill (`rgba(255,247,239,0.96)`). Other
>   speakers keep the existing near-white bubble.
> - `node --check` passed and `npm run build` refreshed `dist/game.js`.
>   Build is `2026-07-21.1`, `game.js?v=51`. The in-app browser was
>   unavailable in this session, so the remaining check is a quick visual pass
>   through 1-1 to confirm the trigger timing and subtle tint strength.
> - Pre-existing uncommitted edits in `style.css` (wider menu how-to panel) and
>   its `style.css?v=18` cache bump in `index.html` were preserved.

> **2026-07-20 (even later session): boss redemption sequence — grounding,
> ally rally, ally-survival line, World 1 stomp-purify opt-out.**
> - **Boss floated during his own defeat.** `defeated-reptilian-boss.png`
>   and `dejected_after_defeat.png` are the only two Saurosapien poses with
>   real transparent padding below the painted figure (measured via
>   PIL: 24% and 16.2% of image height respectively — every other pose is
>   flush-cropped). drawEnemy() anchored by the raw canvas edge like every
>   other sprite, so he visibly hovered above the ground with a gap under
>   his plinth (Jonathan: "see how he is sitting in an unnatural
>   location?"/screenshots of the prone pose floating over a blue plinth).
>   Fixed with SAURO_DEFEATED_BOTTOM_PAD/SAURO_DEJECTED_BOTTOM_PAD constants
>   that shift drawY down by the measured padding so the painted content —
>   not the empty canvas below it — lands on the ground line.
> - **Boss also had an upward launch he shouldn't have had.** purifyBoss()
>   set `hopVy = -90` (copied from the ordinary-critter hop-away arc) then
>   let gravity pull him back down over the 0.6s "falling" phase — a
>   collapse should go down, not up. Jonathan: "don't make his prone
>   position raise off the ground... I will animate it later." Removed the
>   launch entirely and excluded isBoss from the hop/gravity physics tick
>   altogether — he's grounded the instant he's purified and stays there,
>   motionless, through the whole collapse. The prone→dejected transition
>   is already a hard sprite swap (not a tween) once dialoguePhase reaches
>   "translated" — that part didn't need touching, just the floating/launch.
> - **Redeemed-line speech bubble never expired.** drawBossDialogue() drew
>   the translated line every frame for as long as dialoguePhase stayed
>   "translated" (forever — nothing else changes that phase). Added
>   BOSS_TRANSLATED_LINE_DURATION (10s) + a fade-out over the last
>   BOSS_TRANSLATED_FADE_OUT (0.6s).
> - **New: purified critters rally to fight the boss with you.** Once a
>   level's boss wakes and starts hunting Troll, any critter already
>   redeemed that level stops local wandering, closes in on the boss, and
>   lands real chip damage (ALLY_ATTACK_DAMAGE) on a cooldown — can finish
>   him off outright. If the boss's bolt catches one, it plays the same
>   real hop-away/die sequence as an accidental kill (new bossHitAlly(),
>   cloned off killRedeemedCritter() minus the self-blame OOPS line). If any
>   die that way, Troll gets a line — ALLY_SURVIVAL_LINE, "I'm pretty sure
>   those helpful critters are going to be alright." — queued the moment the
>   boss settles into his dejected pose.
> - **World 1 opts out of head-stomp purification.** The 2026-07-20
>   head-stomp feature (below) now skips entirely when `themeName ===
>   "forest"` — World 1 critters can only be purified by the horn, matching
>   the existing "World 1 never gets the gentle purify" split used
>   elsewhere in this file. Jonathan: "make it so you can't jump on
>   critters to heal them in world 1 only."
> - Build bumped to game.js?v=50, dist/game.js rebuilt. **Not yet uploaded.**

> **2026-07-20 (latest, newest session): trunk-tree "next door tree bleed"
> fixed for real — six individually hand-cropped tree images replace the
> shared sheet, not another automated-crop attempt.**
> - This bleed had already had two automated fixes earlier the same day
>   (source-rect cropping to a measured content box, then isolating each
>   cell into its own offscreen canvas so the scaling filter has nothing
>   adjacent to sample) — Jonathan reported it was STILL visible after both.
>   Root cause wasn't the renderer: the source painting itself has
>   overlapping detail (a dangling vine/lantern chain) crossing the nominal
>   cell boundary, which no coordinate-based bbox scan can distinguish from
>   the tree it's cropping.
> - Jonathan's fix: hand-cropped each of the 6 trees out of
>   `trees-to_render-big-and-tall-sprites.png` by eye (via a numbered
>   `- Copy.png` reference, then `- Copy 1.png` through `- Copy 6.png`, one
>   isolated tree per file, order matching the sheet's original reading
>   order: 1=hollow oak, 2=tall oak, 3=window/lantern oak, 4=pine, 5=mossy
>   oak, 6=birch). Verified each file visually against the expected variant
>   before wiring in — order matches `p.connectorVariant` (0-5) exactly.
> - **Code changes** (game.js): `trunkSpritesImg` (single sheet) replaced
>   with `trunkTreeImgs` (array of 6 individually loaded images);
>   `TRUNK_SPRITE_GRID`/`TRUNK_CONTENT_BOXES` deleted (ruins' own
>   `RUIN_SPRITE_GRID`/`RUIN_CONTENT_BOXES` untouched — ruins still use the
>   shared-sheet approach and aren't reported as having this problem). New
>   `drawWholeSprite()` alongside the existing `drawSpriteCell()` — same
>   anchor/scale math, but for a standalone image with no grid/box slicing
>   (nothing adjacent to bleed from in the first place). `drawPlatformConnector()`
>   now looks up `trunkTreeImgs[p.connectorVariant]` directly.
>   `isWindowTreePlatform()`'s comment updated to point at
>   `trunkTreeImgs`/Copy 3 instead of the old grid; its actual logic
>   (`p.connectorVariant !== 2`) was untouched since indexing is unchanged.
> - **Verified live via Playwright**, not just `node --check`: loaded 1-4
>   ("The Tangled Deep", the level with the closest-packed trunk trees) with
>   `?debug=1` — window-tree (Copy 3) and birch (Copy 6) sit
>   right next to each other on the same platform and render with clean
>   edges, no ghosting/slivers from one tree into the other. The numbers
>   Jonathan burned into each Copy file for verification are still visible
>   in this screenshot on purpose — **he's removing them from the image
>   files next**, not a bug.
> - `node --check` clean. Build bumped to `2026-07-20.19`
>   (`index.html` `game.js?v=` → 46), `dist/game.js` rebuilt via
>   `npm run build` (183558 bytes). **Not yet uploaded** — Jonathan still
>   needs to (1) remove the burned-in numbers from the 6
>   `trees-to_render-big-and-tall-sprites - Copy <n>.png` files, then (2)
>   FileZilla-upload `dist/game.js` (renamed) + `index.html` +
>   the 6 Copy PNGs (new files, not currently on the server at all).
> - **Same technique still needed for `full-trees-sprites.png`** (the
>   similar-but-unused decorative sheet Jonathan also cropped into 6 numbered
>   files earlier this session) — those aren't wired into anything yet since
>   that sheet was never used by the game to begin with; revisit if/when
>   there's an actual use for it (background decoration was floated as an
>   idea, not committed to).

> **2026-07-20 (newest session): World 1 music stops looping after extended
> play — root-caused, not yet fixed.**
> - Jonathan reported the World 1 track eventually goes silent after playing
>   for a while (not immediately, not on a level change — mid-session).
>   Confirmed this is caused by today's earlier "reuse Audio elements instead
>   of `new Audio(src)` per play" change (see the `2026-07-20 (latest, new
>   session): music startup fixed...` entry below) — that change fixed slow
>   startup but introduced a new long-lived-element risk.
> - **Mechanism:** `getMusicAudio()` (game.js:734-748) sets `el.loop = true`
>   exactly once when a track's `Audio` element is first created, then
>   `switchMusic()`/`playLevelMusic()` reuse that same cached element for the
>   rest of the session (`musicCache` Map, src -> element). There is no
>   manual/`ended`-based loop scheduler anywhere in the file — playback relies
>   entirely on the browser's native loop-restart, and nothing ever checks
>   that it's still actually happening (no `pause`/`stalled`/`ended`
>   watchdog). The only recovery path that exists, `armMusicUnlock()`
>   (game.js:797-809), is exclusively for the *first* autoplay-block case
>   (`NotAllowedError` before any user gesture) — it does nothing once music
>   has already started playing once.
> - The `error` listener on the element (game.js:742-744) only
>   `console.warn`s — it doesn't reload, doesn't fail over to the `.ogg`
>   sibling already sitting next to every mp3 in `assets/Music/`, and doesn't
>   clear the `musicCache` entry, so a broken element stays broken/cached for
>   the rest of the page's life.
> - **Leading hypothesis:** a long-lived native `<audio loop>` element
>   occasionally fails to seek back to 0 and restart after many loop
>   iterations (a known class of long-session Chromium/WebKit audio-decoder
>   issue) or hits a transient media error mid-loop — either way, once it
>   silently stops, nothing in the code will ever call `.play()` on it again
>   until the player triggers an actual track change (next level, settings
>   toggle, victory), which matches "plays fine for a while, then just goes
>   quiet."
> - **Not yet applied — fix agreed but not written this session:** add a
>   lightweight watchdog (inside the existing `requestAnimationFrame` loop,
>   `loop()` at game.js:5054) that notices `state === "playing" &&
>   currentMusic.paused` when it shouldn't be and calls `.play()` again: also
>   make the `error` handler clear the `musicCache` entry (so a future
>   `getMusicAudio()` call rebuilds a fresh element) rather than just logging.
>   Same underlying mechanism applies to every world/realm, not just World 1
>   — it's just the one Jonathan happened to hit first from playtime.
> - **Do this next:** implement the watchdog + error-recovery fix above in
>   `game.js`, bump `BUILD_VERSION`/`?v=` cache-busters, `npm run build` to
>   refresh `dist/game.js`, then Jonathan needs to actually FileZilla-upload
>   `dist/game.js` (renamed) + `index.html` for it to go live — same
>   reminder as every deploy note in this file.

> **2026-07-20 (still later, same new session): floating-tree roots fixed
> level-wide, verified by a static pass over every forest level's platform
> data, not just fixing the one screenshot.**
> - Jonathan's screenshot showed a tree whose base visibly hung out past its
>   platform's edge into open air. Root cause: `drawPlatformConnector()`'s
>   trunk branch guarantees a tree's rendered width is AT LEAST `p.w * 1.3`
>   (added 2026-07-20 earlier this doc, to stop narrow variants like the
>   birch looking "balanced on a twig") — that's a single uniform scale
>   applied to the WHOLE pre-composed tree image, so widening it to satisfy
>   that floor also widens the ROOT portion at the base by the same factor,
>   with nothing stopping that root from extending past the platform's own
>   footprint into an adjacent gap that has nothing in it. The existing
>   `GATE_HALF_W` logic already did something similar for the two level-exit
>   gates specifically; this just wasn't extended to ordinary
>   platform-to-platform gaps.
> - Wrote a one-off Node script
>   (`analyze_trees.js` in the session's scratchpad, not committed) that
>   parses every forest level's `platforms` array straight out of `game.js`,
>   replicates the exact deterministic seeding formula
>   (`connectorStyle`/`connectorVariant`), and for every trunk-connector
>   platform computes whether its guaranteed minimum root width exceeds the
>   real gap to its nearest neighbouring platform. First pass found FOUR
>   real, reproducible instances across 1-2 and 1-4 (not a one-off — this
>   was a systemic gap in the width-floor logic, confirmed BEFORE writing
>   any fix).
> - Fix: `drawPlatformConnector()` now also computes the actual left/right
>   gap to the nearest neighbouring platform (excluding bridges/sinking
>   platforms) and clamps `maxW` so the root can never claim more than that
>   gap allows (`ROOT_MARGIN = 20px` kept as visible empty air even when
>   otherwise unconstrained, so a root doesn't reach the pixel-exact gap
>   edge either) — same reasoning as the existing gate clamp, just
>   generalized to platform neighbours too. Re-ran the same analysis script
>   against the new logic: all four previously-flagged instances resolved
>   (e.g. the worst case, 1-4's platform at x=1710, went from a 23px
>   guaranteed overhang on a gap with 0px of room, to 0px overhang exactly
>   matching its platform width) — zero floating instances remain in any of
>   the 5 forest levels.
> - **Also cross-checked live, not just offline**: the same script's
>   window-tree counts per level matched the running game's own `?debug=1`
>   overlay exactly (1-1: 1, 1-4: 2) — good independent confirmation the
>   static analysis reflects real runtime behavior, not just the source
>   text. A live screenshot of the specific worst-case platform (x=1710 in
>   1-4, deep in a long enemy gauntlet level) wasn't obtained — reaching it
>   needs real combat/platforming that blind-scripted Playwright input keeps
>   proving unreliable for this session (third time it's derailed a test;
>   noted again for whoever picks this up next). **Worth a quick look next
>   time you're at that spot in 1-4 to visually confirm**, though the
>   math and the live-overlay cross-check both say it should be resolved.
> - World 2 (dunes) unaffected — its platforms don't use this trunk sprite
>   sheet at all (procedural connector only), so there's nothing there to
>   float in the first place.
> - `node --check` clean. `BUILD_VERSION` → `2026-07-20.18`, `index.html`'s
>   `game.js?v=` → 45, `dist/game.js` rebuilt via `npm run build` (232819 →
>   184188 bytes). **Still needs Jonathan's FileZilla upload — `dist/game.js`
>   AND `index.html` together**, same reminder as every entry above.

> **2026-07-20 (yet later, same new session): the "no dialogue popup" report
> traced to trying to talk to a PLATFORM tree, not the level's real one —
> fixed by making platform trees with an actual window talkable too, plus a
> `?debug=1` diagnostic overlay.**
> - Jonathan's screenshot + a shared debug overlay (see below) showed the
>   real cause immediately: he was standing at `x=1176` in 1-1, but that
>   level's only wired-up tree (`exitPoint`) is at `x=2260` — 1041px away,
>   off past the far end of the level. He was at a decorative PLATFORM
>   connector tree (one gets drawn under most elevated platforms, randomly
>   chosen from a 6-variant sprite sheet) — visually near-identical to the
>   real exit tree, but not wired to `tryTalkToTree()` at all. Confirmed by
>   opening `assets/forest/trees/trees-to_render-big-and-tall-sprites.png`
>   directly: only ONE of the 6 trunk variants (index 2, top-right — a
>   twisted tree with hanging lanterns and a round glowing window) is
>   actually painted with a window; the other 5 (plain oak, tall oak, pine,
>   mossy/mushroom oak, birch) have none.
> - Jonathan's call once he saw that: make every tree that's actually drawn
>   with that window variant talkable too, not just the one at the level's
>   end. New `isWindowTreePlatform(p)` (mirrors `drawPlatformConnector()`'s
>   own render gate exactly: `themeName==="forest" && connectorStyle==="trunk"
>   && connectorVariant===2`, not a bridge/sink/ground-level platform) — 
>   `tryTalkToTree()` now scans `platforms` for one in range after the
>   exitPoint/backExitPoint checks miss. All window trees in a level (there's
>   usually 0-2 per level, seeded deterministically same as the art itself)
>   share that level's own `treeVoice` pool — same wood, same voice,
>   whichever hollow Troll happens to be standing at. `sayTreeLine()` and
>   `debugTalk()` factored out so both the exit-tree path and the new
>   platform-tree path share one implementation instead of duplicating it.
>   World 2 unaffected — its dunes platforms use the procedural connector,
>   never this sprite sheet, so it has no extra window trees beyond its two
>   existing exit/entry ones.
> - **New: `?debug=1` diagnostic mode** (`DEBUG` const, inert unless the
>   query param is set) — small on-screen readout: Troll's live x/y, exact
>   distance to `exitPoint`/`backExitPoint`, count and distance to the
>   nearest in-level window-tree platform, and the last Enter/interact
>   attempt with its full outcome (what it found, or exactly why not).
>   Meant to stay in the file permanently as a reusable diagnostic, not a
>   one-off — safe since it does nothing without the param.
> - **Confirmed live via Playwright**, including landing on the EXACT
>   platform from Jonathan's screenshot (x=1150 in 1-1): walked there,
>   pressed Enter, overlay logged `window trees in level: 1, nearest at
>   x=1245 dx=132 IN RANGE` then `talked to a platform window-tree at
>   x=1150 (1-1 Into the Wood, tier=levelDone): "The edge of the wood is
>   quiet again..."` — full round trip confirmed, including correct tier
>   selection (he'd already found 1-1's artifact, so `levelDone` not
>   `inProgress`, exactly as expected).
> - Also worth recording since it burned real time this session: local
>   Playwright testing hit TWO separate false leads before landing on the
>   real fix — (1) a background/inactive browser tab throttles
>   `requestAnimationFrame` hard enough that held-key movement barely
>   progresses in wall-clock time (fixed by calling `page.bringToFront()`
>   before any input sequence); (2) Python's single-threaded dev server
>   dropped the `game.js` request outright under load (`ERR_CONNECTION_RESET`)
>   on one navigation, silently leaving the OLD script running with no error
>   surfaced to the page — always check the console for a failed `game.js`
>   load before trusting a "nothing changed" result while testing locally.
> - `node --check` clean. `BUILD_VERSION` → `2026-07-20.17`, `index.html`'s
>   `game.js?v=` → 44, `dist/game.js` rebuilt via `npm run build` (231338 →
>   182789 bytes). **Still needs Jonathan's FileZilla upload — `dist/game.js`
>   AND `index.html` together**, same reminder as every entry above.

> **2026-07-20 (even later, same new session): every window-tree now has its
> own unique dialogue, and confirmed the talk-to-tree feature itself was
> never broken.**
> - Jonathan reported pressing Enter at 1-1's window tree and getting no
>   popup. Traced the actual mechanism (`interact()` → `tryTalkToTree()`,
>   `TREE_TALK_RANGE_X/Y`, `exitPoint`/`backExitPoint`) and it's sound — live
>   Playwright test (see below) confirms the popup fires correctly. Most
>   likely explanation: the earlier `BUILD_VERSION 2026-07-20.14` deploy
>   genuinely wasn't live yet at the moment he tried it (confirmed separately
>   in this session's own chat — he'd only just asked "what should the build
>   number be" and it turned out `index.html`'s own `?v=` bump hadn't been
>   uploaded alongside `dist/game.js`, which is exactly the kind of gap that
>   silently serves a stale cached build with no visible sign of it — the
>   same failure mode noted in this file's very first bug-history comment
>   from 2026-07-18). Nothing needed fixing in `tryTalkToTree()` itself.
> - **What DID change, per Jonathan's follow-up ask**: "all trees with
>   little windows in all worlds needs a conversation... unique set of
>   possible things to say to troll, based on how far Troll has progressed."
>   Previously all window trees (both `exitPoint` and `backExitPoint`, drawn
>   via `drawTreeExit`) shared one single generic 3-tier line pool
>   (`TREE_LINES_IN_PROGRESS/LEVEL_DONE/WORLD_DONE`) regardless of which
>   level's tree Troll was actually standing at. Every one of the 8 current
>   non-boss levels (1-1..1-4, 2-1..2-4 — boss levels get a portal instead,
>   never a tree) now has its own `treeVoice: { inProgress, levelDone,
>   worldDone }` field with 2 unique lines per tier, written to that level's
>   own name/place (1-1's tree talks about the treeline, 1-3's about being
>   the oldest tree in the Old Grove, etc.) and its position in the story —
>   World 2's trees are written drier and warier per GAME_BIBLE §9's canon
>   that they're literally "bleached bones of portal trees," not living wood
>   like World 1's, and 2-1's tree explicitly echoes Angus's just-delivered
>   "they're PATIENTS!" beat. `tryTalkToTree()` now checks
>   `treeLvl.treeVoice` first and only falls back to the old generic pools
>   if a level doesn't define one (kept specifically so a future World 3+
>   level added without custom tree dialogue still says something sensible).
> - **Playwright-verified live**, and worth noting HOW: the first live check
>   (via `?level=1-2`, talking to 1-1's tree from 1-2's spawn) showed the
>   OLD generic line despite the code being correct — the browser tab had
>   cached `index.html` itself (not just `game.js`) from an earlier
>   navigation this same session and kept requesting the stale `game.js?v=`
>   it already had, even after the file changed on disk. Re-verified after
>   bumping to `?v=42`/`BUILD_VERSION 2026-07-20.15` AND forcing a real
>   cache-bypass navigation (an extra dummy query param) — confirmed correct
>   at both 1-1's tree (via 1-2's spawn: "You're barely past the treeline...")
>   and 2-1's tree (via 2-2's spawn: "This sand used to be soil..."). A
>   good reminder that even local Playwright testing isn't automatically
>   immune to the same stale-cache trap as a real deploy.
> - `node --check` clean. `BUILD_VERSION` → `2026-07-20.15`, `index.html`'s
>   `game.js?v=` → 42, `dist/game.js` rebuilt via `npm run build` (225397 →
>   178409 bytes). **Still needs Jonathan's FileZilla upload — both
>   `dist/game.js` AND `index.html` together**, per the cache-bump lesson
>   above.

> **2026-07-20 (latest, new session): music startup fixed, tree/ruin sprite
> bleed fixed for real, and the World-1 boss's translation-spell sequence
> rebuilt to match Jonathan's spec.**
> - **Music: reused Audio elements instead of a fresh `new Audio(src)` on
>   every play\*Music() call.** All three (`playLevelMusic`/`playMenuMusic`/
>   `playVictoryMusic`) now go through one shared `switchMusic()` +
>   `getMusicAudio()` (a `src -> HTMLAudioElement` cache), so replaying a
>   track (menu → level → back to menu, a retry) resumes an already-buffered
>   element instead of re-fetching. `preloadAllMusic()` now warms the SAME
>   cached elements (previously a disposable throwaway `Audio`, wasted once
>   real playback started) and, critically, warms the **menu theme and
>   World 1's own track first and immediately**, staggering the other
>   4 worlds' tracks afterward — those two are the only ones a new player
>   can hear in their first minute, so they were previously competing for
>   bandwidth against Worlds 2-5's tracks (2.7-4.7MB each) plus every sprite
>   the page also loads at boot. New `.htaccess` at the candy-dash root adds
>   1-year `Cache-Control`/`Expires` for `mp3/png/jpg/webp/woff2` (not
>   `game.js`/`index.html`/`style.css`, which the existing `?v=` cache-buster
>   needs to keep refetching) — the actual "cache it for next time" half of
>   the ask, so a *returning* visit doesn't redownload music/art at all.
>   **What this does NOT fix**: browser autoplay policy. Confirmed live via
>   Playwright — a fresh page load still gets `NotAllowedError` on both the
>   menu theme and World 1's track until the very first click/keypress
>   anywhere (`armMusicUnlock()`, pre-existing), which is a hard browser
>   restriction, not a bug in this game. If Jonathan's own testing genuinely
>   never gets to hear menu music at all (not even after clicking Play),
>   that'd point at something else — worth a second look with the browser's
>   own autoplay-policy indicator open.
> - **Tree/ruin sprite bleed (still visible after the 2026-07-20
>   source-rect-cropping fix earlier this doc)**: `drawSpriteCell()` cropped
>   the *source rect* to each cell's measured content box, but a source rect
>   that size still lets the canvas's own downscale/smoothing filter sample
>   a texel or two just past that rect — bleeding in a sliver of whatever's
>   painted next to it in the shared sheet (the next tree over). Fixed by
>   pre-slicing each cell out to its OWN small offscreen canvas once (cached
>   per source image in a new `spriteCellCache` `WeakMap`), and always
>   drawing/scaling FROM that isolated canvas — there's nothing adjacent
>   left for any filter to sample. `node --check` clean; visually confirmed
>   via Playwright at 1-4 (screenshot showed no bleed), but the *specific*
>   instance Jonathan flagged wasn't identified by level/spot, so **worth a
>   look at whichever tree looked wrong** to confirm this was it.
> - **World-1 boss translation-spell sequence rebuilt to spec** (Jonathan:
>   boss was sitting up into the "dejected" pose too fast, right as the
>   gibberish started, when he should stay lying down through it):
>   - `drawEnemy()` now only swaps to the dejected/sit-up sprite once
>     `dialoguePhase === "translated"` — through "falling", "garbled", and
>     "spell" he stays on the defeated/lying sprite.
>   - New Troll line, said the instant the gibberish starts (`startBossDialogue()`):
>     `TROLL_TRANSLATION_SPELL_LINE` = "Looks like we need a translation
>     spell." — reuses the existing global dialogue-bubble system, so it
>     appears over Troll same as any other line.
>   - The green translation-spell glow moved from the boss to **Troll**
>     (he's casting it) — `player.spellGlowT`, rendered in `drawTroll()`,
>     driven by the boss's `dialoguePhase` tick in `update()`. Duration
>     (`BOSS_DIALOGUE_SPELL_DURATION`) changed from 0.9s to the requested
>     **4 seconds**. Sparkles (`spawnSpellSparkles`, renamed from
>     `spawnBossSpellSparkles`) now spawn at Troll's position too. Comment
>     left in `drawTroll()` noting this glow is a placeholder for the
>     arm-wave animation Jonathan said he'll provide later.
>   - The boss's own bubble now glows green briefly as it swaps from
>     gibberish to the real redeemed line (`drawBubble()` gained an optional
>     `glow` param, a canvas shadow-blur fade; `BOSS_TRANSLATED_GLOW_FADE`).
>   - **Dejected-pose levitation bug fixed**: the universal idle
>     breathing-bob every enemy gets in `drawEnemy()` was still being
>     applied to the boss's sit-up pose, reading as gentle floating. Now
>     zeroed specifically when `o.isBoss && o.defeatPhase === "dejected"` —
>     he's anchored flush to `GROUND_Y` with no bob.
>   - `node --check` clean; level 1-4 render-verified via Playwright
>     (screenshot, no new console errors beyond the pre-existing
>     `rune-eihwaz.png` 404). **Not live-verified end-to-end** — reaching
>     and defeating the actual boss needs real platforming/combat that
>     blind-scripted Playwright input isn't reliable for (same limitation
>     noted in the sink-platform-flicker entry below); Troll died to a
>     regular enemy en route during this session's attempt. **Please play
>     through the World-1 boss fight live next session** to confirm the
>     full sequence (stays down → gibberish → Troll's line → 4s green glow
>     on Troll → bubble glows green → English line → boss sits up anchored,
>     no bob) reads right end to end.
> - `BUILD_VERSION` → `2026-07-20.14`, `index.html`'s `game.js?v=` → 41,
>   `dist/game.js` rebuilt via `npm run build` (217360 → 170214 bytes).
>   **Still needs Jonathan's FileZilla upload** (including the new
>   `.htaccess`) — nothing in this entry is live.

> **2026-07-20 (later still): touch controls reworked — crouch folded into
> the move track, formal ⏎ interact button; menu how-to text made readable
> over the background art.** (build 2026-07-20.13, dist rebuilt)
> Jonathan's live-play feedback with screenshots:
> - **Crouch is now a pull-down on the left-thumb slide track**: drag the
>   thumb down ~20px from wherever it first touched (`CROUCH_PULL_PX` in
>   `game.js`) to crouch, ease back up to stand. Threshold is relative to
>   the initial touch, NOT the track's bottom edge — the track sits 16px
>   from the screen edge, so an absolute zone would be unreachable. Knob
>   now shows a small ▼ under the ◀ ▶ that lights up (`#move-track.crouching`)
>   while crouched. The separate `#crouch-btn` was removed.
> - **`#talk-btn` (💬) became `#action-btn` (⏎)** — the formal touch
>   equivalent of the Enter key. Both keyboard Enter and the button route
>   through a new shared `interact()` (just above `tryTalkToTree()` in
>   `game.js`); that function is THE hook for future levers/switches/NPCs —
>   wire new interactions there and both inputs get them for free.
> - **Menu how-to text**: the background art was washing out the muted grey
>   `.howto` paragraph; it's now `--ink` on a translucent white rounded
>   panel (`rgba(255,255,255,0.68)`, 14px radius). Verified via local
>   http-server + Playwright screenshot.
> - **Pre-existing, not fixed**: `assets/rune-eihwaz.png` 404s locally —
>   no `rune-*.png` exists anywhere under `assets/`. May be present only on
>   the live server; worth checking on trollandunicorn.com.
>
> **2026-07-20 (yet later, same day): narrow tree variants thickened, wide
> ones reined in so neighbours stop overlapping, music on/off setting added.**
> Jonathan's second round of live feedback, with 3 screenshots: a birch
> variant looked "silly" with a platform balanced on a visibly thin trunk;
> a second showed part of a neighbouring platform's tree bleeding into frame
> next to the one in focus (the `maxW` from the previous entry, p.w*3.2, let
> trees on tightly-spaced platforms grow wide enough to visually collide);
> and he asked for a Settings toggle to mute music independently of SFX.
> - `drawSpriteCell()` gained a `minW` param — width now independently
>   clamps into `[minW, maxW]` while height (`dh`) is always honoured
>   exactly regardless (see the updated function comment in `game.js`).
>   Trunk connector call now passes `minW = p.w * 1.3` (thickens narrow
>   variants like the birch without puffing up ones that were already fine)
>   and `maxW` pulled back from `p.w * 3.2` to `p.w * 2.3` (less bleed into
>   neighbours). Logic-verified (`node --check` clean, the math is a
>   straightforward independent-axis clamp) but **not yet spot-checked live
>   on the specific birch instance** — died twice on live enemies en route
>   to it (`1-2 Deeper Roots`, the platform at `x:1650,y:TIER1_Y`, connector
>   variant index 5) before calling it. Worth a quick look there specifically
>   next time you're testing.
> - **New: Music on/off setting**, independent of the existing "Sound
>   effects" toggle (which now only gates `beep()` SFX). New `settings.music`
>   field (defaults `true`, persisted same as the rest of `settings` via
>   `localStorage`), new `#set-music` checkbox in `index.html`'s settings
>   panel, `applyMusicVolume()` now gates on `settings.music` instead of
>   `settings.sound`.
> - **Open question, not yet resolved**: Jonathan also reported "can't jump
>   onto the ruin platform" and "the one above it is also not [high/reachable]
>   enough" on one screenshot (a ruin with an ornate carved-medallion base,
>   variant idx1 or idx3 in `ruins-sprites.png`, Troll standing at its foot,
>   a second platform floating disconnected higher up in frame). Reviewed
>   every platform pair in all 5 forest levels (`1-1` through `1-5`) by hand
>   — every gap is within normal single-jump range (max ~165px used anywhere,
>   vs. ~184px of single-jump height alone, before double-jump), so this
>   doesn't look like a level-data reachability bug, and ruin *height*
>   specifically wasn't touched by anything this session (no `TREE_HEIGHT_
>   BOOST`-equivalent was ever applied to ruins — they still map 1:1 to
>   `spanH`, same as the anchoring-fix entry below, just correctly anchored
>   now instead of falling short). Best guess: the floating platform in that
>   screenshot belongs to a different, later platform entry and isn't meant
>   to read as connected to this ruin at all — but I couldn't confirm without
>   knowing which level/spot this was. **Ask Jonathan which level** (or get
>   an updated screenshot with the level name visible in the HUD) before
>   spending more time on it.
> - `BUILD_VERSION` → `2026-07-20.5`, cache-buster → `v=33`, `dist/game.js`
>   rebuilt again (190877 → 157409 bytes).

> **2026-07-20 (even later, same day): trees now scaled taller than their
> platform's own span so the platform reads as embedded in the branches.**
> Jonathan's follow-up feedback on the anchoring fix below, with a reference
> screenshot: a tree scaled to end exactly at the platform line looks like
> it's standing under a shelf, not holding it. New `TREE_HEIGHT_BOOST = 1.5`
> constant in `game.js` — the trunk connector's draw height is now
> `spanH * TREE_HEIGHT_BOOST` instead of bare `spanH` (bottom anchor
> unchanged, still flush on `GROUND_Y`), and its width cap raised to
> `p.w * 3.2` so the aspect-preserving `min(scaleH, scaleW)` in
> `drawSpriteCell()` doesn't fight the height boost. Net effect: canopy now
> rises past the platform's top edge and wraps around it, so `branch.png`'s
> walkable surface (still drawn right after, still occluding whatever's
> behind it) reads as sitting inside the foliage rather than on top of a
> tree that happens to stop right there. Confirmed via Playwright at level
> 1-1 — Jonathan reviewed the exact screenshot mid-session and confirmed
> "this one looks ok." Ruins unaffected (pillars are meant to have a flat
> top the platform rests ON, not to be grown around).
> - `BUILD_VERSION` → `2026-07-20.4`, cache-buster → `v=32`, `dist/game.js`
>   rebuilt again (189891 → 156371 bytes).

> **2026-07-20 (later, same day): tree/ruin connector alignment fixed for
> real, taller pre-composed trees swapped in, menu theme music added.**
> - **Root cause of the misalignment Jonathan caught live** (tree canopy
>   floating above/off-center from its trunk, ruin caps not sitting flush,
>   trunks not reaching the ground): the very first version of
>   `drawSpriteCell()` (see the entry below) anchored using each sprite
>   sheet cell's raw *transparent-padded* edges, not the actual painted
>   pixels — and every cell has a different amount of padding on every side.
>   Measured the real content bounding box of every cell in both sheets via
>   a one-off PIL script (`Image.crop(cellBox).getbbox()`) and rewrote
>   `drawSpriteCell()` to anchor on that measured box instead: true visual
>   bottom lands exactly on `bottomY` (the ground line), true visual
>   horizontal center lands exactly on `cx` (the platform's center), and
>   scale is now uniform on both axes (never distorts aspect, unlike the
>   original which could squash width independently when `maxW` capped it).
>   `TRUNK_CONTENT_BOXES`/`RUIN_CONTENT_BOXES` in `game.js` hold the measured
>   values — re-measure and update them if either PNG is ever replaced.
> - **Trunk connector is now one whole pre-composed tree**, not a
>   trunk-sprite + separately-composited tree-top-sprite (that two-piece
>   approach was the design that made the padding problem so visible in the
>   first place — two independently-anchored pieces drift apart both ways
>   even with correct math, since they're not a single coherent painting).
>   Jonathan supplied `assets/forest/trees/trees-to_render-big-and-tall-
>   sprites.png` (3×2 grid, whole trees with trunk+canopy+roots already
>   combined, noticeably bigger/taller source paintings than the old
>   trunk-sprites.png) specifically to replace the split approach — used
>   as-is, no per-tree recropping needed since content-bbox anchoring
>   handles the alignment regardless of how much padding each cell has.
>   `trunk-sprites.png` and `tree-tops-sprites.png` are no longer referenced
>   (left on disk, harmless); `treeTopVariant` removed from the per-platform
>   seeding since there's no separate canopy piece to pick anymore.
> - **The "floating pickups with no platform" report was almost certainly a
>   framing/perception side-effect of the above, not a separate bug** —
>   traced the actual heart+candy pair in level 1-1 (`hearts: [{x:1150,
>   y:TIER1_Y-160}]`) via Playwright and found its supporting tree platform
>   sitting exactly where the level data says it should, just at the very
>   edge of/just past the screenshot's camera framing — easy to read as
>   "nothing under it" when the tree itself was ALSO rendering badly
>   misaligned at the time. Now that the tree anchors correctly, this should
>   read fine, but **please double check live** — hearts/candies themselves
>   are a completely separate, unmodified rendering path, so if it still
>   looks wrong after this it's a different issue than the one just fixed.
> - **New: menu theme music.** `assets/Music/Menu/Intro_Theme.mp3` (copied
>   from `02_Art_and_Audio/Audio/Troll & Unicorn Cartoon intro music.mp3`),
>   new `playMenuMusic()` in `game.js`, called once right after the
>   boot-time `loadLevel(0)` (which itself starts World 1's own track behind
>   the title screen as a side effect of just rendering the background level
>   — `playMenuMusic()` immediately swaps that for the real intro theme).
>   Pressing Play naturally replaces it via the existing `loadLevel()` →
>   `playLevelMusic()` path, same as any other level transition — no new
>   state-tracking needed.
> - `BUILD_VERSION` bumped to `2026-07-20.3`, cache-buster to `v=31`,
>   `dist/game.js` rebuilt (189107 → 156971 bytes). Local PHP dev server left
>   running at `http://localhost:8123/index.html` for Jonathan to test
>   directly. **Still needs the usual FileZilla upload** once confirmed good
>   — nothing in this entry is live.

> **2026-07-20: real tree/ruin platform art wired in, spitter enemy no longer
> fires from off-screen-adjacent range.**
> - **New forest platform-connector art** — Jonathan supplied
>   `assets/forest/trees/trunk-sprites.png` (3×2 grid), `tree-tops-sprites.png`
>   (2×4 grid), and `assets/forest/ruins/ruins-sprites.png` (3×2 grid),
>   replacing the old procedural brown-gradient trapezoid connector under
>   forest platforms. New generic `drawSpriteCell(img, grid, index, cx,
>   bottomY, dh, maxW)` helper slices one cell of a grid sheet, bottom-anchored
>   and width-capped. Each platform now gets a deterministic (seeded from
>   `x`/`y`/index, not `Math.random()`, so it's stable across reloads)
>   `connectorStyle` ("ruin" or "trunk", 1-in-3 ruin) and `connectorVariant`/
>   `treeTopVariant`. Ruins are self-contained pillars; trunks get a canopy
>   drawn first (background) topped by one of the 8 tree-top variants. Both
>   draw *before* the walkable `branch.png` platform surface in the same
>   frame, so the top of the trunk/pillar is naturally occluded — no cropping
>   needed. Gated to `themeName === "forest"` only — World 2's dunes theme has
>   no matching art and still uses the original procedural connector, as does
>   forest before the new art has finished loading. `full-trees-sprites.png`
>   (standalone background trees) was inspected but not used — doesn't fit the
>   platform-connector role; worth a look for background decoration later.
>   Visually confirmed via Playwright screenshots at level 1-1 (ruin pillars)
>   and 1-3 "The Old Grove" (trunk+canopy) — both well-composed, correctly
>   occluded, not distorted.
> - **Spitter enemy was firing at any on-screen distance** — Jonathan caught
>   this live (screenshot of the purple spiky spitter). Fixed to match the
>   brute's existing rock-throw gating exactly: new `SPIT_RANGE = 420`
>   constant, spitter fire condition now also requires
>   `horizDist < SPIT_RANGE` (Troll's actual distance, not just camera
>   visibility) alongside the existing `onScreen` check. `node --check` clean;
>   smoke-tested via Playwright (level 1-1 loads, plays, no new console
>   errors) but **not yet play-verified with Troll actually walking up to a
>   live spitter** — spitters first appear around level 1-4/2-1 per the level
>   data (`x: 1450` etc.), out of easy scripted-input reach this pass. Worth a
>   quick manual check next time you're near one.
> - `BUILD_VERSION` bumped `2026-07-20.1` → `2026-07-20.2`, `index.html`'s
>   `game.js?v=` bumped 29 → 30, `dist/game.js` rebuilt via `npm run build`
>   (185940 → 155643 bytes). **Still needs Jonathan's FileZilla upload** —
>   none of this is live yet (upload `dist/game.js` renamed to `game.js`, plus
>   `index.html` and the new `assets/forest/trees/` and `assets/forest/ruins/`
>   files).

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
