/**
 * 경쟁전 맵 — 맵별 영웅 점수의 대상.
 *
 * 키(id)는 OverFast API 의 맵 키 그대로다. 사진은 scripts/sync_maps.py 가 받아
 * public/maps/<id>.webp 로 둔다. API 가 한국어 이름을 주지 않아서 이름은 손으로 적었다.
 *
 * 지금 일반전 · 경쟁전(5v5 · 6v6)에서 도는 맵만 둔다 — 2026 시즌 5 기준 31개. 목록과 한국어
 * 이름은 나무위키 맵 문서의 "일반전 | 경쟁전" 표를 따랐다. 돌격 · 격돌 · 스타디움 · 아케이드
 * 맵은 뺐다. 시즌마다 맵이 바뀌면 여기를 고친다.
 * 거점(쟁탈 구간 등)은 다음 단계에서 붙인다.
 */
export type MapMode = 'control' | 'escort' | 'hybrid' | 'push' | 'flashpoint';

export interface OwMap {
  id: string;
  ko: string;
  mode: MapMode;
}

export const MODES: { k: MapMode; ko: string }[] = [
  { k: 'escort', ko: '호위' },
  { k: 'hybrid', ko: '혼합' },
  { k: 'control', ko: '쟁탈' },
  { k: 'push', ko: '밀기' },
  { k: 'flashpoint', ko: '플래시포인트' },
];

export const MAPS: OwMap[] = [
  // 쟁탈
  { id: 'antarctic-peninsula', ko: '남극 반도', mode: 'control' },
  { id: 'busan', ko: '부산', mode: 'control' },
  { id: 'ilios', ko: '일리오스', mode: 'control' },
  { id: 'lijiang-tower', ko: '리장 타워', mode: 'control' },
  { id: 'nepal', ko: '네팔', mode: 'control' },
  { id: 'oasis', ko: '오아시스', mode: 'control' },
  { id: 'samoa', ko: '사모아', mode: 'control' },
  // 호위
  { id: 'circuit-royal', ko: '서킷 로얄', mode: 'escort' },
  { id: 'dorado', ko: '도라도', mode: 'escort' },
  { id: 'havana', ko: '하바나', mode: 'escort' },
  { id: 'junkertown', ko: '쓰레기촌', mode: 'escort' },
  { id: 'rialto', ko: '리알토', mode: 'escort' },
  { id: 'route-66', ko: '66번 국도', mode: 'escort' },
  { id: 'shambali-monastery', ko: '샴발리 수도원', mode: 'escort' },
  { id: 'watchpoint-gibraltar', ko: '감시 기지: 지브롤터', mode: 'escort' },
  { id: 'watchpoint-grimsvotn', ko: '그림스뵈튼', mode: 'escort' },
  // 혼합
  { id: 'blizzard-world', ko: '블리자드 월드', mode: 'hybrid' },
  { id: 'eichenwalde', ko: '아이헨발데', mode: 'hybrid' },
  { id: 'hollywood', ko: '할리우드', mode: 'hybrid' },
  { id: 'kings-row', ko: '왕의 길', mode: 'hybrid' },
  { id: 'midtown', ko: '미드타운', mode: 'hybrid' },
  { id: 'neon-junction', ko: '네온 교차로', mode: 'hybrid' },
  { id: 'numbani', ko: '눔바니', mode: 'hybrid' },
  { id: 'paraiso', ko: '파라이수', mode: 'hybrid' },
  // 밀기
  { id: 'colosseo', ko: '콜로세오', mode: 'push' },
  { id: 'esperanca', ko: '이스페란사', mode: 'push' },
  { id: 'new-queen-street', ko: '뉴 퀸 스트리트', mode: 'push' },
  { id: 'runasapi', ko: '루나사피', mode: 'push' },
  // 플래시포인트
  { id: 'aatlis', ko: '아틀리스', mode: 'flashpoint' },
  { id: 'new-junk-city', ko: '뉴 정크 시티', mode: 'flashpoint' },
  { id: 'suravasa', ko: '수라바사', mode: 'flashpoint' },
];

export const MAP_IDS = new Set(MAPS.map((m) => m.id));
export const mapById = (id: string | null | undefined) => MAPS.find((m) => m.id === id);
export const mapImage = (id: string) => `${import.meta.env.BASE_URL}maps/${id}.webp`;

/** 맵 점수 뜻 — 상성(매우 유리 …)과 같은 눈금을 맵에 맞게 부른다. */
export const MAP_LABEL: Record<number, string> = {
  3: '매우 좋음',
  2: '좋음',
  1: '약간 좋음',
  0: '보통',
  [-1]: '약간 나쁨',
  [-2]: '나쁨',
  [-3]: '매우 나쁨',
};
