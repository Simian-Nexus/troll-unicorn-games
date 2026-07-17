# Purified enemy sprites

Shown while a hit enemy hops away after being purified (`purify()` / `purifyBoss()`
in `game.js`) — same filename convention as `assets/enemies/`: `<kind>.png`,
transparent, facing left, cropped to visible pixels.

| File | Shown for | Source |
|---|---|---|
| `drone.png` | Gleamleaf Soarer in graceful flight (healed) | `Media/Critters/_Incoming` |
| `grunt.png` | Healed Canopy Skitterkin | `Media/Critters/_Incoming` |
| `spitter.png` | MossNibble Sproutling in glowing bloom (healed) | `Media/Critters/_Incoming` |
| `brute.png` | Skybark Stonetooth, forest guardian (healed) — also shown in the Level 4 finale scene | `Media/Critters/_Incoming` |

Each pair shares the same silhouette/pose as its corrupted counterpart in
`assets/enemies/`, which is why the purify swap reads as "the same creature,
healed" rather than a random substitution — worth preserving that matching when
swapping any of these out.
