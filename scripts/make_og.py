#!/usr/bin/env python3
"""링크 미리보기 카드(public/og.png, 1200×630)를 만든다.

    python3 scripts/make_og.py

디스코드 · 카톡에 주소를 붙이면 뜨는 그림이다. 영웅이 바뀌어도 다시 돌릴 필요는
없다 — 대표 영웅 몇만 쓴다. 한글 글꼴은 macOS 기본(Apple SD 산돌고딕 Neo).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "og.png"
HEROES = ROOT / "public" / "heroes"
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

W, H = 1200, 630
BG = (10, 14, 21)
PANEL = (19, 28, 41)
TXT = (231, 238, 247)
DIM = (138, 154, 176)
ACCENT = (247, 148, 29)
GOOD = (69, 211, 140)
BAD = (239, 91, 82)


def font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    # ttc 안의 굵기 순서: 0 Regular … 6 Bold 근처. 굵은 것을 찾아 쓴다.
    return ImageFont.truetype(FONT, size, index=6 if bold else 0)


def circle(path: Path, size: int, ring: tuple[int, int, int]) -> Image.Image:
    im = Image.open(path).convert("RGBA").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size + 8, size + 8), (0, 0, 0, 0))
    ImageDraw.Draw(out).ellipse((0, 0, size + 7, size + 7), fill=ring)
    out.paste(im, (4, 4), mask)
    return out


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# 오른쪽 아래 은은한 패널
d.rounded_rectangle((640, 70, 1130, 560), radius=28, fill=PANEL)

# 로고와 제목
d.rectangle((80, 92, 156, 132), outline=ACCENT, width=3)
d.text((118, 112), "OW", font=font(28), fill=ACCENT, anchor="mm")
d.text((80, 170), "카운터픽", font=font(92), fill=TXT)
d.text((82, 300), "적 조합을 고르면", font=font(40, False), fill=DIM)
d.text((82, 352), "유리한 스왑이 바로 나와요", font=font(40), fill=TXT)
d.text((82, 450), "해설자 · 스트리머의 상성을 따라가 보세요", font=font(28, False), fill=DIM)

# 추천 줄 모양 — 영웅 · 점수 막대
rows = [("winston", "+6", GOOD, 0.92), ("echo", "+5", GOOD, 0.78), ("kiriko", "+4", GOOD, 0.62), ("widowmaker", "-4", BAD, 0.6)]
y = 110
for hero, score, color, fill in rows:
    p = HEROES / f"{hero}.webp"
    img.paste(circle(p, 72, color), (680, y), circle(p, 72, color))
    d.rounded_rectangle((790, y + 30, 1060, y + 50), radius=10, fill=(30, 43, 61))
    d.rounded_rectangle((790, y + 30, 790 + int(270 * fill), y + 50), radius=10, fill=color)
    d.text((1090, y + 40), score, font=font(30), fill=color, anchor="mm")
    y += 110

img.save(OUT, optimize=True)
print(OUT.relative_to(ROOT), OUT.stat().st_size // 1024, "KB")
