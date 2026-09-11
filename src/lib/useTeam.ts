import { useCallback, useEffect, useMemo, useState } from 'react';
import { isHeroId, type HeroId } from '../data/heroes';
import { canAdd, trim, type TeamSize } from './roster';

export type { TeamSize };

const KEY = 'ow-counterpick.v1';

interface Team {
  size: TeamSize;
  enemies: HeroId[];
}

function initial(): Team {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Team>;
      const size: TeamSize = v.size === 6 ? 6 : 5;
      const enemies = Array.isArray(v.enemies)
        ? trim(v.enemies.filter(isHeroId), size)
        : [];
      return { size, enemies };
    }
  } catch {
    // 시크릿 창이나 저장이 막힌 브라우저. 기억은 못 해도 도구는 돌아간다.
  }
  // 빈 채로 시작한다. 예시를 깔아 두면 지우는 것이 첫 일이 된다.
  return { size: 5, enemies: [] };
}

export function useTeam() {
  const [team, setTeam] = useState<Team>(initial);

  useEffect(() => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ size: team.size, enemies: team.enemies }),
      );
    } catch {
      /* 저장이 막혀 있어도 그냥 넘어간다 */
    }
  }, [team]);

  /** 적 목록을 바꾸는 모든 길은 여기를 지난다. */
  const edit = useCallback(
    (fn: (prev: Team) => HeroId[]) =>
      setTeam((prev) => ({ ...prev, enemies: fn(prev) })),
    [],
  );

  const actions = useMemo(
    () => ({
      add: (id: HeroId) =>
        edit((p) =>
          canAdd(p.enemies, p.size, id) ? [...p.enemies, id] : p.enemies,
        ),

      remove: (id: HeroId) => edit((p) => p.enemies.filter((x) => x !== id)),

      toggle: (id: HeroId) =>
        edit((p) =>
          p.enemies.includes(id)
            ? p.enemies.filter((x) => x !== id)
            : canAdd(p.enemies, p.size, id)
              ? [...p.enemies, id]
              : p.enemies,
        ),

      removeLast: () => edit((p) => p.enemies.slice(0, -1)),

      reset: () => edit(() => []),

      /** 인원을 바꾸면 새 규칙에 안 맞는 자리를 잘라 낸다 — 탱커 둘짜리
       *  6v6 을 5v5 로 옮기면 탱커 하나가 빠진다. */
      setSize: (size: TeamSize) =>
        setTeam((p) => ({ ...p, size, enemies: trim(p.enemies, size) })),
    }),
    [edit],
  );

  return { ...team, ...actions };
}
