"""Build responsive WebP derivatives from the source photography.

Reads  assets-src/photos/<name>.jpg
Writes public/images/<name>-<width>.webp, public/images/og-image.jpg
       src/images.json  (consumed by vite.config.js to fill src/srcset/width/height)

Usage: python scripts/optimize-images.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src" / "photos"
OUT = ROOT / "public" / "images"
MANIFEST = ROOT / "src" / "images.json"

WIDTHS = [480, 800, 1200, 1600, 2400]
QUALITY = 68

# Crops are (left, top, right, bottom) as fractions of the source frame.
CROPS = {}

OG_SOURCE = "terminal-night"
# only used for the share image
OG_ONLY = {"terminal-night"}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for path in sorted(SRC.glob("*.jpg")):
        name = path.stem
        if name in OG_ONLY:
            continue
        im = Image.open(path).convert("RGB")
        if name in CROPS:
            l, t, r, b = CROPS[name]
            w, h = im.size
            im = im.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
        w, h = im.size
        widths = [x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]
        widths = sorted(set(widths))
        for target in widths:
            resized = im.resize((target, round(h * target / w)), Image.LANCZOS)
            resized.save(OUT / f"{name}-{target}.webp", "WEBP", quality=QUALITY, method=6)
        manifest[name] = {"width": w, "height": h, "widths": widths}
        print(f"{name}: {w}x{h} -> {widths}")

    og = Image.open(SRC / f"{OG_SOURCE}.jpg").convert("RGB")
    w, h = og.size
    target_h = round(w * 630 / 1200)
    top = (h - target_h) // 2
    og.crop((0, top, w, top + target_h)).resize((1200, 630), Image.LANCZOS).save(
        OUT / "og-image.jpg", "JPEG", quality=82, optimize=True, progressive=True
    )

    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
