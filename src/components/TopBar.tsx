import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { useMySheet } from '../lib/mySheet';
import { AccountChip } from './Account';

/**
 * 상단 바 — "어디로 갈지(탭) + 누구인지(계정)" 만 둔다. 추천(첫 화면)은 로고로 간다.
 *
 * 화면 안에서만 뜻이 있는 설정(인게임/살펴보기, 5v5/6v6)은 그 화면의 도구줄에 둔다.
 * 헤더에 섞으면 이동 · 설정 · 상태가 한 줄에 뒤엉킨다.
 *
 * 상성표(`/table`)는 탭에서 뺐다 — 데이터를 검수할 때만 쓰는 화면이다. 경로는 살아 있다.
 */
const TABS = [
  // 해설자 · 스트리머가 건 카운터픽을 골라 여는 곳.
  { to: '/browse', label: '둘러보기', end: true },
];

/** children 은 계정 단추 앞에 놓인다 — 상성표(/table) 처럼 헤더에 도구가 꼭 필요한 화면만 쓴다. */
export function TopBar({ children }: { children?: ReactNode }) {
  const { user, source, peek } = useMySheet();
  // 제목은 지금 보는 상성이 누구의 것인지 — 주소로 연 사람, 나무위키, 아니면 나.
  // 이메일은 @ 앞만 — 제목이 길어지지 않게.
  const short = (name: string) => name.split('@')[0];
  const who = peek
    ? short(peek.owner)
    : source.kind === 'namu'
      ? '나무위키'
      : user
        ? short(user.name)
        : '내 상성';
  return (
    <header className="bar">
      {/* 로고와 제목을 누르면 인게임 추천(첫 화면, 주소 `/`)으로 — 자세히나 남의 코드를 보던
          중이어도 게임에 바로 쓰는 화면으로 돌아온다. */}
      <Link className="brand" to="/" aria-label="인게임 추천으로">
        <span className="mark">OW</span>
        <h1>{who}</h1>
      </Link>

      <nav className="tabs">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => (isActive ? 'on' : '')}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <div className="spacer" />

      {children}
      <AccountChip />
    </header>
  );
}
