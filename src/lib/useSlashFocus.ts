import { useEffect, type RefObject } from 'react';

/**
 * '/' 를 누르면 검색창으로 바로 들어간다. 알트탭으로 넘어와서 마우스를
 * 안 잡고 쓸 수 있어야 해서 둔 것이라, 검색창이 있는 화면마다 붙인다.
 */
export function useSlashFocus(ref: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target === ref.current) return;
      e.preventDefault();
      ref.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ref]);
}
