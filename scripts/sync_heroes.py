#!/usr/bin/env python3
"""영웅 명단과 초상화를 공개 API 에서 받아 최신으로 맞춘다.

    python3 scripts/sync_heroes.py

하는 일 세 가지.

1. OverFast API 에서 영웅 명단을 한국어·영어로 받는다. 블리자드 공식
   사이트를 그대로 미러링하는 공개 API 라, 패치로 영웅이 늘면 여기도 는다.
2. 초상화를 받아 작게 줄여 public/heroes/<id>.webp 로 넣는다. 원본은
   장당 150KB 쯤 되는데 화면에서는 72px 짜리 타일이라 그대로 둘 이유가 없다.
3. src/data/heroes.ts 를 다시 쓴다.

matchups.ts 는 건드리지 않는다 — 새 영웅이 생기면 이름만 알려 주고,
상성은 사람이 적는다. 자동으로 빈 항목을 넣어 두면 타입 검사가 통과해
버려서, 목록에는 뜨는데 추천에는 영영 안 나오는 영웅이 조용히 생긴다.
"""

from __future__ import annotations

import io
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HEROES_TS = ROOT / "src" / "data" / "heroes.ts"
MATCHUPS_TS = ROOT / "src" / "data" / "matchups.ts"
PORTRAIT_DIR = ROOT / "public" / "heroes"

API = "https://overfast-api.tekrop.fr/heroes"


def ssl_context() -> ssl.SSLContext:
    """python.org 에서 받은 macOS 파이썬은 루트 인증서가 비어 있다.
    certifi 가 있으면 그걸 쓰고, 없으면 시스템 것을 믿는다."""
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


SSL = ssl_context()

# 화면에서 제일 큰 초상화가 적 슬롯(74px)이다. 레티나 두 배를 잡아도
# 160px 이면 남는다.
PORTRAIT_PX = 160

ROLE_MAP = {"tank": "tank", "damage": "dmg", "support": "sup"}
ROLE_ORDER = {"tank": 0, "dmg": 1, "sup": 2}

# 좁은 타일에서 줄바꿈이 안 나게 짧게 줄여 부르는 이름. 여기 없으면
# 정식 이름을 그대로 쓴다.
SHORT = {
    "doomfist": "둠피",
    "dva": "디바",
    "jetpackcat": "제트팩캣",
    "lifeweaver": "라위",
    "reinhardt": "라인",
    "soldier76": "솔저",
    "widowmaker": "위도우",
}

# API 가 한국어 이름을 영문으로 주는 몇 명. 한국 커뮤니티에서 부르는 대로 쓴다.
#
# 이름을 한글로 맞추는 것이 보기에도 중요하다. 표시용 글꼴 Oswald 에는 한글이
# 없어서 한글 이름은 IBM Plex 로 떨어지는데, 라틴 문자만 Oswald 로 그려져서
# 그 영웅만 굵고 좁아 보인다.
FULL = {"dva": "디바", "dmon": "디몬"}


def fetch(locale: str) -> dict[str, dict]:
    with urllib.request.urlopen(f"{API}?locale={locale}", timeout=30, context=SSL) as r:
        return {h["key"]: h for h in json.load(r)}


def hero_id(key: str) -> str:
    """API 키를 프로젝트 id 로. soldier-76 → soldier76."""
    return key.replace("-", "")


def save_portrait(url: str, dest: Path) -> int:
    with urllib.request.urlopen(url, timeout=60, context=SSL) as r:
        img = Image.open(io.BytesIO(r.read())).convert("RGB")
    img.thumbnail((PORTRAIT_PX, PORTRAIT_PX), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=82, method=6)
    return dest.stat().st_size


def ts_string(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


HEADER = """export type Role = 'tank' | 'dmg' | 'sup';

export interface Hero {
  /** 타일과 근거 칩에 쓰는 짧은 이름 — 좁은 칸에서 줄바꿈이 안 나게. */
  ko: string;
  /** 정식 이름. 슬롯과 추천 줄에 쓴다. */
  full: string;
  en: string;
  r: Role;
}

/** 초상화는 public/heroes/<id>.webp 에 있다. scripts/sync_heroes.py 가 받아 온다. */
export const portrait = (id: HeroId) =>
  `${import.meta.env.BASE_URL}heroes/${id}.webp`;

/* 이 표는 scripts/sync_heroes.py 가 다시 쓴다. 손으로 고치면 다음 실행에
   날아가니, 이름을 바꾸고 싶으면 그 스크립트의 SHORT / FULL 을 고칠 것. */
export const HEROES = {
"""

FOOTER = """} as const satisfies Record<string, Hero>;

export type HeroId = keyof typeof HEROES;

export const HERO_IDS = Object.keys(HEROES) as HeroId[];

export const isHeroId = (v: unknown): v is HeroId =>
  typeof v === 'string' && v in HEROES;

export const ROLES: { k: Role; ko: string; en: string }[] = [
  { k: 'tank', ko: '탱커', en: 'Tank' },
  { k: 'dmg', ko: '딜러', en: 'Damage' },
  { k: 'sup', ko: '지원', en: 'Support' },
];
"""

ROLE_COMMENT = {"tank": "탱커", "dmg": "딜러", "sup": "지원"}


def main() -> int:
    ko, en = fetch("ko-kr"), fetch("en-us")

    heroes = []
    for key, h in ko.items():
        hid = hero_id(key)
        full = FULL.get(hid, h["name"])
        heroes.append(
            {
                "id": hid,
                "ko": SHORT.get(hid, full),
                "full": full,
                "en": en[key]["name"],
                "r": ROLE_MAP[h["role"]],
                "portrait": h["portrait"],
            }
        )
    heroes.sort(key=lambda h: (ROLE_ORDER[h["r"]], h["id"]))

    before = set(re.findall(r"^  ([a-z0-9]+): \{", HEROES_TS.read_text("utf-8"), re.M))
    added = [h for h in heroes if h["id"] not in before]
    gone = sorted(before - {h["id"] for h in heroes})

    # ── 초상화 ────────────────────────────────────────────
    total = 0
    for h in heroes:
        dest = PORTRAIT_DIR / f"{h['id']}.webp"
        if dest.exists():
            total += dest.stat().st_size
            continue
        total += save_portrait(h["portrait"], dest)
        print(f"  초상화 {h['id']}")
    print(f"초상화 {len(heroes)}장 · {total / 1024:.0f} KB")

    # ── heroes.ts ─────────────────────────────────────────
    out = [HEADER]
    last_role = None
    for h in heroes:
        if h["r"] != last_role:
            if last_role is not None:
                out.append("\n")
            out.append(f"  // ── {ROLE_COMMENT[h['r']]} " + "─" * 30 + "\n")
            last_role = h["r"]
        fields = ", ".join(
            f"{k}: {ts_string(h[k])}" for k in ("ko", "full", "en", "r")
        )
        out.append(f"  {h['id']}: {{ {fields} }},\n")
    out.append(FOOTER)
    HEROES_TS.write_text("".join(out), "utf-8")
    print(f"heroes.ts — 영웅 {len(heroes)}명")

    # ── 상성표에 빠진 영웅 ────────────────────────────────
    listed = set(re.findall(r"^  ([a-z0-9]+): \{", MATCHUPS_TS.read_text("utf-8"), re.M))
    missing = [h for h in heroes if h["id"] not in listed]

    if added:
        print("\n새로 들어온 영웅 " + ", ".join(f"{h['id']}({h['full']})" for h in added))
    if gone:
        print("\nAPI 에서 사라진 영웅 " + ", ".join(gone) + " — matchups.ts 에서도 빼야 한다")
    if missing:
        print(f"\n상성 미기입 {len(missing)}명 — matchups.ts 에 적어야 타입 검사가 통과한다:")
        for h in missing:
            print(f"  {h['id']}: {{ good: [], ok: [], bad: [] }},  // {h['full']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
