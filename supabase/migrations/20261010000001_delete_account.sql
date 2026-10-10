-- 회원 탈퇴 — 로그인한 사람이 자기 계정을 지운다.
--
-- 앱(publishable key)은 계정(auth.users)을 직접 지울 권한이 없어서, 관리자 권한으로
-- 도는 함수 하나를 열어 둔다. 함수 안에서 auth.uid() 로 "지금 로그인한 그 사람"만 지운다.
--
-- 지워지는 것
--   계정(auth.users)            — 로그인 정보
--   상성표(public.sheets)       — owner 에 on delete cascade 가 걸려 있어 같이 지워진다
--   받은 좋아요(private.likes)  — 상성표에 cascade 로 같이 지워진다
--   누른 좋아요(private.likes)  — 'u:<계정 id>' 로 남은 기록. 아래에서 직접 지운다
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception '로그인한 사람만 탈퇴할 수 있다';
  end if;

  delete from private.likes where voter = 'u:' || me;
  delete from auth.users where id = me;
end;
$$;

-- 로그인한 사람만 부른다. 로그인 안 한 사람(anon)은 막는다.
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ── 되돌리기 ──
-- drop function if exists public.delete_my_account();
