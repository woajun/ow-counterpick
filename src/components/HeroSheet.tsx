import { useEffect, useRef, type CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';
import { namuUrl } from '../data/namu';
import { MATRIX, cellTone, signed } from '../lib/matrix';
import { isNeutral } from '../data/neutral';
import { isInferred } from '../data/inferred';
import wikiIcon from '../assets/wiki.svg';

interface Props {
  /** 펼쳐 볼 내 픽. null 이면 안 뜬다. */
  id: HeroId | null;
  /** 지금 고른 적 팀. 있으면 맨 위에 "이 조합 상대로 어떤지" 를 먼저 보여 준다. */
  enemies: HeroId[];
  onClose: () => void;
}

/**
 * 유리한 쪽부터 불리한 쪽으로.
 *
 * 0 은 둘로 갈린다. "중립이라 적어 둔 것"은 판단이 있는 것이라 눈금 그대로
 * 가운데에 두고, "아예 안 적힌 것"은 등급이 아니라 자료가 없는 것이라 맨
 * 뒤로 뺀다. 둘을 한 묶음에 넣으면 571개와 106개가 섞여 버린다.
 */
type Kind = 'scored' | 'neutral' | 'blank';

const LEVELS: { v: number; label: string; kind: Kind }[] = [
  { v: 3, label: '매우 유리', kind: 'scored' },
  { v: 2, label: '유리', kind: 'scored' },
  { v: 1, label: '약간 유리', kind: 'scored' },
  { v: 0, label: '중립', kind: 'neutral' },
  { v: -1, label: '약간 불리', kind: 'scored' },
  { v: -2, label: '불리', kind: 'scored' },
  { v: -3, label: '매우 불리', kind: 'scored' },
  { v: 0, label: '적힌 것 없음', kind: 'blank' },
];

/**
 * 내 픽 하나가 적 전체를 상대로 어떤지 한 장에 편다.
 *
 * 추천 줄은 "지금 고른 적 조합"에 대한 점수만 보여 준다. 그 영웅을 실제로
 * 꺼낼지 정하려면 아직 안 나온 적한테도 통하는지가 궁금해진다.
 */
export function HeroSheet({ id, enemies, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!id) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // 뒤쪽 화면이 같이 스크롤되면 어디를 보고 있었는지 잃는다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [id, onClose]);

  if (!id) return null;

  const me = HEROES[id];
  const row = MATRIX[id];
  // 한 묶음에 열일곱 명까지 들어간다. 역할로 한 번 더 갈라야 눈에 들어온다.
  const groups = LEVELS.map((lv) => {
    // 자기 자신은 뺀다. 0 묶음에 제가 끼어 있으면 이상하다.
    const ids = HERO_IDS.filter((e) => {
      if (e === id || row[e] !== lv.v) return false;
      if (lv.kind === 'neutral') return isNeutral(id, e);
      if (lv.kind === 'blank') return !isNeutral(id, e);
      return true;
    });
    return {
      ...lv,
      ids,
      // 빈 역할도 칸을 남긴다. 줄이 어긋나면 3열로 나눈 뜻이 없다.
      byRole: ROLES.map((r) => ({
        role: r,
        ids: ids.filter((e) => HEROES[e].r === r.k),
      })),
    };
  }).filter((g) => g.ids.length > 0);

  return (
    <div
      className="sheet-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hero-sheet" role="dialog" aria-modal="true" aria-label={`${me.full} 상성`}>
        <div className="hs-head" style={{ '--role': `var(--${me.r})` } as CSSProperties}>
          <img className="pic" src={portrait(id)} alt="" decoding="async" />
          <div className="hs-name">
            <b>{me.full}</b>
            <span>{me.en}</span>
          </div>
          {/* 값이 이상하면 여기가 고칠 자리다. 이 도구는 옮겨 적은 사본이다. */}
          <a
            className="hs-icon hs-wiki"
            href={namuUrl(id)}
            target="_blank"
            rel="noreferrer"
            aria-label={`나무위키 ${me.full} 상성 절 열기`}
            title="나무위키 상성 절 열기"
          >
            <img src={wikiIcon} alt="" />
          </a>
          <button
            ref={closeRef}
            type="button"
            className="hs-icon hs-close"
            aria-label="닫기"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="hs-body">
          {enemies.length > 0 && <VersusNow id={id} enemies={enemies} />}

          {/* 역할 머리는 여기 한 번만. 등급 묶음마다 달면 일곱 번 반복된다.
              스크롤해도 붙어 있어서 아래로 내려가도 어느 칸인지 안 잃는다. */}
          <div className="hs-colhead">
            {ROLES.map((r) => (
              <div
                key={r.k}
                style={{ '--role': `var(--${r.k})` } as CSSProperties}
              >
                <span className="dot" />
                {r.ko}
              </div>
            ))}
          </div>

          {groups.map((g) => (
            <div className="hs-group" key={g.label}>
              <div className="hs-group-head">
                <span
                  className={
                    'hs-badge ' +
                    (cellTone(g.v) || (g.kind === 'blank' ? 'blank' : 'zero'))
                  }
                >
                  {g.kind === 'blank' ? '—' : signed(g.v)}
                </span>
                <span className="hs-label">{g.label}</span>
              </div>

              <div className="hs-cols">
                {g.byRole.map(({ role, ids }) => (
                  <div
                    className="hs-col"
                    key={role.k}
                    style={{ '--role': `var(--${role.k})` } as CSSProperties}
                  >
                    {ids.length === 0 ? (
                      <span className="hs-none">-</span>
                    ) : (
                      ids.map((e) => {
                        const h = HEROES[e];
                        return (
                          <span
                            key={e}
                            className={
                              'hs-item' + (isInferred(id, e) ? ' guessed' : '')
                            }
                            title={
                              h.full +
                              (isInferred(id, e)
                                ? ` · ${h.full} 문서 쪽 기록을 뒤집어 매긴 값`
                                : '')
                            }
                          >
                            <img
                              className="pic"
                              src={portrait(e)}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                            <span className="nm">{h.ko}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

/** 평균 한 칸 점수로 붙이는 한마디. 합만 보면 적이 많을수록 커져서 감이 안 온다. */
const verdict = (avg: number) =>
  avg >= 1.5 ? '유리' : avg >= 0.5 ? '약간 유리' : avg > -0.5 ? '비슷' : avg > -1.5 ? '약간 불리' : '불리';

/**
 * 지금 고른 적 팀 상대로 — 시트 맨 위.
 *
 * 시트 아래쪽은 "아직 안 나온 적까지 포함한 전체 상성" 이다. 그런데 i 를 누르는 순간의
 * 질문은 대개 "지금 이 조합 상대로 내 영웅이 어떤가" 라서, 그 답을 먼저 둔다.
 * 합은 추천 줄의 점수(scoreAll)와 같은 값이다 — 둘이 다르면 어느 쪽을 믿을지 모른다.
 */
function VersusNow({ id, enemies }: { id: HeroId; enemies: HeroId[] }) {
  const row = MATRIX[id];
  const total = enemies.reduce((a, e) => a + row[e], 0);
  const avg = total / enemies.length;
  const tone = cellTone(Math.max(-3, Math.min(3, Math.round(avg))));
  const up = enemies.filter((e) => row[e] > 0).length;
  const down = enemies.filter((e) => row[e] < 0).length;
  const blank = enemies.filter((e) => row[e] === 0 && !isNeutral(id, e)).length;

  return (
    <section className="hs-now" aria-label="지금 적 팀 상대 상성">
      <div className="hs-now-head">
        <span className="hs-now-title">지금 적 팀 상대</span>
        <span className={'hs-badge hs-now-total ' + (tone || 'zero')}>{signed(total)}</span>
        <span className="hs-now-verdict">{verdict(avg)}</span>
        <span className="hs-now-count">
          유리 {up} · 불리 {down}
          {blank > 0 && ` · 기록 없음 ${blank}`}
        </span>
      </div>
      <div className="hs-now-list">
        {enemies.map((e) => {
          const v = row[e];
          const none = v === 0 && !isNeutral(id, e);
          return (
            <span
              key={e}
              className={'hs-now-item' + (isInferred(id, e) ? ' guessed' : '')}
              title={HEROES[e].full + (isInferred(id, e) ? ` · ${HEROES[e].full} 문서 쪽 기록을 뒤집어 매긴 값` : '')}
            >
              <img className="pic" src={portrait(e)} alt="" decoding="async" />
              <span className="nm">{HEROES[e].ko}</span>
              <span className={'hs-badge ' + (none ? 'blank' : cellTone(v) || 'zero')}>{none ? '—' : signed(v)}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
