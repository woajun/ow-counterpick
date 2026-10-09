import { useMemo, useState, type CSSProperties } from 'react';
import { HEROES, ROLES, portrait, type HeroId } from '../data/heroes';
import { useRoleFilter } from '../lib/useRoleFilter';
import { scaleFor, scoreAll, scoreCombo, topByRole, worst, type Scored } from '../lib/score';
import { COMBO_ENABLED, type Mode } from '../lib/useMode';
import type { TeamSize } from '../lib/roster';
import { cellTone } from '../lib/matrix';

interface Props {
  /** 카운터 — 적 조합에 유리한 픽. 조합 — 우리 팀에 어울리는 픽. */
  mode: Mode;
  onMode: (m: Mode) => void;
  /** 지금 모드의 팀 — 카운터면 적 팀, 조합이면 우리 팀. */
  team: HeroId[];
  size: TeamSize;
  onLit: (ids: HeroId[]) => void;
  /** 그 영웅의 상성 전체를 펼친다. 모달은 화면 쪽에서 그린다. */
  onInfo: (id: HeroId) => void;
}

function Row({
  item,
  rank,
  scale,
  onLit,
  onOpen,
}: {
  item: Scored;
  rank: number;
  scale: number;
  onLit: (ids: HeroId[]) => void;
  onOpen: (id: HeroId) => void;
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
      role="button"
      tabIndex={0}
      aria-label={`${h.full} 상성 펼치기`}
      onMouseEnter={() => onLit(chips.map((c) => c.enemy))}
      onMouseLeave={() => onLit([])}
      onClick={() => onOpen(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item.id);
        }
      }}
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

export function Recommendations({ mode, onMode, team, size, onLit, onInfo }: Props) {
  const [role, setRole] = useRoleFilter();
  const combo = mode === 'combo';
  /* 조합은 자리가 남은 역할만 매긴다 — 5v5 에서 탱커가 차 있으면 탱커는 안 나온다. */
  const scores = useMemo(
    () => (combo ? scoreCombo(team, size) : scoreAll(team)),
    [combo, team, size],
  );
  // 조합 한 칸은 최대 2점이라 막대 기준도 그만큼.
  const scale = combo ? Math.max(2, team.length * 2) : scaleFor(team.length);
  const enemies = team; // 아래 빈 화면 판정에 쓰던 이름 그대로

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
            <i>{combo ? '우리 팀을 고르면 여기에 나옵니다' : '적을 고르면 여기에 나옵니다'}</i>
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
        {/* 카운터 — 적 조합 상대로. 조합 — 우리 팀에 맞춰. 바꾸면 위의 팀 칸도 따라 바뀐다. */}
        {COMBO_ENABLED && (
        <div className="seg small" role="group" aria-label="추천 기준">
          <button type="button" aria-pressed={!combo} onClick={() => onMode('counter')}>
            카운터
          </button>
          <button type="button" aria-pressed={combo} onClick={() => onMode('combo')}>
            조합
          </button>
        </div>
        )}
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
          {combo
            ? '아래에서 우리 팀 영웅을 고르면 어울리는 픽이 여기 나옵니다.'
            : '아래에서 적 영웅을 고르면 유리한 픽이 여기 나옵니다.'}
        </div>
      ) : blocks.length === 0 && avoid.length === 0 ? (
        <div className="rec-empty">
          {combo ? '이 팀과 궁합이 좋다고 적힌 ' : '이 조합에서 유리하다고 적힌 '}
          {role ? `${ROLES.find((r) => r.k === role)?.ko} ` : ''}
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
                  onOpen={onInfo}
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
                <span>{combo ? '안 어울리는 픽' : '피해야 할 픽'}</span>
              </div>
              {avoid.map((item, i) => (
                <Row
                  key={item.id}
                  item={item}
                  rank={i + 1}
                  scale={scale}
                  onLit={onLit}
                  onOpen={onInfo}
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
