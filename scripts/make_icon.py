#!/usr/bin/env python3
"""앱 아이콘을 만든다 — 파비콘(public/favicon.svg)의 조준점을 큰 그림으로.

    python3 scripts/make_icon.py

카카오 앱 아이콘, 홈 화면에 추가했을 때의 아이콘(apple-touch-icon)에 쓴다.
네 배로 크게 그린 뒤 줄여서 테두리를 매끄럽게 한다.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public"

BG = (15, 22, 34)       # #0f1622
ACCENT = (247, 148, 29)  # #f7941d
SS = 4                   # 네 배로 그린다


def draw(size: int, rounded: bool) -> Image.Image:
    S = size * SS
    u = S / 32  # 파비콘 32칸 기준 한 칸
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 홈 화면 아이콘은 기기가 모서리를 깎으니 꽉 채운다.
    if rounded:
        d.rounded_rectangle((0, 0, S - 1, S - 1), radius=int(7 * u), fill=BG)
    else:
        d.rectangle((0, 0, S, S), fill=BG)
    w = int(2.4 * u)
    c = S / 2
    r = 8 * u
    d.ellipse((c - r, c - r, c + r, c + r), outline=ACCENT, width=w)
    dot = 2.2 * u
    d.ellipse((c - dot, c - dot, c + dot, c + dot), fill=ACCENT)
    # 십자 눈금 — 고리에 닿지 않게 조금 띄운다. 끝을 둥글게 하려고 양 끝에 원을 얹는다.
    for x1, y1, x2, y2 in [(16, 3.5, 16, 6.2), (16, 25.8, 16, 28.5), (3.5, 16, 6.2, 16), (25.8, 16, 28.5, 16)]:
        p1, p2 = (x1 * u, y1 * u), (x2 * u, y2 * u)
        d.line((p1, p2), fill=ACCENT, width=w)
        for px, py in (p1, p2):
            d.ellipse((px - w / 2, py - w / 2, px + w / 2, py + w / 2), fill=ACCENT)
    return img.resize((size, size), Image.LANCZOS)


targets = [
    ("icon-512.png", 512, True),        # 카카오 앱 아이콘 · 공용
    ("icon-192.png", 192, True),
    ("apple-touch-icon.png", 180, False),
]
for name, size, rounded in targets:
    im = draw(size, rounded)
    if not rounded:
        im = im.convert("RGB")
    im.save(OUT / name, optimize=True)
    print(name, size, (OUT / name).stat().st_size // 1024, "KB")
