-- 4/4 좋아요 — 로그인 없이도 누른다. 한 사람이 한 표에 하루 한 번.
--
-- 디시 추천처럼 로그인 안 한 사람은 IP 로 가린다. 로그인했으면 계정으로 가린다.
-- IP 는 그대로 남기지 않고 비밀 소금을 쳐서 해시로만 둔다 — 누가 눌렀는지 거꾸로 못 찾는다.
-- 같은 IP 를 여럿이 쓰는 곳(PC방 · 회사)은 그날 한 명만 누를 수 있다. 하루 단위로 둔 이유다.
--
-- 좋아요 장부는 private 스키마에 둔다. API 로는 아예 안 보이고, 아래 두 함수로만 닿는다.
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

-- ── 장부 ───────────────────────────────────────────────
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- IP 해시에 치는 소금. 처음 한 번 만들고 바꾸지 않는다(바꾸면 오늘 누른 사람이 또 누를 수 있다).
create table private.settings (
  k text primary key,
  v text not null
);
insert into private.settings (k, v)
values ('like_salt', encode(extensions.gen_random_bytes(16), 'hex'));

create table private.likes (
  sheet_id   uuid not null references public.sheets (id) on delete cascade,
  -- 'u:<계정 id>' 또는 'ip:<해시>'
  voter      text not null,
  -- 한국 날짜로 하루.
  day        date not null default (now() at time zone 'Asia/Seoul')::date,
  created_at timestamptz not null default now(),
  primary key (sheet_id, voter, day)
);

-- ── 누른 사람 IP ───────────────────────────────────────
-- 수파베이스 API 가 넘겨주는 요청 헤더에서 읽는다.
create or replace function private.client_ip()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'cf-connecting-ip', ''),
    nullif(trim(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(current_setting('request.headers', true)::json ->> 'x-real-ip', '')
  );
$$;

-- ── 좋아요 누르기 ──────────────────────────────────────
-- 오늘 이미 눌렀으면 아무 일도 안 하고 liked = false 를 돌려준다. 취소는 없다.
create or replace function public.like_sheet(p_code text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  sid   uuid;
  who   text;
  ip    text;
  added integer;
begin
  select id into sid from public.sheets where code = upper(p_code);
  if sid is null then
    return json_build_object('error', 'missing');
  end if;

  if auth.uid() is not null then
    who := 'u:' || auth.uid();
  else
    ip := private.client_ip();
    if ip is null then
      return json_build_object('error', 'no_ip');
    end if;
    who := 'ip:' || encode(
      extensions.digest(ip || (select v from private.settings where k = 'like_salt'), 'sha256'),
      'hex'
    );
  end if;

  insert into private.likes (sheet_id, voter) values (sid, who)
  on conflict do nothing;
  get diagnostics added = row_count;

  return json_build_object(
    'liked', added > 0,
    'likes', (select count(*) from private.likes where sheet_id = sid)
  );
end;
$$;

-- ── 좋아요 수 ──────────────────────────────────────────
-- 지금까지 받은 좋아요 전부(날마다 쌓인다).
create or replace function public.like_counts()
returns table (code text, likes integer)
language sql
stable
security definer
set search_path = ''
as $$
  select s.code, count(l.*)::int
  from public.sheets s
  join private.likes l on l.sheet_id = s.id
  group by s.code;
$$;

-- ── 권한 ───────────────────────────────────────────────
-- 함수는 기본으로 누구나 부를 수 있어서, 막을 것은 막고 열 것만 연다.
revoke all on function private.client_ip() from public, anon, authenticated;
revoke all on function public.like_sheet(text) from public;
revoke all on function public.like_counts() from public;
grant execute on function public.like_sheet(text) to anon, authenticated;
grant execute on function public.like_counts() to anon, authenticated;

-- ── 되돌리기 ──
-- drop function if exists public.like_counts();
-- drop function if exists public.like_sheet(text);
-- drop function if exists private.client_ip();
-- drop table if exists private.likes;
-- drop table if exists private.settings;
-- drop schema if exists private;
