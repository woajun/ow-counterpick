import { useEffect, useState } from 'react';
import { useMySheet, type Notes } from './mySheet';

/**
 * 나무위키 표의 칸마다 설명 — 나무위키 상성 · 궁합 절을 한 줄로 요약한 것(src/data/namuNotes.json).
 * 크기가 커서 처음 쓸 때 한 번만 따로 불러오고, 그 뒤로는 모든 화면이 같은 것을 쓴다.
 */
let cache: Notes | null = null;
let loading: Promise<Notes> | null = null;

function useNamuNotes(enabled: boolean): Notes | null {
  const [notes, setNotes] = useState<Notes | null>(cache);
  useEffect(() => {
    if (!enabled || cache) return;
    let alive = true;
    loading ??= import('../data/namuNotes.json').then((m) => (cache = m.default as Notes));
    void loading.then((n) => alive && setNotes(n));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return enabled ? (notes ?? cache) : null;
}

/**
 * 지금 보고 있는 표의 칸마다 설명 — 주소로 연 남의 표면 그 사람 것, 내 카운터픽이면 내 것,
 * 나무위키 표면 나무위키 요약. 주인이 안 쓴 칸은 비워 둔다(나무위키 요약으로 채우지 않는다).
 */
export function useViewNotes(): Notes | null {
  const my = useMySheet();
  const isNamu = !my.peek && !(my.user && my.source.kind === 'mine');
  const namu = useNamuNotes(isNamu);
  return my.peek ? my.peek.notes : isNamu ? namu : my.notes;
}
