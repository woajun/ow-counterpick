import { type CSSProperties } from 'react';
import { HEROES, HERO_IDS, ROLES, portrait, type HeroId } from '../data/heroes';
import { MAPS, MODES, MAP_LABEL, mapById, mapImage } from '../data/maps';
import { cellTone, signed } from '../lib/matrix';
import { setMapScore, useMySheet } from '../lib/mySheet';

const STEPS = [3, 2, 1, 0, -1, -2, -3];

/**
 * 맵 점수 고치기 — 맵 하나를 고르면 영웅 전부가 줄로 나온다. 영웅마다 −3 … +3.
 *
 * 나무위키에는 맵 점수가 없어서 처음엔 다 비어 있다(추천에 영향 없음). 정한 것만 더해진다.
 * 상성 수정과 같은 줄 모양을 쓴다 — 새로 익힐 것이 없게.
 */
export function MapEditor({
  map,
  onMap,
  edit,
}: {
  map: string;
  onMap: (id: string) => void;
  /** 칸을 고칠 때 감싸는 함수 — 나무위키에서 떨어져 나오는 순간 안내를 띄운다. */
  edit: (fn: () => void) => void;
}) {
  const sheet = useMySheet();
  const cur = mapById(map) ?? MAPS[0];
  const setOf = (m: string) => HERO_IDS.filter((h) => sheet.myMap(m, h) !== null).length;
  const n = setOf(cur.id);

  return (
    <div className="edit-grid">
      {/* 맵 고르기 — 모드별로. 점수를 정한 영웅 수가 숫자로 붙는다. */}
      <nav className="pick map-pick" aria-label="맵">
        {MODES.map((mode) => (
          <div key={mode.k} className="pick-role">
            <div className="pick-head">{mode.ko}</div>
            <div className="map-pick-list">
              {MAPS.filter((m) => m.mode === mode.k).map((m) => {
                const c = setOf(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={'map-pick-item' + (m.id === cur.id ? ' on' : '')}
                    aria-pressed={m.id === cur.id}
                    onClick={() => onMap(m.id)}
                  >
                    <span>{m.ko}</span>
                    {c > 0 && <span className="cnt">{c}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <section className="editor" aria-label={`${cur.ko} 맵 점수`}>
        <div className="ed-head map-head">
          <img className="map-thumb" src={mapImage(cur.id)} alt="" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          <div className="hs-name">
            <b>{cur.ko}</b>
            <span>이 맵에서 영웅마다 · 정한 영웅 {n}</span>
          </div>
          <button
            type="button"
            className="reset small"
            disabled={n === 0}
            onClick={() =>
              edit(() => {
                for (const h of HERO_IDS) if (sheet.myMap(cur.id, h) !== null) setMapScore(cur.id, h, null);
              })
            }
          >
            이 맵 비우기
          </button>
        </div>

        {ROLES.map((r) => (
          <div key={r.k} className="ed-group" style={{ '--role': `var(--${r.k})` } as CSSProperties}>
            <div className="pick-head">
              <span className="dot" />
              {r.ko}
            </div>
            {HERO_IDS.filter((h) => HEROES[h].r === r.k).map((h: HeroId) => {
              const v = sheet.myMap(cur.id, h);
              return (
                <div key={h} className={'ed-row' + (v !== null ? ' edited' : '')}>
                  <img className="pic" src={portrait(h)} alt="" loading="lazy" decoding="async" />
                  <span className="nm">{HEROES[h].full}</span>
                  <div className="steps" role="radiogroup" aria-label={`${cur.ko}에서 ${HEROES[h].full}`}>
                    {STEPS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={v === s}
                        title={MAP_LABEL[s]}
                        className={'step ' + (cellTone(s) || 'zero') + (v === s ? ' on' : '')}
                        onClick={() => edit(() => setMapScore(cur.id, h, s))}
                      >
                        {s === 0 ? '0' : signed(s)}
                      </button>
                    ))}
                  </div>
                  <span className="was">
                    {v !== null && (
                      <button
                        type="button"
                        className="undo"
                        title="지우기 — 이 맵에서 점수 없음"
                        aria-label="지우기"
                        onClick={() => edit(() => setMapScore(cur.id, h, null))}
                      >
                        ↺
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
