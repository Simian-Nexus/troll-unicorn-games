# Enemy sprites — how to swap graphics

`game.js` automatically loads `assets/enemies/<kind>.png` for each enemy kind and
falls back to the procedural vector drawing if the file is missing. **To change a
bad guy's look, just replace the PNG — no code changes needed.** The Level 4 boss
(the Forest Captain) reuses `brute.png` scaled up (`BOSS_SCALE`), so replacing it
also re-skins the boss.

| File | In-game enemy | Current art (source, named per `Media/Critters/_Incoming`) |
|---|---|---|
| `drone.png` | flies, aerial patrol | Corrupted Gleamleaf Soarer |
| `grunt.png` | ground walker, patrols | Corrupted Canopy Skitterkin hunter |
| `spitter.png` | stationary, lobs projectiles | Corrupted MossNibble Sproutling |
| `brute.png` | big, slow — also the Level 4 boss | Skybark Stonetooth (corrupted) |

Matching purified counterparts (shown mid-purify — see `purified/README.md`) live
in `Media/Critters/_Incoming` too, with matching silhouettes, so the purify-swap
reads cleanly. Three more matched pairs are sitting unused in that folder for
future enemy variety in later realms: Corrupted Dewwing Mote, Corrupted bramble
burrowimp, Corrupted stormpetal lanternbat (each with a healed counterpart).

Conventions:
- Transparent PNG, cropped to the visible pixels.
- **Facing LEFT** (toward Troll). Flip before saving if the art faces right.
- Any size works — the game scales to the hitbox height (aspect preserved). ~320 px tall keeps files small.

Cutouts were made with rembg (u2net); the reusable script is
`tools/cutout_critters.py` (see `docs/CANDY_DASH_2_PLAN.md`).
