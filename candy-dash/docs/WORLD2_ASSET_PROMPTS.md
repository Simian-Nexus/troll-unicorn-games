# World 2 (Sun-Blasted Dunes) — AI-Art Prompt Pack

Written 2026-07-17. Everything the game currently shows for World 2 is
placeholder (procedural dunes + hue-shifted forest terrain from
`tools/make_dunes_placeholders.py`). Generate the real set with the project's
Flux/ComfyUI workflow (`03_Games/TAU_RealmsOfCorruption/Docs/GameDesign/…` and
`flux2_klein_detail_pass_workflow.md`), then drop files into `assets/dunes/`
with the same filenames — the game picks them up with zero code changes
(bump `ASSET_VERSION` in game.js so phones refetch).

## Shared style block (prepend to every prompt)

> illustrated storybook game art, soft painterly digital painting, warm
> magical glow, strong readable silhouettes, gentle Celtic ornamental motifs,
> family-friendly fantasy, rich color harmony, in the style of Rayman Legends
> and Ori and the Blind Forest, no text, no watermark

**Shared negative prompt:**

> photo, photorealistic, 3d render, harsh shadows, grimdark, horror, gore,
> text, watermark, signature, frame, border, human figures

**World 2 palette note:** golden sand, honey and amber light, pale turquoise
sky, sun-bleached bone-white accents, occasional corrupted crimson-purple
veins (the corruption accent color from World 1's critters).

## A. Parallax layers → `assets/dunes/parallax/`

Each is its own generation. Wide format (≥2048×1200). Layers that sit in
front of the sky need clean separation for cutout — ask for "plain white
background above the ridgeline" and run the usual rembg/crop pass
(`tools/prep_forest_assets.py` shows the pipeline; watch for internal repeat
seams and mirror axes — crop narrow, the code's cover-scale handles width).

| File | Prompt (after style block) |
|---|---|
| `sky.png` | vast desert sky at golden hour, pale turquoise fading to warm honey at the horizon, one huge soft white-gold sun with gentle bloom, a few wisps of high cloud, empty of land, seamless wide panorama |
| `far.png` | extremely distant pale dune ridgeline, hazy heat-washed silhouette, almost dissolving into sky light, low on frame, plain white background above the ridge |
| `mid.png` | distant golden sand dunes, soft sculpted curves, subtle wind-carved ridges, hazy warm light, plain white background above the ridge |
| `near.png` | mid-distance amber dunes with a few half-buried bleached ancient tree roots and weathered standing stones with faint Celtic spiral carvings, plain white background above the ridge |
| `near2.png` | closer deep-gold dunes, wind-rippled sand texture, scattered sun-bleached branches and bone-white driftwood, one half-buried broken stone arch, plain white background above the ridge |
| `fg.png` | dark honey-brown foreground dune band with sparse dry desert grass tufts, small sandstone rocks, silhouetted foreground detail, plain white background above the ridge |

## B. Terrain → `assets/dunes/terrain/`

Match the forest pieces' framing: isolated object, white background,
side-on, painterly. Cut out with rembg; measure `surfaceFrac` (first row
with >90% opaque coverage) the way the plan doc describes before wiring in.

| File | Prompt |
|---|---|
| `ground-1.png` | floating desert ground shelf seen from the side, flat walkable sandy top with dry grass tufts and small sun-bleached bones, layered sandstone strata and exposed dry roots beneath, isolated on white background |
| `ground-2.png` | wide desert ground shelf from the side, packed golden sand top with scattered pebbles and a small cow-skull-like bleached critter skull, cracked sandstone underside with rounded boulders, isolated on white |
| `ground-3.png` | desert ground shelf with a raised wind-carved sandstone mound on top (a climbable bump), sculpted smooth by wind, dry roots below, isolated on white |
| `branch.png` | long horizontal sun-bleached ancient tree limb, bone-white driftwood platform with a flat walkable top, wind-polished, small Celtic knot scar in the bark, isolated on white |

## C. Cutscene / props → `assets/dunes/cutscene/`

| File | Prompt |
|---|---|
| `tree-exit.png` | huge hollow dead desert tree, sun-bleached bone-white trunk with a large dark inviting hollow at its base, half-buried in golden sand, gentle golden light spilling from the hollow, isolated on white |
| `crates.png` *(new prop — the intrigue drip)* | small stack of alien military supply crates in desert-worn dark metal, reptilian claw-scratch marks, one crate stamped with a subtle glowing logo of a wormhole spiral and a stylized dinosaur skull, half-buried in sand, isolated on white |

(The crate logo is the Paleotech mark from comic Episode 1 — wormhole +
dinosaur skull. Keep it small and subtle: the story beat is that nobody in
the party can read it yet.)

## D. Critter pairs → `assets/enemies/` (World 2 set)

Same recipe as the `Media/Critters/_Incoming` pairs that made World 1 work:
**one corrupted + one healed image per creature, SAME silhouette and pose,
side profile facing LEFT, clean white background** — that's what makes the
purify swap read as "the same creature, healed." Generate corrupted first,
then a second pass prompting the healed palette on the same composition
(img2img at low denoise works well for silhouette lock).

Corruption look: crimson-purple veins, smoky dark accents, sad glowing eyes.
Healed look: warm gold-green glow, bright eyes, relaxed posture.

| Archetype (slot) | Creature | Corrupted prompt core | Healed prompt core |
|---|---|---|---|
| drone (flyer) | **Sunwing Skimmer** | small desert bird-lizard with wide sail-like translucent amber wings, corrupted: crimson-purple veined wings, smoky trail, sorrowful glowing eyes | same creature, wings glowing warm honey-gold, graceful gliding pose, cheerful |
| grunt (walker) | **Duneburrow Skitterkin** | round fennec-like sand critter with oversized ears and digging claws, corrupted: purple-veined fur, hunched aggressive skitter | same creature, sandy-gold fur, bright curious eyes, relaxed happy trot |
| spitter (stationary) | **Prickleburst Sproutling** | squat desert cactus-creature with a flower-bud mouth, corrupted: crimson thorns, dripping dark sap, scowling | same creature in glowing bloom, turquoise desert flower open, content smile |
| brute (heavy) | **Stoneshell Duneback** | big slow tortoise-like beast with a cracked sandstone shell, corrupted: purple magma glowing in the shell cracks, weary anger | same creature, shell cracks sealed with gold (kintsugi-style), calm gentle giant |

Files: `assets/enemies/<kind>.png` + `assets/enemies/purified/<kind>.png` —
but NOTE these are currently the World 1 forest critters shared across both
worlds. Before swapping in desert critters, game.js needs per-theme enemy
sprite sets (small change, same pattern as THEMES). Generate the art first;
wire-up is a 20-minute follow-up.

## E. The Dune Warden (boss) — needs the real Saurosapien design first

The Dune Warden is a Saurosapien quartermaster. He currently reuses the
Forest Captain's pose art (same species, honest placeholder). The real
Saurosapien look is still TBD per `GAME_BIBLE.md` §5 — Jonathan's two
copyrighted reference images (Jupiter Ascending / Aaron Sims Co; "niclas
dreie creative") are style reference ONLY, not to be copied.

Prompt core (after the shared style block, using those references as style
guidance in your workflow):

> tall reptilian humanoid soldier, muscular crocodilian head, sleek dark
> sci-fi armor with glowing cyan-teal tech accents, desert-adapted: sand-worn
> armor plates, tattered sun-cloak, bandolier of waterskins and canteens,
> weary proud quartermaster bearing, side profile facing left, full body,
> white background

Poses needed to match the existing boss rig (see `assets/enemies/saurosapien/`):
`idle`, `alerted`, `about_to_shoot`, `ready_to_shoot_left/right`,
`shooting_left/right_pointing_down/straight` — 9 images, plus one **redeemed**
pose (sitting calmly, helmet off, drinking from a waterskin) for the finale.

## F. Nice-to-haves (bonus, not blocking)

- Heat-shimmer overlay strip (translucent wavy distortion band) — could be
  drawn procedurally instead; skip unless it's easy.
- Matrix-candy variant with a sand-glass look (currently the shared candy).
- A buried, dimmed portal-pool for level backgrounds (story flavor).

## Pipeline reminders

1. Cutouts: `tools/cutout_critters.py` (check per-kind flip — source art must
   face LEFT or set the flip flag; this bit us in World 1).
2. Verify real alpha with PIL — the Read-tool preview lies about transparency
   (World 1 lesson, see CANDY_DASH_2_PLAN.md).
3. Parallax: crop away mirror axes and edge vignettes; narrow crops are safe
   (code cover-scales), internal repeat seams are not.
4. After dropping files in: bump `ASSET_VERSION` in game.js.
