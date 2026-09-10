import { HERO_IDS, type HeroId } from '../data/heroes';
import { MATCHUPS, type Level } from '../data/matchups';

/** [내 영웅][적 영웅] 한 칸의 점수. 상성이 안 적혀 있으면 0. */
export type Matrix = Record<HeroId, Record<HeroId, number>>;

/**
 * 상성표 전체를 행렬로 편다.
 *
 * 칸 값은 scoreAll 이 적 하나에서 얹는 점수 그대로다. 상성표에 적힌 것과
 * 표에 보이는 것이 어긋나면 검수하는 의미가 없다.
 */
function build(): Matrix {
  const m = {} as Matrix;
  for (const mine of HERO_IDS) {
    m[mine] = {} as Record<HeroId, number>;
    for (const enemy of HERO_IDS) m[mine][enemy] = 0;
  }

  for (const enemy of HERO_IDS) {
    for (const [mine, level] of Object.entries(MATCHUPS[enemy]) as [
      HeroId,
      Level,
    ][]) {
      m[mine][enemy] = level;
    }
  }
  return m;
}

/** 상성표는 상수라 한 번만 편다. */
export const MATRIX = build();

/**
 * 상성을 아직 한 줄도 안 적은 영웅.
 *
 * 표에서 빈 세로줄이 "이 영웅한테는 딱히 카운터가 없다" 인지 "아직 안 적었다"
 * 인지 갈라 준다. 새 영웅이 나온 다음 채워 넣을 자리를 찾는 데 쓴다.
 */
export const UNFILLED = new Set(
  HERO_IDS.filter((id) => Object.keys(MATCHUPS[id]).length === 0),
);

/** 한 줄(가로든 세로든)을 요약한 것. */
export interface Line {
  /** 점수 합. */
  sum: number;
  /** 유리한 칸 수. */
  up: number;
  /** 불리한 칸 수. */
  down: number;
}

const summarize = (values: number[]): Line => ({
  sum: values.reduce((a, b) => a + b, 0),
  up: values.filter((v) => v > 0).length,
  down: values.filter((v) => v < 0).length,
});

/** 내 영웅 한 명이 적 전체를 상대로 어떤지. */
export const rowLine = (mine: HeroId, enemies: HeroId[] = HERO_IDS): Line =>
  summarize(enemies.map((e) => MATRIX[mine][e]));

/** 적 한 명을 상대로 내 쪽 픽들이 어떤지. */
export const colLine = (enemy: HeroId, mine: HeroId[] = HERO_IDS): Line =>
  summarize(mine.map((m) => MATRIX[m][enemy]));

/** 칸에 붙일 클래스. p 가 유리, n 이 불리, 숫자가 세기다. */
export const cellTone = (v: number) =>
  v === 0 ? '' : `${v > 0 ? 'p' : 'n'}${Math.abs(v)}`;

/** 표에서는 하이픈 대신 진짜 빼기 기호를 쓴다 — 숫자 폭이 안 흔들린다. */
export const signed = (v: number) => (v > 0 ? `+${v}` : String(v).replace('-', '−'));
