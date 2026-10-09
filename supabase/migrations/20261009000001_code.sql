-- 1/4 코드 만드는 함수 — 대문자·숫자 6자.
-- 아직 표가 없어도 만들 수 있다(함수 안은 부를 때 읽는다).
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

-- ── 코드 ───────────────────────────────────────────────
-- 대문자·숫자 6자. 헷갈리는 0 · O · 1 · I 는 뺀다.
create or replace function public.gen_sheet_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from public.sheets s where s.code = c);
  end loop;
  return c;
end;
$$;

-- ── 되돌리기 ──
-- drop function if exists public.gen_sheet_code();
