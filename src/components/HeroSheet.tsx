import { useEffect, useRef, type CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';
import { conflictOf } from '../data/conflicts';
import { namuUrl } from '../data/namu';
import { MATRIX, cellTone, signed } from '../lib/matrix';

interface Props {
  /** 펼쳐 볼 내 픽. null 이면 안 뜬다. */
  id: HeroId | null;
  /** 지금 적 팀. 이 안에 있는 영웅은 따로 표시한다. */
  enemies: HeroId[];
  onClose: () => void;
}

/** 위에서부터 센 순서. 0(중립)은 안 적힌 것과 같아서 빼고 맨 뒤에 따로 센다. */
const LEVELS: { v: number; label: string }[] = [
  { v: 3, label: '매우 유리' },
  { v: 2, label: '유리' },
  { v: 1, label: '약간 유리' },
  { v: -1, label: '약간 불리' },
  { v: -2, label: '불리' },
  { v: -3, label: '매우 불리' },
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
    const ids = HERO_IDS.filter((e) => row[e] === lv.v);
    return {
      ...lv,
      ids,
      byRole: ROLES.map((r) => ({
        role: r,
        ids: ids.filter((e) => HEROES[e].r === r.k),
      })).filter((x) => x.ids.length > 0),
    };
  }).filter((g) => g.ids.length > 0);

  const written = groups.reduce((n, g) => n + g.ids.length, 0);

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
            <span>
              {me.en} · 적 {written}명에 대해 적혀 있음
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="hs-close"
            aria-label="닫기"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="hs-body">
          {groups.map((g) => (
            <div className="hs-group" key={g.v}>
              <div className="hs-group-head">
                <span className={'hs-badge ' + cellTone(g.v)}>{signed(g.v)}</span>
                <span className="hs-label">{g.label}</span>
                <span className="hs-count">{g.ids.length}</span>
              </div>

              {g.byRole.map(({ role, ids }) => (
                <div className="hs-role" key={role.k}>
                  <div
                    className="hs-role-tag"
                    style={{ '--role': `var(--${role.k})` } as CSSProperties}
                  >
                    <span className="dot" />
                    {role.ko}
                  </div>

                  <div className="hs-list">
                    {ids.map((e) => {
                      const h = HEROES[e];
                      const picked = enemies.includes(e);
                      const clash = conflictOf(id, e);
                      return (
                        <span
                          key={e}
                          className={'hs-item' + (picked ? ' picked' : '')}
                          title={
                            h.full +
                            (picked ? ' · 지금 적 팀에 있음' : '') +
                            (clash ? ' · 두 문서가 서로 어긋난 짝' : '')
                          }
                          style={{ '--role': `var(--${h.r})` } as CSSProperties}
                        >
                          <img
                            className="pic"
                            src={portrait(e)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="nm">{h.ko}</span>
                          {clash ? <i className="hs-clash" aria-hidden="true" /> : null}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <p className="hs-foot">
            적 팀에 있는 영웅은 테두리로 표시했습니다. 모서리에 주황 표시가 있는
            짝은 두 문서가 서로 어긋나게 적어 둔 것입니다.
            <br />
            <a href={namuUrl(id)} target="_blank" rel="noreferrer">
              나무위키 {me.ko} 상성 절 열기
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
