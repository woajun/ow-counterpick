import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * 추천 화면을 어떻게 볼지 — 인게임(빠르게) · 자세히.
 *
 * 같은 상성표를 두 벌로 본다. 인게임은 알트탭으로 들어와 몇 초 안에 스왑을 정하는 화면,
 * 자세히는 게임 밖에서 이 카운터픽이 믿을 만한지 따져 보는 화면이다.
 *
 * 주소로만 가른다 — `?view=detail` 이 있으면 자세히, 없으면 인게임. 따로 기억하지 않아서
 * 북마크 · 공유 링크가 보이는 그대로 열린다. `/detail` 처럼 경로로 두지 않은 이유는
 * GitHub Pages 가 없는 경로를 404 상태로 내줘서 링크 미리보기가 깨지기 때문이다(?code= 와 같다).
 */
export type View = 'game' | 'detail';

export function useView() {
  const [params, setParams] = useSearchParams();
  const view: View = params.get('view') === 'detail' ? 'detail' : 'game';

  const choose = useCallback(
    (next: View) => {
      // 코드(?code=)는 그대로 두고 view 만 바꾼다. 뒤로 가기로 인게임 ↔ 자세히를 오갈 수 있게 push.
      setParams((p) => {
        const n = new URLSearchParams(p);
        if (next === 'detail') n.set('view', 'detail');
        else n.delete('view');
        // 영웅 창에서 바로 열 때 붙는 영웅 · 탭(?hero= · ?tab=)은 여기서 바꿀 때마다 지운다 — 남아 있으면
        // 다음에 자세히 보기를 열 때 엉뚱한 영웅이 열린다.
        n.delete('hero');
        n.delete('tab');
        return n;
      });
    },
    [setParams],
  );

  return [view, choose] as const;
}
