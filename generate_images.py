#!/usr/bin/env python3
"""
SquishPop batch image generator.
Reads prompts from prompts.json and generates PNGs via Gemini 2.5 Flash Image.

Usage:
    python3 generate_images.py              # process all prompts
    python3 generate_images.py --only rainbow  # filter by folder name
"""

import os
import sys
import json
import time
import base64
import argparse
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).parent
ENV_PATH = ROOT / ".env"
DEFAULT_PROMPTS = ROOT / "prompts.json"
LOG_PATH = ROOT / "generation.log"

MODEL = "gemini-2.5-flash-image"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def load_api_key():
    if not ENV_PATH.exists():
        print("ERROR: .env file not found")
        sys.exit(1)
    for line in ENV_PATH.read_text().splitlines():
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip()
    print("ERROR: GEMINI_API_KEY not found in .env")
    sys.exit(1)


def log(msg):
    stamp = time.strftime("%H:%M:%S")
    line = f"[{stamp}] {msg}"
    print(line, flush=True)
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")


def generate_image(api_key, prompt, output_path, max_retries=3):
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    data = json.dumps(body).encode("utf-8")
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json",
    }

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(URL, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=180) as resp:
                result = json.loads(resp.read())

            candidates = result.get("candidates", [])
            if not candidates:
                raise ValueError("No candidates in response")
            parts = candidates[0].get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    img_data = base64.b64decode(part["inlineData"]["data"])
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    output_path.write_bytes(img_data)
                    return True
            raise ValueError("No image data in response parts")

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            log(f"  HTTP {e.code}: {err_body[:300]}")
            if e.code == 429:
                wait = 2 ** (attempt + 3)
                log(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
            elif e.code >= 500 and attempt < max_retries - 1:
                time.sleep(5)
            else:
                return False
        except Exception as e:
            log(f"  Error: {type(e).__name__}: {e}")
            if attempt < max_retries - 1:
                time.sleep(3)
            else:
                return False
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="Filter by substring in filename or folder")
    parser.add_argument("--prompts", help="Prompts JSON file (default: prompts.json)", default=str(DEFAULT_PROMPTS))
    args = parser.parse_args()

    api_key = load_api_key()

    prompts_path = Path(args.prompts)
    if not prompts_path.is_absolute():
        prompts_path = ROOT / prompts_path
    if not prompts_path.exists():
        print(f"ERROR: {prompts_path} not found")
        sys.exit(1)

    all_prompts = json.loads(prompts_path.read_text())
    if args.only:
        prompts = [
            p for p in all_prompts
            if args.only.lower() in p.get("filename", "").lower()
            or args.only.lower() in p.get("folder", "").lower()
        ]
    else:
        prompts = all_prompts

    total = len(prompts)
    log(f"=== Batch start: {total} prompts (filter={args.only or 'none'}) ===")

    success = skipped = failed = 0

    for i, item in enumerate(prompts, 1):
        name = item.get("filename", f"item-{i}.png")
        folder = item.get("folder", "assets/images")
        prompt = item.get("prompt", "")

        output_path = ROOT / folder / name

        if output_path.exists():
            log(f"[{i}/{total}] SKIP {name} (exists)")
            skipped += 1
            continue

        log(f"[{i}/{total}] GEN  {name}")
        start = time.time()
        ok = generate_image(api_key, prompt, output_path)
        elapsed = time.time() - start

        if ok:
            size_kb = output_path.stat().st_size // 1024
            log(f"[{i}/{total}] OK   {name} ({elapsed:.1f}s, {size_kb}KB)")
            success += 1
        else:
            log(f"[{i}/{total}] FAIL {name}")
            failed += 1

        time.sleep(1)

    log(f"=== Done: {success} generated · {skipped} skipped · {failed} failed ===")


if __name__ == "__main__":
    main()
