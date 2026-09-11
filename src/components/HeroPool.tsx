import type { CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';

interface Props {
  picked: HeroId[];
  /** 지금 더 못 넣는 영웅. 팀이 다 찼거나 그 역할 자리가 다 찼을 때. */
  blocked: (id: HeroId) => boolean;
  onToggle: (id: HeroId) => void;
  /** 그 영웅의 상성 전체를 펼친다. */
  onInfo: (id: HeroId) => void;
}

export function HeroPool({ picked, blocked, onToggle, onInfo }: Props) {
  return (
    <section className="pool">
      <h2 className="head">적 영웅 고르기</h2>

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
                      className="tile"
                      style={{ '--role': `var(--${role.k})` } as CSSProperties}
                      aria-pressed={on}
                      disabled={!on && blocked(id)}
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
