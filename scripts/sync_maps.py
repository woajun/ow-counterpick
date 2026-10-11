#!/usr/bin/env python3
"""경쟁전 맵 사진을 OverFast API 에서 받아 작게 줄여 public/maps/<id>.webp 로 넣는다.

    python3 scripts/sync_maps.py

맵 이름(한국어)과 목록은 src/data/maps.ts 에 손으로 적는다 — API 가 한국어 이름을 주지 않고,
경쟁전에 도는 맵만 골라야 해서다. 여기서는 그 목록에 있는 맵의 사진만 받는다.
"""

from __future__ import annotations

import io
import re
import ssl
import json
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MAPS_TS = ROOT / "src" / "data" / "maps.ts"
OUT = ROOT / "public" / "maps"
API = "https://overfast-api.tekrop.fr/maps"
WIDTH = 320  # 맵 고르기 칸에 쓰는 크기. 레티나 두 배를 잡아도 남는다.


def ssl_context() -> ssl.SSLContext:
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


SSL = ssl_context()


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ow-counterpick"})
    with urllib.request.urlopen(req, context=SSL, timeout=30) as r:
        return r.read()


def main() -> None:
    ids = re.findall(r"^\s*\{ id: '([a-z0-9-]+)'", MAPS_TS.read_text("utf-8"), re.M)
    shots = {m["key"]: m["screenshot"] for m in json.loads(get(API))}
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for i in ids:
        if i not in shots:
            print("  사진 없음:", i)
            continue
        try:
            im = Image.open(io.BytesIO(get(shots[i]))).convert("RGB")
        except Exception as e:  # noqa: BLE001 — 한 장이 없어도 나머지는 받는다
            print("  사진 못 받음:", i, e)
            continue
        h = round(im.height * WIDTH / im.width)
        im = im.resize((WIDTH, h), Image.LANCZOS)
        p = OUT / f"{i}.webp"
        im.save(p, "WEBP", quality=72)
        total += p.stat().st_size
    print(f"맵 사진 {len(ids)}장 · {total // 1024} KB")


if __name__ == "__main__":
    main()
