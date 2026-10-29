-- 칸마다 설명을 길게 — 한 칸 200자 → 1,000자(화면이 지킨다). 표 한 장의 설명 전체 한도도 늘린다.
--
-- 한국어는 한 글자에 3바이트라, 256KB 로는 1,000자짜리 설명을 80개쯤 쓰면 저장이 막힌다.
-- 2MB 면 1,000자짜리를 600개 넘게 쓸 수 있다.
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

alter table public.sheets drop constraint if exists sheets_notes_check;
alter table public.sheets
  add constraint sheets_notes_check
  check (notes is null or (jsonb_typeof(notes) = 'object' and pg_column_size(notes) <= 2097152));

-- ── 되돌리기 ──
-- alter table public.sheets drop constraint if exists sheets_notes_check;
-- alter table public.sheets add constraint sheets_notes_check
--   check (notes is null or (jsonb_typeof(notes) = 'object' and pg_column_size(notes) <= 262144));
