import type { HeroId } from './heroes';

/**
 * 중립이라고 **적혀 있는** 짝.
 *
 * 아예 안 적힌 것과 다르다. 나무위키가 "중립" 또는 "유동적"이라고 판단해
 * 둔 것이라, 점수가 0이라는 사실 자체가 정보다. 상성표에는 0을 적지 않기
 * 때문에 그 구별이 사라지는데, 그걸 여기에 남긴다.
 *
 * 방향이 있다. `NEUTRAL[a]` 에 b 가 있다는 것은 **a 의 문서가** b 를 중립으로
 * 봤다는 뜻이고, b 의 문서가 a 를 어떻게 봤는지는 별개다.
 *
 * scripts/scrape_matchups.py 가 다시 쓴다. 손으로 고치면 다음 실행에 날아간다.
 */
const NEUTRAL: Partial<Record<HeroId, HeroId[]>> = {
  dmon: [
    'doomfist', 'hazard', 'illari', 'junkerqueen', 'lucio', 'moira',
    'reaper', 'reinhardt', 'soldier76', 'sombra', 'torbjorn', 'wreckingball',
  ],
  domina: [
    'anran', 'ashe', 'baptiste', 'emre', 'hazard', 'mercy', 'soldier76',
    'torbjorn', 'wuyang',
  ],
  doomfist: [
    'ashe', 'baptiste', 'brigitte', 'dmon', 'dva', 'hanzo', 'hazard',
    'jetpackcat', 'junkerqueen', 'juno', 'mei', 'moira', 'sigma', 'tracer',
    'vendetta',
  ],
  dva: [
    'bastion', 'doomfist', 'genji', 'junkrat', 'lifeweaver', 'lucio',
    'reaper', 'roadhog', 'sigma', 'soldier76', 'wreckingball', 'wuyang',
  ],
  hazard: [
    'ana', 'dmon', 'doomfist', 'genji', 'mercy', 'ramattra', 'tracer',
    'wreckingball',
  ],
  junkerqueen: [
    'brigitte', 'cassidy', 'domina', 'doomfist', 'ramattra', 'reaper',
    'roadhog', 'sigma', 'torbjorn', 'vendetta',
  ],
  mauga: [
    'echo', 'lifeweaver', 'mei', 'moira', 'orisa', 'reaper', 'roadhog',
    'sombra', 'torbjorn', 'tracer', 'wreckingball',
  ],
  orisa: [
    'anran', 'ashe', 'baptiste', 'freja', 'genji', 'illari', 'mauga',
    'mercy', 'reaper', 'sierra', 'sojourn', 'soldier76', 'sombra',
    'torbjorn', 'venture',
  ],
  ramattra: [
    'ashe', 'bastion', 'freja', 'hazard', 'junkerqueen', 'juno', 'mizuki',
    'pharah', 'shion', 'vendetta', 'widowmaker', 'winston',
  ],
  reinhardt: [
    'ana', 'anran', 'baptiste', 'illari', 'juno', 'kiriko', 'mercy', 'moira',
    'roadhog', 'torbjorn',
  ],
  roadhog: [
    'ashe', 'bastion', 'dva', 'hanzo', 'illari', 'junkerqueen', 'lifeweaver',
    'mauga', 'reaper', 'sigma', 'zarya',
  ],
  sigma: [
    'baptiste', 'brigitte', 'doomfist', 'dva', 'hanzo', 'kiriko', 'pharah',
    'reaper', 'roadhog', 'shion', 'vendetta', 'venture', 'wreckingball',
  ],
  winston: [
    'brigitte', 'domina', 'emre', 'jetpackcat', 'lucio', 'moira', 'ramattra',
    'venture', 'wreckingball',
  ],
  wreckingball: [
    'ana', 'anran', 'dva', 'emre', 'hazard', 'junkerqueen', 'lifeweaver',
    'lucio', 'mauga', 'venture', 'zenyatta',
  ],
  zarya: [
    'doomfist', 'juno', 'mauga', 'moira', 'reaper', 'roadhog', 'sierra',
    'vendetta',
  ],
  anran: ['domina', 'orisa', 'reinhardt', 'wreckingball', 'wuyang'],
  ashe: [
    'bastion', 'hanzo', 'moira', 'roadhog', 'soldier76', 'sombra',
    'symmetra', 'vendetta', 'venture',
  ],
  bastion: [
    'ashe', 'baptiste', 'dva', 'emre', 'illari', 'junkerqueen', 'lucio',
    'mauga', 'mei', 'mizuki', 'ramattra', 'reaper', 'roadhog', 'sigma',
    'soldier76', 'widowmaker', 'wuyang',
  ],
  cassidy: ['genji', 'junkerqueen', 'junkrat', 'soldier76'],
  echo: ['ana', 'lucio', 'mauga', 'mercy', 'moira', 'sojourn'],
  emre: [
    'ana', 'ashe', 'domina', 'mizuki', 'reaper', 'sojourn', 'venture',
    'winston', 'wuyang',
  ],
  freja: [
    'ana', 'baptiste', 'dmon', 'jetpackcat', 'mizuki', 'reaper', 'winston',
  ],
  genji: [
    'ana', 'baptiste', 'cassidy', 'hazard', 'illari', 'junkerqueen',
    'junkrat', 'lifeweaver', 'lucio', 'mizuki', 'orisa', 'ramattra',
    'reaper', 'sierra', 'tracer',
  ],
  hanzo: [
    'ana', 'ashe', 'illari', 'junkrat', 'juno', 'mercy', 'reaper', 'roadhog',
    'sojourn', 'soldier76', 'symmetra', 'tracer', 'widowmaker',
  ],
  junkrat: [
    'cassidy', 'dva', 'genji', 'illari', 'mizuki', 'moira', 'torbjorn',
    'zenyatta',
  ],
  mei: [
    'brigitte', 'juno', 'moira', 'torbjorn', 'vendetta', 'venture',
    'wreckingball',
  ],
  pharah: ['sigma'],
  reaper: [
    'ana', 'dva', 'echo', 'emre', 'freja', 'genji', 'juno', 'mizuki',
    'orisa', 'roadhog', 'sierra', 'sigma', 'soldier76',
  ],
  shion: [
    'echo', 'emre', 'freja', 'junkrat', 'mercy', 'moira', 'pharah',
    'ramattra', 'sigma', 'sojourn', 'soldier76', 'torbjorn', 'vendetta',
  ],
  sierra: [
    'ana', 'genji', 'lifeweaver', 'mizuki', 'orisa', 'pharah', 'ramattra',
    'reaper', 'soldier76', 'sombra', 'tracer', 'zarya',
  ],
  sojourn: [
    'baptiste', 'cassidy', 'emre', 'hanzo', 'illari', 'kiriko', 'moira',
    'orisa', 'shion', 'wuyang',
  ],
  soldier76: [
    'baptiste', 'cassidy', 'dva', 'illari', 'mizuki', 'moira', 'orisa',
    'shion', 'sierra', 'symmetra', 'zenyatta',
  ],
  sombra: [
    'ana', 'ashe', 'baptiste', 'dmon', 'jetpackcat', 'mauga', 'orisa',
    'ramattra', 'symmetra',
  ],
  symmetra: [
    'ana', 'ashe', 'illari', 'juno', 'lifeweaver', 'mei', 'orisa',
    'ramattra', 'soldier76', 'sombra', 'venture', 'widowmaker', 'zenyatta',
  ],
  torbjorn: [
    'ana', 'domina', 'illari', 'lucio', 'mauga', 'mei', 'orisa', 'reinhardt',
    'sombra',
  ],
  tracer: [
    'doomfist', 'genji', 'hazard', 'lifeweaver', 'lucio', 'mauga', 'mizuki',
    'moira', 'vendetta', 'wreckingball', 'wuyang',
  ],
  vendetta: [
    'ashe', 'baptiste', 'doomfist', 'junkerqueen', 'kiriko', 'lucio', 'mei',
    'ramattra', 'shion', 'sigma', 'tracer', 'venture', 'zarya',
  ],
  venture: [
    'ana', 'ashe', 'brigitte', 'emre', 'junkrat', 'mei', 'mercy', 'sigma',
    'vendetta', 'widowmaker', 'wreckingball', 'wuyang', 'zenyatta',
  ],
  widowmaker: [
    'ashe', 'baptiste', 'bastion', 'echo', 'moira', 'ramattra', 'symmetra',
    'tracer', 'wuyang', 'zenyatta',
  ],
  ana: [
    'baptiste', 'echo', 'freja', 'genji', 'hazard', 'junkrat', 'reaper',
    'reinhardt', 'torbjorn', 'tracer', 'venture', 'wuyang', 'zenyatta',
  ],
  baptiste: [
    'ana', 'bastion', 'domina', 'doomfist', 'genji', 'mizuki', 'moira',
    'orisa', 'reinhardt', 'sigma', 'sojourn', 'sombra', 'venture',
    'widowmaker', 'zarya',
  ],
  brigitte: ['domina', 'juno', 'mei'],
  illari: [
    'ashe', 'baptiste', 'bastion', 'genji', 'kiriko', 'lifeweaver', 'moira',
    'orisa', 'pharah', 'reinhardt', 'sojourn', 'soldier76', 'symmetra',
  ],
  jetpackcat: [
    'doomfist', 'freja', 'lucio', 'mercy', 'ramattra', 'sigma', 'sombra',
    'winston',
  ],
  juno: [
    'doomfist', 'hanzo', 'lifeweaver', 'lucio', 'mei', 'ramattra',
    'reinhardt', 'zarya', 'zenyatta',
  ],
  kiriko: [
    'ashe', 'echo', 'genji', 'illari', 'lifeweaver', 'lucio', 'mercy',
    'mizuki', 'reinhardt', 'sigma', 'vendetta', 'zenyatta',
  ],
  lifeweaver: [
    'ana', 'brigitte', 'dva', 'genji', 'illari', 'junkerqueen', 'junkrat',
    'juno', 'kiriko', 'mauga', 'mercy', 'moira', 'roadhog', 'sierra',
    'symmetra', 'wreckingball',
  ],
  lucio: [
    'bastion', 'dva', 'echo', 'genji', 'juno', 'kiriko', 'mercy', 'moira',
    'torbjorn', 'tracer', 'vendetta', 'wreckingball', 'zenyatta',
  ],
  mercy: [
    'echo', 'hanzo', 'hazard', 'jetpackcat', 'kiriko', 'lifeweaver', 'lucio',
    'mizuki', 'orisa', 'ramattra', 'reinhardt', 'torbjorn', 'venture',
    'wreckingball',
  ],
  mizuki: [
    'ana', 'anran', 'baptiste', 'brigitte', 'emre', 'genji', 'jetpackcat',
    'junkrat', 'kiriko', 'mauga', 'ramattra', 'reaper', 'sierra',
    'soldier76', 'wuyang',
  ],
  moira: [
    'baptiste', 'brigitte', 'doomfist', 'echo', 'illari', 'junkerqueen',
    'junkrat', 'lifeweaver', 'lucio', 'mauga', 'mei', 'winston',
    'wreckingball', 'zarya', 'zenyatta',
  ],
  wuyang: [
    'ana', 'bastion', 'emre', 'mizuki', 'ramattra', 'sigma', 'sojourn',
    'tracer', 'vendetta',
  ],
  zenyatta: [
    'ana', 'ashe', 'doomfist', 'junkrat', 'juno', 'kiriko', 'moira', 'sigma',
    'symmetra', 'venture', 'widowmaker', 'wreckingball',
  ],
};

const INDEX = new Map(
  Object.entries(NEUTRAL).map(([a, bs]) => [a, new Set(bs)]),
);

/** `mine` 의 문서가 `enemy` 를 중립으로 적어 두었나. */
export const isNeutral = (mine: HeroId, enemy: HeroId) =>
  INDEX.get(mine)?.has(enemy) ?? false;
