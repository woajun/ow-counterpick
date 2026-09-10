import type { CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';

interface Props {
  picked: HeroId[];
  /** 지금 더 못 넣는 영웅. 팀이 다 찼거나 그 역할 자리가 다 찼을 때. */
  blocked: (id: HeroId) => boolean;
  onToggle: (id: HeroId) => void;
}

export function HeroPool({ picked, blocked, onToggle }: Props) {
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
                    <button
                      key={id}
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
