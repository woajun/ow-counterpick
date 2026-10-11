import { useEffect } from 'react';
import { HEROES, portrait, type HeroId } from '../data/heroes';
import { cellTone, signed } from '../lib/matrix';
import { synergyVerdict } from '../lib/score';
import { SYN_LABEL } from '../data/synergy';
import { useMySheet } from '../lib/mySheet';

/**
 * 팀 궁합 풀이 — 팀 칸 머리줄의 [팀 궁합] 을 누르면 뜬다.
 *
 * 점수는 짝마다 등급을 더한 것뿐이라, 모든 짝을 점수 순으로 늘어놓으면 설명 없이 계산서가 된다.
 */
export function SynergyDialog({
  ids,
  label = '팀 궁합',
  onClose,
}: {
  ids: HeroId[];
  /** '상대팀 궁합' · '우리팀 궁합' */
  label?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { viewSynergy } = useMySheet();
  const pairs: { a: HeroId; b: HeroId; v: number }[] = [];
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      pairs.push({ a: ids[i], b: ids[j], v: viewSynergy[ids[i]]?.[ids[j]] ?? 0 });
  const total = pairs.reduce((s, p) => s + p.v, 0);
  const avg = pairs.length ? total / pairs.length : 0;
  // 점수 높은 짝부터 — 위에서 아래로 읽으면 점수가 어디서 왔는지 보인다.
  const sorted = [...pairs].sort((x, y) => y.v - x.v);

  return (
    <div
      className="sheet-back dlg-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hero-sheet syn-dlg" role="dialog" aria-modal="true" aria-label={`${label} 계산`}>
        <div className="syn-top">
          <span className="syn-title">{label}</span>
          <span className={'syn-total ' + (total > 0 ? 'up' : total < 0 ? 'down' : '')}>{signed(total)}</span>
          <span className="syn-verdict">{synergyVerdict(avg)}</span>
          <button type="button" className="hs-icon hs-close" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>

        <ul className="syn-list">
          {sorted.map((p) => (
            <li key={p.a + p.b} className={p.v === 0 ? 'zero' : ''}>
              <span className="syn-who">
                <img className="pic" src={portrait(p.a)} alt="" />
                {HEROES[p.a].ko}
              </span>
              <span className="syn-who">
                <img className="pic" src={portrait(p.b)} alt="" />
                {HEROES[p.b].ko}
              </span>
              <span className={'hs-badge ' + (p.v === 0 ? 'blank' : cellTone(p.v))} title={p.v === 0 ? '평가 없음 · 보통' : SYN_LABEL[p.v]}>
                {p.v === 0 ? '·' : signed(p.v)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
