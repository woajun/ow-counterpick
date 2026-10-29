import { HERO_IDS } from '../data/heroes';
import { MAPS, MODES, MAP_LABEL, mapById, mapImage } from '../data/maps';
import { setMapScore, useMySheet } from '../lib/mySheet';
import { TierBoard } from './TierEditor';

/**
 * 맵 점수 고치기 — 맵 하나를 고르면 영웅 얼굴을 −3 … +3 줄에 끌어다 놓는다.
 *
 * 나무위키에는 맵 점수가 없어서 처음엔 다 "정하지 않음" 이다(추천에 영향 없음). 정한 것만 더해진다.
 * 상성 · 궁합 수정과 같은 티어 판을 쓴다 — 새로 익힐 것이 없게.
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
      {/* 맵 고르기 — 모드별로, 사진과 이름. */}
      <nav className="pick map-pick" aria-label="맵">
        {MODES.map((mode) => (
          <div key={mode.k} className="pick-role">
            <div className="pick-head">{mode.ko}</div>
            <div className="map-pick-list">
              {MAPS.filter((m) => m.mode === mode.k).map((m) => {
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={'map-pick-item' + (m.id === cur.id ? ' on' : '')}
                    aria-pressed={m.id === cur.id}
                    onClick={() => onMap(m.id)}
                  >
                    <img
                      className="map-pick-thumb"
                      src={mapImage(m.id)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                    />
                    <span className="nm">{m.ko}</span>
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
        </div>

        {/* 영웅 얼굴을 끌어다 이 맵에서의 점수 줄에 놓는다 — 상성 · 궁합과 같은 티어 판. 나무위키엔 맵 점수가 없다. */}
        <TierBoard
          resetKey={cur.id}
          items={HERO_IDS}
          valueOf={(h) => sheet.myMap(cur.id, h)}
          place={(h, v) => edit(() => setMapScore(cur.id, h, v))}
          label={MAP_LABEL}
          noneLabel="정하지 않음"
        />
      </section>
    </div>
  );
}
