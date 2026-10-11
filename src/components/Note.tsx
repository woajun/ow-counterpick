import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * 한 줄 설명 — 넘치면 한 줄로 접어 두고 눌러서 펼친다. 줄마다 설명 길이가 달라도
 * 표가 들쭉날쭉해지지 않는다. 한 줄에 다 들어가면 펼칠 것도 없다.
 */
export function Note({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);

  // 접힌 상태에서 글이 칸보다 길면 펼치기 단추를 단다. 화면 폭이 바뀌면 다시 잰다.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setLong(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, children]);

  return (
    <p
      ref={ref}
      className={'dv-note ' + className + (open ? ' open' : '') + (long || open ? ' long' : '')}
      onClick={() => (long || open) && setOpen((v) => !v)}
      title={long && !open ? '눌러서 펼치기' : undefined}
    >
      {children}
      {open && <span className="dv-fold">접기</span>}
    </p>
  );
}
