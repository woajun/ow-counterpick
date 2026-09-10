import type { HeroId } from './heroes';

/**
 * 영웅별 나무위키 문서 제목.
 *
 * 이름이 겹치는 영웅은 동음이의어 문서로 밀려서 `(오버워치)` 가 붙는다 —
 * `파라` 는 아랍어 이름 문서고, 오버워치 파라는 `파라(오버워치)` 다.
 *
 * scripts/scrape_matchups.py 가 실제로 받아 온 제목을 그대로 적는다.
 */
const DOCS: Record<HeroId, string> = {
  dmon: 'D.Mon',
  domina: '도미나',
  doomfist: '둠피스트',
  dva: 'D.Va',
  hazard: '해저드',
  junkerqueen: '정커퀸',
  mauga: '마우가',
  orisa: '오리사',
  ramattra: '라마트라',
  reinhardt: '라인하르트(오버워치)',
  roadhog: '로드호그',
  sigma: '시그마(오버워치)',
  winston: '윈스턴(오버워치)',
  wreckingball: '레킹볼(오버워치)',
  zarya: '자리야',
  anran: '안란',
  ashe: '애쉬(오버워치)',
  bastion: '바스티온',
  cassidy: '캐서디',
  echo: '에코(오버워치)',
  emre: '엠레(오버워치)',
  freja: '프레야',
  genji: '겐지(오버워치)',
  hanzo: '한조(오버워치)',
  junkrat: '정크랫',
  mei: '메이(오버워치)',
  pharah: '파라(오버워치)',
  reaper: '리퍼(오버워치)',
  shion: '시온(오버워치)',
  sierra: '시에라(오버워치)',
  sojourn: '소전(오버워치)',
  soldier76: '솔저: 76',
  sombra: '솜브라',
  symmetra: '시메트라',
  torbjorn: '토르비욘',
  tracer: '트레이서(오버워치)',
  vendetta: '벤데타(오버워치)',
  venture: '벤처(오버워치)',
  widowmaker: '위도우메이커',
  ana: '아나(오버워치)',
  baptiste: '바티스트(오버워치)',
  brigitte: '브리기테',
  illari: '일리아리',
  jetpackcat: '제트팩 캣',
  juno: '주노(오버워치)',
  kiriko: '키리코(오버워치)',
  lifeweaver: '라이프위버',
  lucio: '루시우(오버워치)',
  mercy: '메르시',
  mizuki: '미즈키(오버워치)',
  moira: '모이라(오버워치)',
  wuyang: '우양',
  zenyatta: '젠야타',
};

/**
 * 그 영웅의 상성 절로 바로 가는 주소.
 *
 * 값이 이상하면 여기가 고칠 자리다. 이 도구는 옮겨 적은 사본이라 여기서
 * 고쳐 봐야 원본은 그대로다.
 */
export const namuUrl = (id: HeroId) =>
  `https://namu.wiki/w/${encodeURIComponent(DOCS[id])}#상성`;
