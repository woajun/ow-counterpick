// 둘러보기 추천 표(src/data/featured.ts)를 수파베이스 시드 SQL 로 뽑는다.
//
//   node scripts/seed_featured.mjs > supabase/seed/featured.sql
//
// 추천 표도 나무위키 표 전체를 사본으로 든다(한 칸이라도 고치면 연결이 끊기니까).
// 나무위키 표가 TS 안에 있어서 vite 로 불러 계산한다.
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
try {
  const { MATRIX } = await vite.ssrLoadModule('/src/lib/matrix.ts');
  const { isNeutral } = await vite.ssrLoadModule('/src/data/neutral.ts');
  const { HERO_IDS } = await vite.ssrLoadModule('/src/data/heroes.ts');
  const { FEATURED } = await vite.ssrLoadModule('/src/data/featured.ts');

  const namu = {};
  for (const a of HERO_IDS)
    for (const b of HERO_IDS) {
      if (a === b) continue;
      const v = MATRIX[a][b];
      if (v !== 0 || isNeutral(a, b)) namu[`${a}>${b}`] = v;
    }

  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const rows = FEATURED.map((f) => {
    const sheet = { ...namu };
    for (const [a, b, v] of f.changes) {
      sheet[`${a}>${b}`] = v;
      sheet[`${b}>${a}`] = v === 0 ? 0 : -v;
    }
    return `  (${q(f.code)}, ${q(f.name)}, ${q(f.blurb)}, ${q(JSON.stringify(sheet))}::jsonb)`;
  });

  process.stdout.write(`-- 둘러보기 추천 표 — scripts/seed_featured.mjs 가 뽑았다. 손으로 고치지 말 것.
-- ⚠ 목업용 가상 인물이다. 실제 해설자·스트리머는 본인 동의를 받고 본인 계정으로 건다.
-- 지우기: delete from public.sheets where featured and owner is null;
insert into public.sheets (code, name, blurb, sheet, featured, owner)
select code, name, blurb, sheet, true, null
from (values
${rows.join(',\n')}
) as v (code, name, blurb, sheet)
on conflict (code) do update
  set name = excluded.name, blurb = excluded.blurb, sheet = excluded.sheet;
`);
} finally {
  await vite.close();
}
