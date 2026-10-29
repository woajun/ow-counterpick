import { useEffect, useRef, type CSSProperties } from 'react';
import { HEROES, HERO_IDS, portrait, type HeroId } from '../data/heroes';
import { Link, useSearchParams } from 'react-router';
import { noteKey, synKey, useMySheet } from '../lib/mySheet';
import { useViewNotes } from '../lib/namuNotes';
import { Levels } from './Levels';
import { COUNTER_LABEL } from '../lib/matrix';
import { SYN_LABEL } from '../data/synergy';
import type { Mode } from '../lib/useMode';

interface Props {
  /** 펼쳐 볼 내 픽. null 이면 안 뜬다. */
  id: HeroId | null;
  /** 지금 고른 팀 — 상성이면 적 팀, 조합이면 우리 팀. 점수 묶음에서 얼굴에 팀 색을 두르고 첫 영웅 설명을 펼쳐 둔다. */
  enemies: HeroId[];
  /** 상성(적으로 만났을 때) · 조합(같은 팀일 때). 시트 전체가 이 기준으로 펼쳐진다. */
  mode?: Mode;
  onClose: () => void;
}

/**
 * 내 픽 하나가 적 전체를 상대로 어떤지 한 장에 편다.
 *
 * 추천 줄은 "지금 고른 적 조합"에 대한 점수만 보여 준다. 그 영웅을 실제로
 * 꺼낼지 정하려면 아직 안 나온 적한테도 통하는지가 궁금해진다.
 */
export function HeroSheet({ id, enemies, mode = 'counter', onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [, setParams] = useSearchParams();
  // 내가 고친 상성이 있으면 그 위에서 편다. 추천 점수와 같은 행렬이어야 한다.
  const { viewMatrix: matrix, viewBlank: blank, viewSynergy } = useMySheet();
  const notes = useViewNotes();
  const combo = mode === 'combo';
  /** 판단이 있는 칸 — 0 이어도 중립이라 정한 것이다. */
  const judged = (e: HeroId) =>
    id ? (combo ? viewSynergy[id]?.[e] !== undefined : !blank(id, e)) : false;

  useEffect(() => {
    if (!id) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // 뒤쪽 화면이 같이 스크롤되면 어디를 보고 있었는지 잃는다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [id, onClose]);

  if (!id) return null;

  const me = HEROES[id];
  const row: Record<HeroId, number> = combo
    ? (Object.fromEntries(HERO_IDS.map((e) => [e, viewSynergy[id]?.[e] ?? 0])) as Record<HeroId, number>)
    : matrix[id];

  return (
    <div
      className="sheet-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={'hero-sheet hs-main' + (combo ? ' combo' : '')} role="dialog" aria-modal="true" aria-label={`${me.full} ${combo ? '궁합' : '상성'}`}>
        <div className="hs-head" style={{ '--role': `var(--${me.r})` } as CSSProperties}>
          <img className="pic" src={portrait(id)} alt="" decoding="async" />
          <div className="hs-name">
            <b>{me.full}</b>
            <span>{combo ? '같은 팀일 때' : me.en}</span>
          </div>
          {/* 이 영웅을 자세히 보기에서 연다 — 같은 상성 · 궁합 탭으로. 보던 코드(?code=)는 그대로. */}
          <button
            type="button"
            className="reset small hs-detail"
            onClick={() => {
              onClose();
              setParams((p) => {
                const n = new URLSearchParams(p);
                n.set('view', 'detail');
                n.set('hero', id);
                if (combo) n.set('tab', 'combo');
                else n.delete('tab');
                return n;
              });
            }}
          >
            자세히 보기
          </button>
          {/* 이 영웅 줄을 고치러 간다 — 궁합이면 궁합 탭으로. */}
          <Link
            className="hs-icon hs-edit"
            to={`/edit/${id}${combo ? '?tab=syn' : ''}`}
            aria-label={`${me.full} ${combo ? '궁합' : '상성'} 수정`}
            title={combo ? '궁합 수정' : '상성 수정'}
          >
            ✎
          </Link>
          <button
            ref={closeRef}
            type="button"
            className="hs-icon hs-close"
            aria-label="닫기"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="hs-body">

          {/* 점수별 — 얼굴만 크게, 누르면 그 줄 아래에 이름과 설명. 자세히 보기의 점수별과 같은 모양. */}
          <Levels
            key={id + mode}
            items={HERO_IDS.filter((e) => e !== id).map((e) => ({
              k: e,
              ko: HEROES[e].ko,
              pic: portrait(e),
              v: judged(e) ? row[e] : null,
              hero: e,
            }))}
            label={combo ? SYN_LABEL : COUNTER_LABEL}
            noteOf={(e) => notes?.[combo ? synKey(id, e) : noteKey(id, e)]}
            picked={enemies.filter((e) => e !== id)}
            pickedLabel={combo ? '우리 팀' : '적 팀'}
          />

        </div>
      </div>
    </div>
  );
}

/** 평균 한 칸 점수로 붙이는 한마디. 합만 보면 적이 많을수록 커져서 감이 안 온다. */
