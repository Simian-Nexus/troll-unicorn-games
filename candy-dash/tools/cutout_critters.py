"""Cut critter concept art out of its painted background for candy-dash.

Removes the background with rembg (u2net), crops to the visible pixels,
downscales to a game-friendly height, and writes transparent PNGs into
assets/enemies/ (corrupted) and assets/enemies/purified/ (healed).

IMPORTANT: check each source image's own facing direction before setting
flip=True. drawEnemy() in game.js assumes sprites face LEFT by default and
mirrors them when patrolling right — flipping art that already faces left
makes it face backwards when moving toward the player (found and fixed
2026-07-15: Gleamleaf Soarer and Canopy Skitterkin already faced left, so
they must NOT be flipped; MossNibble Sproutling and Skybark Stonetooth are
front-facing/symmetric, so flip is a no-op for them either way).
"""
from pathlib import Path

from PIL import Image
from rembg import remove

INCOMING = Path(r"D:\JonoFiles\Projects\01_Business\Spinning_Monkey_Studios\02_Active_Projects\Troll_and_Unicorn\03_Games\TAU_RealmsOfCorruption\Media\Critters\_Incoming")
GAME = Path(r"D:\JonoFiles\Projects\01_Business\Spinning_Monkey_Studios\02_Active_Projects\Troll_and_Unicorn\03_Games\TAU_HTML5_Games\candy-dash")
MAX_H = 340

# kind -> (corrupted source, healed/purified source, flip)
PAIRS = {
    "drone": ("Corrupted Gleamleaf Soarer.png", "Gleamleaf Soarer in graceful flight.png", False),
    "grunt": ("Corrupted Canopy Skitterkin hunter.png", "Healed Canopy Skitterkin.png", False),
    "spitter": ("Corrupted MossNibble Sproutling creature.png", "MossNibble Sproutling in glowing bloom.png", False),
    "brute": ("Skybark Stonetooth corrupted.png", "Skybark Stonetooth, forest guardian.png", False),
}


def cutout(src, dst, flip=False):
    img = Image.open(src).convert("RGBA")
    cut = remove(img)
    bbox = cut.getbbox()
    if bbox:
        cut = cut.crop(bbox)
    if cut.height > MAX_H:
        w = round(cut.width * MAX_H / cut.height)
        cut = cut.resize((w, MAX_H), Image.LANCZOS)
    if flip:
        cut = cut.transpose(Image.FLIP_LEFT_RIGHT)
    dst.parent.mkdir(parents=True, exist_ok=True)
    cut.save(dst)
    print(f"{src.name} -> {dst} {cut.size}")


for kind, (corrupted, healed, flip) in PAIRS.items():
    cutout(INCOMING / corrupted, GAME / f"assets/enemies/{kind}.png", flip)
    cutout(INCOMING / healed, GAME / f"assets/enemies/purified/{kind}.png", flip)

print("done")
