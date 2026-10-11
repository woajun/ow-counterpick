import { useEffect } from 'react';
import { MAPS, MODES, mapImage } from '../data/maps';

/** 맵 목록 창 — 모드별로 묶은 사진 칸. 팀 칸 줄의 맵 칸을 누르면 뜬다. */
export function MapDialog({
  value,
  onPick,
  onClose,
  allowNone = true,
}: {
  value: string | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
  allowNone?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="sheet-back dlg-back"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hero-sheet map-dlg" role="dialog" aria-modal="true" aria-label="맵 고르기">
        <div className="syn-top">
          <span className="syn-title">맵 고르기</span>
          {allowNone && value && (
            <button type="button" className="reset small" onClick={() => onPick(null)}>
              맵 빼기
            </button>
          )}
          <button type="button" className="hs-icon hs-close" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="map-groups">
          {MODES.map((mode) => (
            <section key={mode.k}>
              <h4>{mode.ko}</h4>
              <div className="map-grid">
                {MAPS.filter((m) => m.mode === mode.k).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={'map-card' + (m.id === value ? ' on' : '')}
                    aria-pressed={m.id === value}
                    onClick={() => onPick(m.id)}
                  >
                    <img
                      src={mapImage(m.id)}
                      alt=""
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                    />
                    <span>{m.ko}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
