import { useSyncExternalStore } from 'react';
import { HERO_IDS, isHeroId, type HeroId } from '../data/heroes';
import { isNeutral } from '../data/neutral';
import { MATRIX, type Matrix } from './matrix';
import { FEATURED, type Featured } from '../data/featured';

/**
 * 내 상성 — 무엇을 따라가고 있나. (목업)
 *
 * 셋 중 하나다.
 *
 *   나무위키 (기본)  나무위키 상성을 그대로 쓴다. 나무위키가 바뀌면 같이 바뀐다.
 *   남의 코드        그 사람의 상성을 그대로 쓴다. 그 사람이 고치면 같이 바뀐다.
 *   내 상성          한 칸이라도 고친 순간 따라가던 것과의 연결이 끊기고, 그때의 표
 *                    전체를 통째로 내 것으로 들고 간다. 이제 나무위키가 바뀌어도,
 *                    그 사람이 고쳐도 안 바뀐다.
 *
 * 수파베이스를 붙이기 전이라 브라우저에만 둔다. 로그인 전에는 sessionStorage 라
 * 창을 닫으면 사라지고, 로그인하면 localStorage 로 옮겨 다음에도 남는다.
 *
 * 한 칸을 고치면 반대 칸도 부호를 뒤집어 같이 고친다. 메이로 자리야 상대 +2 면
 * 자리야로 메이 상대는 −2 다.
 */

/** 목업 계정. 실제 로그인은 아직 없다. */
export interface MockUser {
  name: string;
  /** Battle.net 으로 들어왔으면 배틀태그가 확인된 사용자다. */
  verified: boolean;
}

/** 남의 코드를 따라가는 중이면. */
export interface Link {
  code: string;
  owner: string;
}

/**
 * 상성표 한 장. `mine>enemy` → −3 … +3.
 * 칸이 없으면 "적힌 것 없음"이다 — 0(중립이라고 정한 것)과 다르다.
 */
export type Sheet = Record<string, number>;

interface State {
  user: MockUser | null;
  /**
   * null 이면 나무위키를 따라간다. 링크 중에는 따라가는 사람의 표가 들어 있다 —
   * 끊기면 이것이 그대로 내 것이 된다.
   */
  sheet: Sheet | null;
  /** 내 상성 코드. 계정마다 하나라 한 번 받으면 바뀌지 않는다. */
  code?: string;
  link?: Link;
}

/** 계정마다 따로 — 목업 계정 둘(Battle.net · 이메일)을 오가며 링크를 시험할 수 있게. */
const ACCOUNT = (name: string) => `ow-counterpick.mock.account.${name}`;
/** 마지막에 로그인한 계정. 탭마다 다른 계정을 쓸 수 있게 sessionStorage 에도 둔다. */
const CURRENT = 'ow-counterpick.mock.current';
const DRAFT = 'ow-counterpick.mock.draft';
const CODES = 'ow-counterpick.mock.codes';

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

// ── 코드 장부 ──────────────────────────────────────────

/**
 * 상성 코드 — 오버워치 워크샵 코드처럼 대문자·숫자 여섯 자.
 *
 * 계정마다 코드가 하나고, 고칠 때마다 같은 코드에 지금 표가 실린다. 헷갈리는 글자
 * (0 · O · 1 · I)는 뺀다. 게임 중에 친구가 불러 줘도 받아 적을 수 있어야 한다.
 *
 * 서버가 없어서 장부를 이 브라우저(localStorage)에 둔다. 그래서 지금은 같은
 * 브라우저 안에서만 코드가 통한다. 수파베이스를 붙이면 장부가 서버로 간다.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LEN = 6;

/** sheet 가 null 이면 그 사람은 나무위키를 따라가는 중이다 — 따라오는 사람도 나무위키를 본다. */
type Ledger = Record<string, { sheet: Sheet | null; owner: string; at: string }>;
const ledger = (): Ledger => read<Ledger>(local, CODES) ?? {};

function newCode(taken: Ledger) {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(CODE_LEN));
    const c = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
    if (!(c in taken)) return c;
  }
}

/** 입력을 코드 모양으로 — 소문자 · 띄어쓰기 · 붙임표를 받아 준다. */
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

// ── 상태 ───────────────────────────────────────────────

type Saved = Partial<Omit<State, 'user'>>;

let state: State = { user: null, sheet: null };
let matrix = MATRIX;
let diff = 0;
/** matrix · diff 를 어느 표로 계산했는지 — 바뀌었을 때만 다시 한다. */
let computedFor: Sheet | null = null;
const subs = new Set<() => void>();

/** 링크 중이면 따라가는 코드의 최신 표로 맞춘다. */
function follow(s: State): State {
  if (!s.link) return s;
  const hit = ledger()[s.link.code];
  if (!hit) return s; // 코드가 사라졌으면 마지막으로 받은 것을 쥐고 있는다
  return { ...s, sheet: hit.sheet === null ? null : clean(hit.sheet), link: { code: s.link.code, owner: hit.owner } };
}

function load(): State {
  const user = read<MockUser>(session, CURRENT) ?? read<MockUser>(local, CURRENT);
  const saved = user ? read<Saved>(local, ACCOUNT(user.name)) : read<Saved>(session, DRAFT);
  return follow({ user, sheet: clean(saved?.sheet), code: saved?.code, link: saved?.link });
}

function persist() {
  const { user, ...rest } = state;
  if (user) {
    write(local, ACCOUNT(user.name), rest);
    write(session, DRAFT, null);
    // 내 코드가 있으면 고칠 때마다 싣는다 — 나를 따라오는 사람에게 바로 간다.
    if (state.code) {
      const book = ledger();
      book[state.code] = { sheet: state.sheet, owner: user.name, at: new Date().toISOString() };
      write(local, CODES, book);
    }
  } else {
    write(session, DRAFT, { sheet: state.sheet, link: state.link });
  }
}

function emit() {
  if (computedFor !== state.sheet) {
    matrix = toMatrix(state.sheet);
    diff = diffCount(state.sheet);
    computedFor = state.sheet;
  }
  subs.forEach((f) => f());
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  persist();
  emit();
}

/**
 * 고치기 전에 — 따라가던 것에서 떨어져 나와 지금 표를 내 것으로 든다.
 * 나무위키를 따라가던 중이면 나무위키 표 전체를, 코드를 따라가던 중이면 그 사람 표를.
 */
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
  set({ sheet, link: undefined });
}

/** 한 영웅이 낀 짝을 모두 나무위키 값으로. 이것도 고치는 것이라 연결은 끊긴다. */
export function resetHero(id: HeroId) {
  const sheet = forked();
  for (const e of HERO_IDS) {
    if (e === id) continue;
    put(sheet, id, e, namuValue(id, e));
    put(sheet, e, id, namuValue(e, id));
  }
  set({ sheet, link: undefined });
}

/** 초기화 — 나무위키를 따라간다. */
export function resetAll() {
  set({ sheet: null, link: undefined });
}

/** 링크만 끊는다. 지금 받은 표는 내 것으로 남는다. */
export function unlink() {
  set({ sheet: forked(), link: undefined });
}

/** 목업 로그인 — 지금 창에서 한 것을 계정으로 옮긴다. */
export function login(via: 'battlenet' | 'email') {
  const user: MockUser =
    via === 'battlenet'
      ? { name: '플레이어#3170', verified: true }
      : { name: 'player@example.com', verified: false };
  const saved = read<Saved>(local, ACCOUNT(user.name));
  // 로그인 전에 이 창에서 한 것이 있으면 그쪽이 이긴다 — 방금 한 일이다.
  const fresh = state.sheet !== null || state.link;
  write(local, CURRENT, user);
  write(session, CURRENT, user);
  state = follow({
    user,
    sheet: fresh ? state.sheet : clean(saved?.sheet),
    link: fresh ? state.link : saved?.link,
    code: saved?.code,
  });
  persist();
  emit();
}

/** 로그아웃 — 계정의 표는 남기고 이 창은 나무위키로 돌아간다. */
export function logout() {
  persist();
  write(local, CURRENT, null);
  write(session, CURRENT, null);
  write(session, DRAFT, null);
  state = { user: null, sheet: null };
  emit();
}

/**
 * 내 코드. 없으면 새로 받는다. 로그인해야 받을 수 있다 —
 * 코드는 계정에 붙는 것이라, 창을 닫으면 사라지는 임시 표에는 줄 수 없다.
 */
export function publishCode(): string | null {
  if (!state.user) return null;
  if (state.code) return state.code;
  // 처음 받을 때 한 번. 그 뒤로는 고칠 때마다 persist() 가 싣는다.
  set({ code: newCode(ledger()) });
  return state.code!;
}

/** 코드로 표를 찾는다. 없는 코드면 null. */
export function findCode(input: string) {
  const hit = ledger()[normalizeCode(input)];
  return hit ? { sheet: hit.sheet === null ? null : clean(hit.sheet), owner: hit.owner } : null;
}

/**
 * 남의 코드를 따라간다. 그 사람이 고치면 나도 따라 바뀌고,
 * 내가 한 칸이라도 고치면 끊긴다.
 */
export function followCode(input: string): 'ok' | 'missing' | 'self' {
  const code = normalizeCode(input);
  const hit = ledger()[code];
  if (!hit) return 'missing';
  if (code === state.code) return 'self';
  set(follow({ ...state, link: { code, owner: hit.owner } }));
  return 'ok';
}

// ── 화면에서 쓰는 것 ────────────────────────────────────

/** 지금 무엇을 따라가고 있나. */
export type Source = { kind: 'namu' } | { kind: 'code'; link: Link } | { kind: 'mine' };

const sourceOf = (s: State): Source =>
  s.link ? { kind: 'code', link: s.link } : s.sheet === null ? { kind: 'namu' } : { kind: 'mine' };

/** 지금 이 순간의 출처. 고친 직후 무엇이 바뀌었는지 보려고 화면에서 부른다. */
export const sourceNow = () => sourceOf(state);

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

/**
 * 둘러보기 — 따라가지 않고 남의 표로 추천을 잠깐 구경한다.
 *
 * 내 상태(따라가는 것 · 내 상성)는 그대로 두고, 추천 화면만 그 표로 보여 준다.
 * 이 탭에서만이고 창을 닫으면 끝난다.
 */
export interface Peek {
  code: string;
  owner: string;
  matrix: Matrix;
  sheet: Sheet | null;
}
const PEEK = 'ow-counterpick.mock.peek';
let peek: Peek | null = null;

function makePeek(code: string): Peek | null {
  const hit = ledger()[code];
  if (!hit) return null;
  const sheet = hit.sheet === null ? null : clean(hit.sheet);
  return { code, owner: hit.owner, sheet, matrix: toMatrix(sheet) };
}

/** 이 코드의 표로 둘러본다. 지금 따라가는 것이면 둘러볼 필요가 없다. */
export function peekCode(code: string) {
  peek = state.link?.code === code ? null : makePeek(code);
  write(session, PEEK, peek ? peek.code : null);
  subs.forEach((f) => f());
}

export function stopPeek() {
  peek = null;
  write(session, PEEK, null);
  subs.forEach((f) => f());
}

/** 둘러보던 것을 그대로 따라간다. */
export function followPeek() {
  if (!peek) return;
  const code = peek.code;
  stopPeek();
  followCode(code);
}

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
    link: s.state.link,
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

// 다른 탭에서 따라가는 코드가 고쳐지면 바로 받는다. 서버가 붙으면 실시간 구독이 이 자리다.
window.addEventListener('storage', (e) => {
  if (e.key !== CODES || !state.link) return;
  state = follow(state);
  persist();
  emit();
});


/**
 * 둘러보기의 추천 코드를 장부에 걸어 둔다 — 목업. 서버가 붙으면 서버 장부에 원래 있다.
 * 나무위키 표에 그 사람이 다르게 둔 짝을 얹어 한 장으로 만든다.
 */
export function seedFeatured(list: Featured[]) {
  const book = ledger();
  for (const f of list) {
    // 추천 코드는 앱이 가진 것이라 열 때마다 새로 건다 — 목록을 고치면 바로 반영된다.
    const sheet = namuSheet();
    for (const [a, b, v] of f.changes) {
      put(sheet, a, b, v);
      put(sheet, b, a, -v);
    }
    book[f.code] = { sheet, owner: f.name, at: book[f.code]?.at ?? new Date().toISOString() };
  }
  write(local, CODES, book);
}

seedFeatured(FEATURED);


/** 장부에 걸린 코드 전부 — 둘러보기의 "모두의 코드". 서버가 붙으면 인기순으로 받아 온다. */
export function listCodes() {
  return Object.entries(ledger()).map(([code, v]) => ({
    code,
    owner: v.owner,
    at: v.at,
    diff: diffCount(v.sheet === null ? null : clean(v.sheet)),
  }));
}

state = load();
emit();

// 새로고침해도 둘러보던 것은 이어서 — 탭을 닫으면 끝난다.
{
  const code = read<string>(session, PEEK);
  if (code) peek = makePeek(code);
}
