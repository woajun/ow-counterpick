import { HEROES, HERO_IDS, type HeroId, type Role } from '../data/heroes';
import type { Level } from '../data/matchups';
import { MATRIX, type Matrix } from './matrix';
import type { SynTable } from '../data/synergy';
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
  /** 고른 맵에서 이 영웅의 점수(표 주인이 정한 것). 정하지 않았으면 없다. value 에 들어 있다. */
  map?: number;
}

/**
 * 맵 점수를 얹는다 — 표 주인이 정한 "이 맵에서 이 영웅 몇 점"(−3 … +3)을 그대로 더한다.
 * 맵 하나가 적 한 명만큼 무게를 갖는다. 정하지 않은 영웅은 그대로다.
 */
export function withMap(
  scores: Partial<Record<HeroId, Scored>>,
  mapScore: ((hero: HeroId) => number | null) | null,
): Partial<Record<HeroId, Scored>> {
  if (!mapScore) return scores;
  const out: Partial<Record<HeroId, Scored>> = {};
  for (const [id, s] of Object.entries(scores) as [HeroId, Scored][]) {
    const m = mapScore(id);
    out[id] = m === null ? s : { ...s, value: s.value + m, map: m };
  }
  return out;
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

  for (const s of Object.values(out)) s.reasons.sort(byReason);
  return out;
}

/**
 * 근거 칩 차례 — 점수 순으로 한 줄. 추천 픽은 높은 것부터(+3 … −3), 피해야 할 픽은
 * 낮은 것부터(−3 … +3)(reasonsFor).
 *
 * 세기(절댓값)로 줄 세우면 +3 옆에 −3 이 끼어 초록 · 빨강이 섞여 읽힌다. 점수 순이면
 * 초록에서 빨강으로(또는 그 반대로) 한 방향으로 흐른다.
 */
export const byReason = (a: Reason, b: Reason) => b.level - a.level;

/** 줄에 늘어놓을 칩 — 점수가 마이너스인 픽은 왜 나쁜지가 먼저라 낮은 것부터. */
export const reasonsFor = (s: Scored) => (s.value < 0 ? [...s.reasons].reverse() : s.reasons);

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
 * 카운터와 같은 단순 합이다. 팀원 하나하나와의 궁합 점수(−3 … +3, 나무위키는 +2 · +1 · −1)를 더한다.
 * 근거(reasons)의 `enemy` 칸에는 여기서는 팀원이 들어간다.
 *
 * <b>자리가 없는 역할은 아예 매기지 않는다</b> — 5v5 에서 탱커가 이미 있으면 탱커는
 * 고를 수 없으니 추천할 이유가 없다. 그런 영웅은 결과에서 빠진다(값이 없다).
 */
export function scoreCombo(allies: HeroId[], size: TeamSize, syn: SynTable): Partial<Record<HeroId, Scored>> {
  const out: Partial<Record<HeroId, Scored>> = {};
  for (const id of HERO_IDS) {
    if (!canAdd(allies, size, id)) continue;
    const reasons: Reason[] = [];
    let value = 0;
    for (const mate of allies) {
      const lv = syn[id]?.[mate];
      if (lv) {
        value += lv;
        reasons.push({ enemy: mate, level: lv as Level });
      }
    }
    reasons.sort(byReason);
    out[id] = { id, value, reasons };
  }
  return out;
}

/**
 * 팀 궁합 — 고른 영웅끼리 짝지은 궁합 등급의 합. 5명이면 10짝, 6명이면 15짝이다.
 *
 * 상성 모드에서는 적 팀이 얼마나 잘 짜였는지, 조합 모드에서는 우리 팀이 얼마나 잘
 * 맞는지 본다. 점수는 보고 있는 표의 궁합이다(평가 없으면 0).
 */
export function teamSynergy(ids: HeroId[], syn: SynTable) {
  const pairs: { a: HeroId; b: HeroId; level: number }[] = [];
  let total = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const level = syn[ids[i]]?.[ids[j]] ?? 0;
      total += level;
      if (level !== 0) pairs.push({ a: ids[i], b: ids[j], level });
    }
  }
  const count = (ids.length * (ids.length - 1)) / 2;
  pairs.sort((x, y) => y.level - x.level);
  return { total, count, pairs, avg: count ? total / count : 0 };
}

/** 한 짝 평균으로 붙이는 한마디. */
export const synergyVerdict = (avg: number) =>
  avg >= 0.9 ? '찰떡' : avg >= 0.5 ? '잘 어울림' : avg > 0.1 ? '무난' : avg > -0.2 ? '따로 놂' : '안 어울림';

/**
 * 궁합이 가장 좋은 5명(탱커 1 · 딜러 2 · 지원 2) — 짝마다 궁합 점수를 더한 합이 큰 순으로 `top` 개.
 *
 * 탱커마다 가장 좋은 조합 하나씩만 겨룬다 — 그냥 상위 3개를 뽑으면 한두 명만 바뀐 비슷한
 * 조합이 줄줄이 나온다. 탱커가 달라야 고를 거리가 된다.
 *
 * 다 세어 본다. 탱커 × 딜러 두 명 × 지원 두 명이라 30만 가지 남짓이고, 한 번에 몇십 ms 다.
 * 합이 같으면 먼저 찾은 것(영웅 목록 순)이 앞이라 순서가 흔들리지 않는다.
 */
export function bestTeams(syn: SynTable, top = 3) {
  const of = (r: Role) => HERO_IDS.filter((h) => HEROES[h].r === r);
  const tanks = of('tank');
  const dmg = of('dmg');
  const sup = of('sup');
  const v = (a: HeroId, b: HeroId) => syn[a]?.[b] ?? 0;
  const pairs = (list: HeroId[]) => {
    const out: { a: HeroId; b: HeroId; v: number }[] = [];
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) out.push({ a: list[i], b: list[j], v: v(list[i], list[j]) });
    return out;
  };
  const dPairs = pairs(dmg);
  const sPairs = pairs(sup);

  const perTank: { ids: HeroId[]; total: number }[] = [];
  for (const t of tanks) {
    let best: { ids: HeroId[]; total: number } | null = null;
    for (const d of dPairs) {
      const td = v(t, d.a) + v(t, d.b) + d.v;
      for (const s of sPairs) {
        const total =
          td + v(t, s.a) + v(t, s.b) + s.v + v(d.a, s.a) + v(d.a, s.b) + v(d.b, s.a) + v(d.b, s.b);
        if (!best || total > best.total) best = { ids: [t, d.a, d.b, s.a, s.b], total };
      }
    }
    if (best) perTank.push(best);
  }
  // 안정 정렬이라 합이 같으면 영웅 목록 순 그대로.
  return perTank.sort((x, y) => y.total - x.total).slice(0, top);
}
