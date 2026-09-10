import type { HeroId } from './heroes';

/**
 * 두 영웅의 나무위키 문서가 서로 어긋나게 적어 둔 짝.
 *
 * 애쉬 문서는 "메이 상대로 불리"라고 적고, 메이 문서도 "애쉬 상대로 불리"라고
 * 적는다. 둘 다 자기가 진다는 말이라 앞뒤가 안 맞는다. 옮겨 적으면서 생긴
 * 오류가 아니라 원본이 그렇게 되어 있는 것이라, 한쪽으로 정하려면 사람이
 * 판단해야 한다.
 *
 * 상성표에서 이 짝을 따로 표시해 준다 — 표시가 없으면 도구가 고장 난 것처럼
 * 보인다.
 *
 * scripts/scrape_matchups.py 가 다시 쓴다. 손으로 고치면 다음 실행에 날아간다.
 */
export interface Conflict {
  a: HeroId;
  b: HeroId;
  /** 둘 다 유리하다고 적었는지(`up`), 둘 다 불리하다고 적었는지(`down`). */
  both: 'up' | 'down';
}

export const CONFLICTS: Conflict[] = [
  { a: 'ana', b: 'moira', both: 'up' }, // 아나 ↔ 모이라
  { a: 'anran', b: 'baptiste', both: 'down' }, // 안란 ↔ 바티스트
  { a: 'anran', b: 'bastion', both: 'up' }, // 안란 ↔ 바스티온
  { a: 'anran', b: 'echo', both: 'down' }, // 안란 ↔ 에코
  { a: 'anran', b: 'juno', both: 'up' }, // 안란 ↔ 주노
  { a: 'anran', b: 'mercy', both: 'up' }, // 안란 ↔ 메르시
  { a: 'ashe', b: 'mei', both: 'down' }, // 애쉬 ↔ 메이
  { a: 'ashe', b: 'tracer', both: 'up' }, // 애쉬 ↔ 트레이서
  { a: 'dmon', b: 'orisa', both: 'up' }, // D.Mon ↔ 오리사
  { a: 'domina', b: 'zarya', both: 'up' }, // 도미나 ↔ 자리야
  { a: 'doomfist', b: 'bastion', both: 'up' }, // 둠피스트 ↔ 바스티온
  { a: 'doomfist', b: 'emre', both: 'up' }, // 둠피스트 ↔ 엠레
  { a: 'echo', b: 'illari', both: 'down' }, // 에코 ↔ 일리아리
  { a: 'echo', b: 'jetpackcat', both: 'down' }, // 에코 ↔ 제트팩 캣
  { a: 'freja', b: 'juno', both: 'up' }, // 프레야 ↔ 주노
  { a: 'freja', b: 'sojourn', both: 'up' }, // 프레야 ↔ 소전
  { a: 'junkerqueen', b: 'anran', both: 'up' }, // 정커퀸 ↔ 안란
  { a: 'junkerqueen', b: 'illari', both: 'up' }, // 정커퀸 ↔ 일리아리
  { a: 'junkerqueen', b: 'mizuki', both: 'up' }, // 정커퀸 ↔ 미즈키
  { a: 'junkerqueen', b: 'tracer', both: 'up' }, // 정커퀸 ↔ 트레이서
  { a: 'mauga', b: 'wuyang', both: 'up' }, // 마우가 ↔ 우양
  { a: 'pharah', b: 'sombra', both: 'up' }, // 파라 ↔ 솜브라
  { a: 'ramattra', b: 'ana', both: 'down' }, // 라마트라 ↔ 아나
  { a: 'reinhardt', b: 'genji', both: 'up' }, // 라인하르트 ↔ 겐지
  { a: 'reinhardt', b: 'soldier76', both: 'up' }, // 라인하르트 ↔ 솔저: 76
  { a: 'roadhog', b: 'mei', both: 'up' }, // 로드호그 ↔ 메이
  { a: 'shion', b: 'brigitte', both: 'up' }, // 시온 ↔ 브리기테
  { a: 'soldier76', b: 'ana', both: 'up' }, // 솔저: 76 ↔ 아나
  { a: 'sombra', b: 'tracer', both: 'up' }, // 솜브라 ↔ 트레이서
  { a: 'symmetra', b: 'tracer', both: 'down' }, // 시메트라 ↔ 트레이서
  { a: 'tracer', b: 'illari', both: 'down' }, // 트레이서 ↔ 일리아리
  { a: 'venture', b: 'illari', both: 'up' }, // 벤처 ↔ 일리아리
  { a: 'wreckingball', b: 'freja', both: 'up' }, // 레킹볼 ↔ 프레야
  { a: 'zarya', b: 'freja', both: 'down' }, // 자리야 ↔ 프레야
  { a: 'zarya', b: 'mei', both: 'down' }, // 자리야 ↔ 메이
  { a: 'zarya', b: 'sojourn', both: 'down' }, // 자리야 ↔ 소전
  { a: 'zarya', b: 'symmetra', both: 'down' }, // 자리야 ↔ 시메트라
];

const key = (a: HeroId, b: HeroId) => (a < b ? `${a}|${b}` : `${b}|${a}`);

const INDEX = new Map(CONFLICTS.map((c) => [key(c.a, c.b), c]));

/** 이 짝이 어긋나 있나. 어느 쪽을 먼저 넣든 같다. */
export const conflictOf = (a: HeroId, b: HeroId) => INDEX.get(key(a, b));
