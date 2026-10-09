#!/usr/bin/env python3
"""궁합 등급을 src/data/synergy.ts 로 옮긴다 — 조합 추천의 점수표.

    python3 scripts/build_synergy.py

읽는 것: data/namu/synergy-grades.json — 궁합 글(data/namu/synergy.json) 한 줄마다
매긴 등급. {"me", "mate", "level": 2|1|0|-1, "why"} 의 배열이다. 등급은 사람이
(또는 클로드가) 글을 읽고 붙인 것이라, 고치고 싶으면 이 파일을 고치고 다시 돌린다.

    +2 핵심 조합 — 궁 연계 · 대표 조합
    +1 좋은 편
     0 무난 · 상황 따라 · 평가 없음  → 표에 안 적는다
    −1 궁합이 안 좋음 — 겹치거나 방해된다

두 문서가 같은 짝을 따로 적는다
--------------------------------
애쉬 문서는 "라인하르트와 궁합이 좋다", 라인하르트 문서도 애쉬를 따로 적는다.
궁합은 방향이 없으니 한 칸으로 합친다. 한쪽만 적혀 있으면 그 값을, 둘 다 있으면
합으로 정한다 — 합 3 이상 +2, 1~2 +1, 0 이면 안 적음, 음수면 −1.
(+2 와 0 이면 +1 로 내린다. 한쪽이 핵심이라 해도 다른 쪽이 무덤덤하면 핵심까지는 아니다.)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRADES = ROOT / "data" / "namu" / "synergy-grades.json"
OUT = ROOT / "src" / "data" / "synergy.ts"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scrape_matchups import load_heroes  # noqa: E402


def merge(a: int | None, b: int | None) -> int:
    if a is None or b is None:
        return a if b is None else b  # type: ignore[return-value]
    s = a + b
    return 2 if s >= 3 else 1 if s >= 1 else 0 if s == 0 else -1


def main() -> int:
    heroes = load_heroes()
    rows = json.loads(GRADES.read_text("utf-8"))
    one: dict[tuple[str, str], int] = {(r["me"], r["mate"]): int(r["level"]) for r in rows}

    table: dict[str, dict[str, int]] = {h: {} for h in heroes}
    for a in heroes:
        for b in heroes:
            if a >= b:
                continue
            v = merge(one.get((a, b)), one.get((b, a)))
            if v:
                table[a][b] = v
                table[b][a] = v

    lines = [
        "import type { HeroId } from './heroes';",
        "",
        "/**",
        " * 궁합 등급 — 조합 모드의 점수표. scripts/build_synergy.py 가 쓴다. 손으로 고치지 말 것 —",
        " * 등급은 data/namu/synergy-grades.json 에서 고치고 스크립트를 다시 돌린다.",
        " *",
        " * 나무위키 영웅 문서의 궁합 절(CC BY-NC-SA 2.0 KR)을 읽고 매긴 값이다. 원문에는 등급이 없다.",
        " *   +2 핵심 조합   +1 좋은 편   −1 안 어울림   (0 은 안 적는다)",
        " * 궁합은 방향이 없어서 [a][b] 와 [b][a] 가 늘 같다.",
        " */",
        "export type SynLevel = 2 | 1 | -1;",
        "",
        "export const SYNERGY: Partial<Record<HeroId, Partial<Record<HeroId, SynLevel>>>> = {",
    ]
    for h in heroes:
        row = table[h]
        if not row:
            continue
        cells = ", ".join(f"{k}: {v}" for k, v in sorted(row.items(), key=lambda kv: (-kv[1], kv[0])))
        lines.append(f"  {h}: {{ {cells} }},")
    lines.append("};")
    OUT.write_text("\n".join(lines) + "\n", "utf-8")

    pairs = sum(len(r) for r in table.values()) // 2
    dist = {v: sum(1 for r in table.values() for x in r.values() if x == v) // 2 for v in (2, 1, -1)}
    print(f"{OUT.relative_to(ROOT)} — 짝 {pairs} (+2 {dist[2]} · +1 {dist[1]} · −1 {dist[-1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
