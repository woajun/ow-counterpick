#!/usr/bin/env python3
"""나무위키 영웅 문서의 궁합 절을 옮겨 적는다 — 조합 추천의 근거.

    python3 scripts/scrape_synergy.py        # data/namu/synergy.json 을 다시 쓴다

새로 받지 않는다. scrape_matchups.py 가 받아 둔 data/namu/pages/*.html 을 읽는다.

무엇을 읽나
-----------
`궁합` 절은 상성 절과 달리 등급이 없다. 줄마다 이렇게 생겼다.

    라인하르트
     -
    전형적인 지정 사수인 애쉬와 궁합이 안 좋을 리 없다. …

설명이 없는 영웅은 이름과 ` -` 만 있고 바로 다음 영웅으로 넘어간다. 그래서
"설명이 있는 짝" 만 남긴다. 설명이 곧 근거라, 등급(+2 · +1 · 0 · −1)은 이 글을
읽고 따로 매긴다 — src/data/synergy.ts.

나무위키 글은 CC BY-NC-SA 2.0 KR 이다.
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_matchups import CACHE, ROOT, load_heroes, name_index, norm  # noqa: E402

OUT = ROOT / "data" / "namu" / "synergy.json"
END = ("관련업적및도전과제", "관련 업적 및 도전과제", "패치노트", "패치 노트")


def lines_of(doc: str) -> list[str]:
    """태그를 줄바꿈으로 바꿔 한 줄씩. 궁합 절은 이름 · ` -` · 설명이 각각 한 덩이다."""
    i = doc.find('<span id="궁합"')
    if i < 0:
        return []
    js = [k for k in (doc.find(f'<span id="{n}"', i) for n in END) if k > 0]
    body = doc[i : min(js) if js else len(doc)]
    txt = html.unescape(re.sub(r"<[^>]+>", "\n", body))
    return [l.strip() for l in txt.split("\n") if l.strip()]


DASH = re.compile(r"^[-–—]\s*(.*)$")


def header(ls: list[str], k: int, idx: dict[str, str]) -> tuple[list[str], str, int] | None:
    """k 에서 영웅 머리가 시작하면 (영웅들, 등급 낱말, 설명 시작 줄) 을 돌려준다.

    머리는 세 모양이 있다.
        라인하르트 / -               — 등급 없음
        D.Va / - 적합                 — 문서가 등급을 적어 둠
        둠피스트 / , / 레킹볼 / - 약간 적합   — 여럿이 설명 하나를 같이 씀
    """
    ids: list[str] = []
    while k < len(ls) and idx.get(norm(ls[k])):
        ids.append(idx[norm(ls[k])])
        k += 1
        if k < len(ls) and ls[k] == ",":
            k += 1
            continue
        break
    if not ids or k >= len(ls):
        return None
    m = DASH.match(ls[k])
    if not m:
        return None
    return ids, m.group(1).strip(), k + 1


def parse(doc: str, idx: dict[str, str], me: str) -> dict[str, dict]:
    """{짝 id: {"text": 설명, "grade": 문서가 적은 등급 낱말 또는 ""}}. 설명도 등급도 없는 짝은 뺀다."""
    ls = lines_of(doc)
    out: dict[str, dict] = {}
    k = 0
    while k < len(ls):
        h = header(ls, k, idx)
        if not h:
            k += 1
            continue
        ids, grade, j = h
        text = []
        # 다음 영웅 머리나 소제목(11.2. 같은 번호)이 나올 때까지가 설명이다.
        while j < len(ls) and not header(ls, j, idx) and not re.fullmatch(r"\d+(\.\d+)*\.", ls[j]):
            if ls[j] != "[편집]":
                text.append(ls[j])
            j += 1
        body = re.sub(r"\s+", " ", " ".join(text)).strip()
        if body or grade:
            for hid in ids:
                if hid != me:
                    out[hid] = {"text": body, "grade": grade}
        k = j
    return out


def main() -> int:
    heroes = load_heroes()
    idx = name_index(heroes)
    data: dict[str, dict[str, dict]] = {}
    for hid in heroes:
        f = CACHE / f"{hid}.html"
        if not f.exists():
            print(f"  · {hid}: 받아 둔 문서가 없다", file=sys.stderr)
            continue
        data[hid] = parse(f.read_text("utf-8"), idx, hid)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", "utf-8")
    n = sum(len(v) for v in data.values())
    g = sum(1 for v in data.values() for x in v.values() if x["grade"])
    print(f"{OUT.relative_to(ROOT)} — 영웅 {len(data)} · 짝 {n} (문서에 등급이 적힌 짝 {g})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
