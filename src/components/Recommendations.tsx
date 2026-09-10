import { useMemo, type CSSProperties } from 'react';
import { HEROES, ROLES, type HeroId } from '../data/heroes';
import { scaleFor, scoreAll, topByRole, worst, type Scored } from '../lib/score';

interface Props {
  enemies: HeroId[];
  onLit: (ids: HeroId[]) => void;
}

function Row({
  item,
  rank,
  scale,
  onLit,
}: {
  item: Scored;
  rank: number;
  scale: number;
  onLit: (ids: HeroId[]) => void;
}) {
  const h = HEROES[item.id];
  const negative = item.value < 0;

  // 같은 적이 good 과 ok 양쪽에 걸릴 수 있어서 한 번만 보여준다.
  const chips: { enemy: HeroId; hard: boolean }[] = [];
  for (const r of item.reasons) {
    const seen = chips.find((c) => c.enemy === r.enemy);
    if (seen) seen.hard ||= r.hard;
    else chips.push({ enemy: r.enemy, hard: r.hard });
  }

  return (
    <div
      className={
        'row' + (negative ? ' neg' : '') + (rank === 1 && !negative ? ' top' : '')
      }
      onMouseEnter={() => onLit(chips.map((c) => c.enemy))}
      onMouseLeave={() => onLit([])}
    >
      <div className="rank">{rank}</div>

      <div>
        <div className="name">{h.full}</div>
        {chips.length > 0 && (
          <div className="why">
            {chips.map((c) => (
              <span key={c.enemy} className={c.hard ? 'hard' : undefined}>
                {HEROES[c.enemy].ko}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="meter">
        <div className="track">
          <div
            className="fill"
            style={{
              width: `${Math.round(Math.min(1, Math.abs(item.value) / scale) * 100)}%`,
            }}
          />
        </div>
        <div className="num">
          {item.value > 0 ? '+' : ''}
          {item.value}
        </div>
      </div>
    </div>
  );
}

export function Recommendations({ enemies, onLit }: Props) {
  const scores = useMemo(() => scoreAll(enemies), [enemies]);
  const scale = scaleFor(enemies.length);
  const avoid = useMemo(() => worst(scores), [scores]);

  return (
    <aside className="rec" aria-live="polite">
      <h2 className="head">추천 픽</h2>

      {enemies.length === 0 ? (
        <div className="rec-empty">
          아래에서 적 영웅을 고르면 유리한 픽이 여기 나옵니다.
        </div>
      ) : (
        <>
          {ROLES.map((role) => {
            const list = topByRole(scores, role.k);
            if (list.length === 0) return null;
            return (
              <div className="block" key={role.k}>
                <div
                  className="block-head"
                  style={{ '--role': `var(--${role.k})` } as CSSProperties}
                >
                  <span className="dot" />
                  <span>{role.ko}</span>
                </div>
                {list.map((item, i) => (
                  <Row
                    key={item.id}
                    item={item}
                    rank={i + 1}
                    scale={scale}
                    onLit={onLit}
                  />
                ))}
              </div>
            );
          })}

          {avoid.length > 0 && (
            <div className="avoid">
              <div
                className="block-head"
                style={{ '--role': 'var(--bad)' } as CSSProperties}
              >
                <span className="dot" />
                <span>피해야 할 픽</span>
              </div>
              {avoid.map((item, i) => (
                <Row
                  key={item.id}
                  item={item}
                  rank={i + 1}
                  scale={scale}
                  onLit={onLit}
                />
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
