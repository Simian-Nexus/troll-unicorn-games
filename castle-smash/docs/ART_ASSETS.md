# Castle Smash — Art Asset Spec

Created 2026-07-15. The pieces the concept needs, in priority order, so they can be
produced through the existing T&U art pipeline (LoRA/ComfyUI lane or manual paint).

## Style anchor

Match the studio canon in `candy-dash/docs/GAME_BIBLE.md`: illustrated storybook,
soft painterly, bright magical glows, strong silhouettes, Celtic motifs
(Rayman Legends / Ori / Ghibli warmth). Family-friendly, never harsh.

All sprites: **transparent PNG**. Physics bodies are simple shapes, so art must read
clearly at small sizes — bold outlines, strong silhouette.

## Priority 1 — makes the prototype look like T&U

| Piece | Spec | Notes |
|---|---|---|
| Unicorn face projectile | 128×128, round silhouette | Smug/delighted expression; gold horn tip visible inside the circle. This is the signature image of the whole game. |
| Troll face projectile | 128×128, round silhouette | Deadpan-grumpy. Used when roles swap. |
| Sparkle-burst shards | 64×64, ×3 variants | Mini unicorn-face sparkles for the mid-flight split ability. |
| Wood beam/plank texture | 256×64 tileable | Painterly timber, rope bindings for charm. |
| Stone block texture | 128×128 | Mossy castle stone, Celtic knot carving on some. |
| Crystal | 96×128 | Glowing magical crystal — the win-condition object; needs an intact + cracked state. |
| Slingshot / launcher | ~200×300 | In-world it's a magical catapult-flower or Unicorn's horn-powered launcher — concept choice needed. |

## Priority 2 — polish

| Piece | Spec | Notes |
|---|---|---|
| Background | reuse first | The Unity project's Whispering Forest parallax set (`TAU_RealmsOfCorruption/Assets/Art/Sprites/Levels/Common/Parallax/Forest`, 4096×1024 tileable) can be adapted directly. |
| Defender vignette | reuse first | Troll idle/bum-scratch frames (256×256, `.../Player/Idle`) shown beside his castle reacting to hits — big personality win, zero new art. |
| Impact/destruction VFX | 128×128, 4–6 frames | Puff + sparkle debris per material. |
| Ice + magic-jelly blocks | 128×128 | Later materials from the design doc. |
| Game logo / title card | ~1024×512 | Needed before any public embed; final title still open. |
| UI set | buttons, HUD frames | Match website palette (navy `#1b2a4a`, soft cream, muted gold `#c9a441`). |

## Reusable today (no new art needed)

- Troll full-body frames: `candy-dash/assets/troll/` (run/jump/idle) and the larger
  Unity sprite library at `TAU_RealmsOfCorruption/Assets/Art/Sprites/`.
- `candy-dash/assets/unicorn-sit.png`, `unicorn-vibes.png` — full-body poses for
  menus/results screens (not suitable as projectiles; faces need dedicated crops/paints).
- Forest parallax + terrain sets (see Priority 2).

## Wiring note for the developer

Matter.js bodies take sprites via `render.sprite.texture` with `xScale`/`yScale`;
`src/main.js` MATERIALS table is the single place to attach block textures, and
`createProjectile()` for the face sprite. Keep source PSD/PNG masters in
`02_Art_and_Audio`, export game-ready copies into `castle-smash/assets/`.
