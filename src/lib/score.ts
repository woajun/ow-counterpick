import { HEROES, HERO_IDS, type HeroId, type Role } from '../data/heroes';
import type { Level } from '../data/matchups';
import { MATRIX, type Matrix } from './matrix';
import { SYNERGY } from '../data/synergy';
import { canAdd, type TeamSize } from './roster';

/** 한 칸이 얹을 수 있는 가장 센 점수. 막대를 채우는 기준이 된다. */
export const MAX_LEVEL = 3;

export interface Reason {
  /** 근거가 된 적 영웅. */
  enemy: HeroId;
  /** 그 적 하나가 얹은 점수. +3 매우 유리 … −3 매우 불리. */
  level: Level;
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
 *
 * 불리한 근거도 같이 담는다. 점수가 왜 깎였는지 안 보이면 "피해야 할 픽"
 * 줄이 이유 없는 명단이 된다.
 */
export function scoreAll(enemies: HeroId[], matrix: Matrix = MATRIX): Record<HeroId, Scored> {
  const out = {} as Record<HeroId, Scored>;
  for (const id of HERO_IDS) out[id] = { id, value: 0, reasons: [] };

  // 칸은 행렬에서 읽는다 — 내가 고친 상성(mySheet)이 얹힌 행렬이 들어올 수 있다.
  for (const enemy of enemies) {
    for (const mine of HERO_IDS) {
      const level = matrix[mine][enemy] as Level | 0;
      if (level === 0 || mine === enemy) continue;
      out[mine].value += level;
      out[mine].reasons.push({ enemy, level });
    }
  }

  // 센 근거부터. 칩을 몇 개만 보고 넘어가도 제일 중요한 것이 눈에 들어온다.
  for (const s of Object.values(out)) {
    s.reasons.sort(
      (a, b) => Math.abs(b.level) - Math.abs(a.level) || b.level - a.level,
    );
  }
  return out;
}

/** 역할별 상위 픽. 점수가 같으면 이름순으로 고정해서 순서가 안 흔들리게. */
export function topByRole(
  scores: Partial<Record<HeroId, Scored>>,
  role: Role,
  limit = 4,
): Scored[] {
  return HERO_IDS
    .filter((id) => HEROES[id].r === role && (scores[id]?.value ?? 0) > 0)
    .sort(
      (a, b) =>
        scores[b]!.value - scores[a]!.value ||
        HEROES[a].full.localeCompare(HEROES[b].full),
    )
    .slice(0, limit)
    .map((id) => scores[id]!);
}

/** 가장 불리한 픽. 역할을 주면 그 역할 안에서만 고른다. */
export function worst(
  scores: Partial<Record<HeroId, Scored>>,
  limit = 4,
  role: Role | null = null,
): Scored[] {
  return HERO_IDS
    .filter(
      (id) => (scores[id]?.value ?? 0) < 0 && (role === null || HEROES[id].r === role),
    )
    .sort((a, b) => scores[a]!.value - scores[b]!.value)
    .slice(0, limit)
    .map((id) => scores[id]!);
}

/** 막대를 채우는 기준값. 적이 많을수록 점수가 커지므로 같이 늘린다. */
export const scaleFor = (enemyCount: number) =>
  Math.max(MAX_LEVEL, enemyCount * MAX_LEVEL);

/**
 * 우리 팀 조합에 대해 아직 넣을 수 있는 영웅을 점수로 매긴다 — 조합 모드.
 *
 * 카운터와 같은 단순 합이다. 팀원 하나하나와의 궁합 등급(+2 · +1 · 0 · −1)을 더한다.
 * 근거(reasons)의 `enemy` 칸에는 여기서는 팀원이 들어간다.
 *
 * <b>자리가 없는 역할은 아예 매기지 않는다</b> — 5v5 에서 탱커가 이미 있으면 탱커는
 * 고를 수 없으니 추천할 이유가 없다. 그런 영웅은 결과에서 빠진다(값이 없다).
 */
export function scoreCombo(allies: HeroId[], size: TeamSize): Partial<Record<HeroId, Scored>> {
  const out: Partial<Record<HeroId, Scored>> = {};
  for (const id of HERO_IDS) {
    if (!canAdd(allies, size, id)) continue;
    const reasons: Reason[] = [];
    let value = 0;
    for (const mate of allies) {
      const lv = SYNERGY[id]?.[mate];
      if (lv) {
        value += lv;
        reasons.push({ enemy: mate, level: lv as Level });
      }
    }
    reasons.sort((a, b) => Math.abs(b.level) - Math.abs(a.level) || b.level - a.level);
    out[id] = { id, value, reasons };
  }
  return out;
}
