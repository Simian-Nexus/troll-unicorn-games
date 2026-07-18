# Candy Dash — Game Bible (Troll & Unicorn Universe)

Compiled 2026-07-15 from episode 7.5, the Realms of Corruption GDD, character sheets,
and level concepts. This is the single canon reference for the HTML5 game.
It is written in Markdown deliberately so it can be ingested by the Story Planner
Canon Engine (`Story_planner_tool`) alongside the episode HTML files.

Authoritative sources (in priority order when anything conflicts):

1. `01_Lore_and_Scripts/Episodes/episode-07.5.html` — the bridge episode the game begins from
2. `03_Games/TAU_RealmsOfCorruption/Docs/GameDesign/GDD.md` — full game design document
3. `03_Games/TAU_RealmsOfCorruption/Docs/GameDesign/CharacterSheets.md`
4. `03_Games/TAU_RealmsOfCorruption/Docs/GameDesign/LevelConcepts.md`

---

## 1. The Setup (where episode 7.5 leaves off)

A Saurosapien (vulture-like reptilian) warship attacks King Angus's palace in the
**Wood Between Worlds**. Angus repels it, but the phase-cannon bolts ricochet off the
palace's magical shield into the forest, where they are absorbed by the portal pools.
About 20 falling Saurosapiens (including their **Captain**) are sucked into the pools.

Result:

- **5 portal pools are corrupted** — glowing and pulsing a sinister red, each leading to a
  realm destabilized by the reptilian interlopers inside it.
- All other pools are **locked**, including Cerebra's way home to prehistoric Earth.
- King Angus summons his exiled son **Thagius (Troll)** back from the caves and gives him
  the mission. Cerebra (newly "upgraded" with physical magic) numbers the portals **1–5**
  by corruption intensity.

**The mission (Angus's words, paraphrased):** enter each portal, collect the fragmented
pieces of the corrupted **Stabilizing Matrix**, use their power to deal with the
Saurosapien interloper in each realm, and let Sparkles form a stable Matrix (portal)
back to the Wood. Do all five and Troll gets to talk about getting his body back.

Angus levitates Troll and Sparkles into Portal 1. They splash in… **the game begins.**

## 2. The Core Fiction of Play

- **"Candies" = fractured Stabilizing Matrix fragments.** They float in the corrupted
  realms. They look like glowing candy; that's the joke and the brand.
- Troll's own magic is offline (no sunlight, wrong body), so **the fragments are his only
  power source**, channelled through **Sparkles's horn**.
- Charged horn energy is fired at corrupted creatures to **purify them back into the good
  creatures they were** — the game is about healing, not killing (a locked canon rule:
  enemies feel corrupted or confused, never evil; no graphic violence).
- At the end of each level, the collected Matrix energy is **given to Sparkles**, who
  enters a harmonic trance and **stabilizes the exit portal** (gold light blossoms,
  realm heals, uplifting beat, on to the next level).

## 3. Characters (game-relevant essentials)

### Troll — Thagius Spoozikm Gumwillows (PLAYER)
- Reluctant celestial exile; once a cosmic energy-balancer, banished into troll form for grumpiness.
- Sarcastic, intelligent, impatient, secretly soft-hearted. Scottish-flavoured speech like his dad
  ("Och", "dinnae", "whit").
- Grumpy, **not** cruel. He complains the whole way and does the right thing anyway.
- Powers: normally sunlight + Matrix energy; in the corrupted realms he relies on Matrix fragments.

### Sparkles the Unicorn (COMPANION / WEAPON / PORTAL KEY)
- Joy-spirit in unicorn form; air elemental. **Speech lisp is canon** ("Leth go Thpooth!").
- Invulnerable, non-violent; magic powered by belief and harmony.
- In-game roles: horn-blast purification (using Troll's collected candy), portal stabilization,
  comic relief. Calls Troll "Thpooth".

### King Angus Gumwillows
- Ruler of the Wood Between Worlds. Majestic, warm, loud, exasperated. Scottish.
- Game roles: mission-giver, between-level narration, loading-screen one-liners.

### Cerebra
- Former Eldaryn AI, now biological, newly able to touch magic. Wise, kind, rational.
- Game roles: tutorial/UI voice ("It makes sense to tackle this based on corruption intensity"),
  level-select glyphs/numbers, hint system. A natural diegetic excuse for any HUD element.

### Timmy Harrington
- Human child companion. Watches from the Wood with Angus and Cerebra — perfect framing device:
  **the game is literally what Timmy and the others watch from the hub.** Cheerleader VO.

### Saurosapiens (ANTAGONISTS)
- Proud, militaristic reptilian empire; not purely evil ("power without wisdom becomes corruption").
- ~20 fell into the pools; concentrated into 5 realms. **One interloper boss per realm**,
  the **Captain** in realm 5.
- Bosses get **redemption-tinged endings**, never cruelty.

## 4. World Structure

Canon note (2026-07-15): episode 7.5 and the GDD agree on **5 realms**; the GDD structures
them as 5 worlds × 4 levels = 20 levels. `LevelConcepts.md` lists "20 realms" — treat those
20 biome ideas as the **level themes inside the 5 worlds**, not 20 separate realms.

For the HTML5 game we use **5 realms, 3–4 levels each**, drawn from the level-concept bible:

| Realm | Working name | Biome / mechanic seeds | Corruption theme (GDD) |
|---|---|---|---|
| 1 | Whispering Forest | Green woodland; branch platforms, gliding leaves | The Spillover — corruption is accidental |
| 2 | Sun-Blasted Dunes | Desert; moving sand platforms, heat shimmer | The Occupation — corruption is strategic |
| 3 | Frozen Star Valley | Ice; slide platforms, stillness and clarity | The Assimilator — corruption is learning |
| 4 | Bioluminescent Caverns | Crystal caves; light-trigger doors, glow | The Mirror — not all enemies chose corruption |
| 5 | Storm-Cliff Citadel | Lightning fortress; timing hazards; Captain's realm | The Convergence — ideology vs balance |

(Sky Isles, Coral Reef, Clockwork Riverlands, etc. remain in the back-pocket for bonus levels.)

**Hub:** the Wood Between Worlds — five numbered red pools that turn **gold** as realms are
healed. Level select = walking Troll onto a pool.

## 5. Enemy Archetypes (from GDD, mapped to platformer mechanics)

Named creatures (2026-07-15) come from `Media/Critters/_Incoming` — properly matched
corrupted/healed pairs (same silhouette, different palette/detail), which is why the
purify swap in-game reads as "the same creature, healed."

| Archetype | Behaviour | Corrupted name | Purified form |
|---|---|---|---|
| Drone / Flyer | aerial patrol | Gleamleaf Soarer | Gleamleaf Soarer in graceful flight |
| Grunt | ground patrol, contact damage | Canopy Skitterkin hunter | Healed Canopy Skitterkin |
| Spitter | stationary, lobbed projectiles | MossNibble Sproutling | MossNibble Sproutling in glowing bloom |
| Brute | slow, big, jump-proof | Skybark Stonetooth | Skybark Stonetooth, forest guardian |
| Realm 1 Boss ("Forest Captain") | hunts Troll within his arena, multi-phase, Saurosapien | Skybark Stonetooth (scaled 2.2x, placeholder — see note) | same, at normal scale, in the finale scene |

Held in reserve for future realm variety (matched pairs, not yet wired in):
Corrupted Dewwing Mote, Corrupted bramble burrowimp, Corrupted stormpetal lanternbat
(each with a healed counterpart in the same folder).

**Saurosapien look, not yet made (2026-07-15):** Skybark Stonetooth is a functional
placeholder for the Forest Captain, not the intended design. Jonathan shared two
reference images for the real look: a reptilian humanoid in sleek dark sci-fi armor
with glowing cyan/teal tech accents, muscular crocodilian head, clawed hands (and
one variant with large bat-like wings). **Both references are copyrighted third-party
concept art** (one credited "Tsvetomir Georgiev / The Aaron Sims Company", a Jupiter
Ascending piece; the other watermarked "niclas dreie creative") — neither was copied
into the project; they're style/mood reference only. No image-generation tool is
available in a Claude Code session, so an actual Saurosapien sprite needs to be
generated locally (the project's own Flux/ComfyUI workflows, e.g.
`03_Games/TAU_RealmsOfCorruption/Docs/flux2_klein_detail_pass_workflow.md`) using
those two images as prompt/style reference, then cut out the same way as the other
critters (`tools/cutout_critters.py`).

Rules that must not lapse:
- Enemies never learn mid-level; escalation is **designed**, one new concept per realm.
- Purifying yields more score/"Goodness" than dodging past. Kind play is the optimal play.

## 6. Tone & Presentation Canon

- **Hope-based fantasy.** Whimsical, mythic, heartfelt, funny. Never grimdark, never harsh.
- Art: illustrated storybook, soft painterly, bright magical glows, Celtic motifs, strong
  silhouettes (inspirations: Rayman Legends, Ori, Ghibli warmth).
- Audio: Celtic strings, warm woodwinds, chimes; playful impacts; friendly UI sounds.
- Writing: Troll deadpan-grumpy, Sparkles lisping joy, Angus booming Scottish exasperation,
  Cerebra precise and kind. Nobody is mocked cruelly.
- Family-friendly (ages 8–14 + nostalgic adults); dignity and safety first.

## 7. Asset Inventory (already produced, reusable in HTML5)

All under `03_Games/TAU_RealmsOfCorruption/Assets/Art/Sprites/` unless noted. Troll frames
are 256×256 PNGs with transparency — ideal for canvas.

- **Player/Run** — `TAU_Troll_Run_01..08.png` (full run cycle)
- **Player/Walk** — 21 frames; **Walk/Crouched** — 9 frames (in game as crouch)
- **Player/Jump** — 5 frames + 5 "in place" frames
- **Player/Idle** — look left (16, in game), look right (11, unused), scratch-bum (7, in game),
  plus two more transition folders (`IDLE POSITIONING FROM RIGHT FOR BUM SCRATCH`,
  `IDLE LOOK STRAIGHT FROM RIGHT SCRATCH BUM`, 20 frames) not yet used
- **Levels/Common/Parallax/Forest** — Sky / Far / Mid / Near / FG_Deco layers (in game; each
  source file is a mirrored pair — crop to the left half before using, see the plan doc)
- **Levels/Production/World01_WhisperingForest/Terrain** — Unity block-style terrain
  (`GRD_W01_*`, `PLT_W01_*`); `PLT_W01_Branch_A_2u` is in game as the platform sprite. The
  `Top_Flat`/`Body_Rooty` ground blocks are RGB with a plain white background (not real
  alpha) — need a rembg cutout before use, unlike the branch/portal-adjacent RGBA pieces.
- **`Media/Critters/_Incoming`** (project root) — 7 matched corrupted/healed creature pairs,
  clean white background, high quality, side-profile — 4 pairs in game (see §5), 3 held in
  reserve.
- **`TAU_RealmsOfCorruption_25D/Assets/_Project/Art/Prompts/Results`** — a numbered AI-art
  library specifically for this forest level: real **portal art** (`25 Golden Portal Core`,
  in game; `24 Portal Root Arch`, `26 Portal Steps v1-3`, `27 Portal Grove Platform` unused),
  ground-shelf variants (`01`/`02`, in game, richer than the Unity terrain blocks), plus
  unused decor/prop pieces (mossy boulders, root bridges, stepping stones, matched
  corrupted/healed bramble and moss patches, Matrix Fragment Orb candy art, spell-impact/
  cleanse-puff VFX) — worth a full pass before realm 2.
- **`02_Art_and_Audio/AI_Art/Troll/Animation`** — a much larger Troll animation library
  (idle wave, spellcast, crawl-transform, turn-to-camera, run-to-jump, etc.) as raw MP4s and
  extracted video frames — NOT pre-cutout or canvas-normalized like the Unity sprite folders,
  so each use needs a rembg pass + manual frame selection first (done once already for 6
  frames of `Idle Cycle`, folded into the idle fidget loop). Good source for future "long
  idle" personality beats, spell-cast VFX reference, and a crawl/climb mechanic if wanted.
- 2.5D project (`TAU_RealmsOfCorruption_25D`) Unity scenes/scripts otherwise unused —
  reference only.

Still missing for the HTML5 game: Sparkles run/fly cycle matching Troll's style, candy
sprite dedicated art (currently procedural; `31 Matrix Fragment Orb.png` above is untried),
realm 2–5 parallax sets.

## 8. Level Exit & Artifact System (added 2026-07-15)

- **Levels 1-3 end at a hollow tree, not a portal.** Each hides one **artifact** — a
  glowing rune stone (canon: a "Lore Stone", per `LevelConcepts.md`'s optional-collectible
  list) — on a high platform. Reaching the tree without it triggers Troll's own line
  ("I have to find the artifact thingy first.") instead of ending the level; the HUD
  shows a dim artifact icon that lights up once found.
- **Level 4 keeps a real portal**, deliberately dark and empty — no candy threshold, no
  automatic activation. Defeating the Forest Captain hands Troll a full charge outright
  ("killing him gives Troll the energy he needs"); walking up to the portal with that
  charge starts a short scripted beat — Sparkles flies in and beams the energy into the
  portal, which then lights up gold — before cutting to the finale scene. The boss also
  actively hunts Troll within his arena rather than just pacing corner to corner.
- This replaces the earlier "candy-threshold gates the final portal" design from Phase 3
  — natural regen still exists, but its purpose is now "you'll always have enough after
  the boss fight," not "grind candy to meet a threshold."

## 9. The 10-World Story Arc (canon 2026-07-17)

Jonathan approved `STORY_ARC_PROPOSAL_10_WORLDS.md` as canon on 2026-07-17 —
that file is now the authoritative arc: 10 worlds (5 surface realms per episode
7.5, then 5 "Deep Realms" as the corruption migrates along the Wood's root-ways),
5 levels each (4 + boss), the five plot threads, and the future-Earth /
Eldaryn-time-travel cliffhanger that bridges into comic Episode 8.

Canon rules added by that arc, live in the game since 2026-07-17:

- **Healed critters stay.** From World 2's opening beat (Angus: "ye're shootin'
  those poor corrupted critters TOO HARD — they're PATIENTS!"), purified
  creatures no longer despawn: they settle and wander harmlessly, so a cleansed
  level visibly fills with life. (Implemented retroactively in World 1 too.)
- **World 2 = The Sun-Blasted Dunes** ("The Occupation"): golden desert, heat
  shimmer, bleached bones of portal trees. New traversal concept: **sinking
  sand platforms**. Boss: **the Dune Warden**, a Saurosapien quartermaster
  hoarding water for troops who never came. Intrigue drip: Saurosapien field
  crates stamped with a Paleotech logo; Cerebra can read it and says nothing.
- Levels: 2-1 The Bleached Sands (Angus beat), 2-2 The Sunken Caravan,
  2-3 Mirage Flats, 2-4 The Bone Garden, 2-5 The Dune Warden.
- **All World 2 art is placeholder** (procedural dunes + hue-shifted forest
  terrain via `tools/make_dunes_placeholders.py`). Real art prompts:
  `docs/WORLD2_ASSET_PROMPTS.md`. The Dune Warden reuses the Saurosapien pose
  art (same species — honest placeholder).

## 10. Naming

- Public game title: **Troll & Unicorn: Candy Dash**
- Narrative umbrella (shared with Unity projects): **Realms of Corruption**
- The Unity 2D/2.5D projects are **paused, not dead** — this HTML5 game is the fast route
  to a playable, shareable product that feeds the YouTube channel.
