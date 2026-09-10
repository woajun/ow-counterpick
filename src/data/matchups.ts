import type { HeroId } from './heroes';

/** 한 영웅을 적이 골랐을 때, 내 쪽에서 어떤 픽이 좋고 나쁜지. */
export interface Matchup {
  /** 확실한 카운터. */
  good: HeroId[];
  /** 나쁘지 않은 선택. */
  ok: HeroId[];
  /** 이 적을 상대로 고생하는 픽. */
  bad: HeroId[];
}

/**
 * 상성표 — 이 파일 하나만 고치면 화면 전체가 따라간다.
 *
 * 커뮤니티에서 통용되는 관계를 정리한 것이라 밸런스 패치마다 달라진다.
 * 절대적인 기준이 아니라 스왑 후보를 좁히는 용도다.
 *
 * 키를 HeroId 전부로 묶어 둔 이유: 영웅을 추가하고 상성을 안 적으면
 * 타입 검사에서 걸린다. 목록에는 뜨는데 추천에는 영영 안 나오는 영웅이
 * 생기는 것을 막는다.
 */
export const MATCHUPS: Record<HeroId, Matchup> = {
  // ── 탱커 ────────────────────────────────────────────────
  dva: {
    good: ['zarya', 'mei', 'symmetra'],
    ok: ['winston', 'moira', 'reaper', 'sombra'],
    bad: ['pharah', 'junkrat', 'hanzo', 'torbjorn', 'bastion'],
  },
  doomfist: {
    good: ['cassidy', 'ana', 'brigitte'],
    ok: ['sombra', 'orisa', 'mei', 'reaper'],
    bad: ['zenyatta', 'widowmaker', 'hanzo'],
  },
  hazard: {
    good: ['ana', 'cassidy', 'zarya'],
    ok: ['mei', 'brigitte', 'sombra'],
    bad: ['zenyatta', 'mercy'],
  },
  junkerqueen: {
    good: ['ana', 'zarya', 'sigma'],
    ok: ['bastion', 'mei', 'orisa', 'baptiste'],
    bad: ['lifeweaver', 'roadhog', 'brigitte'],
  },
  mauga: {
    good: ['ana', 'dva', 'zarya'],
    ok: ['sombra', 'orisa', 'sigma', 'symmetra'],
    bad: ['reinhardt', 'roadhog', 'lifeweaver'],
  },
  orisa: {
    good: ['sombra', 'ana', 'mei'],
    ok: ['reaper', 'symmetra', 'zarya', 'sigma'],
    bad: ['reinhardt', 'junkrat', 'bastion'],
  },
  ramattra: {
    good: ['ana', 'sombra', 'zarya'],
    ok: ['cassidy', 'mei', 'echo', 'sojourn'],
    bad: ['reinhardt', 'brigitte', 'roadhog'],
  },
  reinhardt: {
    good: ['pharah', 'echo', 'reaper'],
    ok: ['sigma', 'bastion', 'junkrat', 'ana', 'lucio'],
    bad: ['torbjorn', 'symmetra'],
  },
  roadhog: {
    good: ['ana', 'sombra', 'reaper'],
    ok: ['zarya', 'orisa', 'lucio', 'mei'],
    bad: ['widowmaker', 'zenyatta', 'tracer'],
  },
  sigma: {
    good: ['sombra', 'reaper', 'winston'],
    ok: ['ana', 'junkrat', 'mei', 'dva'],
    bad: ['pharah', 'hanzo', 'widowmaker'],
  },
  winston: {
    good: ['reaper', 'mei', 'brigitte'],
    ok: ['zarya', 'roadhog', 'ana', 'baptiste'],
    bad: ['zenyatta', 'widowmaker', 'ashe'],
  },
  wreckingball: {
    good: ['sombra', 'ana', 'cassidy'],
    ok: ['reaper', 'mei', 'brigitte', 'zarya'],
    bad: ['zenyatta', 'widowmaker', 'mercy'],
  },
  zarya: {
    good: ['sombra', 'ana', 'reaper'],
    ok: ['mei', 'echo', 'cassidy', 'moira'],
    bad: ['reinhardt', 'symmetra', 'winston', 'torbjorn'],
  },

  // ── 딜러 ────────────────────────────────────────────────
  ashe: {
    good: ['dva', 'winston', 'genji'],
    ok: ['sigma', 'sombra', 'tracer', 'doomfist'],
    bad: ['pharah', 'mercy', 'zenyatta'],
  },
  bastion: {
    good: ['genji', 'sombra', 'dva'],
    ok: ['pharah', 'tracer', 'widowmaker', 'ana'],
    bad: ['reinhardt', 'orisa', 'symmetra'],
  },
  cassidy: {
    good: ['pharah', 'echo', 'widowmaker'],
    ok: ['sigma', 'dva', 'hanzo', 'ashe'],
    bad: ['tracer', 'genji', 'winston'],
  },
  echo: {
    good: ['cassidy', 'ashe', 'soldier76'],
    ok: ['widowmaker', 'hanzo', 'dva', 'sojourn'],
    bad: ['reinhardt', 'brigitte', 'mei'],
  },
  freja: {
    good: ['winston', 'dva', 'genji'],
    ok: ['sigma', 'sombra', 'tracer', 'doomfist'],
    bad: ['pharah', 'mercy', 'zenyatta'],
  },
  genji: {
    good: ['winston', 'brigitte', 'mei'],
    ok: ['moira', 'zarya', 'cassidy', 'kiriko'],
    bad: ['hanzo', 'pharah', 'junkrat', 'torbjorn'],
  },
  hanzo: {
    good: ['winston', 'dva', 'genji'],
    ok: ['tracer', 'sombra', 'sigma', 'doomfist'],
    bad: ['pharah', 'mercy', 'lifeweaver'],
  },
  junkrat: {
    good: ['widowmaker', 'ashe', 'soldier76'],
    ok: ['pharah', 'echo', 'cassidy', 'dva'],
    bad: ['reinhardt', 'brigitte', 'mei'],
  },
  mei: {
    good: ['pharah', 'echo', 'widowmaker'],
    ok: ['ashe', 'soldier76', 'sombra', 'junkrat'],
    bad: ['reinhardt', 'winston', 'tracer'],
  },
  pharah: {
    good: ['soldier76', 'ashe', 'cassidy'],
    ok: ['widowmaker', 'sojourn', 'dva', 'baptiste'],
    bad: ['reinhardt', 'junkrat', 'torbjorn', 'mei'],
  },
  reaper: {
    good: ['pharah', 'ashe', 'widowmaker'],
    ok: ['soldier76', 'cassidy', 'sojourn', 'mei'],
    bad: ['winston', 'reinhardt', 'roadhog', 'moira'],
  },
  sojourn: {
    good: ['winston', 'dva', 'genji'],
    ok: ['sigma', 'sombra', 'tracer', 'doomfist'],
    bad: ['pharah', 'mercy', 'zenyatta'],
  },
  soldier76: {
    good: ['winston', 'dva', 'genji'],
    ok: ['sigma', 'sombra', 'tracer', 'reaper'],
    bad: ['pharah', 'mercy', 'zenyatta'],
  },
  sombra: {
    good: ['cassidy', 'brigitte', 'moira'],
    ok: ['torbjorn', 'symmetra', 'winston', 'zarya'],
    bad: ['wreckingball', 'widowmaker', 'mercy', 'ana'],
  },
  symmetra: {
    good: ['pharah', 'ashe', 'widowmaker'],
    ok: ['soldier76', 'cassidy', 'echo', 'hanzo'],
    bad: ['reinhardt', 'winston', 'genji'],
  },
  torbjorn: {
    good: ['pharah', 'widowmaker', 'ashe'],
    ok: ['echo', 'sojourn', 'soldier76', 'hanzo'],
    bad: ['reinhardt', 'winston', 'genji', 'tracer'],
  },
  tracer: {
    good: ['brigitte', 'cassidy', 'moira'],
    ok: ['torbjorn', 'symmetra', 'mei', 'kiriko'],
    bad: ['widowmaker', 'ana', 'zenyatta', 'mercy'],
  },
  venture: {
    good: ['cassidy', 'ashe', 'ana'],
    ok: ['sigma', 'brigitte', 'mei'],
    bad: ['zenyatta', 'widowmaker', 'mercy'],
  },
  widowmaker: {
    good: ['winston', 'dva', 'genji'],
    ok: ['sombra', 'tracer', 'doomfist', 'lucio'],
    bad: ['pharah', 'ashe', 'mercy'],
  },

  // ── 지원 ────────────────────────────────────────────────
  ana: {
    good: ['genji', 'tracer', 'winston'],
    ok: ['dva', 'doomfist', 'sombra', 'echo'],
    bad: ['reinhardt', 'roadhog', 'mercy'],
  },
  baptiste: {
    good: ['genji', 'tracer', 'winston'],
    ok: ['dva', 'sombra', 'doomfist', 'ana'],
    bad: ['reinhardt', 'junkrat', 'mercy'],
  },
  brigitte: {
    good: ['pharah', 'echo', 'widowmaker'],
    ok: ['ashe', 'cassidy', 'sojourn', 'junkrat'],
    bad: ['genji', 'tracer', 'winston', 'doomfist'],
  },
  illari: {
    good: ['winston', 'dva', 'genji'],
    ok: ['sombra', 'tracer', 'sigma'],
    bad: ['pharah', 'mercy', 'zenyatta'],
  },
  juno: {
    good: ['winston', 'dva', 'tracer'],
    ok: ['genji', 'sombra', 'sojourn'],
    bad: ['pharah', 'mercy', 'zenyatta'],
  },
  kiriko: {
    // 보호 부적이 안티힐·빙결을 지워서, 그걸로 먹고사는 픽이 헛돈다.
    good: ['widowmaker', 'sombra', 'hanzo'],
    ok: ['winston', 'tracer', 'cassidy'],
    bad: ['ana', 'mei', 'junkerqueen'],
  },
  lifeweaver: {
    // 생명의 손길이 갈고리·철권 각을 빼 간다.
    good: ['sombra', 'ana', 'widowmaker'],
    ok: ['tracer', 'genji', 'winston'],
    bad: ['roadhog', 'doomfist', 'junkerqueen'],
  },
  lucio: {
    good: ['ana', 'cassidy', 'sombra'],
    ok: ['widowmaker', 'hanzo', 'mei'],
    bad: ['reinhardt', 'roadhog', 'mauga'],
  },
  mercy: {
    good: ['widowmaker', 'sombra', 'tracer'],
    ok: ['hanzo', 'ashe', 'genji', 'winston'],
    bad: ['reinhardt', 'junkrat', 'moira'],
  },
  moira: {
    good: ['ana', 'ashe', 'widowmaker'],
    ok: ['cassidy', 'sojourn', 'soldier76', 'zenyatta'],
    bad: ['tracer', 'genji', 'winston'],
  },
  wuyang: {
    good: ['sombra', 'ana', 'widowmaker'],
    ok: ['tracer', 'genji', 'cassidy'],
    bad: ['reinhardt', 'roadhog', 'mei'],
  },
  zenyatta: {
    good: ['winston', 'dva', 'genji'],
    ok: ['tracer', 'doomfist', 'sombra', 'reaper'],
    bad: ['reinhardt', 'roadhog', 'mercy'],
  },
};
