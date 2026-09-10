#!/usr/bin/env python3
"""나무위키 영웅 문서의 상성 섹션을 긁어 상성표로 옮긴다.

    pip install playwright          # 한 번만
    python3 scripts/scrape_matchups.py            # 영웅 전부
    python3 scripts/scrape_matchups.py 캐서디 파라   # 몇 명만
    python3 scripts/scrape_matchups.py --write     # matchups.ts 까지 다시 쓴다

왜 브라우저를 띄우나
--------------------
나무위키는 본문을 암호화한 덩어리로 내려보내고 브라우저 안에서 푼다. 그래서
HTML 을 그냥 받으면 목차만 있고 본문이 없다. 암호를 푸는 게 아니라, 사람이
보는 것과 같은 화면을 띄워서 다 그려진 글자를 읽는다. robots.txt 가 `/w/` 를
허용하고 있고, 1초에 한 장씩만 넘긴다.

나무위키 글은 CC BY-NC-SA 2.0 KR 이다. 이 도구를 밖에 내보낼 거면 출처를
밝히고 같은 라이선스로 열어야 한다.

무엇을 읽나
-----------
문서의 `상성` 절은 줄마다 이렇게 생겼다.

    vs 라인하르트 - 유리 () 다른 돌격군들과는 달리 …

일곱 단계(매우 유리 · 유리 · 약간 유리 · 중립 · 약간 불리 · 불리 ·
매우 불리)를 그대로 data/namu/matchups.json 에 남긴다. 프로젝트 상성표는
+3 / +1 / −3 세 단계뿐이라 옮기면서 눌리는데, 눌리기 전 값을 남겨 둬야
나중에 단계를 늘리거나 패치별로 비교할 수 있다.

방향이 뒤집힌다는 것
--------------------
나무위키는 "캐서디 입장에서 라인하르트가 유리" 로 적는다. 이 프로젝트의
`MATCHUPS` 는 반대로 "라인하르트가 적으로 나왔을 때 캐서디가 좋다" 로 적는다.
그래서 읽은 것을 뒤집어 넣는다. 두 문서가 서로 어긋나면(둘 다 자기가 유리하다고
적어 놓았으면) 고치라고 알려 준다.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEROES_TS = ROOT / "src" / "data" / "heroes.ts"
MATCHUPS_TS = ROOT / "src" / "data" / "matchups.ts"
CACHE = ROOT / "data" / "namu" / "pages"
OUT_JSON = ROOT / "data" / "namu" / "matchups.json"
CLASH_MD = ROOT / "data" / "namu" / "conflicts.md"
CLASH_TS = ROOT / "src" / "data" / "conflicts.ts"
NAMU_TS = ROOT / "src" / "data" / "namu.ts"

BASE = "https://namu.wiki/w/"
DELAY = 1.0  # 초. 남의 서버다.

# 나무위키의 등급을 그대로 점수로. 좌우 대칭이라 눌러 담을 것이 없다.
# 긴 것부터 봐야 '유리' 가 '매우 유리' 를 먼저 잡아먹지 않는다.
GRADES = [
    ("매우 유리", 3),
    ("약간 유리", 1),
    ("유리", 2),
    ("매우 불리", -3),
    ("약간 불리", -1),
    ("불리", -2),
    ("중립", 0),
    ("대등", 0),
    # 상황을 탄다는 뜻. 한쪽으로 기울지 않으니 중립과 같이 본다.
    ("유동적", 0),
]
GRADE_RE = "|".join(g for g, _ in GRADES)

# 나무위키 문서 제목이 프로젝트의 정식 이름과 다른 영웅.
DOC = {"dva": "D.Va", "dmon": "D.Mon"}

# 문서 안에서 부르는 다른 이름.
ALIAS = {
    "d.va": "dva",
    "디바": "dva",
    "d.mon": "dmon",
    "솔저": "soldier76",
    "솔저:76": "soldier76",
    "맥크리": "cassidy",
    "로드호": "roadhog",
    "레킹 볼": "wreckingball",
}


# ── heroes.ts 읽기 ────────────────────────────────────────
def load_heroes() -> dict[str, dict]:
    src = HEROES_TS.read_text("utf-8")
    out = {}
    for m in re.finditer(
        r"^  ([a-z0-9]+): \{ ko: '([^']*)', full: '([^']*)', en: '((?:[^'\\]|\\.)*)', r: '(\w+)' \}",
        src,
        re.M,
    ):
        hid, ko, full, en, r = m.groups()
        out[hid] = {"ko": ko, "full": full, "en": en.replace("\\'", "'"), "r": r}
    if not out:
        sys.exit("heroes.ts 를 못 읽었다. 먼저 scripts/sync_heroes.py 를 돌릴 것.")
    return out


def name_index(heroes: dict[str, dict]) -> dict[str, str]:
    """문서에 적힌 이름 → 영웅 id. 공백을 지우고 소문자로 맞춰 찾는다."""
    idx = {}
    for hid, h in heroes.items():
        for n in (h["ko"], h["full"], h["en"], hid):
            idx[norm(n)] = hid
    idx.update({norm(k): v for k, v in ALIAS.items()})
    return idx


def norm(s: str) -> str:
    return re.sub(r"[\s:·]", "", s).lower()


def row_res(heroes: dict[str, dict]) -> tuple[re.Pattern, re.Pattern]:
    """상성 줄을 잡는 정규식.

    문서마다 줄 머리가 다르다 — 캐서디 문서는 `vs D.Va - 매우 불리`, 라인하르트
    문서는 `D.Va - 약간 불리` 로 적는다. 그래서 `vs` 에 기대지 않고 아는 영웅
    이름에 앵커를 잡는다. 긴 이름부터 봐야 `파라` 가 `라마트라` 를 먼저
    잡아먹지 않는다.
    """
    names = {n for h in heroes.values() for n in (h["ko"], h["full"], h["en"])}
    names |= set(ALIAS)
    alt = "|".join(re.escape(n) for n in sorted(names, key=len, reverse=True))
    row = re.compile(rf"(?:vs\s+)?({alt})\s*[-–—]\s*({GRADE_RE})(?![가-힣])")
    # 내가 모르는 등급 낱말을 찾아내는 그물. 조용히 빠지는 줄이 없게.
    diag = re.compile(rf"(?:vs\s+)?({alt})\s*[-–—]\s*([가-힣]{{1,10}}?)\s*\(")
    return row, diag


# ── 한 장 받기 ────────────────────────────────────────────
def candidates(name: str) -> list[str]:
    """문서 제목 후보. 이름이 겹치는 영웅은 동음이의어 문서로 먼저 간다 —
    `파라` 는 아랍어 이름이고 오버워치 파라는 `파라(오버워치)` 다."""
    return [name, f"{name}(오버워치)", f"{name}(오버워치 2)"]


def render(name: str, page) -> tuple[str, str] | None:
    """상성 절이 다 그려질 때까지 기다렸다가 (문서 제목, HTML) 을 돌려준다."""
    from playwright.sync_api import TimeoutError as PWTimeout

    for title in candidates(name):
        page.goto(BASE + title.replace(" ", "%20"), wait_until="domcontentloaded", timeout=60_000)
        try:
            page.wait_for_selector('[id="상성"]', timeout=20_000)
        except PWTimeout:
            continue
        return title, page.content()
    return None


def section(doc: str, name: str, nxt: tuple[str, ...]) -> str:
    """`name` 절부터 다음 절 직전까지의 글자만."""
    i = doc.find(f'<span id="{name}"')
    if i < 0:
        return ""
    j = min(
        (k for k in (doc.find(f'<span id="{n}"', i) for n in nxt) if k > 0),
        default=len(doc),
    )
    txt = html.unescape(re.sub(r"<[^>]+>", " ", doc[i:j]))
    return re.sub(r"[ \t ]+", " ", txt)


def ts_string(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def doc_title(doc: str) -> str | None:
    """받아 온 문서에서 실제 제목을 도로 읽는다.

    `파라` 는 동음이의어 문서라 실제로 받은 것은 `파라(오버워치)` 다. 화면에서
    그 영웅의 상성 절로 링크를 걸려면 어느 제목으로 받았는지 알아야 한다.
    """
    m = re.search(r"<title>(.*?) - 나무위키</title>", doc)
    return html.unescape(m.group(1)) if m else None


def parse(doc: str, row_re: re.Pattern, diag_re: re.Pattern) -> tuple[list, set]:
    body = section(doc, "상성", ("궁합", "관련업적및도전과제", "패치노트"))
    rows = [(n.strip(), g) for n, g in row_re.findall(body)]
    known = {g for g, _ in GRADES}
    odd = {g for _, g in diag_re.findall(body) if g not in known}
    return rows, odd


# ── matchups.ts 쓰기 ──────────────────────────────────────
HEAD = """import type { HeroId } from './heroes';

/**
 * 상성 한 칸의 세기. 나무위키가 적어 둔 등급을 그대로 옮긴 것이다.
 *
 *   +3 매우 유리    +2 유리    +1 약간 유리
 *   −1 약간 불리    −2 불리    −3 매우 불리
 *
 * 0(중립 · 유동적)은 적지 않는다. 안 적힌 짝과 뜻이 같아서 자리를 차지할
 * 이유가 없다.
 */
export type Level = 3 | 2 | 1 | -1 | -2 | -3;

/**
 * 한 영웅이 적으로 나왔을 때, 내 쪽 픽마다 몇 점인지.
 *
 * 통째로 비어 있으면 아직 안 적은 영웅이다 — 추천에도, 피해야 할 픽에도
 * 영영 안 나온다. 상성표(`/table`)에서 통째로 빈 세로줄로 보인다.
 */
export type Matchup = Partial<Record<HeroId, Level>>;

/**
 * 상성표 — 이 파일 하나만 고치면 화면 전체가 따라간다.
 *
 * scripts/scrape_matchups.py 가 나무위키 영웅 문서의 상성 절을 옮겨 적은
 * 것이다(출처: 나무위키, CC BY-NC-SA 2.0 KR). 밸런스 패치마다 달라지니
 * 절대적인 기준이 아니라 스왑 후보를 좁히는 용도다.
 *
 * 키를 HeroId 전부로 묶어 둔 이유: 영웅을 추가하고 상성을 안 적으면
 * 타입 검사에서 걸린다. 목록에는 뜨는데 추천에는 영영 안 나오는 영웅이
 * 생기는 것을 막는다.
 */
export const MATCHUPS: Record<HeroId, Matchup> = {
"""

ROLE_KO = {"tank": "탱커", "dmg": "딜러", "sup": "지원"}


WIDTH = 78


def wrap(items: list[str], indent: str) -> list[str]:
    """센 것부터 차례로, 줄이 넘치면 접어서. 사람이 읽을 표다."""
    lines, cur = [], indent
    for it in items:
        piece = it + ","
        if len(cur) + len(piece) + 1 > WIDTH and cur != indent:
            lines.append(cur.rstrip())
            cur = indent
        cur += piece + " "
    if cur.strip():
        lines.append(cur.rstrip())
    return lines


def write_ts(table: dict[str, dict[str, int]], heroes: dict[str, dict]) -> None:
    order = sorted(heroes, key=lambda h: ({"tank": 0, "dmg": 1, "sup": 2}[heroes[h]["r"]], h))
    out, last = [HEAD], None
    for hid in order:
        if heroes[hid]["r"] != last:
            if last is not None:
                out.append("\n")
            out.append(f"  // ── {ROLE_KO[heroes[hid]['r']]} " + "─" * 30 + "\n")
            last = heroes[hid]["r"]
        m = table[hid]
        if not m:
            out.append(f"  {hid}: {{}}, // 미기입 — {heroes[hid]['full']}\n")
            continue
        # 센 것부터, 같은 세기 안에서는 이름순. 위쪽 몇 줄만 봐도 확실한
        # 카운터가 누군지 보인다.
        items = [f"{k}: {v}" for k, v in sorted(m.items(), key=lambda kv: (-kv[1], kv[0]))]
        out.append(f"  {hid}: {{\n")
        out.extend(line + "\n" for line in wrap(items, "    "))
        out.append("  },\n")
    out.append("};\n")
    MATCHUPS_TS.write_text("".join(out), "utf-8")


CLASH_HEAD = """import type { HeroId } from './heroes';

/**
 * 두 영웅의 나무위키 문서가 서로 어긋나게 적어 둔 짝.
 *
 * 애쉬 문서는 "메이 상대로 불리"라고 적고, 메이 문서도 "애쉬 상대로 불리"라고
 * 적는다. 둘 다 자기가 진다는 말이라 앞뒤가 안 맞는다. 옮겨 적으면서 생긴
 * 오류가 아니라 원본이 그렇게 되어 있는 것이라, 한쪽으로 정하려면 사람이
 * 판단해야 한다.
 *
 * 상성표에서 이 짝을 따로 표시해 준다 — 표시가 없으면 도구가 고장 난 것처럼
 * 보인다.
 *
 * scripts/scrape_matchups.py 가 다시 쓴다. 손으로 고치면 다음 실행에 날아간다.
 */
export interface Conflict {
  a: HeroId;
  b: HeroId;
  /** 둘 다 유리하다고 적었는지(`up`), 둘 다 불리하다고 적었는지(`down`). */
  both: 'up' | 'down';
}

export const CONFLICTS: Conflict[] = [
"""

CLASH_FOOT = """];

const key = (a: HeroId, b: HeroId) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const INDEX = new Map(CONFLICTS.map((c) => [key(c.a, c.b), c]));

/** 이 짝이 어긋나 있나. 어느 쪽을 먼저 넣든 같다. */
export const conflictOf = (a: HeroId, b: HeroId) => INDEX.get(key(a, b));
"""


def write_conflicts_ts(pairs, heroes: dict[str, dict]) -> None:
    out = [CLASH_HEAD]
    for a, b, both in pairs:
        out.append(
            f"  {{ a: '{a}', b: '{b}', both: '{both}' }},"
            f" // {heroes[a]['full']} ↔ {heroes[b]['full']}\n"
        )
    out.append(CLASH_FOOT)
    CLASH_TS.write_text("".join(out), "utf-8")


NAMU_HEAD = """import type { HeroId } from './heroes';

/**
 * 영웅별 나무위키 문서 제목.
 *
 * 이름이 겹치는 영웅은 동음이의어 문서로 밀려서 `(오버워치)` 가 붙는다 —
 * `파라` 는 아랍어 이름 문서고, 오버워치 파라는 `파라(오버워치)` 다.
 *
 * scripts/scrape_matchups.py 가 실제로 받아 온 제목을 그대로 적는다.
 */
const DOCS: Record<HeroId, string> = {
"""

NAMU_FOOT = """};

/**
 * 그 영웅의 상성 절로 바로 가는 주소.
 *
 * 값이 이상하면 여기가 고칠 자리다. 이 도구는 옮겨 적은 사본이라 여기서
 * 고쳐 봐야 원본은 그대로다.
 */
export const namuUrl = (id: HeroId) =>
  `https://namu.wiki/w/${encodeURIComponent(DOCS[id])}#상성`;
"""


def write_namu_ts(titles: dict[str, str], heroes: dict[str, dict]) -> None:
    order = sorted(heroes, key=lambda h: ({"tank": 0, "dmg": 1, "sup": 2}[heroes[h]["r"]], h))
    out = [NAMU_HEAD]
    for hid in order:
        t = titles.get(hid)
        if t:
            out.append(f"  {hid}: {ts_string(t)},\n")
    out.append(NAMU_FOOT)
    NAMU_TS.write_text("".join(out), "utf-8")


# ── 본체 ──────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("only", nargs="*", help="영웅 이름 몇 개만 (비우면 전부)")
    ap.add_argument("--write", action="store_true", help="matchups.ts 를 다시 쓴다")
    ap.add_argument("--refetch", action="store_true", help="받아 둔 것을 무시하고 다시 받는다")
    ap.add_argument("--headed", action="store_true", help="브라우저 창을 띄워 놓고 본다")
    args = ap.parse_args()

    heroes = load_heroes()
    idx = name_index(heroes)
    row_re, diag_re = row_res(heroes)

    targets = list(heroes)
    if args.only:
        want = {norm(x) for x in args.only}
        targets = [h for h in heroes if norm(heroes[h]["full"]) in want or h in want]
        if not targets:
            sys.exit(f"그런 영웅이 없다: {', '.join(args.only)}")

    CACHE.mkdir(parents=True, exist_ok=True)

    # 받아 둔 것으로 채울 수 있는지 먼저 본다 — 다시 돌릴 때 서버를 안 때린다.
    docs: dict[str, str] = {}
    todo = []
    for hid in targets:
        f = CACHE / f"{hid}.html"
        if f.exists() and not args.refetch:
            docs[hid] = f.read_text("utf-8")
        else:
            todo.append(hid)

    if todo:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            sys.exit(
                "playwright 가 없다.\n"
                "  pip install playwright\n"
                "이미 깔린 크롬을 그대로 쓰니 브라우저는 따로 안 받아도 된다."
            )

        with sync_playwright() as pw:
            browser = pw.chromium.launch(channel="chrome", headless=not args.headed)
            page = browser.new_page(locale="ko-KR")
            # 광고와 이미지는 안 받는다. 글자만 있으면 된다.
            page.route(
                re.compile(r"\.(png|jpe?g|gif|webp|svg|woff2?|mp4)$|doubleclick|googlesyndication|google-analytics"),
                lambda r: r.abort(),
            )
            for n, hid in enumerate(todo, 1):
                name = DOC.get(hid, heroes[hid]["full"])
                print(f"  [{n}/{len(todo)}] {name}", end="", flush=True)
                got = render(name, page)
                if got is None:
                    print(f"\r  [{n}/{len(todo)}] {name} — 상성 절을 못 찾았다")
                    continue
                title, doc = got
                print(f"\r  [{n}/{len(todo)}] {title}")
                docs[hid] = doc
                (CACHE / f"{hid}.html").write_text(doc, "utf-8")
                time.sleep(DELAY)
            browser.close()

    # ── 읽은 것을 정리 ────────────────────────────────────
    raw: dict[str, dict[str, str]] = {}
    titles: dict[str, str] = {}
    odd_grades: dict[str, set[str]] = {}
    thin = []
    for hid, doc in docs.items():
        t = doc_title(doc)
        if t:
            titles[hid] = t
        rows, odd = parse(doc, row_re, diag_re)
        got = {}
        for name, grade in rows:
            other = idx.get(norm(name))
            # 줄마다 처음 나온 등급만 쓴다. 뒤는 설명 안에서 이름이 또
            # 나온 것이라 등급이 아니다.
            if other and other != hid and other not in got:
                got[other] = grade
        raw[hid] = got
        if odd:
            odd_grades[hid] = odd
        mark = "  ← 적게 읽혔다" if len(got) < 20 else ""
        if mark:
            thin.append(hid)
        print(f"{heroes[hid]['full']:12} {len(got):3}줄{mark}")

    if odd_grades:
        print("\n처음 보는 등급 낱말 — GRADES 에 넣어야 그 줄이 안 빠진다")
        for hid, gs in odd_grades.items():
            print(f"  {heroes[hid]['full']}: {', '.join(sorted(gs))}")
    if thin:
        print(f"\n적게 읽힌 영웅 {len(thin)}명 — 문서를 눈으로 볼 것: "
              + ", ".join(heroes[h]["full"] for h in thin))

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(
            {"source": "namu.wiki", "license": "CC BY-NC-SA 2.0 KR",
             "fetched": time.strftime("%Y-%m-%d"), "grades": raw},
            ensure_ascii=False, indent=2,
        ),
        "utf-8",
    )
    print(f"\n{OUT_JSON.relative_to(ROOT)} — 영웅 {len(raw)}명")

    # ── 서로 어긋나는 곳 ──────────────────────────────────
    score = dict(GRADES)
    clash = []
    for a, row in raw.items():
        for b, g in row.items():
            back = raw.get(b, {}).get(a)
            if back is None:
                continue
            if score[g] > 0 and score[back] > 0:
                clash.append((a, b, g, back, "둘 다 유리"))
            elif score[g] < 0 and score[back] < 0:
                clash.append((a, b, g, back, "둘 다 불리"))
    seen, lines, pairs = set(), [], []
    for a, b, g, back, why in clash:
        if (b, a) in seen:
            continue
        seen.add((a, b))
        lines.append(f"| {heroes[a]['full']} | {g} | {heroes[b]['full']} | {back} | {why} |")
        pairs.append((a, b, "up" if "유리" in why else "down"))
    if lines:
        CLASH_MD.write_text(
            "# 두 문서가 어긋나는 곳\n\n"
            f"`scripts/scrape_matchups.py` 가 {time.strftime('%Y-%m-%d')} 에 뽑은 것. "
            "두 영웅의 나무위키 문서가 서로 자기가 유리하다고(또는 서로 불리하다고)\n"
            "적어 놓은 짝이다. 상성표에는 양쪽 주장이 그대로 들어가 있으니, "
            "한쪽으로 정하려면 `src/data/matchups.ts` 를 직접 고칠 것.\n\n"
            "| 영웅 | 자기 문서 주장 | 상대 | 상대 문서 주장 | |\n"
            "| --- | --- | --- | --- | --- |\n" + "\n".join(lines) + "\n",
            "utf-8",
        )
        print(f"\n두 문서가 어긋나는 짝 {len(lines)}개 → {CLASH_MD.relative_to(ROOT)}")

    write_conflicts_ts(sorted(pairs), heroes)
    print(f"{CLASH_TS.relative_to(ROOT)} — 어긋난 짝 {len(pairs)}개")

    if len(titles) == len(heroes):
        write_namu_ts(titles, heroes)
        print(f"{NAMU_TS.relative_to(ROOT)} — 문서 제목 {len(titles)}개")
    else:
        print(f"\n문서 제목을 {len(titles)}/{len(heroes)}개만 읽었다 — namu.ts 는 안 고친다")

    # ── 방향을 뒤집어 상성표로 ────────────────────────────
    if not args.write:
        print("\n--write 를 붙이면 matchups.ts 를 다시 쓴다.")
        return 0

    if len(raw) < len(heroes):
        sys.exit(
            f"\n{len(heroes)}명 중 {len(raw)}명만 읽었다. 반쪽짜리로 상성표를 "
            "덮어쓰면 안 되니 전부 받은 다음 --write 할 것."
        )

    table: dict[str, dict[str, int]] = {hid: {} for hid in heroes}
    for mine, row in raw.items():
        for enemy, grade in row.items():
            v = score[grade]
            if v:  # 0(중립·유동적)은 안 적힌 것과 뜻이 같다
                table[enemy][mine] = v

    write_ts(table, heroes)
    filled = sum(1 for m in table.values() if m)
    cells = sum(len(m) for m in table.values())
    spread = {v: sum(1 for m in table.values() for x in m.values() if x == v) for v in (3, 2, 1, -1, -2, -3)}
    print(f"matchups.ts — 영웅 {filled}/{len(heroes)}명, 상성 {cells}칸")
    print("  " + "  ".join(f"{v:+d}:{n}" for v, n in spread.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
