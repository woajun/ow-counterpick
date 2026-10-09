import { useEffect, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { HEROES, HERO_IDS, ROLES, isHeroId, portrait, type HeroId } from '../data/heroes';
import { cellTone, signed } from '../lib/matrix';
import {
  followCode,
  resetAll,
  resetHero,
  setPair,
  sourceNow,
  unlink,
  useMySheet,
  type Source,
} from '../lib/mySheet';
import { CodeDialog } from '../components/CodeDialog';
import { TopBar } from '../components/TopBar';
import { AccountChip, LoginDialog } from '../components/Account';

const STEPS = [3, 2, 1, 0, -1, -2, -3];
const STEP_LABEL: Record<number, string> = {
  3: '매우 유리',
  2: '유리',
  1: '약간 유리',
  0: '중립',
  [-1]: '약간 불리',
  [-2]: '불리',
  [-3]: '매우 불리',
};

/**
 * 상성 수정 — 영웅 하나를 고르면 나머지 전부와의 상성이 줄로 나온다.
 *
 * 나무위키 값이 기본으로 눌려 있고, 다른 칸을 누르면 그 짝만 내 값으로 바뀐다.
 * 반대쪽(상대 영웅으로 나를 상대할 때)은 부호를 뒤집어 같이 바뀐다.
 */
export function EditPage() {
  const { hero } = useParams();
  const sheet = useMySheet();
  const [onlyMine, setOnlyMine] = useState(false);
  const [login, setLogin] = useState(false);
  const [codeMode, setCodeMode] = useState<'share' | 'enter' | null>(null);
  /** 방금 고쳐서 떠나온 것 — 나무위키나 남의 코드. 안내를 띄우고 되돌릴 수 있게. */
  const [left, setLeft] = useState<Source | null>(null);

  useEffect(() => {
    if (!left) return;
    const t = setTimeout(() => setLeft(null), 8000);
    return () => clearTimeout(t);
  }, [left]);

  /** 칸을 고친다. 나무위키나 코드를 따라가다가 내 상성으로 넘어가는 순간이면 알린다. */
  const edit = (fn: () => void) => {
    const before = sourceNow();
    fn();
    if (before.kind !== 'mine' && sourceNow().kind === 'mine') setLeft(before);
  };

  const undo = () => {
    if (left?.kind === 'code') followCode(left.link.code);
    else resetAll();
    setLeft(null);
  };
  if (hero && !isHeroId(hero)) return <Navigate to="/edit" replace />;
  const id: HeroId = hero && isHeroId(hero) ? hero : HERO_IDS[0];
  const me = HEROES[id];
  const src = sheet.source.kind;

  /** 영웅마다 나무위키와 다른 짝 수 — 고르는 줄에 숫자로 찍는다. */
  const editedOf = (h: HeroId) =>
    HERO_IDS.filter((e) => e !== h && sheet.differs(h, e)).length;

  const rows = HERO_IDS.filter(
    (e) => e !== id && (!onlyMine || sheet.differs(id, e)),
  );
  const mineHere = editedOf(id);

  return (
    <>
      <TopBar>
        <Link className="reset" to="/">
          ← 추천으로
        </Link>
        <AccountChip />
      </TopBar>

      <main className="edit">
        {/* 저장 상태. 로그인 전에는 창을 닫으면 사라진다는 것을 먼저 알린다. */}
        <div className={'save-note' + (src === 'code' ? ' linked' : src === 'mine' ? ' saved' : '')}>
          <span>
            {sheet.link ? (
              <>
                <b>{sheet.link.owner}</b>의 상성(<b className="mono">{sheet.link.code}</b>)을 따라가는
                중 · 그 사람이 고치면 자동으로 바뀌어요. 내가 한 칸이라도 고치면 연결이 끊겨요.
              </>
            ) : src === 'namu' ? (
              <>
                <b>나무위키</b>를 따라가는 중 · 나무위키가 바뀌면 같이 바뀌어요. 한 칸이라도 고치면
                연결이 끊기고 내 상성이 돼요.
              </>
            ) : sheet.user ? (
              <>
                <b>내 상성</b> · 나무위키와 다른 짝 {sheet.diff} · 계정에 저장됨
              </>
            ) : (
              <>
                <b>내 상성</b>은 이 창에만 임시로 있어요. 다음에도 쓰려면{' '}
                <button type="button" className="link" onClick={() => setLogin(true)}>
                  로그인
                </button>
                하세요.
              </>
            )}
          </span>
          <span className="note-actions">
            {/* 따라가는 중에는 끊는 것 하나만. 나머지는 끊고 나서 할 일이다. */}
            {src === 'code' ? (
              <button type="button" className="reset small" onClick={unlink}>
                연결 끊기
              </button>
            ) : (
              <>
                {src === 'mine' && (
                  <button type="button" className="reset small" onClick={() => setCodeMode('share')}>
                    내 코드
                  </button>
                )}
                <button type="button" className="reset small" onClick={() => setCodeMode('enter')}>
                  코드 입력
                </button>
                {src === 'mine' && (
                  <button
                    type="button"
                    className="reset small"
                    onClick={() => {
                      if (confirm('내 상성을 지우고 나무위키를 따라갈까요?')) resetAll();
                    }}
                  >
                    초기화
                  </button>
                )}
              </>
            )}
          </span>
        </div>


        <div className="edit-grid">
          {/* 영웅 고르기 — 역할별로. 고친 짝이 있는 영웅에는 숫자가 붙는다. */}
          <nav className="pick" aria-label="수정할 영웅">
            {ROLES.map((r) => (
              <div key={r.k} className="pick-role" style={{ '--role': `var(--${r.k})` } as CSSProperties}>
                <div className="pick-head">
                  <span className="dot" />
                  {r.ko}
                </div>
                <div className="pick-list">
                  {HERO_IDS.filter((h) => HEROES[h].r === r.k).map((h) => {
                    const n = editedOf(h);
                    return (
                      <Link
                        key={h}
                        to={`/edit/${h}`}
                        className={'pick-item' + (h === id ? ' on' : '')}
                        title={HEROES[h].full}
                        aria-current={h === id ? 'page' : undefined}
                      >
                        <img className="pic" src={portrait(h)} alt="" loading="lazy" decoding="async" />
                        <span className="nm">{HEROES[h].ko}</span>
                        {n > 0 && <span className="cnt">{n}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <section className="editor" aria-label={`${me.full} 상성 수정`}>
            <div className="ed-head" style={{ '--role': `var(--${me.r})` } as CSSProperties}>
              <img className="pic" src={portrait(id)} alt="" decoding="async" />
              <div className="hs-name">
                <b>{me.full}</b>
                <span>내 픽이 {me.ko}일 때 · 고친 짝 {mineHere}</span>
              </div>
              <div className="seg small" role="group" aria-label="보기">
                <button type="button" aria-pressed={!onlyMine} onClick={() => setOnlyMine(false)}>
                  전체
                </button>
                <button type="button" aria-pressed={onlyMine} onClick={() => setOnlyMine(true)}>
                  고친 것만
                </button>
              </div>
              <button
                type="button"
                className="reset small"
                disabled={mineHere === 0}
                onClick={() => edit(() => resetHero(id))}
              >
                이 영웅 되돌리기
              </button>
            </div>


            {rows.length === 0 && <div className="rec-empty">이 영웅은 아직 고친 짝이 없어요.</div>}

            {ROLES.map((r) => {
              const list = rows.filter((e) => HEROES[e].r === r.k);
              if (list.length === 0) return null;
              return (
                <div key={r.k} className="ed-group" style={{ '--role': `var(--${r.k})` } as CSSProperties}>
                  <div className="pick-head">
                    <span className="dot" />
                    {r.ko}
                  </div>
                  {list.map((e) => {
                    const blank = sheet.blank(id, e);
                    const v = sheet.matrix[id][e];
                    // 나무위키와 다른 칸. 따라가는 중에는 그 사람이 나무위키와 다르게 둔 칸이다.
                    const edited = sheet.differs(id, e);
                    return (
                      <div
                        key={e}
                        className={'ed-row' + (edited ? ' edited' : blank ? ' blank' : '')}
                        title={blank ? '아직 값이 없어요 — 골라 주세요' : undefined}
                      >
                        <img className="pic" src={portrait(e)} alt="" loading="lazy" decoding="async" />
                        <span className="nm">{HEROES[e].full}</span>
                        <div className="steps" role="radiogroup" aria-label={`${me.full} vs ${HEROES[e].full}`}>
                          {STEPS.map((s) => {
                            const on = !blank && v === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                title={STEP_LABEL[s]}
                                className={
                                  'step ' +
                                  (cellTone(s) || 'zero') +
                                  (on ? ' on' : '')
                                }
                                onClick={() => edit(() => setPair(id, e, s))}
                              >
                                {s === 0 ? '0' : signed(s)}
                              </button>
                            );
                          })}
                        </div>
                        <span className="was">
                          {edited ? (
                            <>
                              <button
                                type="button"
                                className="undo"
                                title="나무위키 값으로 되돌리기"
                                aria-label="나무위키 값으로 되돌리기"
                                onClick={() => edit(() => setPair(id, e, null))}
                              >
                                ↺
                              </button>
                            </>
                          ) : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </section>
        </div>
      </main>

      {login && <LoginDialog onClose={() => setLogin(false)} />}
      {codeMode && <CodeDialog mode={codeMode} onClose={() => setCodeMode(null)} />}

      {/* 따라가던 것에서 떨어져 나온 순간 — 무슨 일이 일어났는지와 되돌리는 길. */}
      {left && (
        <div className="toast" role="status">
          <span>
            {left.kind === 'code' ? (
              <>
                <b>{left.link.owner}</b>({left.link.code}) 연결이 끊기고 내 상성이 됐어요. 이제 그
                사람이 고쳐도 안 바뀌어요.
              </>
            ) : (
              <>
                <b>나무위키</b> 연결이 끊기고 내 상성이 됐어요. 이제 나무위키가 바뀌어도 안
                바뀌어요.
              </>
            )}
          </span>
          <button type="button" className="link" onClick={undo}>
            되돌리기
          </button>
          <button type="button" className="toast-x" aria-label="닫기" onClick={() => setLeft(null)}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}
