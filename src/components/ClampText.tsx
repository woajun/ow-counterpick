import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 긴 설명 — 처음엔 몇 줄까지만 보이고, 넘치면 끝에 "더 보기". 누르면 다 펼친다.
 * 표 주인이 상대법을 길게 써도 아래 점수 줄을 밀어내지 않게. 짧은 글은 그대로 보인다.
 */
export function ClampText({ children, lines = 3, className = '' }: { children: ReactNode; lines?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);

  // 접힌 채로 글이 칸보다 높으면 "더 보기" 를 단다. 폭이 바뀌면 다시 잰다.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setLong(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, children]);

  return (
    <div className={'clamp ' + className}>
      <div ref={ref} className={'clamp-body' + (open ? ' open' : '')} style={{ WebkitLineClamp: open ? 'unset' : lines }}>
        {children}
      </div>
      {(long || open) && (
        <button type="button" className="clamp-more" onClick={() => setOpen((v) => !v)}>
          {open ? '접기' : '더 보기'}
        </button>
      )}
    </div>
  );
}
