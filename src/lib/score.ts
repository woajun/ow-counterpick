import { HEROES, HERO_IDS, type HeroId, type Role } from '../data/heroes';
import { MATCHUPS } from '../data/matchups';

export const W_GOOD = 3;
export const W_OK = 1;
export const W_BAD = -3;

export interface Reason {
  /** 근거가 된 적 영웅. */
  enemy: HeroId;
  /** 확실한 카운터인지(good), 무난한 편인지(ok). */
  hard: boolean;
}

export interface Scored {
  id: HeroId;
  value: number;
  reasons: Reason[];
}

/**
 * 적 조합에 대해 내 영웅 전부를 점수로 매긴다.
 *
 * 적 하나하나가 독립적으로 점수를 얹는 단순한 합이다. 시너지나 맵은
 * 안 본다 — 게임 중에 몇 초 안에 스왑을 정하는 도구라, 설명할 수 없는
 * 가중치를 넣는 것보다 근거를 그대로 보여주는 쪽이 쓸모 있다.
 */
export function scoreAll(enemies: HeroId[]): Record<HeroId, Scored> {
  const out = {} as Record<HeroId, Scored>;
  for (const id of HERO_IDS) out[id] = { id, value: 0, reasons: [] };

  for (const enemy of enemies) {
    const m = MATCHUPS[enemy];
    for (const id of m.good) {
      out[id].value += W_GOOD;
      out[id].reasons.push({ enemy, hard: true });
    }
    for (const id of m.ok) {
      out[id].value += W_OK;
      out[id].reasons.push({ enemy, hard: false });
    }
    for (const id of m.bad) out[id].value += W_BAD;
  }
  return out;
}

/** 역할별 상위 픽. 점수가 같으면 이름순으로 고정해서 순서가 안 흔들리게. */
export function topByRole(
  scores: Record<HeroId, Scored>,
  role: Role,
  limit = 4,
): Scored[] {
  return HERO_IDS
    .filter((id) => HEROES[id].r === role && scores[id].value > 0)
    .sort(
      (a, b) =>
        scores[b].value - scores[a].value ||
        HEROES[a].full.localeCompare(HEROES[b].full),
    )
    .slice(0, limit)
    .map((id) => scores[id]);
}

/** 역할 가리지 않고 가장 불리한 픽. */
export function worst(scores: Record<HeroId, Scored>, limit = 4): Scored[] {
  return HERO_IDS
    .filter((id) => scores[id].value < 0)
    .sort((a, b) => scores[a].value - scores[b].value)
    .slice(0, limit)
    .map((id) => scores[id]);
}

/** 막대를 채우는 기준값. 적이 많을수록 점수가 커지므로 같이 늘린다. */
export const scaleFor = (enemyCount: number) =>
  Math.max(W_GOOD, enemyCount * W_GOOD);
