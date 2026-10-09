-- 3/4 상성표 권한 — 누구나 읽고, 쓰기는 제 줄만.
-- 이걸 돌리기 전에는 앱에서 표를 읽지도 쓰지도 못한다(새 테이블 자동 공개를 꺼 둬서).
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

-- 표는 누구나 읽는다 — 주소(?code=)만 알면 로그인 없이 볼 수 있어야 한다.
alter table public.sheets enable row level security;

create policy "누구나 읽는다" on public.sheets
  for select to anon, authenticated
  using (true);

-- 쓰기는 로그인한 사람이 제 줄만. 추천 카드(featured)는 운영자만 SQL 로 켠다.
create policy "제 줄만 만든다" on public.sheets
  for insert to authenticated
  with check (owner = auth.uid() and featured = false);

create policy "제 줄만 고친다" on public.sheets
  for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid() and featured = false);

create policy "제 줄만 지운다" on public.sheets
  for delete to authenticated
  using (owner = auth.uid());

-- 새 테이블 자동 공개를 꺼 두었으니 직접 연다.
grant select on public.sheets to anon, authenticated;
grant insert, update, delete on public.sheets to authenticated;

-- ── 되돌리기 ──
-- revoke all on public.sheets from anon, authenticated;
-- drop policy if exists "누구나 읽는다" on public.sheets;
-- drop policy if exists "제 줄만 만든다" on public.sheets;
-- drop policy if exists "제 줄만 고친다" on public.sheets;
-- drop policy if exists "제 줄만 지운다" on public.sheets;
