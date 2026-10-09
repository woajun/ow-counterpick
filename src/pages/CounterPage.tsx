import { useEffect, useState } from 'react';
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
import { Link, useNavigate, useSearchParams } from 'react-router';
import { copyPeek, likeCounts, likeSheet, likedToday, peekCode, stopPeek, useMySheet } from '../lib/mySheet';

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

  /* `?code=코드` 로 들어오면 그 사람 카운터픽으로 본다. 주소가 기준이라 북마크해 두면
     로그인 없이 알트탭 한 번에 그 사람 상성으로 뜬다. 내 상태는 안 바뀐다.
     `/c/코드` 처럼 경로로 두지 않은 이유: GitHub Pages 는 없는 경로를 404 상태로
     내줘서, 디스코드 · 카톡 링크 미리보기가 깨진다. 메인 주소에 붙이면 늘 200 이다. */
  const [params] = useSearchParams();
  const code = params.get('code');
  const navigate = useNavigate();
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!code) return;
    let alive = true;
    void peekCode(code).then((ok) => alive && setMissing(!ok));
    return () => {
      alive = false;
      setMissing(false);
      stopPeek();
    };
  }, [code]);

  /* 좋아요 — 로그인 없이 누른다. 하루 한 번(계정이나 IP 로 DB 가 가린다). */
  const [likes, setLikes] = useState<number | null>(null);
  const [justLiked, setJustLiked] = useState<string | null>(null);
  const peekCodeNow = sheet.peek?.code;
  const liked = !!peekCodeNow && (justLiked === peekCodeNow || likedToday(peekCodeNow));
  useEffect(() => {
    if (!peekCodeNow) return;
    let alive = true;
    void likeCounts().then((m) => alive && setLikes(m.get(peekCodeNow) ?? 0));
    return () => {
      alive = false;
      setLikes(null);
    };
  }, [peekCodeNow]);
  const like = async () => {
    if (!peekCodeNow || liked) return;
    setJustLiked(peekCodeNow);
    const r = await likeSheet(peekCodeNow);
    if (r) setLikes(r.likes);
    else setJustLiked(null);
  };

  return (
    <>
      <TopBar>
        <SizeToggle size={team.size} onSize={team.setSize} />
        {/* 내 상성이 얹혀 있으면 추천도 그걸로 나온다는 것을 보여 둔다. */}
        {!sheet.peek && sheet.source.kind === 'mine' && (
          <span className="tag" title="추천 점수가 내 상성으로 계산돼요">
            내 상성{sheet.user ? '' : ' · 임시'}
          </span>
        )}
        <Link className="reset edit-link" to="/edit">
          상성 수정
        </Link>
        <AccountChip />
      </TopBar>

      {/* 주소로 들어온 남의 카운터픽 — 좋아요를 누르거나, 복사해 내 상성으로 시작할 수 있다. */}
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
      {sheet.peek && (
        <div className="peek-bar">
          <span>
            <b>{sheet.peek.owner}</b>의 카운터픽이에요. 이 주소를 북마크하면 로그인 없이 바로
            열려요.
          </span>
          <button
            type="button"
            className={'like-btn' + (liked ? ' on' : '')}
            aria-pressed={liked}
            title={liked ? '오늘은 이미 눌렀어요' : '좋아요 — 하루 한 번'}
            onClick={() => void like()}
          >
            ♥ {likes ?? '…'}
          </button>
          <button
            type="button"
            className="reset small"
            title="이 표를 복사해 내 상성으로 시작해요. 그 뒤로는 이 사람이 고쳐도 안 바뀌어요."
            onClick={() => {
              if (
                sheet.source.kind === 'mine' &&
                !confirm(`지금 내 상성을 지우고 ${sheet.peek!.owner}의 표로 다시 시작할까요?`)
              )
                return;
              copyPeek();
              navigate('/edit');
            }}
          >
            이 상성으로 내 것 만들기
          </button>
          <button type="button" className="reset small" onClick={() => navigate('/')}>
            내 추천으로
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
