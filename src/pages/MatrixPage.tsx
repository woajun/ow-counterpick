import { useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  HEROES,
  HERO_IDS,
  ROLES,
  portrait,
  type HeroId,
  type Role,
} from '../data/heroes';
import { MATRIX, UNFILLED, cellTone, colLine, rowLine, signed } from '../lib/matrix';
import { CONFLICTS, conflictOf } from '../data/conflicts';
import { namuUrl } from '../data/namu';
import { TopBar } from '../components/TopBar';
import { useSlashFocus } from '../lib/useSlashFocus';
import { SiteLinks } from '../components/SiteLinks';

/** 범례. 나무위키 등급을 그대로 옮긴 여섯 단계다. */
const LEGEND: [number, string][] = [
  [3, '매우 유리'],
  [2, '유리'],
  [1, '약간 유리'],
  [-1, '약간 불리'],
  [-2, '불리'],
  [-3, '매우 불리'],
];

/** 마우스가 올라간 칸. 53 × 53 이라 십자선이 없으면 줄을 놓친다. */
interface Cross {
  mine: HeroId;
  enemy: HeroId;
}

/** 세로 칸은 적 영웅 전부다 — 여기는 거르지 않는다. 세로줄을 훑는 것이
 *  "이 적한테 뭐가 좋은가" 를 보는 방법이라, 빠지면 표가 안 읽힌다. */
const COLS = HERO_IDS;

/** 역할이 바뀌는 자리에 굵은 선을 넣어 덩어리로 보이게 한다. */
const startsRole = (ids: HeroId[], i: number) =>
  i > 0 && HEROES[ids[i]].r !== HEROES[ids[i - 1]].r;

export function MatrixPage() {
  const [query, setQuery] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [cross, setCross] = useState<Cross | null>(null);
  // 십자선은 표 위에 있을 때만 켜고, 읽어 주는 줄은 떼어도 남긴다 —
  // 그러지 않으면 줄 안의 링크를 누르러 가는 사이에 줄이 사라진다.
  const [onTable, setOnTable] = useState(false);
  const lit = onTable ? cross : null;
  const searchRef = useRef<HTMLInputElement>(null);
  useSlashFocus(searchRef);

  /** 가로줄만 거른다. 검색어와 역할 칩이 같이 걸린다. */
  const rows = useMemo(() => {
    const k = query.trim().toLowerCase();
    return HERO_IDS.filter((id) => {
      const h = HEROES[id];
      if (roles.length > 0 && !roles.includes(h.r)) return false;
      if (!k) return true;
      return (
        h.full.includes(k) || h.ko.includes(k) || h.en.toLowerCase().includes(k)
      );
    });
  }, [query, roles]);

  /** 세로 합계는 화면에 남은 가로줄만 더한다 — 거른 채로 전체 합을 보여
   *  주면 표와 숫자가 어긋난다. */
  const colTotals = useMemo(
    () => Object.fromEntries(COLS.map((e) => [e, colLine(e, rows)])) as
      Record<HeroId, ReturnType<typeof colLine>>,
    [rows],
  );

  const toggleRole = (r: Role) =>
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );

  const clear = () => {
    setQuery('');
    setRoles([]);
    searchRef.current?.focus();
  };

  const filtered = rows.length !== HERO_IDS.length;

  return (
    <>
      <TopBar>
        <div className="seg" role="group" aria-label="역할로 거르기">
          {ROLES.map((r) => (
            <button
              key={r.k}
              type="button"
              aria-pressed={roles.includes(r.k)}
              onClick={() => toggleRole(r.k)}
            >
              {r.ko}
            </button>
          ))}
        </div>

        <input
          ref={searchRef}
          className="search"
          type="search"
          value={query}
          placeholder="내 픽 검색  /"
          aria-label="내 픽 검색"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            if (query) setQuery('');
            else e.currentTarget.blur();
          }}
        />

        <button type="button" className="reset" onClick={clear}>
          초기화
        </button>
      </TopBar>

      <main className="wide">
        <h2 className="head">
          상성표
          <span className="n">
            {rows.length} / {HERO_IDS.length} × {COLS.length}
          </span>
          {filtered && <span className="tag">거른 중</span>}
          {UNFILLED.size > 0 && (
            <span className="tag todo">상성 미기입 {UNFILLED.size}</span>
          )}
          {CONFLICTS.length > 0 && (
            <span className="tag clash">어긋난 짝 {CONFLICTS.length}</span>
          )}
        </h2>

        <div className="legend">
          {LEGEND.map(([v, label]) => (
            <span key={v} className={cellTone(v)} title={label}>
              {signed(v)}
            </span>
          ))}
          <span className="sep" />
          매우 유리 · 유리 · 약간 유리 · 약간 불리 · 불리 · 매우 불리
          <span className="sep" />
          <span className="clash-key" /> 두 문서가 서로 어긋나는 짝
          <span className="sep" />
          가로 = 내 픽, 세로 = 적 픽. 칸 값은 추천 점수에 그대로 얹히는 숫자다.
        </div>

        {/* 십자선 읽어 주는 줄. 칸이 작아서 숫자만으로는 누가 누군지 놓친다. */}
        <div className="readout" aria-live="polite">
          {cross ? (
            <>
              <b>{HEROES[cross.mine].full}</b> 로 <b>{HEROES[cross.enemy].full}</b>{' '}
              상대 —{' '}
              <span className={cellTone(MATRIX[cross.mine][cross.enemy]) || 'zero'}>
                {MATRIX[cross.mine][cross.enemy] === 0
                  ? '적어 둔 상성 없음'
                  : signed(MATRIX[cross.mine][cross.enemy])}
              </span>
              {(() => {
                const c = conflictOf(cross.mine, cross.enemy);
                if (!c) return null;
                const w = c.both === 'up' ? '유리' : '불리';
                return (
                  <span className="clash-note">
                    ⚠ 두 문서가 서로 {w}하다고 적은 짝
                  </span>
                );
              })()}

              {/* 값이 이상하면 여기가 고칠 자리다. 이 도구는 옮겨 적은
                  사본이라 여기서 고쳐 봐야 원본은 그대로다. */}
              <span className="src">
                나무위키
                <a
                  href={namuUrl(cross.mine)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {HEROES[cross.mine].ko}
                </a>
                <a
                  href={namuUrl(cross.enemy)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {HEROES[cross.enemy].ko}
                </a>
              </span>
            </>
          ) : (
            <span className="hint">칸에 마우스를 올리면 여기에 읽어 줍니다.</span>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="rec-empty">걸린 영웅이 없습니다.</div>
        ) : (
          <div className="matrix-scroll">
            <table
              className="matrix"
              onMouseEnter={() => setOnTable(true)}
              onMouseLeave={() => setOnTable(false)}
            >
              <thead>
                <tr>
                  <th className="corner" scope="col">
                    <span className="mine">내 픽</span>
                    <span className="enemy">적 픽</span>
                  </th>
                  {COLS.map((e, i) => {
                    const h = HEROES[e];
                    return (
                      <th
                        key={e}
                        scope="col"
                        className={
                          'ch' +
                          (startsRole(COLS, i) ? ' gap' : '') +
                          (lit?.enemy === e ? ' on' : '')
                        }
                        style={{ '--role': `var(--${h.r})` } as CSSProperties}
                        title={
                          `${h.full} · ${h.en}` +
                          (UNFILLED.has(e) ? ' — 상성 미기입' : '')
                        }
                      >
                        <span className="chi">
                          <img
                            className="pic"
                            src={portrait(e)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                          <span className={'v' + (UNFILLED.has(e) ? ' todo' : '')}>
                            {h.ko}
                          </span>
                        </span>
                      </th>
                    );
                  })}
                  <th scope="col" className="th-tot gap">
                    합
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((mine, ri) => {
                  const h = HEROES[mine];
                  const line = rowLine(mine);
                  return (
                    <tr
                      key={mine}
                      className={
                        (startsRole(rows, ri) ? 'gap' : '') +
                        (lit?.mine === mine ? ' on' : '')
                      }
                    >
                      <th
                        scope="row"
                        className="rh"
                        style={{ '--role': `var(--${h.r})` } as CSSProperties}
                        title={`${h.full} · ${h.en}`}
                      >
                        <span className="rhi">
                          <img
                            className="pic"
                            src={portrait(mine)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                          <span>{h.full}</span>
                        </span>
                      </th>

                      {COLS.map((enemy, ci) => {
                        const v = MATRIX[mine][enemy];
                        const tone = cellTone(v);
                        return (
                          <td
                            key={enemy}
                            className={
                              tone +
                              (startsRole(COLS, ci) ? ' gap' : '') +
                              (mine === enemy ? ' self' : '') +
                              (lit?.enemy === enemy ? ' col' : '') +
                              (conflictOf(mine, enemy) ? ' clash' : '')
                            }
                            onMouseEnter={() => setCross({ mine, enemy })}
                          >
                            {v === 0 ? '' : signed(v)}
                          </td>
                        );
                      })}

                      <td className="tot gap" title={`유리 ${line.up} · 불리 ${line.down}`}>
                        {signed(line.sum)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr>
                  <th scope="row" className="rh">
                    합
                  </th>
                  {COLS.map((e, i) => {
                    const line = colTotals[e];
                    return (
                      <td
                        key={e}
                        className={
                          'tot' +
                          (startsRole(COLS, i) ? ' gap' : '') +
                          (lit?.enemy === e ? ' col' : '')
                        }
                        title={`${HEROES[e].full} — 유리 ${line.up} · 불리 ${line.down}`}
                      >
                        {signed(line.sum)}
                      </td>
                    );
                  })}
                  <td className="tot gap" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>

      <footer>
        <SiteLinks />
        <b>표 보는 법</b> — 가로줄 하나가 내 픽 하나입니다. 세로줄을 훑으면
        그 적이 나왔을 때 뭐가 좋은지 보입니다. 맨 오른쪽 <b>합</b>은 적{' '}
        {COLS.length}명 전체를 상대로 한 점수 합이고, 맨 아래 <b>합</b>은 화면에
        남은 내 픽만 더한 값입니다.
        <br />
        <b>모서리에 빗금이 그어진 칸</b> — 두 영웅의 나무위키 문서가 서로
        어긋나게 적어 둔 짝입니다. 애쉬 문서는 "메이 상대로 불리", 메이 문서도
        "애쉬 상대로 불리"라고 적어서 둘 다 자기가 진다는 말이 됩니다. 옮겨
        적으면서 생긴 오류가 아니라 원본이 그렇게 되어 있는 것이라, 한쪽으로
        정하려면 사람이 판단해야 합니다. 지금 {CONFLICTS.length}짝입니다.
        <br />
        <b>값이 이상하면</b> — 원본인 나무위키 문서를 고쳐 주세요. 이 표는 옮겨
        적은 사본이라 다음 수집 때 따라옵니다. 칸을 짚으면 그 영웅의 상성 절로
        가는 링크가 위에 뜹니다. 빈 칸은 아직 안 적혔거나 중립이라는 뜻입니다.
        <br />
        <b>출처</b> — <a href="https://namu.wiki/" target="_blank" rel="noreferrer">나무위키</a>
        영웅 문서의 상성 절(
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/2.0/kr/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-NC-SA 2.0 KR
        </a>
        ). 영웅 초상화는 블리자드의 자산입니다.
      </footer>
    </>
  );
}
