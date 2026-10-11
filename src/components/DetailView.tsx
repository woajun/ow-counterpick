import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';
import { cellTone, signed } from '../lib/matrix';
import { MOCK_BLURB, MOCK_NOTES } from '../data/mockNotes';
import { SYNERGY } from '../data/synergy';
import { MAPS, MODES } from '../data/maps';
import { mapValueIn } from '../lib/mySheet';
import {
  likeCounts,
  useMySheet,
  valueIn,
  type Sheet,
} from '../lib/mySheet';

/**
 * 살펴보기 — 이 카운터픽이 믿을 만한지 게임 밖에서 천천히 본다.
 *
 * 인게임 화면과 같은 표(주소로 연 남의 표, 아니면 내 표 · 나무위키)를 쓴다.
 * 여기 있는 것: 소개 · 영웅별로 보기(나무위키와 나란히).
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

  // 무엇을 살펴보나 — 주소로 연 남의 표가 먼저, 아니면 내 카운터픽(로그인), 아니면 나무위키.
  const subject: Subject = my.peek
    ? { name: my.peek.owner, code: my.peek.code, sheet: my.peek.sheet, updatedAt: my.peek.updatedAt, isNamu: false }
    : my.user && my.source.kind === 'mine'
      ? { name: my.user.name, code: my.code, sheet: my.sheet, isNamu: false }
      : { name: '나무위키', sheet: null, isNamu: true };

  return (
    <main className="edit detail">
      <Overview subject={subject} />
      <HeroLines subject={subject} />
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
        {/* 받은 추천(좋아요) 수 — 제목 줄 오른쪽 끝에 크게. 코드가 있는 표만. */}
        {subject.code && (
          <span className="dv-likes" title="받은 추천 수">
            ♥ <b>{likes ?? '…'}</b>
          </span>
        )}
      </div>
      {!subject.isNamu && subject.updatedAt && (
        <div className="dv-stats">
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
  // 목업 설명이 겐지 줄에만 있어서 영웅을 고르면 겐지부터. 처음엔 영웅 없이 전체 요약을 보여 준다.
  const [id, setId] = useState<HeroId>('genji');
  /** 영웅을 아직 안 골랐다 — 오른쪽에 이 표 전체 요약. */
  const [summary, setSummary] = useState(true);
  const pick = (h: HeroId) => {
    setId(h);
    setSummary(false);
  };
  /** 역할 안에서 점수 높은 순으로 — 끄면 게임 영웅 선택 화면 차례. */
  const [byScore, setByScore] = useState(false);
  /**
   * 상성(적으로 만났을 때) · 조합(같은 팀일 때).
   * 조합은 나무위키 궁합 절을 읽고 매긴 값이라 표마다 다르지 않고, 아직 고칠 수도 없다.
   */
  const [tab, setTab] = useState<'counter' | 'combo' | 'map'>('counter');
  const onMapTab = tab === 'map';
  const combo = tab === 'combo';
  /** 지금 탭의 한 칸 — 조합은 +2 · +1 · −1, 평가 없으면 null. */
  const valueOf = (e: HeroId) => (combo ? (SYNERGY[id]?.[e] ?? null) : valueIn(subject.sheet, id, e));
  const me = HEROES[id];

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
                  return (
                    <button
                      key={h}
                      type="button"
                      className={'pick-item' + (!summary && h === id ? ' on' : '')}
                      title={HEROES[h].full}
                      aria-pressed={!summary && h === id}
                      onClick={() => pick(h)}
                    >
                      <img className="pic" src={portrait(h)} alt="" loading="lazy" decoding="async" />
                      <span className="nm">{HEROES[h].ko}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {summary ? (
          <Summary sheet={subject.sheet} onPick={pick} />
        ) : (
        <div className="editor">
          <div className="ed-head" style={{ '--role': `var(--${me.r})` } as CSSProperties}>
            <button type="button" className="reset small" onClick={() => setSummary(true)} title="표 전체 요약으로">
              ← 요약
            </button>
            <img className="pic" src={portrait(id)} alt="" decoding="async" />
            <div className="hs-name">
              <b>{me.full}</b>
              <span>
                {onMapTab ? `맵마다 ${me.ko} 점수` : combo ? `${me.ko}와 같은 팀일 때` : `내 픽이 ${me.ko}일 때`}
              </span>
            </div>
            <div className="seg small" role="group" aria-label="상성 · 궁합 · 맵">
              <button type="button" aria-pressed={tab === 'counter'} onClick={() => setTab('counter')}>
                상성
              </button>
              <button type="button" aria-pressed={combo} onClick={() => setTab('combo')}>
                궁합
              </button>
              <button type="button" aria-pressed={onMapTab} onClick={() => setTab('map')}>
                맵
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


          {/* 맵 — 이 영웅이 맵마다 몇 점인지(표 주인이 정한 것). 정하지 않은 맵은 — . */}
          {onMapTab &&
            (MAPS.every((m) => mapValueIn(subject.sheet, m.id, id) === null) ? (
              <div className="rec-empty">
                {subject.isNamu ? '나무위키에는 맵 점수가 없어요.' : `${me.ko}의 맵 점수를 아직 정하지 않았어요.`}
              </div>
            ) : (
              MODES.map((mode) => {
                const list = MAPS.filter((m) => m.mode === mode.k);
                if (byScore) {
                  const sc = (id2: string) => mapValueIn(subject.sheet, id2, id) ?? -Infinity;
                  list.sort((a, b) => sc(b.id) - sc(a.id));
                }
                return (
                  <div key={mode.k} className="ed-group">
                    <div className="pick-head">{mode.ko}</div>
                    {list.map((m) => (
                      <div key={m.id} className="dv-row">
                        <span />
                        <span className="nm">{m.ko}</span>
                        <Badge v={mapValueIn(subject.sheet, m.id, id)} />
                        <span />
                      </div>
                    ))}
                  </div>
                );
              })
            ))}

          {!onMapTab && ROLES.map((r) => {
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
                  return (
                    <div key={e} className="dv-row">
                      <img className="pic" src={portrait(e)} alt="" loading="lazy" decoding="async" />
                      <span className="nm">{HEROES[e].full}</span>
                      <Badge v={v} title={subject.isNamu ? '나무위키' : `${subject.name}의 값`} />
                      <span />
                      {/* 왜 이 점수인지 — 목업. 나중엔 표 주인이 칸마다 쓴다. */}
                      {!combo && MOCK_NOTES[`${id}>${e}`] && <Note key={id + e} text={MOCK_NOTES[`${id}>${e}`]} />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}

// ── 전체 요약 — 영웅을 고르기 전 ─────────────────────────

/** 설명 아이콘 — 마우스를 올리면(또는 눌러 초점을 주면) 말풍선으로 설명이 뜬다. */
const Info = ({ text }: { text: string }) => (
  <span className="info" tabIndex={0} aria-label={text} data-tip={text}>
    i
  </span>
);


/**
 * 이 표 전체를 한눈에 — 영웅을 고르기 전에 오른쪽에 뜬다.
 *
 * 카운터가 많은 영웅 · 적은 영웅 — +2 이상으로 이기는 상대가 많은 영웅. 꺼내기 조심스러운 픽.
 * 영웅을 누르면 그 영웅 줄로 넘어간다.
 */
function Summary({ sheet, onPick }: { sheet: Sheet | null; onPick: (h: HeroId) => void }) {
  const v = (a: HeroId, b: HeroId) => valueIn(sheet, a, b) ?? 0;
  const countered = HERO_IDS.map((h) => ({ h, n: HERO_IDS.filter((x) => x !== h && v(x, h) >= 2).length }));
  // 많은 순 · 적은 순. 같으면 이름순으로 고정해 순서가 안 흔들리게.
  const byName = (x: { h: HeroId }, y: { h: HeroId }) => HEROES[x.h].full.localeCompare(HEROES[y.h].full);
  const counters = [...countered].sort((x, y) => y.n - x.n || byName(x, y)).slice(0, 10);
  const safe = [...countered].sort((x, y) => x.n - y.n || byName(x, y)).slice(0, 10);

  const Hero = ({ h, score }: { h: HeroId; score: string }) => (
    <button type="button" className="sm-hero" onClick={() => onPick(h)} title={`${HEROES[h].full} 줄 보기`}>
      <img className="pic" src={portrait(h)} alt="" loading="lazy" decoding="async" />
      <span className="nm">{HEROES[h].ko}</span>
      <span className="sc">{score}</span>
    </button>
  );

  return (
    <div className="editor summary">
      <section className="sm-sec">
        <h3>
          카운터가 많은 영웅
          <Info text="+2 이상으로 이기는 상대 수 — 많을수록 꺼내기 조심스러워요" />
        </h3>
        <div className="sm-list">
          {counters.map(({ h, n }) => (
            <Hero key={h} h={h} score={`${n}명`} />
          ))}
        </div>
      </section>

      <section className="sm-sec">
        <h3>
          카운터가 적은 영웅
          <Info text="+2 이상으로 이기는 상대 수 — 적을수록 어디서든 꺼내기 편해요" />
        </h3>
        <div className="sm-list safe">
          {safe.map(({ h, n }) => (
            <Hero key={h} h={h} score={`${n}명`} />
          ))}
        </div>
      </section>
    </div>
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
