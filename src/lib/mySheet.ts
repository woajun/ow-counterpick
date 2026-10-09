import { useSyncExternalStore } from 'react';
import { HERO_IDS, isHeroId, type HeroId } from '../data/heroes';
import { isNeutral } from '../data/neutral';
import { MATRIX, type Matrix } from './matrix';
import { supabase, type SheetRow } from './supabase';

/**
 * 내 상성 — 둘 중 하나다.
 *
 *   나무위키 (기본)  나무위키 상성을 그대로 쓴다. 나무위키가 바뀌면 같이 바뀐다.
 *   내 상성          한 칸이라도 고친 순간 나무위키와의 연결이 끊기고, 그때의 표
 *                    전체를 통째로 내 것으로 들고 간다.
 *
 * 남의 표는 주소(?code=코드)로 열어 본다(peek). 내 상태는 안 바뀌고, 북마크하면
 * 로그인 없이 언제든 그 사람의 최신 표로 열린다.
 *
 * 로그인하면 수파베이스 sheets 테이블의 제 줄에 저장한다(코드도 거기서 받는다).
 * 로그인 전에는 sessionStorage 라 창을 닫으면 사라진다.
 *
 * 한 칸을 고치면 반대 칸도 부호를 뒤집어 같이 고친다.
 */

export interface User {
  id: string;
  /** 화면에 뜨는 이름 — "○○의 카운터픽". */
  name: string;
  /** Battle.net 으로 들어왔으면 배틀태그가 확인된 사용자다(아직 없음). */
  verified: boolean;
}

/** 상성표 한 장. `mine>enemy` → −3 … +3. 칸이 없으면 "적힌 것 없음"이다. */
export type Sheet = Record<string, number>;

interface State {
  user: User | null;
  /** null 이면 나무위키를 따라간다. */
  sheet: Sheet | null;
  /** 내 코드. 로그인하면 DB 가 준다. */
  code?: string;
}

const DRAFT = 'ow-counterpick.draft';
/** 로그인한 사람의 마지막 상태 — 알트탭으로 열었을 때 DB 를 기다리지 않고 바로 그린다. */
const CACHE = 'ow-counterpick.cache';

const key = (mine: HeroId, enemy: HeroId) => `${mine}>${enemy}`;

function clean(raw: unknown): Sheet | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Sheet = {};
  for (const [k, v] of Object.entries(raw)) {
    const [a, b] = k.split('>');
    if (isHeroId(a) && isHeroId(b) && typeof v === 'number' && v >= -3 && v <= 3) {
      out[k] = Math.round(v);
    }
  }
  return out;
}

function read<T>(storage: () => Storage, k: string): T | null {
  try {
    const raw = storage().getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: () => Storage, k: string, v: unknown) {
  try {
    if (v === null) storage().removeItem(k);
    else storage().setItem(k, JSON.stringify(v));
  } catch {
    /* 저장이 막힌 브라우저 — 이번 창에서만 쓴다 */
  }
}

const local = () => localStorage;
const session = () => sessionStorage;

// ── 나무위키와 비교 ─────────────────────────────────────

/** 나무위키 값. 중립이라 적힌 것은 0, 아예 안 적힌 것은 null. */
export const namuValue = (a: HeroId, b: HeroId): number | null =>
  MATRIX[a][b] !== 0 || isNeutral(a, b) ? MATRIX[a][b] : null;

/** 나무위키 표 전체를 한 장으로 — 처음 고치는 순간 이걸 들고 떨어져 나온다. */
function namuSheet(): Sheet {
  const out: Sheet = {};
  for (const a of HERO_IDS) {
    for (const b of HERO_IDS) {
      if (a === b) continue;
      const v = namuValue(a, b);
      if (v !== null) out[key(a, b)] = v;
    }
  }
  return out;
}

const valueIn = (sheet: Sheet | null, a: HeroId, b: HeroId) =>
  sheet === null ? namuValue(a, b) : key(a, b) in sheet ? sheet[key(a, b)] : null;

/** 나무위키와 다른 짝 수. 앞뒤 두 칸이 한 짝이다. */
export function diffCount(sheet: Sheet | null) {
  if (sheet === null) return 0;
  let n = 0;
  for (let i = 0; i < HERO_IDS.length; i++) {
    for (let j = i + 1; j < HERO_IDS.length; j++) {
      const a = HERO_IDS[i];
      const b = HERO_IDS[j];
      if (valueIn(sheet, a, b) !== namuValue(a, b) || valueIn(sheet, b, a) !== namuValue(b, a)) n++;
    }
  }
  return n;
}

function toMatrix(sheet: Sheet | null): Matrix {
  if (sheet === null) return MATRIX;
  const m = {} as Matrix;
  for (const id of HERO_IDS) {
    m[id] = {} as Record<HeroId, number>;
    for (const e of HERO_IDS) m[id][e] = 0;
  }
  for (const [k, v] of Object.entries(sheet)) {
    const [a, b] = k.split('>') as [HeroId, HeroId];
    m[a][b] = v;
  }
  return m;
}

// ── 코드 ───────────────────────────────────────────────

/** 대문자·숫자 6자. 헷갈리는 0 · O · 1 · I 는 DB 가 안 만든다. */
export const CODE_LEN = 6;

/** 입력을 코드 모양으로 — 소문자 · 띄어쓰기 · 붙임표를 받아 준다. */
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

const COLS = 'id, owner, code, name, sheet, featured, blurb, updated_at';

/** 코드의 표를 읽는다. 없는 코드면 null. */
async function fetchCode(code: string): Promise<{ row: SheetRow; sheet: Sheet | null } | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('sheets').select(COLS).eq('code', code).maybeSingle<SheetRow>();
  return data ? { row: data, sheet: data.sheet === null ? null : clean(data.sheet) } : null;
}

// ── 상태 ───────────────────────────────────────────────

let state: State = { user: null, sheet: null };
let matrix = MATRIX;
let diff = 0;
let computedFor: Sheet | null = null;
const subs = new Set<() => void>();

function emit() {
  if (computedFor !== state.sheet) {
    matrix = toMatrix(state.sheet);
    diff = diffCount(state.sheet);
    computedFor = state.sheet;
  }
  subs.forEach((f) => f());
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

/** 로그인했으면 DB 에(조금 모았다가), 아니면 이 창에만. */
function persist() {
  if (state.user) {
    write(local, CACHE, { ...state });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void saveRow(), 400);
  } else {
    write(session, DRAFT, { sheet: state.sheet });
  }
}

async function saveRow() {
  if (!supabase || !state.user) return;
  const { data, error } = await supabase
    .from('sheets')
    .upsert(
      {
        owner: state.user.id,
        name: state.user.name,
        sheet: state.sheet,
      },
      { onConflict: 'owner' },
    )
    .select('code')
    .single<{ code: string }>();
  if (error) {
    console.error('상성 저장 실패', error);
    return;
  }
  if (data.code !== state.code) {
    state = { ...state, code: data.code };
    write(local, CACHE, { ...state });
    emit();
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  emit();
}

/** 고치기 전에 — 나무위키를 따라가던 중이면 나무위키 표 전체를 내 것으로 든다. */
const forked = (): Sheet => ({ ...(state.sheet ?? namuSheet()) });

function put(sheet: Sheet, a: HeroId, b: HeroId, v: number | null) {
  if (v === null) delete sheet[key(a, b)];
  else sheet[key(a, b)] = v === 0 ? 0 : v; // −0 을 남기지 않는다
}

/** 한 짝을 정한다. 반대 칸은 부호를 뒤집는다. null 이면 둘 다 나무위키 값으로. */
export function setPair(a: HeroId, b: HeroId, v: number | null) {
  const sheet = forked();
  if (v === null) {
    put(sheet, a, b, namuValue(a, b));
    put(sheet, b, a, namuValue(b, a));
  } else {
    put(sheet, a, b, v);
    put(sheet, b, a, -v);
  }
  set({ sheet });
}

/** 한 영웅이 낀 짝을 모두 나무위키 값으로. */
export function resetHero(id: HeroId) {
  const sheet = forked();
  for (const e of HERO_IDS) {
    if (e === id) continue;
    put(sheet, id, e, namuValue(id, e));
    put(sheet, e, id, namuValue(e, id));
  }
  set({ sheet });
}

/** 초기화 — 나무위키를 따라간다. */
export function resetAll() {
  set({ sheet: null });
}

/** 내 코드. 로그인해야 있다 — 첫 저장 때 DB 가 준다. */
export function publishCode(): string | null {
  if (!state.user) return null;
  if (!state.code) void saveRow();
  return state.code ?? null;
}

/** 코드로 표를 찾는다. 없는 코드면 null. */
export async function findCode(input: string) {
  const hit = await fetchCode(normalizeCode(input));
  return hit ? { sheet: hit.sheet, owner: hit.row.name, code: hit.row.code } : null;
}

// ── 로그인 ─────────────────────────────────────────────

/** 이메일로 로그인 링크를 보낸다. 링크를 누르면 이 사이트로 돌아와 로그인된다. 실패하면 이유. */
export async function sendLoginLink(email: string) {
  if (!supabase) return '수파베이스가 연결되지 않았어요.';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: location.origin + import.meta.env.BASE_URL + 'edit' },
  });
  return error ? error.message : null;
}

export async function logout() {
  await supabase?.auth.signOut();
}

/** 로그인되면 제 줄을 불러온다. 로그인 전에 이 창에서 한 것이 있으면 그쪽이 이긴다. */
async function signedIn(id: string, email: string | undefined) {
  if (!supabase) return;
  const { data: row } = await supabase.from('sheets').select(COLS).eq('owner', id).maybeSingle<SheetRow>();
  const draft = read<{ sheet: Sheet | null }>(session, DRAFT);
  const fresh = !!draft && draft.sheet !== null;
  const user: User = { id, name: row?.name ?? (email?.split('@')[0] || '플레이어'), verified: false };

  state = {
    user,
    code: row?.code,
    sheet: fresh ? clean(draft!.sheet) : row?.sheet ? clean(row.sheet) : null,
  };
  write(session, DRAFT, null);
  persist(); // 줄이 없으면 이때 만들어지고 코드를 받는다
  emit();
}

function signedOut() {
  clearTimeout(saveTimer);
  write(local, CACHE, null);
  write(session, DRAFT, null);
  state = { user: null, sheet: null };
  emit();
}

// ── 남의 카운터픽 — 주소(?code=)로 연 표 ─────────────────

export interface Peek {
  code: string;
  owner: string;
  matrix: Matrix;
  sheet: Sheet | null;
}
let peek: Peek | null = null;

/**
 * 이 코드의 표로 본다 — 주소 `?code=코드` 로 들어왔을 때. 내 상태는 안 건드려서
 * 로그인 없이도 그 사람 카운터픽이 바로 뜬다. 없는 코드면 false.
 */
export async function peekCode(code: string) {
  const hit = await fetchCode(normalizeCode(code));
  peek = hit ? { code: hit.row.code, owner: hit.row.name, sheet: hit.sheet, matrix: toMatrix(hit.sheet) } : null;
  subs.forEach((f) => f());
  return !!hit;
}

export function stopPeek() {
  if (!peek) return;
  peek = null;
  subs.forEach((f) => f());
}

/**
 * 보던 표를 복사해 내 상성으로 시작한다. 그 뒤로는 그 사람과 상관없다 —
 * 그 사람이 고쳐도 내 것은 안 바뀐다.
 */
export function copyPeek() {
  if (!peek) return;
  set({ sheet: peek.sheet ? { ...peek.sheet } : null });
}

// ── 좋아요 ─────────────────────────────────────────────

const LIKED = 'ow-counterpick.liked';
/** 한국 날짜 — DB 가 하루 한 번을 세는 기준과 맞춘다. */
const today = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

/** 오늘 이 브라우저에서 이미 눌렀나. 진짜 막는 것은 DB 고, 이건 단추를 바로 바꾸려고. */
export function likedToday(code: string) {
  const book = read<Record<string, string>>(local, LIKED) ?? {};
  return book[code] === today();
}

/**
 * 좋아요 — 로그인 없이도 된다. 한 사람(로그인했으면 계정, 아니면 IP)이 한 표에 하루 한 번.
 * 결과의 likes 는 지금까지 받은 좋아요 수.
 */
export async function likeSheet(code: string): Promise<{ liked: boolean; likes: number } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('like_sheet', { p_code: code });
  if (error || !data || (data as { error?: string }).error) return null;
  const book = read<Record<string, string>>(local, LIKED) ?? {};
  book[code] = today();
  write(local, LIKED, book);
  return data as { liked: boolean; likes: number };
}

/** 코드별 좋아요 수. */
export async function likeCounts(): Promise<Map<string, number>> {
  if (!supabase) return new Map();
  const { data } = await supabase.rpc('like_counts');
  return new Map(((data ?? []) as { code: string; likes: number }[]).map((x) => [x.code, x.likes]));
}

// ── 둘러보기 목록 ───────────────────────────────────────

export interface BrowseItem {
  code: string;
  name: string;
  blurb: string | null;
  likes: number;
}

/**
 * 운영자가 건 추천 표와, 자기 표가 있는 모든 사람의 표. 좋아요 많은 순.
 * 아직 사용자가 적어서 개수 제한 없이 전부 보여 준다 — 늘면 다시 건다.
 */
export async function fetchBrowse(): Promise<{ featured: BrowseItem[]; recent: BrowseItem[] }> {
  if (!supabase) return { featured: [], recent: [] };
  const [f, r, likes] = await Promise.all([
    supabase.from('sheets').select('code, name, blurb').eq('featured', true),
    supabase
      .from('sheets')
      .select('code, name, blurb')
      .eq('featured', false)
      // 나무위키를 그대로 쓰는 사람(sheet 가 비어 있음)은 빼고, 자기 표가 있는 사람만.
      .not('sheet', 'is', null)
      .order('updated_at', { ascending: false }),
    likeCounts(),
  ]);
  const withLikes = (rows: Omit<BrowseItem, 'likes'>[] | null) =>
    (rows ?? [])
      .map((x) => ({ ...x, likes: likes.get(x.code) ?? 0 }))
      .sort((a, b) => b.likes - a.likes);
  return { featured: withLikes(f.data), recent: withLikes(r.data) };
}

// ── 화면에서 쓰는 것 ────────────────────────────────────

/** 내 기준 — 나무위키냐 내 상성이냐. */
export type Source = { kind: 'namu' } | { kind: 'mine' };

const sourceOf = (s: State): Source =>
  s.sheet === null ? { kind: 'namu' } : { kind: 'mine' };

/** 지금 이 순간의 출처. 고친 직후 무엇이 바뀌었는지 보려고 화면에서 부른다. */
export const sourceNow = () => sourceOf(state);

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

let snap: { state: State; matrix: Matrix; diff: number; peek: Peek | null } = { state, matrix, diff, peek };
const getSnap = () => {
  if (snap.state !== state || snap.matrix !== matrix || snap.peek !== peek)
    snap = { state, matrix, diff, peek };
  return snap;
};

export function useMySheet() {
  const s = useSyncExternalStore(subscribe, getSnap);
  const sheet = s.state.sheet;
  return {
    user: s.state.user,
    code: s.state.code,
    source: sourceOf(s.state),
    matrix: s.matrix,
    /** 둘러보는 중이면 그 사람 표. */
    peek: s.peek,
    /** 추천 화면이 쓸 표 — 둘러보는 중이면 그 사람 것, 아니면 내 것. */
    viewMatrix: s.peek?.matrix ?? s.matrix,
    /** 추천 화면이 쓸 "적힌 값 없음" 판정. */
    viewBlank: (a: HeroId, b: HeroId) => valueIn(s.peek ? s.peek.sheet : sheet, a, b) === null,
    /** 나무위키와 다른 짝 수. */
    diff: s.diff,
    /** 나무위키와 다른 칸인가. */
    differs: (a: HeroId, b: HeroId) => valueIn(sheet, a, b) !== namuValue(a, b),
    /** 적힌 값이 없는 칸인가 — 중립(0)과 다르다. */
    blank: (a: HeroId, b: HeroId) => valueIn(sheet, a, b) === null,
  };
}

// ── 시작 ───────────────────────────────────────────────

{
  // 로그인했던 사람은 지난 상태로 바로 그린다. 진짜 로그인 여부는 아래에서 확인한다.
  const cached = read<State>(local, CACHE);
  if (cached?.user) {
    state = { ...cached, sheet: clean(cached.sheet) };
  } else {
    const draft = read<{ sheet: Sheet | null }>(session, DRAFT);
    state = { user: null, sheet: clean(draft?.sheet) };
  }
  emit();


  supabase?.auth.onAuthStateChange((event, auth) => {
    // 콜백 안에서 바로 DB 를 부르면 잠금이 걸린다 — 한 박자 미룬다.
    setTimeout(() => {
      if (auth?.user) {
        // 같은 사람이면 다시 불러오지 않는다 — 탭을 오갈 때도 SIGNED_IN 이 오는데,
        // 그때 DB 값으로 덮으면 아직 저장 안 된 방금 고친 칸이 날아간다.
        if (state.user?.id !== auth.user.id) {
          void signedIn(auth.user.id, auth.user.email);
        }
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && state.user)) {
        signedOut();
      }
    }, 0);
  });
}
