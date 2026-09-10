import { HEROES, type HeroId, type Role } from '../data/heroes';

export type TeamSize = 5 | 6;

/**
 * 한 팀에 들어갈 수 있는 역할별 인원.
 *
 * 5v5 는 역할 고정이라 탱커 1 · 딜러 2 · 지원 2 로 딱 떨어진다.
 * 6v6 은 탱커만 둘로 막히고 나머지는 합이 6이면 된다.
 */
export const LIMITS: Record<TeamSize, Record<Role, number>> = {
  5: { tank: 1, dmg: 2, sup: 2 },
  6: { tank: 2, dmg: 6, sup: 6 },
};

/**
 * 5v5 슬롯 자리.
 *
 * 고른 순서와 상관없이 역할 자리에 꽂는다 — 빈 자리를 보면 아직 못 본 역할이
 * 무엇인지 바로 안다. 6v6 은 자리가 안 정해져 있어서 고른 순서대로 둔다.
 */
export const LAYOUT: Role[] = ['tank', 'dmg', 'dmg', 'sup', 'sup'];

export const countRole = (ids: HeroId[], r: Role) =>
  ids.filter((id) => HEROES[id].r === r).length;

/** 이 영웅을 더 넣을 수 있나. */
export function canAdd(ids: HeroId[], size: TeamSize, id: HeroId): boolean {
  if (ids.includes(id) || ids.length >= size) return false;
  const r = HEROES[id].r;
  return countRole(ids, r) < LIMITS[size][r];
}

/**
 * 규칙에 안 맞는 것을 잘라 낸다.
 *
 * 6v6 에서 5v5 로 줄일 때, 그리고 이 규칙이 생기기 전에 저장해 둔 조합을
 * 다시 열 때 지나간다. 그냥 앞에서 다섯을 남기면 탱커 둘짜리 5v5 가 나온다.
 */
export function trim(ids: HeroId[], size: TeamSize): HeroId[] {
  const out: HeroId[] = [];
  for (const id of ids) if (canAdd(out, size, id)) out.push(id);
  return out;
}

export interface Slot {
  id?: HeroId;
  /** 빈 자리에 적어 줄 역할. 6v6 은 자리가 안 정해져 있어서 없다. */
  role?: Role;
}

/** 화면에 늘어놓을 슬롯. */
export function arrange(ids: HeroId[], size: TeamSize): Slot[] {
  if (size === 6) return Array.from({ length: 6 }, (_, i) => ({ id: ids[i] }));

  const left = [...ids];
  return LAYOUT.map((role) => {
    const i = left.findIndex((id) => HEROES[id].r === role);
    return i < 0 ? { role } : { id: left.splice(i, 1)[0], role };
  });
}
