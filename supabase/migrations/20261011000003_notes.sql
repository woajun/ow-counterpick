-- 칸마다 설명 — "왜 이 점수인지" 한두 줄. 수정 화면에서 쓰고, 자세히 보기의 영웅 줄 아래에 뜬다.
--
-- 표(sheet)와 따로 둔다. 표는 점수만 담고(숫자), 설명은 글이라 모양이 다르다.
--   { "genji>widowmaker": "질풍참으로 …", "syn:ana>genji": "…" }
-- 키는 표와 같다 — 상성은 `내 픽>적 픽`(방향 있음), 궁합은 `syn:이름순`(방향 없음).
-- 한 칸 200자는 화면이 지킨다. DB 는 통째로 너무 커지지 않게만 막는다.
--
-- 표 한마디(blurb)는 처음부터 있던 칸을 쓴다 — 여기서 손대지 않는다.
--
-- 실행: SQL Editor 에 붙여 넣고 Run. 되돌리기는 맨 아래.

alter table public.sheets
  add column notes jsonb
  check (notes is null or (jsonb_typeof(notes) = 'object' and pg_column_size(notes) <= 262144));

comment on column public.sheets.notes is '칸마다 설명 — 키는 sheet 와 같다. null 이면 설명 없음.';

-- ── 되돌리기 ──
-- alter table public.sheets drop column if exists notes;
