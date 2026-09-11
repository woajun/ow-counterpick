import { useMemo, useState, type CSSProperties } from 'react';
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

  // 좁은 화면에서는 아래에 붙는 시트가 된다. 접힌 채로도 1위 몇 개는
  // 보여야, 영웅을 고른 결과가 화면을 안 움직이고 그 자리에서 바뀐다.
  const [open, setOpen] = useState(false);
  // 전체를 볼 때는 역할마다 1위 하나씩 — 점수순으로 자르면 탱커만 셋이
  // 나오는 판이 생긴다. 한 역할만 볼 때는 그 안에서 셋.
  const peek = (
    role ? blocks.flatMap((b) => b.list).slice(0, 3) : blocks.map((b) => b.list[0])
  ).filter(Boolean);

  return (
    <aside className={'rec' + (open ? ' open' : '')} aria-live="polite">
      <button
        type="button"
        className="sheet-handle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="caret" aria-hidden="true">
          {open ? '▾' : '▴'}
        </span>
        <span className="lbl">추천</span>
        <span className="peek">
          {peek.length === 0 ? (
            <i>적을 고르면 여기에 나옵니다</i>
          ) : (
            peek.map((it) => (
              <span
                key={it.id}
                className="pk"
                style={
                  { '--role': `var(--${HEROES[it.id].r})` } as CSSProperties
                }
              >
                <img
                  className="pic"
                  src={portrait(it.id)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className="nm">{HEROES[it.id].ko}</span>
                <b>
                  {it.value > 0 ? '+' : ''}
                  {it.value}
                </b>
              </span>
            ))
          )}
        </span>
      </button>

      <div className="rec-body">
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
      </div>
    </aside>
  );
}
