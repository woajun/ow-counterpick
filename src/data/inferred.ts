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
  dmon: ['doctrine'],
  domina: ['doctrine'],
  doomfist: ['doctrine'],
  dva: ['dmon', 'doctrine'],
  hazard: ['doctrine'],
  junkerqueen: ['doctrine'],
  mauga: ['doctrine', 'mizuki'],
  orisa: ['doctrine'],
  ramattra: ['doctrine'],
  reinhardt: ['dmon', 'doctrine'],
  roadhog: ['doctrine'],
  sigma: ['doctrine'],
  winston: ['dmon', 'doctrine'],
  wreckingball: ['dmon', 'doctrine'],
  zarya: ['doctrine'],
  anran: ['dmon', 'shion', 'sierra'],
  ashe: [
    'anran', 'dmon', 'domina', 'emre', 'jetpackcat', 'mizuki', 'shion',
    'sierra',
  ],
  cassidy: ['anran', 'dmon', 'jetpackcat', 'shion', 'wuyang'],
  echo: ['dmon'],
  emre: ['dmon', 'shion', 'sierra'],
  freja: ['cassidy', 'doctrine', 'shion', 'sierra'],
  genji: ['doctrine'],
  hanzo: [
    'anran', 'dmon', 'domina', 'emre', 'jetpackcat', 'mizuki', 'shion',
    'sierra', 'wuyang',
  ],
  junkrat: ['doctrine', 'shion', 'sierra'],
  pharah: ['doctrine', 'shion', 'sierra'],
  shion: ['dmon'],
  sierra: ['dmon', 'shion'],
  sojourn: ['dmon'],
  soldier76: ['dmon'],
  torbjorn: ['dmon', 'shion', 'sierra'],
  tracer: ['dmon', 'sierra'],
  vendetta: ['dmon', 'doctrine'],
  venture: ['dmon', 'doctrine'],
  widowmaker: [
    'anran', 'dmon', 'emre', 'jetpackcat', 'mizuki', 'shion', 'sierra',
  ],
  ana: ['anran', 'doctrine', 'domina', 'emre', 'mizuki', 'shion', 'sierra'],
  baptiste: ['dmon', 'shion'],
  brigitte: ['doctrine'],
  illari: ['anran', 'dmon', 'domina', 'emre', 'mizuki', 'shion', 'sierra'],
  jetpackcat: ['doctrine', 'shion', 'sierra'],
  juno: ['dmon', 'doctrine', 'shion'],
  kiriko: ['doctrine'],
  lifeweaver: ['dmon', 'doctrine', 'emre', 'shion'],
  lucio: ['anran', 'dmon', 'jetpackcat', 'mizuki', 'shion', 'sierra'],
  mercy: ['dmon', 'doctrine'],
  mizuki: ['dmon'],
  moira: [
    'dmon', 'doctrine', 'emre', 'jetpackcat', 'mizuki', 'shion', 'wuyang',
  ],
  sombra: [
    'ana', 'anran', 'ashe', 'baptiste', 'bastion', 'brigitte', 'dmon',
    'doctrine', 'domina', 'doomfist', 'dva', 'echo', 'emre', 'freja',
    'genji', 'hanzo', 'hazard', 'illari', 'jetpackcat', 'junkerqueen',
    'junkrat', 'juno', 'kiriko', 'lifeweaver', 'lucio', 'mei', 'mercy',
    'mizuki', 'moira', 'orisa', 'pharah', 'ramattra', 'reaper', 'reinhardt',
    'shion', 'sierra', 'sigma', 'sojourn', 'soldier76', 'symmetra',
    'torbjorn', 'tracer', 'vendetta', 'venture', 'widowmaker',
    'wreckingball', 'wuyang', 'zarya', 'zenyatta',
  ],
  wuyang: ['dmon', 'shion', 'sierra'],
  zenyatta: ['doctrine'],
};

const INDEX = new Map(
  Object.entries(INFERRED).map(([a, bs]) => [a, new Set(bs)]),
);

/** `mine` 의 `enemy` 상성이 반대쪽에서 뒤집어 온 값인가. */
export const isInferred = (mine: HeroId, enemy: HeroId) =>
  INDEX.get(mine)?.has(enemy) ?? false;
