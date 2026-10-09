import { useState } from 'react';
import type { HeroId } from '../data/heroes';
import { useTeam } from '../lib/useTeam';
import { useMode } from '../lib/useMode';
import { canAdd } from '../lib/roster';
import { TopBar } from '../components/TopBar';
import { SizeToggle } from '../components/SizeToggle';
import { EnemySlots } from '../components/EnemySlots';
import { HeroPool } from '../components/HeroPool';
import { Recommendations } from '../components/Recommendations';
import { HeroSheet } from '../components/HeroSheet';
import { AccountChip } from '../components/Account';
import { Link } from 'react-router';
import { followPeek, stopPeek, useMySheet } from '../lib/mySheet';

export function CounterPage() {
  /* 고른 영웅은 하나다 — 카운터면 적 팀으로, 조합이면 우리 팀으로 읽는다.
     따로 두었더니 토글할 때마다 고른 것이 바뀌어 보였다. 토글은 읽는 법만 바꾼다. */
  const team = useTeam();
  const sheet = useMySheet();
  const [mode, setMode] = useMode();
  const [lit, setLit] = useState<HeroId[]>([]);
  /** 상성을 펼쳐 볼 영웅. 추천 줄이나 타일의 i 로 열린다. */
  const [info, setInfo] = useState<HeroId | null>(null);

  const blocked = (id: HeroId) => !canAdd(team.enemies, team.size, id);

  return (
    <>
      <TopBar>
        <SizeToggle size={team.size} onSize={team.setSize} />
        {/* 내 상성이 얹혀 있으면 추천도 그걸로 나온다는 것을 보여 둔다. */}
        {sheet.link ? (
          <span className="tag" title={`${sheet.link.owner}의 상성으로 추천해요 — 그 사람이 고치면 같이 바뀌어요`}>
            🔗 {sheet.link.owner}
          </span>
        ) : (
          sheet.source.kind === 'mine' && (
            <span className="tag" title="추천 점수가 내 상성으로 계산돼요">
              내 상성{sheet.user ? '' : ' · 임시'}
            </span>
          )
        )}
        <Link className="reset edit-link" to="/edit">
          상성 수정
        </Link>
        <AccountChip />
      </TopBar>

      {/* 둘러보는 중 — 내 추천 기준은 그대로고 이 화면만 그 사람 표로 보여 준다. */}
      {sheet.peek && (
        <div className="peek-bar">
          <span>
            <b>{sheet.peek.owner}</b>의 상성을 둘러보는 중이에요. 내 추천 기준은 그대로예요.
          </span>
          <button type="button" className="bw-follow" onClick={followPeek}>
            따라가기
          </button>
          <button type="button" className="reset small" onClick={stopPeek}>
            그만 보기
          </button>
        </div>
      )}

      <main>
        <EnemySlots
          enemies={team.enemies}
          size={team.size}
          lit={lit}
          onRemove={team.remove}
          onReset={team.reset}
          title={mode === 'combo' ? '우리 팀' : '적 팀'}
        />

        <Recommendations
          mode={mode}
          onMode={setMode}
          team={team.enemies}
          size={team.size}
          onLit={setLit}
          onInfo={setInfo}
        />

        <HeroPool
          picked={team.enemies}
          blocked={blocked}
          onToggle={team.toggle}
          onInfo={setInfo}
          title={mode === 'combo' ? '우리 팀 영웅 고르기' : '적 영웅 고르기'}
        />
      </main>

      {/* '지금 적 팀 상대' 는 카운터일 때만 — 조합이면 고른 영웅이 우리 편이다. */}
      <HeroSheet id={info} enemies={mode === 'counter' ? team.enemies : []} onClose={() => setInfo(null)} />

      {/* 좁은 화면에서 추천 시트가 화면 아래에 떠 있어서, 마지막 줄이
          그 밑에 깔리지 않게 자리를 비워 둔다. */}
      <div className="sheet-gap" aria-hidden="true" />
    </>
  );
}
