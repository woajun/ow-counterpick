import type { CSSProperties } from 'react';
import { HEROES, type HeroId } from '../data/heroes';
import type { TeamSize } from '../lib/useTeam';

interface Props {
  enemies: HeroId[];
  size: TeamSize;
  demo: boolean;
  /** 추천 줄에 마우스를 올렸을 때 근거가 된 적만 테두리를 켠다. */
  lit: HeroId[];
  onRemove: (id: HeroId) => void;
}

export function EnemySlots({ enemies, size, demo, lit, onRemove }: Props) {
  const slots = Array.from({ length: size }, (_, i) => enemies[i]);

  return (
    <section className="enemy">
      <h2 className="head">
        적 팀
        <span className="n">
          {enemies.length} / {size}
        </span>
        {demo && <span className="tag">예시</span>}
      </h2>

      <div className="slots">
        {slots.map((id, i) => {
          if (!id) {
            return (
              <div key={`empty-${i}`} className="slot empty">
                비어 있음
              </div>
            );
          }
          const h = HEROES[id];
          return (
            <button
              key={id}
              type="button"
              className={'slot filled' + (lit.includes(id) ? ' lit' : '')}
              style={{ '--role': `var(--${h.r})` } as CSSProperties}
              aria-label={`${h.full} 빼기`}
              onClick={() => onRemove(id)}
            >
              <span className="x" aria-hidden="true">
                ✕
              </span>
              <span className="ko">{h.full}</span>
              <span className="en">{h.en}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
