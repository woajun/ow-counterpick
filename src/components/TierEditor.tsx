import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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
/** 나무위키 기본 · 모두 빼기 때 한 명씩 옮기는 간격. 53명이면 3초 남짓. */
const STEP_MS = 90;
/** 한 명이 날아가는 시간. */
const FLY_MS = 480;

/**
 * 티어로 매기기 — 고른 영웅에 대해 나머지 영웅을 −3 … +3 줄로 끌어다 놓는다(티어 메이커처럼).
 *
 * 맨 아래 "미정" 은 적힌 것 없음. 상성은 반대 칸도 부호를 뒤집어 같이 바뀌고(수정 화면 목록과 같다),
 * 궁합은 방향이 없다. "나무위키 기본" 은 나무위키 값으로 한 명씩 날아가 꽂히는 것을 보여 준다.
 *
 * 끌기는 마우스 · 터치 모두 pointer 이벤트로 한다 — HTML 드래그는 터치에서 안 된다.
 */
export function TierEditor({
  id,
  syn,
  edit,
}: {
  id: HeroId;
  syn: boolean;
  /** 칸을 고칠 때 감싸는 함수 — 나무위키에서 떨어져 나오는 순간 안내를 띄운다. */
  edit: (fn: () => void) => void;
}) {
  const sheet = useMySheet();
  const others = HERO_IDS.filter((e) => e !== id);
  const valueOf = (e: HeroId): number | null =>
    syn ? sheet.mySyn(id, e) : sheet.blank(id, e) ? null : sheet.matrix[id][e];
  const namuOf = (e: HeroId): number | null => (syn ? (SYNERGY[id]?.[e] ?? null) : namuValue(id, e));
  const place = (e: HeroId, v: number | null) =>
    edit(() => {
      if (v === null) (syn ? clearSynergy : clearPair)(id, e);
      else (syn ? setSynergy : setPair)(id, e, v);
    });
  const label = syn ? SYN_LABEL : COUNTER_LABEL;

  // ── 끌기 ──
  const [drag, setDrag] = useState<{ e: HeroId; x: number; y: number; dx: number; dy: number } | null>(null);
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
      const t = tierAt(ev.clientX, ev.clientY);
      const next = t === null ? undefined : t === 'none' ? null : Number(t);
      if (next !== undefined && next !== valueOf(drag.e)) {
        dropped.current = drag.e; // 놓은 자리에 바로 — 옛 자리에서 날아오는 움직임은 빼고
        place(drag.e, next);
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
      // 아직 날아가는 다른 얼굴은 그대로 둔다 — 끊으면 한 명씩 꽂히는 흐름이 깨진다.
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

  // ── 나무위키 기본 · 모두 빼기 — 한 명씩 차례로 옮겨서 꽂히는 것을 보여 준다 ──
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    // 다른 영웅으로 바꾸면 하던 것을 멈춘다.
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
  }, [id, syn]);
  const run = (target: (e: HeroId) => number | null) => {
    // 높은 줄부터 채운다 — 카드를 위에서부터 나눠 주듯.
    const order = (v: number | null) => (v === null ? 99 : -v);
    const todo = others
      .filter((e) => valueOf(e) !== target(e))
      .sort((a, b) => order(target(a)) - order(target(b)));
    if (todo.length === 0) return;
    setRunning(true);
    timers.current = todo.map((e, i) => window.setTimeout(() => place(e, target(e)), i * STEP_MS));
    timers.current.push(window.setTimeout(() => setRunning(false), todo.length * STEP_MS + FLY_MS));
  };

  const rows: { key: string; v: number | null }[] = [...TIERS.map((v) => ({ key: String(v), v })), { key: 'none', v: null }];

  return (
    <div className={'tier' + (drag ? ' dragging' : '')} ref={box}>
      <div className="tier-tools">
        <span className="tier-hint">얼굴을 끌어다 줄에 놓아요</span>
        <button type="button" className="reset small" disabled={running} onClick={() => run(() => null)}>
          모두 빼기
        </button>
        <button type="button" className="reset small tier-namu" disabled={running} onClick={() => run(namuOf)}>
          나무위키 기본
        </button>
      </div>
      {rows.map(({ key, v }) => {
        const list = others.filter((e) => valueOf(e) === v);
        return (
          <div key={key} className={'tier-row' + (over === key ? ' over' : '')} data-tier={key}>
            <div className={'tier-label ' + (v === null ? 'none' : cellTone(v) || 'zero')}>
              <b>{v === null ? '미정' : v === 0 ? '0' : signed(v)}</b>
              <span>{v === null ? (syn ? '평가 없음' : '적힌 것 없음') : label[v]}</span>
            </div>
            <div className="tier-drop">
              {list.map((e) => (
                <button
                  key={e}
                  type="button"
                  data-k={e}
                  className={'tier-face' + (drag?.e === e ? ' lifted' : '')}
                  title={HEROES[e].full}
                  aria-label={`${HEROES[e].ko} — 끌어서 옮기기`}
                  disabled={running}
                  onPointerDown={(ev) => {
                    if (ev.button !== 0) return;
                    ev.preventDefault();
                    const r = ev.currentTarget.getBoundingClientRect();
                    setDrag({ e, x: ev.clientX, y: ev.clientY, dx: ev.clientX - r.left, dy: ev.clientY - r.top });
                    setOver(key);
                  }}
                >
                  <img src={portrait(e)} alt="" draggable={false} decoding="async" />
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {/* 손가락 · 마우스를 따라다니는 얼굴 */}
      {drag && (
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
