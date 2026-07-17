"""Prepare Whispering Forest environment art for candy-dash: parallax layers,
ground-shelf tiles, and the two-layer rotating portal.

Requires rembg (see cutout_critters.py for the venv setup notes). Re-run whole
sections independently if you only need to regenerate one asset family --
each block below is self-contained.
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
from rembg import remove

ROC = Path(r"D:\JonoFiles\Projects\01_Business\Spinning_Monkey_Studios\02_Active_Projects\Troll_and_Unicorn\03_Games\TAU_RealmsOfCorruption\Assets\Art\Sprites\Levels")
RESULTS_25D = Path(r"D:\JonoFiles\Projects\01_Business\Spinning_Monkey_Studios\02_Active_Projects\Troll_and_Unicorn\03_Games\TAU_RealmsOfCorruption_25D\Assets\_Project\Art\Prompts\Results")
OUT = Path(r"D:\JonoFiles\Projects\01_Business\Spinning_Monkey_Studios\02_Active_Projects\Troll_and_Unicorn\03_Games\TAU_HTML5_Games\candy-dash\assets\forest")
(OUT / "parallax").mkdir(parents=True, exist_ok=True)
(OUT / "terrain").mkdir(parents=True, exist_ok=True)
(OUT / "cutscene").mkdir(parents=True, exist_ok=True)


def resize_to_width(src, dst, width, crop_left=None, crop_right=None):
    img = Image.open(src).convert("RGBA")
    h = round(img.height * width / img.width)
    img = img.resize((width, h), Image.LANCZOS)
    if crop_left is not None or crop_right is not None:
        img = img.crop((crop_left or 0, 0, crop_right or width, img.height))
    img.save(dst)
    print(f"{src.name} -> {dst} {img.size}")


def cutout(src, dst, max_dim=None):
    img = Image.open(src).convert("RGBA")
    cut = remove(img)
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    if max_dim and max(cut.size) > max_dim:
        if cut.width >= cut.height:
            w, h = max_dim, round(cut.height * max_dim / cut.width)
        else:
            h, w = max_dim, round(cut.width * max_dim / cut.height)
        cut = cut.resize((w, h), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    cut.save(dst)
    print(f"{src.name} -> {dst} {cut.size}")


# --- Parallax -----------------------------------------------------------
# Every PA_Forest_*_A source is a mirrored pair (left half + its own mirror)
# baked into one file -- the mirror axis shows up as a jarring vertical seam
# if tiled naively. Each layer also has its own outer-edge vignette near its
# original x=0. Bounds below (measured on the 2048px resize, 2026-07-15) clear
# both: left trims the vignette, right stays short of that layer's own mirror
# seam. Re-derive with a column-brightness scan if the source art changes.
PARALLAX = ROC / "Common" / "Parallax" / "Forest"
resize_to_width(PARALLAX / "Sky" / "PA_Forest_Sky_A_4096x1024.png", OUT / "parallax" / "sky.png", 2048, 40, 800)
resize_to_width(PARALLAX / "Far" / "PA_Forest_Far_A_4096x1024.png", OUT / "parallax" / "far.png", 2048, 40, 1050)
resize_to_width(PARALLAX / "Mid" / "PA_Forest_Mid_A_4096x1024.png", OUT / "parallax" / "mid.png", 2048, 40, 950)
resize_to_width(PARALLAX / "Near" / "PA_Forest_Near_A_4096x1024.png", OUT / "parallax" / "near.png", 2048, 230, 830)
resize_to_width(PARALLAX / "FG_Deco" / "PA_Forest_FG_A_4096x768.png", OUT / "parallax" / "fg.png", 2048, 94, 1000)
# Near_B is a second, closer treeline for extra depth (mult 0.75 in game.js,
# between near's 0.6 and fg's 0.85). It has a SHORTER internal repeat unit
# than the _A layers (~410px on the 2048 resize, not ~1024) -- a wider crop
# re-introduces a seam partway through, so this one deliberately stays narrow.
# Safe because drawParallaxLayers uses a "cover" scale that never lets a tile
# render narrower than the canvas, regardless of source crop width.
resize_to_width(PARALLAX / "Near" / "PA_Forest_Near_B_4096x1024.png", OUT / "parallax" / "near2.png", 2048, 30, 440)

# --- Ground shelves (25D art-prompt library, richer than the Unity terrain
# blocks, which turned out to be plain-white RGB with no real alpha) --------
cutout(RESULTS_25D / "01 Mossy Ground Shelf - Medium.png", OUT / "terrain" / "ground-1.png", max_dim=900)
cutout(RESULTS_25D / "01 Mossy Ground Shelf - Medium 2.png", OUT / "terrain" / "ground-2.png", max_dim=900)
cutout(RESULTS_25D / "02 Mossy Ground Shelf - Broken Edge.png", OUT / "terrain" / "ground-3.png", max_dim=900)
# NOTE: game.js's groundTilePool also needs a `surfaceFrac` per tile -- the
# fraction down from the top where the flat walkable line actually sits
# (these chunks have foliage poking up above it by different amounts).
# Measure with: first row where opaque-pixel coverage across width exceeds
# 90%, divided by image height. Current values (2026-07-15): ground-1=0.325,
# ground-2=0.567, ground-3=0.140.
# ground-3 ("Broken Edge") is also drawn as a raised mound, not a flat strip
# -- it additionally has a `bump` descriptor {xFrac0,xFrac1,topFrac} in
# game.js giving that mound a real (approximate, single-flat-step) collider
# instead of Troll just clipping through it. Measured via a per-column
# top-opaque-row scan (peak around x=0.3-0.4 of the tile width, ~0.02 frac).

TERRAIN = ROC / "Production" / "World01_WhisperingForest" / "Terrain"
resize_to_width(TERRAIN / "PLT_W01_Branch_A_2u.png", OUT / "terrain" / "branch.png", 300)

# --- Portal: two layers so the swirl can spin independently of the oblique
# (foreshortened) outer ring. See docs/CANDY_DASH_2_PLAN.md for why a naive
# rotation of the whole (already-elliptical) portal image looks wrong. -----
cutout(RESULTS_25D / "25 Golden Portal Core.png", OUT / "cutscene" / "portal.png", max_dim=420)

portal = Image.open(OUT / "cutscene" / "portal.png").convert("RGBA")
pw, ph = portal.size
# Swirl core bounding box, visually estimated as a fraction of the full
# portal image (the whitish spiral sits inset from the outer ring/wisps).
box = (int(pw * 0.12), int(ph * 0.20), int(pw * 0.88), int(ph * 0.84))
swirl = portal.crop(box)
sw, sh = swirl.size
mask = Image.new("L", (sw, sh), 0)
ImageDraw.Draw(mask).ellipse((sw * 0.04, sh * 0.04, sw * 0.96, sh * 0.96), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(sw * 0.05))
swirl.putalpha(Image.composite(swirl.split()[3], Image.new("L", (sw, sh), 0), mask))
swirl.save(OUT / "cutscene" / "portal-swirl.png")
print("portal-swirl.png", swirl.size)

blurred = portal.filter(ImageFilter.GaussianBlur(6))
frame_mask = Image.new("L", (pw, ph), 0)
ImageDraw.Draw(frame_mask).ellipse(box, fill=255)
frame_mask = frame_mask.filter(ImageFilter.GaussianBlur(8))
frame = Image.composite(blurred, portal, frame_mask)
frame.save(OUT / "cutscene" / "portal-frame.png")
print("portal-frame.png", frame.size)
# NOTE: game.js also hardcodes PORTAL_SWIRL_OFFSET_X/Y (box center minus image
# center) and PORTAL_SWIRL_ASPECT (sh/sw) derived from this same box -- update
# those constants too if `box` changes.

print("done")
