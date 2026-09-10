import { useEffect, type RefObject } from 'react';
import type { TeamSize } from '../lib/useTeam';

interface Props {
  size: TeamSize;
  onSize: (n: TeamSize) => void;
  query: string;
  onQuery: (q: string) => void;
  /** 검색창에서 Enter — 목록의 첫 결과를 적 팀에 넣는다. */
  onSubmit: () => void;
  /** 검색창이 비어 있을 때 Backspace — 마지막 적을 뺀다. */
  onBackspace: () => void;
  onReset: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

export function TopBar({
  size,
  onSize,
  query,
  onQuery,
  onSubmit,
  onBackspace,
  onReset,
  searchRef,
}: Props) {
  // '/' 로 검색창에 바로 들어간다. 알트탭으로 넘어와서 마우스를 안 잡고
  // 영웅을 넣을 수 있어야 해서 둔 것이다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target === searchRef.current) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchRef]);

  return (
    <header className="bar">
      <div className="brand">
        <span className="mark">OW</span>
        <h1>카운터픽</h1>
      </div>

      <div className="spacer" />

      <div className="seg" role="group" aria-label="팀 인원">
        {([5, 6] as TeamSize[]).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={size === n}
            onClick={() => onSize(n)}
          >
            {n} v {n}
          </button>
        ))}
      </div>

      <input
        ref={searchRef}
        className="search"
        type="search"
        value={query}
        placeholder="영웅 검색  /"
        aria-label="영웅 검색"
        autoComplete="off"
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          } else if (e.key === 'Escape') {
            if (query) onQuery('');
            else e.currentTarget.blur();
          } else if (e.key === 'Backspace' && !query) {
            e.preventDefault();
            onBackspace();
          }
        }}
      />

      <button type="button" className="reset" onClick={onReset}>
        초기화
      </button>
    </header>
  );
}
