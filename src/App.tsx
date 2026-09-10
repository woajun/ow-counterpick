import { useMemo, useRef, useState } from 'react';
import { HEROES, HERO_IDS, type HeroId } from './data/heroes';
import { useTeam } from './lib/useTeam';
import { TopBar } from './components/TopBar';
import { EnemySlots } from './components/EnemySlots';
import { HeroPool } from './components/HeroPool';
import { Recommendations } from './components/Recommendations';

export default function App() {
  const team = useTeam();
  const [query, setQuery] = useState('');
  const [lit, setLit] = useState<HeroId[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return HERO_IDS;
    return HERO_IDS.filter((id) => {
      const h = HEROES[id];
      return (
        h.full.includes(k) || h.ko.includes(k) || h.en.toLowerCase().includes(k)
      );
    });
  }, [query]);

  const full = team.enemies.length >= team.size;

  /** 검색창에서 Enter. 남아 있는 첫 영웅을 넣고 검색어를 비운다. */
  const submit = () => {
    const first = visible.find((id) => !team.enemies.includes(id));
    if (first && !full) {
      team.add(first);
      setQuery('');
    }
  };

  const reset = () => {
    team.reset();
    setQuery('');
    searchRef.current?.focus();
  };

  return (
    <>
      <TopBar
        size={team.size}
        onSize={team.setSize}
        query={query}
        onQuery={setQuery}
        onSubmit={submit}
        onBackspace={team.removeLast}
        onReset={reset}
        searchRef={searchRef}
      />

      <main>
        <EnemySlots
          enemies={team.enemies}
          size={team.size}
          demo={team.demo}
          lit={lit}
          onRemove={team.remove}
        />

        <Recommendations enemies={team.enemies} onLit={setLit} />

        <HeroPool
          visible={visible}
          picked={team.enemies}
          full={full}
          onToggle={team.toggle}
        />
      </main>

      <footer>
        <b>상성 데이터에 대해</b> — 영웅별 카운터는 커뮤니티에서 통용되는 관계를
        정리한 것입니다. 밸런스 패치마다 달라지니 절대적인 기준이 아니라 스왑
        후보를 좁히는 용도로 쓰세요.
        <br />
        <b>단축키</b> — <kbd>/</kbd> 검색, 검색창에서 <kbd>Enter</kbd> 첫 결과
        추가 · <kbd>Backspace</kbd> 마지막 적 제거 · <kbd>Esc</kbd> 검색 비우기
      </footer>
    </>
  );
}
