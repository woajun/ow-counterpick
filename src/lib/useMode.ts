import { useCallback, useState } from 'react';

/** 추천 기준 — 적 조합을 카운터하나, 우리 팀 조합에 맞추나. */
export type Mode = 'counter' | 'combo';

const KEY = 'ow-counterpick.mode';

/**
 * 조합 모드를 화면에 내놓을지. 10/4 에 궁합 등급이 거칠다며 숨겼다가, 10/11 에 다시 켰다 —
 * 인게임 · 살펴보기 모두 [상성 | 조합] 으로 고른다.
 */
export const COMBO_ENABLED = true;

/** 기억해 둔다 — 알트탭으로 넘어올 때마다 다시 고르게 하지 않으려고. */
export function useMode() {
  const [mode, set] = useState<Mode>(() => {
    if (!COMBO_ENABLED) return 'counter';
    try {
      return localStorage.getItem(KEY) === 'combo' ? 'combo' : 'counter';
    } catch {
      return 'counter';
    }
  });
  const choose = useCallback((next: Mode) => {
    set(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* 저장이 막혀 있어도 그냥 넘어간다 */
    }
  }, []);
  return [mode, choose] as const;
}
