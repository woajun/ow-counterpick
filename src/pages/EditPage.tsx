import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { MapEditor } from '../components/MapEditor';
import { MAPS } from '../data/maps';
import { HEROES, HERO_IDS, ROLES, isHeroId, portrait, type HeroId } from '../data/heroes';
import { cellTone, signed } from '../lib/matrix';
import {
  resetAll,
  resetHero,
  CELL_NOTE_MAX,
  NOTE_MAX,
  noteKey,
  resetSynergyHero,
  setBlurb,
  setNote,
  setPair,
  setSynergy,
  synKey,
  sourceNow,
  useMySheet,
  type Source,
} from '../lib/mySheet';
import { CodeDialog } from '../components/CodeDialog';
import { confirmDialog } from '../lib/dialog';
import { TopBar } from '../components/TopBar';
import { LoginDialog } from '../components/Account';
import { TierEditor } from '../components/TierEditor';
import { SYN_LABEL } from '../data/synergy';

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
  /** 상성 · 궁합 · 맵 — 주소(?tab=syn · ?tab=map&map=)에 둔다. */
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab = tabParam === 'map' ? 'map' : tabParam === 'syn' ? 'syn' : 'counter';
  /** 궁합 — 같은 팀일 때. 상성과 같은 줄 모양이고 방향이 없다(한쪽을 고치면 반대쪽도 같은 값). */
  const syn = tab === 'syn';
  const editMap = params.get('map') ?? MAPS[0].id;
  const setQuery = (patch: Record<string, string | null>) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) n.delete(k);
          else n.set(k, v);
        }
        return n;
      },
      { replace: true },
    );
  const sheet = useMySheet();
  const [login, setLogin] = useState(false);
  /** 티어(끌어다 놓기) · 목록(줄마다 단추 · 설명). 처음엔 티어. */
  const [layout, setLayout] = useState<'tier' | 'list'>('tier');
  /** 설명을 쓰고 있는 칸의 키 — 한 번에 한 칸만 연다. */
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [codeMode, setCodeMode] = useState<'share' | 'enter' | null>(null);
  /** 방금 고쳐서 떠나온 것 — 나무위키나 남의 코드. 안내를 띄우고 되돌릴 수 있게. */
  const [left, setLeft] = useState<Source | null>(null);

  useEffect(() => {
    if (!left) return;
    const t = setTimeout(() => setLeft(null), 8000);
    return () => clearTimeout(t);
  }, [left]);

  /** 칸을 고친다. 나무위키를 따라가다가 내 카운터픽으로 넘어가는 순간이면 알린다. */
  const edit = (fn: () => void) => {
    const before = sourceNow();
    fn();
    if (before.kind !== 'mine' && sourceNow().kind === 'mine') setLeft(before);
  };

  const undo = () => {
    resetAll();
    setLeft(null);
  };
  if (hero && !isHeroId(hero)) return <Navigate to="/edit" replace />;
  const id: HeroId = hero && isHeroId(hero) ? hero : HERO_IDS[0];
  const me = HEROES[id];
  const src = sheet.source.kind;


  const rows = HERO_IDS.filter(
    (e) => e !== id,
  );

  // 고치는 것은 로그인한 사람만 — 표는 그 사람 코드에 붙는다.
  if (!sheet.user) {
    return (
      <>
        <TopBar />
        <main className="edit">
          <div className="login-gate">
            <p>로그인하면 내 카운터픽을 고칠 수 있어요.</p>
            <button type="button" className="login-btn kakao" onClick={() => setLogin(true)}>
              카카오로 로그인
            </button>
          </div>
        </main>
        {login && <LoginDialog onClose={() => setLogin(false)} />}
      </>
    );
  }

  return (
    <>
      <TopBar />

      <main className="edit">
        {/* 내 카운터픽(내 코드의 표)의 상태. */}
        <div className={'save-note' + (src === 'mine' ? ' saved' : '')}>
          <span>
            {src === 'namu' ? (
              <>
                <b>나무위키</b>를 따라가는 중 · 나무위키가 바뀌면 같이 바뀌어요. 한 칸이라도 고치면
                연결이 끊기고 내 카운터픽이 돼요.
              </>
            ) : (
              <>
                <b>{sheet.user?.name}</b>의 카운터픽 · 저장됨
              </>
            )}
          </span>
          <span className="note-actions">
            {src === 'mine' && (
              <>
                {src === 'mine' && (
                  <button type="button" className="reset small" onClick={() => setCodeMode('share')}>
                    내 코드
                  </button>
                )}
                {src === 'mine' && (
                  <button
                    type="button"
                    className="reset small"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: '초기화할까요?',
                        message: '내 카운터픽을 지우고 나무위키를 따라가요. 지운 것은 되돌릴 수 없어요.',
                        ok: '초기화',
                        danger: true,
                      });
                      if (ok) resetAll();
                    }}
                  >
                    초기화
                  </button>
                )}
              </>
            )}
          </span>
        </div>


        {/* 표 한마디 — 자세히 보기 맨 위 · 둘러보기 카드에 뜬다. 칸을 떠나면 저장된다. */}
        <label className="blurb-field">
          <span>한마디</span>
          <TextField
            key={sheet.blurb ?? ''}
            value={sheet.blurb ?? ''}
            placeholder="내 카운터픽을 한 줄로 소개해 주세요 — 자세히 보기와 둘러보기에 보여요"
            onSave={setBlurb}
          />
        </label>

        {/* 상성(적으로 만났을 때) · 맵(이 맵에서). 같은 카운터픽 한 장에 들어간다. */}
        <div className="seg small edit-tab" role="group" aria-label="상성 · 궁합 · 맵">
          <button type="button" aria-pressed={tab === 'counter'} onClick={() => setQuery({ tab: null })}>
            상성
          </button>
          <button type="button" aria-pressed={tab === 'syn'} onClick={() => setQuery({ tab: 'syn' })}>
            궁합
          </button>
          <button type="button" aria-pressed={tab === 'map'} onClick={() => setQuery({ tab: 'map' })}>
            맵
          </button>
        </div>

        {tab === 'map' ? (
          <MapEditor map={editMap} onMap={(m) => setQuery({ map: m })} edit={edit} />
        ) : (
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
                    return (
                      <Link
                        key={h}
                        to={`/edit/${h}${syn ? '?tab=syn' : ''}`}
                        className={'pick-item' + (h === id ? ' on' : '')}
                        title={HEROES[h].full}
                        aria-current={h === id ? 'page' : undefined}
                      >
                        <img className="pic" src={portrait(h)} alt="" loading="lazy" decoding="async" />
                        <span className="nm">{HEROES[h].ko}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <section className="editor" aria-label={`${me.full} ${syn ? '궁합' : '상성'} 수정`}>
            <div className="ed-head" style={{ '--role': `var(--${me.r})` } as CSSProperties}>
              <img className="pic" src={portrait(id)} alt="" decoding="async" />
              <div className="hs-name">
                <b>{me.full}</b>
                <span>{syn ? `${me.ko} · 같은 팀일 때` : `내 픽이 ${me.ko}일 때`}</span>
              </div>
              <div className="seg small" role="group" aria-label="티어 · 목록">
                <button type="button" aria-pressed={layout === 'tier'} onClick={() => setLayout('tier')}>
                  티어
                </button>
                <button type="button" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}>
                  목록
                </button>
              </div>
              {layout === 'list' && (
                <button
                  type="button"
                  className="reset small"
                  onClick={() => edit(() => (syn ? resetSynergyHero(id) : resetHero(id)))}
                >
                  이 영웅 되돌리기
                </button>
              )}
            </div>

            {/* 티어 — 얼굴을 끌어다 −3 … +3 줄에 놓는다. 설명은 목록에서 쓴다. */}
            {layout === 'tier' && <TierEditor id={id} syn={syn} edit={edit} />}



            {layout === 'list' && ROLES.map((r) => {
              const list = rows.filter((e) => HEROES[e].r === r.k);
              if (list.length === 0) return null;
              return (
                <div key={r.k} className="ed-group" style={{ '--role': `var(--${r.k})` } as CSSProperties}>
                  <div className="pick-head">
                    <span className="dot" />
                    {r.ko}
                  </div>
                  {list.map((e) => {
                    const nk = syn ? synKey(id, e) : noteKey(id, e);
                    const note = sheet.notes?.[nk];
                    const open = noteOpen === nk;
                    const sv = syn ? sheet.mySyn(id, e) : null;
                    const blank = syn ? sv === null : sheet.blank(id, e);
                    const v = syn ? (sv ?? 0) : sheet.matrix[id][e];
                    return (
                      <Fragment key={e}>
                      <div
                        className={'ed-row' + (blank ? ' blank' : '')}
                        title={blank ? '아직 값이 없어요 — 골라 주세요' : undefined}
                      >
                        <img className="pic" src={portrait(e)} alt="" loading="lazy" decoding="async" />
                        <span className="nm">{HEROES[e].full}</span>
                        <div
                          className="steps"
                          role="radiogroup"
                          aria-label={`${me.full} ${syn ? '+' : 'vs'} ${HEROES[e].full}`}
                        >
                          {STEPS.map((s) => {
                            const on = !blank && v === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                title={syn ? SYN_LABEL[s] : STEP_LABEL[s]}
                                className={
                                  'step ' +
                                  (cellTone(s) || 'zero') +
                                  (on ? ' on' : '')
                                }
                                onClick={() => edit(() => (syn ? setSynergy(id, e, s) : setPair(id, e, s)))}
                              >
                                {s === 0 ? '0' : signed(s)}
                              </button>
                            );
                          })}
                        </div>
                        {/* 왜 이 점수인지 — 자세히 보기의 영웅 줄 아래에 뜬다. */}
                        <button
                          type="button"
                          className={'note-btn' + (note ? ' has' : '')}
                          aria-expanded={open}
                          title={note ? '설명 고치기' : '왜 이 점수인지 설명 쓰기'}
                          onClick={() => setNoteOpen(open ? null : nk)}
                        >
                          설명
                        </button>
                      </div>
                      {open ? (
                        <TextField
                          multiline
                          autoFocus
                          value={note ?? ''}
                          placeholder={`왜 이 점수인지, 어떻게 상대하는지 (${CELL_NOTE_MAX}자까지 · Shift+Enter 로 줄바꿈)`}
                          max={CELL_NOTE_MAX}
                          onSave={(t) => setNote(nk, t)}
                          onDone={() => setNoteOpen(null)}
                        />
                      ) : (
                        note && (
                          <p className="ed-note" onClick={() => setNoteOpen(nk)} title="눌러서 고치기">
                            {note}
                          </p>
                        )
                      )}
                      </Fragment>
                    );
                  })}
                </div>
              );
            })}
          </section>
        </div>
        )}
      </main>

      {login && <LoginDialog onClose={() => setLogin(false)} />}
      {codeMode && <CodeDialog mode={codeMode} onClose={() => setCodeMode(null)} />}

      {/* 나무위키에서 떨어져 나온 순간 — 무슨 일이 일어났는지와 되돌리는 길. */}
      {left && (
        <div className="toast" role="status">
          <span>
            <b>나무위키</b> 연결이 끊기고 내 카운터픽이 됐어요. 이제 나무위키가 바뀌어도 안 바뀌어요.
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

/**
 * 설명 · 한마디 입력 칸 — 쓰는 동안은 저장하지 않고, 칸을 떠날 때(또는 Enter) 한 번 저장한다.
 * 글자마다 저장하면 표 전체가 다시 그려지고 DB 에도 계속 간다.
 */
function TextField({
  value,
  placeholder,
  onSave,
  onDone,
  multiline = false,
  autoFocus = false,
  max = NOTE_MAX,
}: {
  value: string;
  placeholder: string;
  onSave: (text: string) => void;
  /** 저장하고 닫을 때 — Enter · Esc. */
  onDone?: () => void;
  multiline?: boolean;
  autoFocus?: boolean;
  /** 최대 글자 수 — 표 한마디 200, 칸 설명 1,000. */
  max?: number;
}) {
  const [draft, setDraft] = useState(value);
  /** Esc 로 닫을 때 — 닫히며 떠나는 순간(blur)에 저장하지 않게. */
  const discard = useRef(false);
  const save = () => {
    if (discard.current) return;
    if (draft.trim() !== value.trim()) onSave(draft);
  };
  const common = {
    value: draft,
    placeholder,
    maxLength: max,
    autoFocus,
    onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
    onBlur: save,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // 줄바꿈은 Shift+Enter. Enter 는 저장하고 닫기, Esc 는 고친 것을 버리고 닫기.
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        save();
        onDone?.();
        if (!onDone) e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        discard.current = true;
        setDraft(value);
        onDone?.();
      }
    },
  };
  return multiline ? (
    <div className="ed-note-edit">
      <textarea rows={3} {...common} />
      <span className="cnt">
        {draft.length} / {max}
      </span>
    </div>
  ) : (
    <input type="text" className="blurb-input" {...common} />
  );
}
