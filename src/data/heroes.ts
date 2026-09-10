export type Role = 'tank' | 'dmg' | 'sup';

export interface Hero {
  /** 타일과 근거 칩에 쓰는 짧은 이름 — 좁은 칸에서 줄바꿈이 안 나게. */
  ko: string;
  /** 정식 이름. 슬롯과 추천 줄에 쓴다. */
  full: string;
  en: string;
  r: Role;
}

/** 초상화는 public/heroes/<id>.webp 에 있다. scripts/sync_heroes.py 가 받아 온다. */
export const portrait = (id: HeroId) =>
  `${import.meta.env.BASE_URL}heroes/${id}.webp`;

/* 이 표는 scripts/sync_heroes.py 가 다시 쓴다. 손으로 고치면 다음 실행에
   날아가니, 이름을 바꾸고 싶으면 그 스크립트의 SHORT / FULL 을 고칠 것. */
export const HEROES = {
  // ── 탱커 ──────────────────────────────
  dmon: { ko: 'D.Mon', full: 'D.Mon', en: 'D.Mon', r: 'tank' },
  domina: { ko: '도미나', full: '도미나', en: 'Domina', r: 'tank' },
  doomfist: { ko: '둠피', full: '둠피스트', en: 'Doomfist', r: 'tank' },
  dva: { ko: '디바', full: '디바', en: 'D.Va', r: 'tank' },
  hazard: { ko: '해저드', full: '해저드', en: 'Hazard', r: 'tank' },
  junkerqueen: { ko: '정커퀸', full: '정커퀸', en: 'Junker Queen', r: 'tank' },
  mauga: { ko: '마우가', full: '마우가', en: 'Mauga', r: 'tank' },
  orisa: { ko: '오리사', full: '오리사', en: 'Orisa', r: 'tank' },
  ramattra: { ko: '라마트라', full: '라마트라', en: 'Ramattra', r: 'tank' },
  reinhardt: { ko: '라인', full: '라인하르트', en: 'Reinhardt', r: 'tank' },
  roadhog: { ko: '로드호그', full: '로드호그', en: 'Roadhog', r: 'tank' },
  sigma: { ko: '시그마', full: '시그마', en: 'Sigma', r: 'tank' },
  winston: { ko: '윈스턴', full: '윈스턴', en: 'Winston', r: 'tank' },
  wreckingball: { ko: '레킹볼', full: '레킹볼', en: 'Wrecking Ball', r: 'tank' },
  zarya: { ko: '자리야', full: '자리야', en: 'Zarya', r: 'tank' },

  // ── 딜러 ──────────────────────────────
  anran: { ko: '안란', full: '안란', en: 'Anran', r: 'dmg' },
  ashe: { ko: '애쉬', full: '애쉬', en: 'Ashe', r: 'dmg' },
  bastion: { ko: '바스티온', full: '바스티온', en: 'Bastion', r: 'dmg' },
  cassidy: { ko: '캐서디', full: '캐서디', en: 'Cassidy', r: 'dmg' },
  echo: { ko: '에코', full: '에코', en: 'Echo', r: 'dmg' },
  emre: { ko: '엠레', full: '엠레', en: 'Emre', r: 'dmg' },
  freja: { ko: '프레야', full: '프레야', en: 'Freja', r: 'dmg' },
  genji: { ko: '겐지', full: '겐지', en: 'Genji', r: 'dmg' },
  hanzo: { ko: '한조', full: '한조', en: 'Hanzo', r: 'dmg' },
  junkrat: { ko: '정크랫', full: '정크랫', en: 'Junkrat', r: 'dmg' },
  mei: { ko: '메이', full: '메이', en: 'Mei', r: 'dmg' },
  pharah: { ko: '파라', full: '파라', en: 'Pharah', r: 'dmg' },
  reaper: { ko: '리퍼', full: '리퍼', en: 'Reaper', r: 'dmg' },
  shion: { ko: '시온', full: '시온', en: 'Shion', r: 'dmg' },
  sierra: { ko: '시에라', full: '시에라', en: 'Sierra', r: 'dmg' },
  sojourn: { ko: '소전', full: '소전', en: 'Sojourn', r: 'dmg' },
  soldier76: { ko: '솔저', full: '솔저: 76', en: 'Soldier: 76', r: 'dmg' },
  sombra: { ko: '솜브라', full: '솜브라', en: 'Sombra', r: 'dmg' },
  symmetra: { ko: '시메트라', full: '시메트라', en: 'Symmetra', r: 'dmg' },
  torbjorn: { ko: '토르비욘', full: '토르비욘', en: 'Torbjörn', r: 'dmg' },
  tracer: { ko: '트레이서', full: '트레이서', en: 'Tracer', r: 'dmg' },
  vendetta: { ko: '벤데타', full: '벤데타', en: 'Vendetta', r: 'dmg' },
  venture: { ko: '벤처', full: '벤처', en: 'Venture', r: 'dmg' },
  widowmaker: { ko: '위도우', full: '위도우메이커', en: 'Widowmaker', r: 'dmg' },

  // ── 지원 ──────────────────────────────
  ana: { ko: '아나', full: '아나', en: 'Ana', r: 'sup' },
  baptiste: { ko: '바티스트', full: '바티스트', en: 'Baptiste', r: 'sup' },
  brigitte: { ko: '브리기테', full: '브리기테', en: 'Brigitte', r: 'sup' },
  illari: { ko: '일리아리', full: '일리아리', en: 'Illari', r: 'sup' },
  jetpackcat: { ko: '제트팩캣', full: '제트팩 캣', en: 'Jetpack Cat', r: 'sup' },
  juno: { ko: '주노', full: '주노', en: 'Juno', r: 'sup' },
  kiriko: { ko: '키리코', full: '키리코', en: 'Kiriko', r: 'sup' },
  lifeweaver: { ko: '라위', full: '라이프위버', en: 'Lifeweaver', r: 'sup' },
  lucio: { ko: '루시우', full: '루시우', en: 'Lúcio', r: 'sup' },
  mercy: { ko: '메르시', full: '메르시', en: 'Mercy', r: 'sup' },
  mizuki: { ko: '미즈키', full: '미즈키', en: 'Mizuki', r: 'sup' },
  moira: { ko: '모이라', full: '모이라', en: 'Moira', r: 'sup' },
  wuyang: { ko: '우양', full: '우양', en: 'Wuyang', r: 'sup' },
  zenyatta: { ko: '젠야타', full: '젠야타', en: 'Zenyatta', r: 'sup' },
} as const satisfies Record<string, Hero>;

export type HeroId = keyof typeof HEROES;

export const HERO_IDS = Object.keys(HEROES) as HeroId[];

export const isHeroId = (v: unknown): v is HeroId =>
  typeof v === 'string' && v in HEROES;

export const ROLES: { k: Role; ko: string; en: string }[] = [
  { k: 'tank', ko: '탱커', en: 'Tank' },
  { k: 'dmg', ko: '딜러', en: 'Damage' },
  { k: 'sup', ko: '지원', en: 'Support' },
];
