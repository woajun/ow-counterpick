import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { HEROES, HERO_IDS, portrait, type HeroId } from '../data/heroes';
import { SYNERGY, SYN_LABEL } from '../data/synergy';
import { COUNTER_LABEL, cellTone, signed } from '../lib/matrix';
import {
  clearPair,
  clearSynergy,
  namuValue,
  setPair,
  setSynergy,
  useMySheet,
} from '../lib/mySheet';

const TIERS = [3, 2, 1, 0, -1, -2, -3];
/** 한 명이 날아가는 시간. */
const FLY_MS = 480;

/**
 * 티어로 매기기 — 고른 영웅에 대해 나머지 영웅을 −3 … +3 줄로 끌어다 놓는다(티어 메이커처럼).
 *
 * 맨 아래 "미정" 은 적힌 것 없음. 상성은 반대 칸도 부호를 뒤집어 같이 바뀌고(수정 화면 목록과 같다),
 * 궁합은 방향이 없다. "나무위키 기본" 은 나무위키 값으로 한꺼번에 날아가 꽂히는 것을 보여 준다.
 *
 * 끌기는 마우스 · 터치 모두 pointer 이벤트로 한다 — HTML 드래그는 터치에서 안 된다.
 */
export function TierEditor({
  id,
  syn,
  edit,
  note,
}: {
  id: HeroId;
  syn: boolean;
  /** 얼굴을 짧게 누르면(끌지 않고) 그 줄 아래에 펼칠 것 — 칸 설명 쓰기. */
  note?: (e: HeroId) => ReactNode;
  /** 칸을 고칠 때 감싸는 함수 — 나무위키에서 떨어져 나오는 순간 안내를 띄운다. */
  edit: (fn: () => void) => void;
}) {
  const sheet = useMySheet();
  /**
   * 손으로 옮기면 반대쪽 줄도 같이 바뀐다 — 상성은 부호를 뒤집어, 궁합은 같은 값으로.
   * 애쉬 줄에서 제트팩캣을 옮기면 제트팩캣 줄의 애쉬도 바뀌는데, 화면엔 안 보이니 알림으로 알린다.
   */
  const [shown, setMirror] = useState<{ e: HeroId; v: number | null; n: number; at: string } | null>(null);
  // 다른 영웅 · 탭으로 넘어가면 숨긴다 — 그 알림은 앞 화면 이야기다.
  const at = id + (syn ? ':syn' : '');
  const mirror = shown?.at === at ? shown : null;
  useEffect(() => {
    if (!mirror) return;
    const t = setTimeout(() => setMirror(null), 3500);
    return () => clearTimeout(t);
  }, [mirror]);
  const label = syn ? SYN_LABEL : COUNTER_LABEL;
  const mv = mirror && (mirror.v === null ? null : syn ? mirror.v : -mirror.v || 0);
  return (
    <>
    <TierBoard
      resetKey={id + (syn ? ':syn' : '')}
      items={HERO_IDS.filter((e) => e !== id)}
      valueOf={(e) => (syn ? sheet.mySyn(id, e) : sheet.blank(id, e) ? null : sheet.matrix[id][e])}
      namuOf={(e) => (syn ? (SYNERGY[id]?.[e] ?? null) : namuValue(id, e))}
      place={(e, v) =>
        edit(() => {
          if (v === null) (syn ? clearSynergy : clearPair)(id, e);
          else (syn ? setSynergy : setPair)(id, e, v);
        })
      }
      label={syn ? SYN_LABEL : COUNTER_LABEL}
      noneLabel={syn ? '평가 없음' : '적힌 것 없음'}
      note={note}
      onDrop={(e, v) => setMirror((m) => ({ e, v, n: (m?.n ?? 0) + 1, at }))}
    />
    {mirror && (
      <div className="toast tier-toast" role="status" key={mirror.n}>
        <img className="pic" src={portrait(mirror.e)} alt="" />
        <span>
          {syn ? '궁합은 서로 같아요' : '반대쪽도 같이 바뀌었어요'} — <b>{HEROES[mirror.e].ko}</b> 줄의{' '}
          <b>{HEROES[id].ko}</b>:{' '}
          <b className={'tier-toast-v ' + (mv === null ? '' : cellTone(mv) || 'zero')}>
            {mv === null ? (syn ? '평가 없음' : '미정') : `${mv === 0 ? '0' : signed(mv)} ${label[mv]}`}
          </b>
        </span>
        <button type="button" className="toast-x" aria-label="닫기" onClick={() => setMirror(null)}>
          ✕
        </button>
      </div>
    )}
    </>
  );
}

/**
 * 티어 판 — 영웅 얼굴을 −3 … +3 줄과 "미정" 줄에 끌어다 놓는다. 무엇의 점수인지는 부르는 쪽이 정한다
 * (상성 · 궁합 — TierEditor, 맵 — MapEditor). `namuOf` 를 주면 "나무위키 기본" 단추가 생긴다.
 */
export function TierBoard({
  items,
  valueOf,
  place,
  namuOf,
  label,
  noneLabel,
  note,
  resetKey,
  onDrop,
}: {
  items: HeroId[];
  valueOf: (e: HeroId) => number | null;
  place: (e: HeroId, v: number | null) => void;
  namuOf?: (e: HeroId) => number | null;
  /** 줄 이름 — 매우 유리 · 찰떡 궁합 · 매우 좋음 … */
  label: Record<number, string>;
  /** "미정" 줄 아래 작은 글씨. */
  noneLabel: string;
  note?: (e: HeroId) => ReactNode;
  /** 바뀌면 하던 움직임 · 펼친 설명을 접는다 — 다른 영웅 · 다른 맵으로 넘어갔을 때. */
  resetKey: string;
  /** 손으로 끌어다 놓았을 때만 — 나무위키 기본 · 모두 빼기로 옮길 때는 부르지 않는다. */
  onDrop?: (e: HeroId, v: number | null) => void;
}) {
  const others = items;

  // ── 끌기 ──
  const [drag, setDrag] = useState<{
    e: HeroId;
    x: number;
    y: number;
    dx: number;
    dy: number;
    /** 누른 자리 — 거의 안 움직이고 떼면 끌기가 아니라 누르기(설명 열기)다. */
    x0: number;
    y0: number;
  } | null>(null);
  /** 설명을 펼친 얼굴. */
  const [noteFor, setNoteFor] = useState<HeroId | null>(null);
  // 설명 칸 바깥을 누르면 닫는다(쓴 것은 칸이 닫히며 저장된다). 얼굴을 누르는 것은 끌기 · 열기가 맡는다.
  useEffect(() => {
    if (!noteFor) return;
    const down = (ev: PointerEvent) => {
      const t = ev.target as Element | null;
      if (t?.closest('.tier-row-note') || t?.closest('.tier-face')) return;
      setNoteFor(null);
    };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, [noteFor]);
  const [over, setOver] = useState<string | null>(null);
  const tierAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest('[data-tier]') as HTMLElement | null)?.dataset.tier ?? null;
  const dropped = useRef<HeroId | null>(null);

  useEffect(() => {
    if (!drag) return;
    const move = (ev: PointerEvent) => {
      setDrag((d) => d && { ...d, x: ev.clientX, y: ev.clientY });
      setOver(tierAt(ev.clientX, ev.clientY));
    };
    const up = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - drag.x0, ev.clientY - drag.y0) < 5) {
        // 누르기 — 설명을 열고 닫는다.
        setNoteFor((cur) => (cur === drag.e ? null : drag.e));
        setDrag(null);
        setOver(null);
        return;
      }
      const t = tierAt(ev.clientX, ev.clientY);
      const next = t === null ? undefined : t === 'none' ? null : Number(t);
      if (next !== undefined && next !== valueOf(drag.e)) {
        dropped.current = drag.e; // 놓은 자리에 바로 — 옛 자리에서 날아오는 움직임은 빼고
        place(drag.e, next);
        onDrop?.(drag.e, next);
      }
      setDrag(null);
      setOver(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // valueOf · place 는 매번 새 함수다 — 끄는 동안 바뀌는 것은 drag 뿐이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.e]);

  // ── 줄을 옮긴 얼굴만 옛 자리에서 새 자리로 날아간다(FLIP) ──
  // 한 명이 빠지거나 끼면 같은 줄의 나머지도 한 칸씩 밀리는데, 그것까지 움직이면 줄 전체가
  // 출렁여서 누가 옮겨졌는지 안 보인다. 그래서 줄이 바뀐 얼굴만 움직이고 나머지는 바로 제자리.
  const box = useRef<HTMLDivElement>(null);
  const rects = useRef(new Map<string, DOMRect>());
  const tiers = useRef(new Map<string, string>());
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const nextRects = new Map<string, DOMRect>();
    const nextTiers = new Map<string, string>();
    el.querySelectorAll<HTMLElement>('[data-k]').forEach((face) => {
      const k = face.dataset.k!;
      const tier = (face.closest('[data-tier]') as HTMLElement).dataset.tier!;
      // 줄이 바뀐 얼굴은 새 줄에서 새로 그려진 것이라 변환 없이 도착 자리가 잡힌다.
      // 아직 날아가는 다른 얼굴은 그대로 둔다 — 끊으면 움직임이 툭 끊긴다.
      const r = face.getBoundingClientRect();
      nextRects.set(k, r);
      nextTiers.set(k, tier);
      const prevTier = tiers.current.get(k);
      const prev = rects.current.get(k);
      if (!prev || prevTier === undefined || prevTier === tier || dropped.current === k) return;
      const dx = prev.left - r.left;
      const dy = prev.top - r.top;
      face.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(1)`, zIndex: 50 },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(1.18)`, zIndex: 50, offset: 0.5 },
          { transform: 'none', zIndex: 50 },
        ],
        { duration: FLY_MS, easing: 'cubic-bezier(.3, .7, .2, 1)' },
      );
    });
    rects.current = nextRects;
    tiers.current = nextTiers;
    dropped.current = null;
  });

  // ── 나무위키 기본 · 모두 빼기 — 옮길 얼굴이 한꺼번에 날아간다 ──
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    // 다른 영웅으로 바꾸면 하던 것을 멈춘다.
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
    setNoteFor(null);
  }, [resetKey]);
  const run = (target: (e: HeroId) => number | null) => {
    // 한 번에 다 옮긴다 — 한 번 그려지면 옮겨진 얼굴이 모두 같이 제자리로 날아간다.
    const todo = others.filter((e) => valueOf(e) !== target(e));
    if (todo.length === 0) return;
    setRunning(true);
    todo.forEach((e) => place(e, target(e)));
    timers.current = [window.setTimeout(() => setRunning(false), FLY_MS)];
  };

  const rows: { key: string; v: number | null }[] = [...TIERS.map((v) => ({ key: String(v), v })), { key: 'none', v: null }];

  return (
    <div className={'tier' + (drag ? ' dragging' : '')} ref={box}>
      <div className="tier-tools">
        <span className="tier-hint">얼굴을 끌어다 줄에 놓아요</span>
        <button type="button" className="reset small" disabled={running} onClick={() => run(() => null)}>
          모두 빼기
        </button>
        {namuOf && (
          <button type="button" className="reset small tier-namu" disabled={running} onClick={() => run(namuOf)}>
            나무위키 기본
          </button>
        )}
      </div>
      {rows.map(({ key, v }) => {
        const list = others.filter((e) => valueOf(e) === v);
        return (
          <div key={key} className={'tier-row' + (over === key ? ' over' : '')} data-tier={key}>
            <div className={'tier-label ' + (v === null ? 'none' : cellTone(v) || 'zero')}>
              <b>{v === null ? '미정' : v === 0 ? '0' : signed(v)}</b>
              <span>{v === null ? noneLabel : label[v]}</span>
            </div>
            <div className="tier-drop">
              {list.map((e) => (
                <button
                  key={e}
                  type="button"
                  data-k={e}
                  className={
                    'tier-face' +
                    (drag?.e === e && (drag.x !== drag.x0 || drag.y !== drag.y0) ? ' lifted' : '') +
                    (noteFor === e ? ' on' : '')
                  }
                  title={`${HEROES[e].full} — 끌어서 옮기기 · 눌러서 설명 쓰기`}
                  aria-label={`${HEROES[e].ko} — 끌어서 옮기기, 눌러서 설명 쓰기`}
                  disabled={running}
                  onPointerDown={(ev) => {
                    if (ev.button !== 0) return;
                    ev.preventDefault();
                    const r = ev.currentTarget.getBoundingClientRect();
                    setDrag({
                      e,
                      x: ev.clientX,
                      y: ev.clientY,
                      dx: ev.clientX - r.left,
                      dy: ev.clientY - r.top,
                      x0: ev.clientX,
                      y0: ev.clientY,
                    });
                    setOver(key);
                  }}
                >
                  <img src={portrait(e)} alt="" draggable={false} decoding="async" />
                </button>
              ))}
            </div>
            {/* 이 줄에서 누른 얼굴의 설명 쓰기 — 줄 전체 폭으로 */}
            {note && noteFor && list.includes(noteFor) && <div className="tier-row-note">{note(noteFor)}</div>}
          </div>
        );
      })}
      {/* 손가락 · 마우스를 따라다니는 얼굴 */}
      {drag && (drag.x !== drag.x0 || drag.y !== drag.y0) && (
        <img
          className="tier-ghost"
          src={portrait(drag.e)}
          alt=""
          style={{ left: drag.x - drag.dx, top: drag.y - drag.dy } as CSSProperties}
        />
      )}
    </div>
  );
}
