import { useEffect, useState } from 'react';
import type { HeroId } from '../data/heroes';
import { useTeam } from '../lib/useTeam';
import { useMode } from '../lib/useMode';
import { canAdd, swapIn } from '../lib/roster';
import { TopBar } from '../components/TopBar';
import { SizeToggle } from '../components/SizeToggle';
import { EnemySlots } from '../components/EnemySlots';
import { HeroPool } from '../components/HeroPool';
import { Recommendations } from '../components/Recommendations';
import { HeroSheet } from '../components/HeroSheet';
import { DetailView } from '../components/DetailView';
import { useView } from '../lib/useView';
import { useNavigate, useSearchParams } from 'react-router';
import { normalizeCode, peekCode, stopPeek, useMySheet } from '../lib/mySheet';

const MAP_KEY = 'ow-counterpick.map';

export function CounterPage() {
  /* 고른 영웅은 하나다 — 카운터면 적 팀으로, 조합이면 우리 팀으로 읽는다.
     따로 두었더니 토글할 때마다 고른 것이 바뀌어 보였다. 토글은 읽는 법만 바꾼다. */
  const team = useTeam();
  /** 인게임(빠르게) · 살펴보기(자세히) — 같은 표를 두 벌로 본다. */
  const [view, setView] = useView();
  const sheet = useMySheet();
  const [mode, setMode] = useMode();
  const [lit, setLit] = useState<HeroId[]>([]);
  /** 상성을 펼쳐 볼 영웅. 추천 줄이나 타일의 i 로 열린다. */
  const [info, setInfo] = useState<HeroId | null>(null);

  const blocked = (id: HeroId) => !canAdd(team.enemies, team.size, id);
  const locked = (id: HeroId) => swapIn(team.enemies, team.size, id) === null;

  /* `?code=코드` 로 들어오면 그 사람 카운터픽으로 본다. 주소가 기준이라 북마크해 두면
     로그인 없이 알트탭 한 번에 그 사람 상성으로 뜬다. 내 상태는 안 바뀐다.
     `/c/코드` 처럼 경로로 두지 않은 이유: GitHub Pages 는 없는 경로를 404 상태로
     내줘서, 디스코드 · 카톡 링크 미리보기가 깨진다. 메인 주소에 붙이면 늘 200 이다. */
  const [params, setParams] = useSearchParams();
  const code = params.get('code');
  /** 주소의 코드가 내 코드면 남의 표처럼 받아 오지 않고 내 표를 그대로 쓴다 — 방금 고친 것이 바로 보인다. */
  const isMine = !!code && !!sheet.user && normalizeCode(code) === sheet.code;
  const myCode = sheet.user ? sheet.code : undefined;
  /* 로그인한 채로 코드 없이 들어오면 내 코드 주소로 바꾼다 — 그 주소를 북마크하면 된다. */
  useEffect(() => {
    if (code || !myCode) return;
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        next.set('code', myCode);
        return next;
      },
      { replace: true },
    );
  }, [code, myCode, setParams]);
  /**
   * 고른 맵 — 주소에는 안 남긴다. 판마다 바뀌는 내 상황이라 공유할 일이 없다.
   * 이 탭에서만 기억해서(sessionStorage) 새로고침해도 이번 판 맵은 그대로다.
   */
  const [map, setMapState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(MAP_KEY);
    } catch {
      return null;
    }
  });
  const setMap = (id: string | null) => {
    setMapState(id);
    try {
      if (id) sessionStorage.setItem(MAP_KEY, id);
      else sessionStorage.removeItem(MAP_KEY);
    } catch {
      /* 저장이 막혀 있어도 이번 화면에서는 쓴다 */
    }
  };
  const navigate = useNavigate();
  const [missing, setMissing] = useState(false);
  // 로그인 · 로그아웃할 때도 다시 받아 온다 — 로그인하는 사이 요청이 멈춰 남의 표가 안 뜨는 일이 있었다.
  const uid = sheet.user?.id;
  useEffect(() => {
    if (!code || isMine) return;
    let alive = true;
    void peekCode(code).then((ok) => alive && setMissing(!ok));
    return () => {
      alive = false;
      setMissing(false);
      stopPeek();
    };
  }, [code, isMine, uid]);

  return (
    <>
      <TopBar />

      {/* 이 화면에서만 뜻이 있는 설정 — 헤더가 아니라 화면 맨 위 도구줄에 둔다. */}
      {/* 두 모드에서 폭이 같아야 토글이 제자리에 있다. */}
      <div className="page-tools">
        {view === 'game' && (
          <>
            {/* 상성 — 적 조합을 보고 고른다. 조합 — 우리 팀에 맞춰 고른다. 위의 팀 칸도 같이 바뀐다. */}
            <div className="seg small mode-seg" data-mode={mode} role="group" aria-label="상성 · 궁합">
              <button type="button" aria-pressed={mode === 'counter'} onClick={() => setMode('counter')}>
                상성
              </button>
              <button type="button" aria-pressed={mode === 'combo'} onClick={() => setMode('combo')}>
                궁합
              </button>
            </div>
            <SizeToggle size={team.size} onSize={team.setSize} />
          </>
        )}
        {/* 자세히 — 게임 밖에서 이 카운터픽을 따져 보는 화면. 인게임 조건들과 성격이 달라서
            설정 묶음과 떼어 오른쪽 끝에 둔다. 아이콘만 두면 뜻이 안 읽혀서 글자로. */}
        <div className="spacer" />
        {view === 'game' ? (
          <button type="button" className="reset small view-btn" onClick={() => setView('detail')}>
            자세히 보기 →
          </button>
        ) : (
          <button type="button" className="reset small view-btn" onClick={() => setView('game')}>
            ← 인게임으로
          </button>
        )}
      </div>

      {/* 주소의 코드가 없는 코드일 때만 알린다. */}
      {code && missing && (
        <div className="peek-bar">
          <span>
            <b>{code.toUpperCase()}</b> 코드를 찾지 못했어요.
          </span>
          <button type="button" className="reset small" onClick={() => navigate('/')}>
            내 추천으로
          </button>
        </div>
      )}
      {view === 'detail' ? (
        <DetailView />
      ) : (
      // 상성 · 조합에 따라 색이 바뀐다 — 고른 영웅이 적인지 우리 편인지 한눈에.
      <main data-mode={mode}>
        <EnemySlots
          enemies={team.enemies}
          size={team.size}
          lit={lit}
          onRemove={team.remove}
          onReset={team.reset}
          title={mode === 'combo' ? '우리 팀' : '적 팀'}
          synLabel={mode === 'combo' ? '우리팀 궁합' : '상대팀 궁합'}
          map={map}
          onMap={setMap}
        />

        <Recommendations
          mode={mode}
          team={team.enemies}
          size={team.size}
          onLit={setLit}
          onInfo={setInfo}
          map={map}
        />

        <HeroPool
          picked={team.enemies}
          blocked={blocked}
          locked={locked}
          onToggle={team.toggle}
          onInfo={setInfo}
          title={mode === 'combo' ? '우리 팀 영웅 고르기' : '적 영웅 고르기'}
        />
      </main>
      )}

      {/* '지금 적 팀 상대' 는 카운터일 때만 — 조합이면 고른 영웅이 우리 편이다. */}
      <HeroSheet id={info} enemies={team.enemies} mode={mode} map={map} onClose={() => setInfo(null)} />

      {/* 좁은 화면에서 추천 시트가 화면 아래에 떠 있어서, 마지막 줄이
          그 밑에 깔리지 않게 자리를 비워 둔다. */}
      <div className="sheet-gap" aria-hidden="true" />
    </>
  );
}
