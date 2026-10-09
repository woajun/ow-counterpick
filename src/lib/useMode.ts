import { useCallback, useState } from 'react';

/** 추천 기준 — 적 조합을 카운터하나, 우리 팀 조합에 맞추나. */
export type Mode = 'counter' | 'combo';

const KEY = 'ow-counterpick.mode';

/**
 * 조합 모드를 화면에 내놓을지. 아직 실전성이 떨어져 숨겨 둔다(10/4) — 궁합 등급이
 * 문서 글을 읽어 매긴 것이라 거칠다. 코드와 자료(synergy.ts)는 그대로 두고 단추만 감춘다.
 */
export const COMBO_ENABLED = false;

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
