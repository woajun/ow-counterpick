import { useMemo, type CSSProperties } from 'react';
import { HEROES, ROLES, portrait, type HeroId } from '../data/heroes';
import { useRoleFilter } from '../lib/useRoleFilter';
import { scaleFor, scoreAll, topByRole, worst, type Scored } from '../lib/score';
import { cellTone } from '../lib/matrix';

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

  // 적 하나가 얹는 점수는 하나뿐이라 그대로 쓴다. 센 근거부터 정렬돼 있다.
  const chips = item.reasons;

  return (
    <div
      className={
        'row' + (negative ? ' neg' : '') + (rank === 1 && !negative ? ' top' : '')
      }
      onMouseEnter={() => onLit(chips.map((c) => c.enemy))}
      onMouseLeave={() => onLit([])}
    >
      <div className="rank">{rank}</div>

      <img
        className="pic"
        src={portrait(item.id)}
        alt=""
        loading="lazy"
        decoding="async"
      />

      <div>
        <div className="name">{h.full}</div>
        {chips.length > 0 && (
          <div className="why">
            {chips.map((c) => (
              <span key={c.enemy} className={cellTone(c.level)}>
                {HEROES[c.enemy].ko}
                <b>
                  {c.level > 0 ? '+' : '−'}
                  {Math.abs(c.level)}
                </b>
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
  const [role, setRole] = useRoleFilter();
  const scores = useMemo(() => scoreAll(enemies), [enemies]);
  const scale = scaleFor(enemies.length);

  // 한 역할만 볼 때는 자리가 남으니 더 깊이 보여 준다.
  const limit = role ? 8 : 4;
  const shown = role ? ROLES.filter((r) => r.k === role) : ROLES;
  const avoid = useMemo(
    () => worst(scores, limit, role),
    [scores, limit, role],
  );

  const blocks = shown
    .map((r) => ({ role: r, list: topByRole(scores, r.k, limit) }))
    .filter((b) => b.list.length > 0);

  return (
    <aside className="rec" aria-live="polite">
      <h2 className="head">
        추천 픽
        <div className="spacer" />
        <div className="seg small" role="group" aria-label="역할 고르기">
          <button
            type="button"
            aria-pressed={role === null}
            onClick={() => setRole(null)}
          >
            전체
          </button>
          {ROLES.map((r) => (
            <button
              key={r.k}
              type="button"
              aria-pressed={role === r.k}
              onClick={() => setRole(r.k)}
            >
              {r.ko}
            </button>
          ))}
        </div>
      </h2>

      {enemies.length === 0 ? (
        <div className="rec-empty">
          아래에서 적 영웅을 고르면 유리한 픽이 여기 나옵니다.
        </div>
      ) : blocks.length === 0 && avoid.length === 0 ? (
        <div className="rec-empty">
          이 조합에서 유리하다고 적힌 {role ? `${ROLES.find((r) => r.k === role)?.ko} ` : ''}
          픽이 없습니다.
        </div>
      ) : (
        <>
          {blocks.map(({ role: r, list }) => (
            <div className="block" key={r.k}>
              <div
                className="block-head"
                style={{ '--role': `var(--${r.k})` } as CSSProperties}
              >
                <span className="dot" />
                <span>{r.ko}</span>
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
          ))}

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
