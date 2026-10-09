import type { HeroId } from './heroes';

/**
 * 둘러보기에 거는 추천 상성 — 수파베이스 시드의 원본.
 *
 *   node scripts/seed_featured.mjs > supabase/seed/featured.sql
 *
 * 앱은 이 파일을 읽지 않는다. 화면은 DB 의 featured 줄을 읽는다.
 *
 * 해설자 · 스트리머 · 프로가 자기 코드를 걸어 두면 구독자가 [따라가기] 한 번으로
 * 그 사람의 표를 쓴다. 실제 인물의 이름과 표는 본인 동의를 받고 본인이 직접
 * 만든 것만 건다 — 그래서 목업에는 가상의 이름을 쓴다.
 *
 * `changes` 는 나무위키와 다르게 둔 짝이다. 나머지는 나무위키 그대로다.
 */
export interface Featured {
  code: string;
  name: string;
  /** 한 줄 소개 — 이 표가 어떤 관점인지. */
  blurb: string;
  /** [내 픽, 적 픽, 점수] — 반대 칸은 부호를 뒤집어 들어간다. */
  changes: [HeroId, HeroId, number][];
}

export const FEATURED: Featured[] = [
  {
    code: 'CAST7A',
    name: '해설자 A',
    blurb: '대회 메타 기준. 다이브 상대 탱커 상성을 더 세게 봤어요.',
    changes: [
      ['winston', 'genji', 2],
      ['winston', 'tracer', 3],
      ['dva', 'pharah', 2],
      ['sigma', 'reinhardt', -1],
      ['zarya', 'mei', 2],
      ['ana', 'winston', -3],
    ],
  },
  {
    code: 'STRM4B',
    name: '스트리머 B',
    blurb: '솔큐 다이아~마스터 체감. 빠른 대전에서 바로 먹히는 것 위주.',
    changes: [
      ['cassidy', 'tracer', 2],
      ['cassidy', 'genji', 1],
      ['moira', 'sombra', 0],
      ['junkrat', 'reinhardt', 2],
      ['hanzo', 'widowmaker', -2],
    ],
  },
  {
    code: 'PRO9C2',
    name: '프로게이머 C',
    blurb: '스크림에서 실제로 쓰는 스왑 기준. 딜러 상성을 촘촘하게 고쳤어요.',
    changes: [
      ['sojourn', 'widowmaker', 1],
      ['widowmaker', 'pharah', 2],
      ['echo', 'reinhardt', 2],
      ['tracer', 'ashe', 2],
      ['genji', 'zenyatta', 2],
      ['venture', 'zarya', 0],
      ['kiriko', 'ana', 1],
    ],
  },
  {
    code: 'COCH3D',
    name: '코치 D',
    blurb: '입문자용. 판단이 어려운 짝은 중립으로 눌러 둬서 헷갈리지 않게.',
    changes: [
      ['reinhardt', 'bastion', 0],
      ['mercy', 'widowmaker', 0],
      ['soldier76', 'pharah', 1],
      ['lucio', 'roadhog', -1],
    ],
  },
];
