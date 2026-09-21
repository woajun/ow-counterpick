import type { HeroId } from './heroes';

/**
 * 반대쪽 문서를 뒤집어 메운 짝.
 *
 * 나무위키는 두 영웅 중 한쪽 문서에만 적어 두는 일이 잦다. 빈 쪽은 반대쪽을
 * 뒤집어 채웠다 — b 가 a 에게 유리하면 a 는 b 에게 그만큼 불리하다.
 *
 * 적혀 있는 값과 구별해 두는 이유: 나중에 원본이 채워지면 덮어써야 하고,
 * 한쪽 문서만 근거라서 무게가 다르다.
 *
 * scripts/scrape_matchups.py 가 다시 쓴다. 손으로 고치면 다음 실행에 날아간다.
 */
const INFERRED: Partial<Record<HeroId, HeroId[]>> = {
  dva: ['dmon'],
  mauga: ['mizuki'],
  reinhardt: ['dmon'],
  winston: ['dmon'],
  wreckingball: ['dmon'],
  anran: ['dmon', 'shion', 'sierra'],
  ashe: [
    'anran', 'dmon', 'domina', 'emre', 'jetpackcat', 'mizuki', 'shion',
    'sierra',
  ],
  cassidy: ['anran', 'dmon', 'jetpackcat', 'shion', 'wuyang'],
  echo: ['dmon'],
  emre: ['dmon', 'shion', 'sierra'],
  freja: ['cassidy', 'shion', 'sierra'],
  hanzo: [
    'anran', 'dmon', 'domina', 'emre', 'jetpackcat', 'mizuki', 'shion',
    'sierra', 'wuyang',
  ],
  junkrat: ['shion', 'sierra'],
  mei: ['dmon'],
  pharah: ['shion', 'sierra'],
  shion: ['dmon'],
  sierra: ['dmon', 'shion'],
  sojourn: ['dmon'],
  soldier76: ['dmon'],
  sombra: ['shion', 'sierra'],
  torbjorn: ['dmon', 'shion', 'sierra'],
  tracer: ['dmon', 'sierra'],
  vendetta: ['dmon'],
  venture: ['dmon'],
  widowmaker: [
    'anran', 'dmon', 'emre', 'jetpackcat', 'mizuki', 'shion', 'sierra',
  ],
  ana: ['anran', 'domina', 'emre', 'mizuki', 'shion', 'sierra'],
  baptiste: ['dmon', 'shion'],
  illari: ['anran', 'dmon', 'domina', 'emre', 'mizuki', 'shion', 'sierra'],
  jetpackcat: ['shion', 'sierra'],
  juno: ['dmon', 'shion'],
  kiriko: ['shion'],
  lifeweaver: ['dmon', 'emre', 'shion'],
  lucio: ['anran', 'dmon', 'jetpackcat', 'mizuki', 'shion', 'sierra'],
  mercy: ['dmon'],
  mizuki: ['dmon'],
  moira: [
    'dmon', 'emre', 'jetpackcat', 'mizuki', 'shion', 'sierra', 'wuyang',
  ],
  wuyang: ['dmon', 'shion', 'sierra'],
};

const INDEX = new Map(
  Object.entries(INFERRED).map(([a, bs]) => [a, new Set(bs)]),
);

/** `mine` 의 `enemy` 상성이 반대쪽에서 뒤집어 온 값인가. */
export const isInferred = (mine: HeroId, enemy: HeroId) =>
  INDEX.get(mine)?.has(enemy) ?? false;
