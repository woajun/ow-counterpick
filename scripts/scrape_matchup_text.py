#!/usr/bin/env python3
"""나무위키 영웅 문서의 상성 절에서 짝마다 설명 글을 옮겨 적는다 — 한 줄 요약의 재료.

    python3 scripts/scrape_matchup_text.py   # data/namu/matchup-text.json 을 다시 쓴다

새로 받지 않는다. scrape_matchups.py 가 받아 둔 data/namu/pages/*.html 을 읽는다.
줄 머리(`D.Mon - 약간 불리`)는 scrape_matchups.py 와 같은 정규식으로 잡고, 다음 머리까지를 설명으로 본다.
키는 문서 주인 쪽에서 본 짝이다 — genji.html 의 `D.Mon - 약간 불리` 는 {"genji": {"dmon": …}}.

나무위키 글은 CC BY-NC-SA 2.0 KR 이다. 이 파일은 요약을 만드는 재료로만 쓰고 화면에 그대로 내지 않는다.
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_matchups import CACHE, ROOT, load_heroes, name_index, norm, row_res  # noqa: E402

OUT = ROOT / "data" / "namu" / "matchup-text.json"
NEXT = ("궁합", "관련업적및도전과제", "관련 업적 및 도전과제", "패치노트", "패치 노트")


def body_of(doc: str) -> str:
    """상성 절을 한 줄 글로. 태그 자리는 띄어 쓴다 — 등급 낱말이 줄로 나뉘어 있어도 붙는다."""
    i = doc.find('<span id="상성"')
    if i < 0:
        return ""
    js = [k for k in (doc.find(f'<span id="{n}"', i) for n in NEXT) if k > 0]
    txt = html.unescape(re.sub(r"<[^>]+>", " ", doc[i : min(js) if js else len(doc)]))
    return re.sub(r"\s+", " ", txt)


def tidy(s: str) -> str:
    # 다음 소제목(`11.2. 공격 [편집]`)이 끼면 거기서 자른다 — 그 뒤는 다음 역할 묶음의 머리말이다.
    cut = re.search(r"\b\d+(\.\d+)+\.\s+\S+\s*\[편집\]", s)
    if cut:
        s = s[: cut.start()]
    s = re.sub(r"\[\d+\]", "", s)  # 각주 번호
    s = re.sub(r"\[편집\]", "", s)
    s = re.sub(r"\b\d+(\.\d+)+\.\s+\S+\s*$", "", s.strip())  # 끝에 붙은 다음 소제목(11.2. 공격)
    s = re.sub(r"^\(\s*\)", "", s.strip())  # 등급 뒤 빈 괄호
    return re.sub(r"\s+", " ", s).strip()


def main() -> int:
    heroes = load_heroes()
    idx = name_index(heroes)
    row_re, _ = row_res(heroes)
    data: dict[str, dict[str, dict]] = {}
    for hid in heroes:
        f = CACHE / f"{hid}.html"
        if not f.exists():
            continue
        body = body_of(f.read_text("utf-8"))
        ms = list(row_re.finditer(body))
        out: dict[str, dict] = {}
        for k, m in enumerate(ms):
            other = idx.get(norm(m.group(1)))
            if not other or other == hid:
                continue
            end = ms[k + 1].start() if k + 1 < len(ms) else len(body)
            text = tidy(body[m.end() : end])
            if text:
                out[other] = {"grade": m.group(2), "text": text}
        data[hid] = out
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", "utf-8")
    n = sum(len(v) for v in data.values())
    c = sum(len(x["text"]) for v in data.values() for x in v.values())
    print(f"{OUT.relative_to(ROOT)} — 영웅 {len(data)} · 짝 {n} · {c:,}자")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
