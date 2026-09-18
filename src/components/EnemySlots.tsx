import type { CSSProperties } from 'react';
import { HEROES, ROLES, portrait, type HeroId } from '../data/heroes';
import { LIMITS, arrange, countRole, type TeamSize } from '../lib/roster';

interface Props {
  enemies: HeroId[];
  size: TeamSize;
  /** 추천 줄에 마우스를 올렸을 때 근거가 된 적만 테두리를 켠다. */
  lit: HeroId[];
  onRemove: (id: HeroId) => void;
  onReset: () => void;
}

export function EnemySlots({
  enemies,
  size,
  lit,
  onRemove,
  onReset,
}: Props) {
  const slots = arrange(enemies, size);

  return (
    <section className="enemy">
      <h2 className="head">
        적 팀
        <span className="n">
          {enemies.length} / {size}
        </span>
        {/* 6v6 은 빈 자리에 역할이 안 적히니 탱커 수만 따로 보여 준다. */}
        {size === 6 && (
          <span
            className={
              'n' + (countRole(enemies, 'tank') >= LIMITS[6].tank ? ' max' : '')
            }
          >
            탱커 {countRole(enemies, 'tank')} / {LIMITS[6].tank}
          </span>
        )}
      </h2>

      {/* 칸 수를 격자에 그대로 넘긴다. flex 로 나누면 안쪽 글자 폭 때문에
          좁은 화면에서 마지막 칸이 밀려 나간다. */}
      <div className="slots" style={{ '--n': size } as CSSProperties}>
        {/* 비우는 대상과 같은 높이로, 맨 앞에. 머리줄에 작게 달려 있을 때는
            있는 줄도 몰랐다. */}
        <button
          type="button"
          className="wipe"
          disabled={enemies.length === 0}
          onClick={onReset}
        >
          <span className="x" aria-hidden="true">
            ✕
          </span>
          <span className="lbl">초기화</span>
        </button>

        {slots.map((slot, i) => {
          if (!slot.id) {
            const role = slot.role && ROLES.find((r) => r.k === slot.role);
            return (
              <div
                key={`empty-${i}`}
                className="slot empty"
                style={
                  slot.role
                    ? ({ '--role': `var(--${slot.role})` } as CSSProperties)
                    : undefined
                }
              >
                {role ? <span className="want">{role.ko}</span> : '비어 있음'}
              </div>
            );
          }
          const h = HEROES[slot.id];
          const id = slot.id;
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
              <img className="pic" src={portrait(id)} alt="" decoding="async" />
              {/* 좁은 화면에서는 줄인 이름으로 바꾼다 — 66px 칸에
                  "위도우메이커"를 넣으면 잘려서 못 읽는다. */}
              <span className="ko">{h.full}</span>
              <span className="ko short">{h.ko}</span>
              <span className="en">{h.en}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
