import { createClient } from '@supabase/supabase-js';

/**
 * 수파베이스 — 상성표와 로그인.
 *
 * 둘 다 브라우저에 공개되는 값이다(publishable key). 쓰기 권한은 DB 의 RLS 가 막는다 —
 * supabase/migrations 를 볼 것. secret key 는 여기 절대 두지 않는다.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** 값이 없으면 null — 그때는 로그인 · 코드 없이 나무위키만 쓴다. */
export const supabase = url && key ? createClient(url, key) : null;

/** sheets 테이블 한 줄. */
export interface SheetRow {
  id: string;
  owner: string | null;
  code: string;
  name: string;
  sheet: Record<string, number> | null;
  featured: boolean;
  blurb: string | null;
  updated_at: string;
}
