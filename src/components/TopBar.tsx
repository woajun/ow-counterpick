import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

/**
 * 상단 바 탭.
 *
 * 상성표(`/table`)는 여기서 뺐다 — 데이터를 검수할 때만 쓰는 화면이라
 * 평소에 자리를 차지할 이유가 없다. 경로는 살아 있어서 주소로 바로 들어갈
 * 수 있고, 출처·라이선스 표기도 거기 남아 있다.
 */
const TABS = [{ to: '/', label: '추천' }];

/** 화면마다 다른 조작(인원·검색·초기화)은 children 으로 받는다. */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="bar">
      <div className="brand">
        <span className="mark">OW</span>
        <h1>카운터픽</h1>
      </div>

      {/* 탭이 하나뿐이면 고를 것이 없다. 자리만 차지하니 안 그린다. */}
      {TABS.length > 1 && (
      <nav className="tabs">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end
            className={({ isActive }) => (isActive ? 'on' : '')}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      )}

      <div className="spacer" />

      {children}
    </header>
  );
}
