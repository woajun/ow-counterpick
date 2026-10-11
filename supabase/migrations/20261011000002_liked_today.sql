-- 오늘 이 표에 추천했나 — 다른 브라우저 · 시크릿 창에서 열어도 단추가 맞게 보이게.
--
-- 누른 사람을 가리는 법은 like_sheet · unlike_sheet 와 같다(private.voter).
-- 누가 눌렀는지는 알려 주지 않고, "지금 부른 사람" 이 오늘 눌렀는지만 돌려준다.
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

create or replace function public.liked_today(p_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.likes l
    join public.sheets s on s.id = l.sheet_id
    where s.code = upper(p_code)
      and l.voter = private.voter()
      and l.day = (now() at time zone 'Asia/Seoul')::date
  );
$$;

revoke all on function public.liked_today(text) from public;
grant execute on function public.liked_today(text) to anon, authenticated;

-- ── 되돌리기 ──
-- drop function if exists public.liked_today(text);
