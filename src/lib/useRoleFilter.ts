import { useCallback, useState } from 'react';
import type { Role } from '../data/heroes';

const KEY = 'ow-counterpick.role';

const isRole = (v: unknown): v is Role =>
  v === 'tank' || v === 'dmg' || v === 'sup';

/**
 * 추천에서 보고 싶은 역할. `null` 이면 전부 본다.
 *
 * 기억해 둔다 — 주로 하는 역할은 잘 안 바뀌는데, 알트탭으로 넘어올 때마다
 * 다시 고르게 하면 몇 초 안에 쓰는 도구가 아니게 된다.
 */
export function useRoleFilter() {
  const [role, set] = useState<Role | null>(() => {
    try {
      const v = localStorage.getItem(KEY);
      return isRole(v) ? v : null;
    } catch {
      // 시크릿 창이나 저장이 막힌 브라우저. 기억은 못 해도 도구는 돌아간다.
      return null;
    }
  });

  const choose = useCallback((next: Role | null) => {
    set(next);
    try {
      if (next) localStorage.setItem(KEY, next);
      else localStorage.removeItem(KEY);
    } catch {
      /* 저장이 막혀 있어도 그냥 넘어간다 */
    }
  }, []);

  return [role, choose] as const;
}
