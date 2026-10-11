-- 좋아요 취소 — 오늘 누른 좋아요를 한 번 더 눌러 거둔다.
--
-- 오늘 것만 거둔다. 어제 이전에 누른 것은 이미 쌓인 수라 그대로 둔다(하루 한 번 규칙과 같다).
-- 누른 사람을 가리는 법(계정 · IP 해시)은 like_sheet 와 같아야 해서 함수 하나로 뺀다.
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

-- ── 누른 사람 ──────────────────────────────────────────
-- 'u:<계정 id>' 또는 'ip:<해시>'. IP 를 못 읽으면 null.
create or replace function private.voter()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  ip text;
begin
  if auth.uid() is not null then
    return 'u:' || auth.uid();
  end if;
  ip := private.client_ip();
  if ip is null then
    return null;
  end if;
  return 'ip:' || encode(
    extensions.digest(ip || (select v from private.settings where k = 'like_salt'), 'sha256'),
    'hex'
  );
end;
$$;

-- ── 좋아요 취소 ────────────────────────────────────────
-- 오늘 누른 것이 없으면 아무 일도 안 하고 unliked = false 를 돌려준다.
create or replace function public.unlike_sheet(p_code text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  sid     uuid;
  who     text;
  removed integer;
begin
  select id into sid from public.sheets where code = upper(p_code);
  if sid is null then
    return json_build_object('error', 'missing');
  end if;

  who := private.voter();
  if who is null then
    return json_build_object('error', 'no_ip');
  end if;

  delete from private.likes
  where sheet_id = sid
    and voter = who
    and day = (now() at time zone 'Asia/Seoul')::date;
  get diagnostics removed = row_count;

  return json_build_object(
    'unliked', removed > 0,
    'likes', (select count(*) from private.likes where sheet_id = sid)
  );
end;
$$;

-- ── 권한 ───────────────────────────────────────────────
revoke all on function private.voter() from public, anon, authenticated;
revoke all on function public.unlike_sheet(text) from public;
grant execute on function public.unlike_sheet(text) to anon, authenticated;

-- ── 되돌리기 ──
-- drop function if exists public.unlike_sheet(text);
-- drop function if exists private.voter();
