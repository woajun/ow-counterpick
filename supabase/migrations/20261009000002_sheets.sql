-- 2/4 상성표 테이블 — 계정마다 한 줄.
--
-- 한 줄이 한 사람의 상성표다.
--   sheet  null 이면 나무위키를 따라간다. 아니면 상성표 전체(`mine>enemy` → −3 … +3).
-- 남의 표는 주소(?code=코드)로 열어 본다 — 따로 "따라가기" 상태를 두지 않는다.
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

-- ── 표 ─────────────────────────────────────────────────
create table public.sheets (
  id          uuid primary key default gen_random_uuid(),
  -- 비어 있으면 운영자가 건 추천 표(둘러보기). 사람 계정이면 한 사람에 한 줄.
  owner       uuid unique references auth.users (id) on delete cascade default auth.uid(),
  code        text not null unique default public.gen_sheet_code()
                check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  -- 화면에 뜨는 이름 — "○○의 카운터픽".
  name        text not null check (char_length(name) between 1 and 40),
  sheet       jsonb check (sheet is null or jsonb_typeof(sheet) = 'object'),
  -- 둘러보기에 거는 것 — 운영자만 SQL 로 켠다.
  featured    boolean not null default false,
  blurb       text check (blurb is null or char_length(blurb) <= 200),
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

comment on table public.sheets is '상성표 — 계정마다 한 장. sheet 가 null 이면 나무위키를 따라간다.';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sheets_touch
before update on public.sheets
for each row execute function public.touch_updated_at();

-- ── 되돌리기 ──
-- drop table if exists public.sheets;
-- drop function if exists public.touch_updated_at();
