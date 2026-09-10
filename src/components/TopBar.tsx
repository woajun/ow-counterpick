import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

const TABS = [
  { to: '/', label: '추천' },
  { to: '/table', label: '상성표' },
];

/** 화면마다 다른 조작(인원·검색·초기화)은 children 으로 받는다. */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="bar">
      <div className="brand">
        <span className="mark">OW</span>
        <h1>카운터픽</h1>
      </div>

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

      <div className="spacer" />

      {children}
    </header>
  );
}
