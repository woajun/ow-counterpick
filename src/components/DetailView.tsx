import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';
import { cellTone, signed } from '../lib/matrix';
import { MOCK_BLURB, MOCK_NOTES } from '../data/mockNotes';
import { SYNERGY } from '../data/synergy';
import {
  CODE_LEN,
  findCode,
  likeCounts,
  namuValue,
  normalizeCode,
  useMySheet,
  valueIn,
  type Sheet,
} from '../lib/mySheet';

/**
 * 살펴보기 — 이 카운터픽이 믿을 만한지 게임 밖에서 천천히 본다.
 *
 * 인게임 화면과 같은 표(주소로 연 남의 표, 아니면 내 표 · 나무위키)를 쓴다.
 * 여기 있는 것: 소개 · 영웅별로 보기(나무위키와 나란히) · 다른 표와 비교.
 * 댓글 · 작성자 근거 · 합의도는 다음 단계에서 붙는다.
 */

interface Subject {
  name: string;
  code?: string;
  /** null 이면 나무위키 */
  sheet: Sheet | null;
  updatedAt?: string;
  isNamu: boolean;
}

const Badge = ({ v, title }: { v: number | null; title?: string }) => (
  <span className={'hs-badge ' + (v === null ? 'blank' : cellTone(v) || 'zero')} title={title}>
    {v === null ? '—' : v === 0 ? '0' : signed(v)}
  </span>
);

/** 3일 전 · 오늘 · 2달 전 */
function ago(iso?: string) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return '오늘';
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.floor(days / 30)}달 전`;
  return `${Math.floor(days / 365)}년 전`;
}

export function DetailView() {
  const my = useMySheet();

  // 무엇을 살펴보나 — 주소로 연 남의 표가 먼저, 아니면 내 기준(내 상성 · 나무위키).
  const subject: Subject = my.peek
    ? { name: my.peek.owner, code: my.peek.code, sheet: my.peek.sheet, updatedAt: my.peek.updatedAt, isNamu: false }
    : my.source.kind === 'mine'
      ? { name: my.user?.name ?? '내 상성', code: my.code, sheet: my.sheet, isNamu: false }
      : { name: '나무위키', sheet: null, isNamu: true };

  return (
    <main className="edit detail">
      <Overview subject={subject} />
      <HeroLines subject={subject} />
      <Compare subject={subject} />
    </main>
  );
}

// ── 소개 ───────────────────────────────────────────────

function Overview({ subject }: { subject: Subject }) {
  const [likes, setLikes] = useState<number | null>(null);
  useEffect(() => {
    if (!subject.code) return;
    let alive = true;
    void likeCounts().then((m) => alive && setLikes(m.get(subject.code!) ?? 0));
    return () => {
      alive = false;
    };
  }, [subject.code]);

  return (
    <section className="dv-card">
      <div className="dv-title">
        <b>{subject.name}</b>
        {subject.code && <span className="mono">{subject.code}</span>}
      </div>
      {!subject.isNamu && (subject.code || subject.updatedAt) && (
        <div className="dv-stats">
          {subject.code && (
            <span>
              ♥ <b>{likes ?? '…'}</b>
            </span>
          )}
          {subject.updatedAt && (
            <span>
              마지막 수정 <b>{ago(subject.updatedAt)}</b>
            </span>
          )}
        </div>
      )}
      {/* 주인이 쓰는 한마디 — 목업 */}
      <p className="dv-blurb">
        {subject.isNamu ? '나무위키 영웅 문서의 상성 절을 그대로 옮긴 기본 표예요.' : MOCK_BLURB}
        {!subject.isNamu && <span className="dv-mock">예시</span>}
      </p>
    </section>
  );
}

// ── 영웅별로 보기 ───────────────────────────────────────

function HeroLines({ subject }: { subject: Subject }) {
  // 목업 설명이 겐지 줄에만 있어서 겐지부터 보여 준다. 설명이 실제로 붙으면 첫 영웅으로 되돌린다.
  const [id, setId] = useState<HeroId>('genji');
  /** 역할 안에서 점수 높은 순으로 — 끄면 게임 영웅 선택 화면 차례. */
  const [byScore, setByScore] = useState(false);
  /**
   * 상성(적으로 만났을 때) · 조합(같은 팀일 때).
   * 조합은 나무위키 궁합 절을 읽고 매긴 값이라 표마다 다르지 않고, 아직 고칠 수도 없다.
   */
  const [tab, setTab] = useState<'counter' | 'combo'>('counter');
  const combo = tab === 'combo';
  /** 지금 탭의 한 칸 — 조합은 +2 · +1 · −1, 평가 없으면 null. */
  const valueOf = (e: HeroId) => (combo ? (SYNERGY[id]?.[e] ?? null) : valueIn(subject.sheet, id, e));
  const me = HEROES[id];

  const differs = (a: HeroId, b: HeroId) => valueIn(subject.sheet, a, b) !== namuValue(a, b);
  const diffOf = (h: HeroId) => HERO_IDS.filter((e) => e !== h && differs(h, e)).length;
  const rows = HERO_IDS.filter((e) => e !== id);

  return (
    <section className="dv-section">
      <h2 className="head">영웅별로 보기</h2>
      <div className="edit-grid">
        <nav className="pick" aria-label="볼 영웅">
          {ROLES.map((r) => (
            <div key={r.k} className="pick-role" style={{ '--role': `var(--${r.k})` } as CSSProperties}>
              <div className="pick-head">
                <span className="dot" />
                {r.ko}
              </div>
              <div className="pick-list">
                {HERO_IDS.filter((h) => HEROES[h].r === r.k).map((h) => {
                  const n = subject.isNamu ? 0 : diffOf(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      className={'pick-item' + (h === id ? ' on' : '')}
                      title={HEROES[h].full}
                      aria-pressed={h === id}
                      onClick={() => setId(h)}
                    >
                      <img className="pic" src={portrait(h)} alt="" loading="lazy" decoding="async" />
                      <span className="nm">{HEROES[h].ko}</span>
                      {n > 0 && <span className="cnt">{n}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="editor">
          <div className="ed-head" style={{ '--role': `var(--${me.r})` } as CSSProperties}>
            <img className="pic" src={portrait(id)} alt="" decoding="async" />
            <div className="hs-name">
              <b>{me.full}</b>
              <span>{combo ? `${me.ko}와 같은 팀일 때` : `내 픽이 ${me.ko}일 때`}</span>
            </div>
            <div className="seg small" role="group" aria-label="상성 · 궁합">
              <button type="button" aria-pressed={!combo} onClick={() => setTab('counter')}>
                상성
              </button>
              <button type="button" aria-pressed={combo} onClick={() => setTab('combo')}>
                궁합
              </button>
            </div>
            <button
              type="button"
              className={'reset small' + (byScore ? ' on' : '')}
              aria-pressed={byScore}
              title="탱커 · 딜러 · 지원 안에서 점수 높은 순으로"
              onClick={() => setByScore((v) => !v)}
            >
              점수순 {byScore ? '켬' : '끔'}
            </button>
          </div>


          {ROLES.map((r) => {
            const list = rows.filter((e) => HEROES[e].r === r.k);
            if (list.length === 0) return null;
            // 점수순: 유리한 것부터, 적힌 것 없음은 맨 뒤. 같은 점수는 원래 차례 그대로.
            if (byScore) {
              const score = (e: HeroId) => valueOf(e) ?? -Infinity;
              list.sort((a, b) => score(b) - score(a));
            }
            return (
              <div key={r.k} className="ed-group" style={{ '--role': `var(--${r.k})` } as CSSProperties}>
                <div className="pick-head">
                  <span className="dot" />
                  {r.ko}
                </div>
                {list.map((e) => {
                  const v = valueOf(e);
                  const n = namuValue(id, e);
                  // 조합은 표마다 같아서 나무위키와 견줄 것이 없다.
                  const d = !combo && !subject.isNamu && v !== n;
                  return (
                    <div key={e} className={'dv-row' + (d ? ' diff' : '')}>
                      <img className="pic" src={portrait(e)} alt="" loading="lazy" decoding="async" />
                      <span className="nm">{HEROES[e].full}</span>
                      <Badge v={v} title={subject.isNamu ? '나무위키' : `${subject.name}의 값`} />
                      {d ? (
                        <span className="dv-was">
                          나무위키 <Badge v={n} />
                        </span>
                      ) : (
                        <span />
                      )}
                      {/* 왜 이 점수인지 — 목업. 나중엔 표 주인이 칸마다 쓴다. */}
                      {!combo && MOCK_NOTES[`${id}>${e}`] && <Note key={id + e} text={MOCK_NOTES[`${id}>${e}`]} />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * 한 줄 설명 — 넘치면 한 줄로 접어 두고 눌러서 펼친다. 줄마다 설명 길이가 달라도
 * 표가 들쭉날쭉해지지 않는다. 한 줄에 다 들어가면 펼칠 것도 없다.
 */
function Note({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);

  // 접힌 상태에서 글이 칸보다 길면 펼치기 단추를 단다. 화면 폭이 바뀌면 다시 잰다.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setLong(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, text]);

  return (
    <p
      ref={ref}
      className={'dv-note' + (open ? ' open' : '') + (long || open ? ' long' : '')}
      onClick={() => (long || open) && setOpen((v) => !v)}
      title={long && !open ? '눌러서 펼치기' : undefined}
    >
      {text}
      {open && <span className="dv-fold">접기</span>}
    </p>
  );
}

// ── 다른 표와 비교 ─────────────────────────────────────

interface Other {
  name: string;
  sheet: Sheet | null;
}

function Compare({ subject }: { subject: Subject }) {
  const my = useMySheet();
  const [other, setOther] = useState<Other | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);

  // 비교 상대 — 기본은 나무위키. 남의 표를 보는 중이고 내 상성이 있으면 내 것과도 견줄 수 있다.
  const target: Other = other ?? (subject.isNamu ? { name: '내 상성', sheet: my.sheet } : { name: '나무위키', sheet: null });
  // 나무위키를 보면서 내 상성도 없으면 견줄 상대가 아직 없다 — 코드를 넣어야 한다.
  const nothing = subject.isNamu && my.source.kind !== 'mine' && !other;
  const canMine = !subject.isNamu && my.source.kind === 'mine' && my.code !== subject.code;

  const pairs = useMemo(() => {
    const out: { a: HeroId; b: HeroId; x: number | null; y: number | null }[] = [];
    for (let i = 0; i < HERO_IDS.length; i++) {
      for (let j = 0; j < HERO_IDS.length; j++) {
        if (i === j) continue;
        const a = HERO_IDS[i];
        const b = HERO_IDS[j];
        const x = valueIn(subject.sheet, a, b);
        const y = valueIn(target.sheet, a, b);
        if (x !== y) out.push({ a, b, x, y });
      }
    }
    return out;
  }, [subject.sheet, target.sheet]);

  const load = async () => {
    const hit = await findCode(code);
    if (!hit) {
      setError('없는 코드예요.');
      return;
    }
    setOther({ name: hit.owner, sheet: hit.sheet });
    setError('');
  };

  const shown = more ? pairs : pairs.slice(0, 60);

  return (
    <section className="dv-section">
      <h2 className="head">
        다른 표와 비교
        {!nothing && (
          <span className="n">
            {subject.name} · {target.name} — 다른 칸 {pairs.length}
          </span>
        )}
      </h2>

      <div className="dv-pick">
        <div className="seg small" role="group" aria-label="비교 상대">
          {!subject.isNamu && (
            <button type="button" aria-pressed={target.name === '나무위키' && !other} onClick={() => setOther(null)}>
              나무위키
            </button>
          )}
          {canMine && (
            <button
              type="button"
              aria-pressed={other?.name === '내 상성'}
              onClick={() => setOther({ name: '내 상성', sheet: my.sheet })}
            >
              내 상성
            </button>
          )}
        </div>
        <input
          className="dv-code"
          value={code}
          placeholder="코드로 비교"
          maxLength={CODE_LEN + 2}
          spellCheck={false}
          onChange={(e) => {
            setCode(normalizeCode(e.target.value));
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && code.length === CODE_LEN) void load();
          }}
        />
        <button type="button" className="reset small" disabled={code.length !== CODE_LEN} onClick={() => void load()}>
          비교
        </button>
        {error && <span className="code-error">{error}</span>}
      </div>

      {nothing ? (
        <div className="rec-empty">코드를 넣으면 나무위키와 그 사람 표를 견줘 볼 수 있어요.</div>
      ) : pairs.length === 0 ? (
        <div className="rec-empty">두 표가 같아요.</div>
      ) : (
        <div className="dv-diffs">
          <div className="dv-diff head">
            <span>내 픽 vs 적 픽</span>
            <span>{subject.name}</span>
            <span>{target.name}</span>
          </div>
          {shown.map(({ a, b, x, y }) => (
            <div key={a + '>' + b} className="dv-diff">
              <span className="dv-pair">
                <img className="pic" src={portrait(a)} alt="" loading="lazy" />
                {HEROES[a].ko}
                <i>vs</i>
                <img className="pic" src={portrait(b)} alt="" loading="lazy" />
                {HEROES[b].ko}
              </span>
              <Badge v={x} />
              <Badge v={y} />
            </div>
          ))}
          {!more && pairs.length > shown.length && (
            <button type="button" className="reset small dv-more" onClick={() => setMore(true)}>
              {pairs.length - shown.length}칸 더 보기
            </button>
          )}
        </div>
      )}
    </section>
  );
}
