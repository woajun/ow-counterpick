import type { CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';

interface Props {
  picked: HeroId[];
  /** 그냥은 못 넣는 영웅 — 역할 자리가 찼다. 누르면 같은 역할의 마지막 영웅과 바뀐다. */
  blocked: (id: HeroId) => boolean;
  /** 아예 못 넣는 영웅 — 바꿀 상대도 없다. 이것만 누를 수 없게 한다. */
  locked?: (id: HeroId) => boolean;
  onToggle: (id: HeroId) => void;
  /** 그 영웅의 상성 전체를 펼친다. */
  onInfo: (id: HeroId) => void;
  /** 머리 글자. 조합 모드에서는 '우리 팀 영웅 고르기'. */
  title?: string;
}

export function HeroPool({ picked, blocked, locked, onToggle, onInfo, title = '적 영웅 고르기' }: Props) {
  return (
    <section className="pool">
      <h2 className="head">{title}</h2>

      <div className="cols">
        {ROLES.map((role) => {
          const ids = HERO_IDS.filter((id) => HEROES[id].r === role.k);
          return (
            <div key={role.k}>
              <div
                className="role-head"
                style={{ '--role': `var(--${role.k})` } as CSSProperties}
              >
                <span className="dot" />
                <span>{role.ko}</span>
              </div>

              <div className="tiles">
                {ids.map((id) => {
                  const h = HEROES[id];
                  const on = picked.includes(id);
                  return (
                    <div className="tile-wrap" key={id}>
                      {/* 고르지 않고 상성만 보고 싶을 때. 타일 자체는 고르는
                          버튼이라 따로 낸다. */}
                      <button
                        type="button"
                        className="tile-info"
                        aria-label={`${h.full} 상성 보기`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onInfo(id);
                        }}
                      >
                        i
                      </button>
                    <button
                      type="button"
                      className={'tile' + (!on && blocked(id) ? ' swap' : '')}
                      style={{ '--role': `var(--${role.k})` } as CSSProperties}
                      aria-pressed={on}
                      disabled={!on && !!locked?.(id)}
                      title={!on && blocked(id) ? `누르면 같은 역할 영웅과 바꿔요` : undefined}
                      onClick={() => onToggle(id)}
                    >
                      <img
                        className="pic"
                        src={portrait(id)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="ko">{h.ko}</span>
                      <span className="en">{h.en}</span>
                    </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
