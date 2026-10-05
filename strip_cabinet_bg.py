#!/usr/bin/env python3
"""
Process cabinet frame:
1. Backup original if not already done
2. rembg to remove external background
3. Cut out a precise interior rectangle (based on measurements)
"""
import shutil
from pathlib import Path
from rembg import remove, new_session
from PIL import Image, ImageDraw
import io

ROOT = Path(__file__).parent
CABINET = ROOT / "assets" / "images" / "room" / "cabinet-frame.png"
BACKUP = ROOT / "assets" / "images" / "room" / "cabinet-frame-original.png"

# Interior opening rect (measured from the generated frame image)
INTERIOR = {
    "left": 325,
    "top": 207,
    "right": 719,
    "bottom": 881,
    "corner_radius": 10,
}

if not BACKUP.exists():
    shutil.copy(CABINET, BACKUP)
    print(f"Backed up original to {BACKUP.name}")
else:
    # Always restore from backup before processing
    shutil.copy(BACKUP, CABINET)
    print(f"Restored from backup")

print("Running rembg...")
session = new_session("u2net")
with open(CABINET, "rb") as f:
    input_bytes = f.read()
output_bytes = remove(input_bytes, session=session)
img = Image.open(io.BytesIO(output_bytes)).convert("RGBA")
print(f"After rembg: {img.mode} {img.size}")

# Cut out a clean rounded rectangle in the interior
print(f"Cutting interior rect: {INTERIOR}")
w, h = img.size
# Create a mask: start with all opaque, then set interior to transparent
mask = Image.new("L", (w, h), 255)  # alpha mask (255 = keep, 0 = clear)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle(
    [INTERIOR["left"], INTERIOR["top"], INTERIOR["right"], INTERIOR["bottom"]],
    radius=INTERIOR["corner_radius"],
    fill=0,  # transparent
)

# Apply mask to alpha channel: multiply existing alpha by mask/255
r, g, b, a = img.split()
import numpy as np
a_arr = np.array(a)
m_arr = np.array(mask)
new_a = np.minimum(a_arr, m_arr).astype(np.uint8)
new_alpha = Image.fromarray(new_a, mode="L")
img.putalpha(new_alpha)

img.save(CABINET, "PNG")
print(f"Saved: {CABINET.name}")

# Verify
check = Image.open(CABINET)
print(f"Final: {check.mode} {check.size}")
cx, cy = w // 2, h // 2
print(f"Center alpha: {check.getpixel((cx, cy))[3]}")
print(f"Corner alpha: {check.getpixel((5, 5))[3]}")
