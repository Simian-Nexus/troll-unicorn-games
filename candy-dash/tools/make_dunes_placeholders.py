"""Generate PLACEHOLDER art for World 2 (Sun-Blasted Dunes).

Two jobs:
1. Procedural parallax layers (sky/far/mid/near/near2/fg) — warm desert
   gradient sky + sun, then layered dune-ridge silhouettes in progressively
   darker sand tones. Painterly-ish via soft noise on the ridgelines.
2. Hue-shifted copies of the Whispering Forest terrain art (ground shelves,
   branch platform, tree exit) toward sand/bleached-bone tones, so all the
   collision metadata (surfaceFrac, bumps, branch profile) carries over
   unchanged.

These are STAND-INS until real art is generated with the Flux/ComfyUI
workflow — see docs/WORLD2_ASSET_PROMPTS.md for the prompt pack. Replace
files in assets/dunes/ 1:1 (same names) and the game picks them up.

Run from the candy-dash folder:  python tools/make_dunes_placeholders.py
"""

import colorsys
import math
import random
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOREST = ROOT / "assets" / "forest"
OUT = ROOT / "assets" / "dunes"
(OUT / "parallax").mkdir(parents=True, exist_ok=True)
(OUT / "terrain").mkdir(parents=True, exist_ok=True)
(OUT / "cutscene").mkdir(parents=True, exist_ok=True)

random.seed(21)  # reproducible dunes

W, H = 2048, 1200  # matches the forest layers' working scale


def ridge(width, base_frac, amp_frac, waves, seed):
    """A smooth dune ridgeline: sum of a few sines, tileable across width."""
    rnd = random.Random(seed)
    phases = [rnd.uniform(0, math.tau) for _ in range(waves)]
    amps = [rnd.uniform(0.4, 1.0) for _ in range(waves)]
    ys = []
    for x in range(width):
        t = x / width * math.tau
        v = sum(a * math.sin(t * (i + 1) + p) for i, (a, p) in enumerate(zip(amps, phases)))
        v /= sum(amps)
        ys.append(int(H * (base_frac + amp_frac * v)))
    return ys


def dune_layer(name, color, base_frac, amp_frac, waves, seed, haze=None):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = img.load()
    ys = ridge(W, base_frac, amp_frac, waves, seed)
    r, g, b = color
    for x in range(W):
        top = ys[x]
        for y in range(max(0, top), H):
            # subtle vertical shading: darker toward the bottom
            shade = 1 - 0.25 * (y - top) / max(1, H - top)
            px[x, y] = (int(r * shade), int(g * shade), int(b * shade), 255)
        if haze:  # soft light rim along the crest (sun-bleached edge)
            for y in range(max(0, top - 6), top):
                a = int(255 * (1 - (top - y) / 6) * 0.6)
                px[x, y] = (haze[0], haze[1], haze[2], a)
    img.save(OUT / "parallax" / name)
    print("wrote", name)


def sky():
    img = Image.new("RGBA", (W, H))
    px = img.load()
    # warm desert sky: pale gold horizon -> dusty blue zenith
    top = (126, 168, 196)
    bottom = (244, 224, 172)
    for y in range(H):
        t = y / H
        c = tuple(int(top[i] + (bottom[i] - top[i]) * (t**1.3)) for i in range(3))
        for x in range(W):
            px[x, y] = (*c, 255)
    # big low sun with soft bloom
    sx, sy, rad = int(W * 0.68), int(H * 0.38), 130
    for y in range(sy - rad * 3, sy + rad * 3):
        if not (0 <= y < H):
            continue
        for x in range(sx - rad * 3, sx + rad * 3):
            if not (0 <= x < W):
                continue
            d = math.hypot(x - sx, y - sy)
            if d < rad:
                px[x, y] = (255, 246, 214, 255)
            elif d < rad * 3:
                t = 1 - (d - rad) / (rad * 2)
                pr, pg, pb, _ = px[x, y]
                a = t * t * 0.55
                px[x, y] = (
                    int(pr + (255 - pr) * a),
                    int(pg + (246 - pg) * a),
                    int(pb + (214 - pb) * a),
                    255,
                )
    img.save(OUT / "parallax" / "sky.png")
    print("wrote sky.png")


def hue_shift_file(src, dst, target_h, sat_mul=0.9, val_mul=1.08):
    """Recolor art toward a target hue while keeping alpha + detail."""
    img = Image.open(src).convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            hh, ss, vv = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # pull hue toward the sand hue; keep near-neutrals neutral
            hh = target_h if ss > 0.12 else hh
            ss = min(1, ss * sat_mul)
            vv = min(1, vv * val_mul)
            nr, ng, nb = colorsys.hsv_to_rgb(hh, ss, vv)
            px[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    img.save(dst)
    print("wrote", dst.name)


SAND_H = 0.10  # ~36 degrees: warm sand
BONE_H = 0.11

sky()
# far: pale distant dunes low on the frame
dune_layer("far.png", (226, 203, 156), 0.62, 0.03, 3, seed=1, haze=(255, 240, 205))
dune_layer("mid.png", (211, 182, 130), 0.68, 0.045, 4, seed=2, haze=(252, 232, 190))
dune_layer("near.png", (196, 163, 108), 0.74, 0.06, 4, seed=3, haze=(250, 226, 178))
dune_layer("near2.png", (178, 143, 92), 0.80, 0.07, 5, seed=4, haze=(246, 218, 166))
dune_layer("fg.png", (156, 120, 74), 0.88, 0.08, 5, seed=5)

# Terrain: hue-shift the forest art so all collision metadata carries over.
hue_shift_file(FOREST / "terrain" / "ground-1.png", OUT / "terrain" / "ground-1.png", SAND_H)
hue_shift_file(FOREST / "terrain" / "ground-2.png", OUT / "terrain" / "ground-2.png", SAND_H)
hue_shift_file(FOREST / "terrain" / "ground-3.png", OUT / "terrain" / "ground-3.png", SAND_H)
hue_shift_file(FOREST / "terrain" / "branch.png", OUT / "terrain" / "branch.png", BONE_H, sat_mul=0.6, val_mul=1.15)
hue_shift_file(FOREST / "cutscene" / "tree-exit.png", OUT / "cutscene" / "tree-exit.png", BONE_H, sat_mul=0.45, val_mul=1.2)

print("done — placeholder dunes art in assets/dunes/")
