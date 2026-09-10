import { useState } from 'react';
import type { HeroId } from '../data/heroes';
import { useTeam } from '../lib/useTeam';
import { canAdd } from '../lib/roster';
import { TopBar } from '../components/TopBar';
import { SizeToggle } from '../components/SizeToggle';
import { EnemySlots } from '../components/EnemySlots';
import { HeroPool } from '../components/HeroPool';
import { Recommendations } from '../components/Recommendations';

export function CounterPage() {
  const team = useTeam();
  const [lit, setLit] = useState<HeroId[]>([]);

  const blocked = (id: HeroId) => !canAdd(team.enemies, team.size, id);

  return (
    <>
      <TopBar>
        <SizeToggle size={team.size} onSize={team.setSize} />
      </TopBar>

      <main>
        <EnemySlots
          enemies={team.enemies}
          size={team.size}
          demo={team.demo}
          lit={lit}
          onRemove={team.remove}
          onReset={team.reset}
        />

        <Recommendations enemies={team.enemies} onLit={setLit} />

        <HeroPool
          picked={team.enemies}
          blocked={blocked}
          onToggle={team.toggle}
        />
      </main>

      <footer>
        <b>상성 데이터에 대해</b> — 영웅별 카운터는 나무위키 영웅 문서의 상성
        절에서 옮긴 것입니다. 밸런스 패치마다 달라지니 절대적인 기준이 아니라
        스왑 후보를 좁히는 용도로 쓰세요. 표 전체는 <b>상성표</b> 탭에서 볼 수
        있습니다.
        <br />
        <b>적 팀 구성</b> — 5v5 는 탱커 1 · 딜러 2 · 지원 2 고정, 6v6 은 탱커
        최대 2명에 나머지는 합이 6이면 됩니다. 자리가 찬 역할은 아래 목록에서
        눌리지 않습니다.
      </footer>
    </>
  );
}
