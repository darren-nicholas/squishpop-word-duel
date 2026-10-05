#!/usr/bin/env python3
"""Strip white backgrounds from all avatars via rembg Python API."""
import sys
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

ROOT = Path(__file__).parent
AVATARS = ROOT / "assets" / "images" / "avatars"

session = new_session("u2net")

pngs = sorted(AVATARS.glob("*.png"))
print(f"Processing {len(pngs)} avatars...")

for i, p in enumerate(pngs, 1):
    with open(p, "rb") as f:
        input_bytes = f.read()
    output_bytes = remove(input_bytes, session=session)
    # Ensure RGBA
    img = Image.open(io.BytesIO(output_bytes)).convert("RGBA")
    img.save(p, "PNG")
    print(f"[{i}/{len(pngs)}] {p.name}")

print("Done!")
