import { useState, type CSSProperties } from 'react';
import { SynergyDialog } from './SynergyDialog';
import { MapDialog } from './MapPicker';
import { mapById, mapImage } from '../data/maps';
import { HEROES, ROLES, portrait, type HeroId } from '../data/heroes';
import { LIMITS, arrange, countRole, type TeamSize } from '../lib/roster';
import { synergyVerdict, teamSynergy } from '../lib/score';
import { signed } from '../lib/matrix';

interface Props {
  enemies: HeroId[];
  size: TeamSize;
  /** 추천 줄에 마우스를 올렸을 때 근거가 된 적만 테두리를 켠다. */
  lit: HeroId[];
  onRemove: (id: HeroId) => void;
  onReset: () => void;
  /** 머리 글자. 조합 모드에서는 '우리 팀'. */
  title?: string;
  /** 팀 궁합 이름 — 상성이면 '상대팀 궁합', 궁합 모드면 '우리팀 궁합'. */
  synLabel?: string;
  /** 이번 판 맵 — 영웅 칸 앞에 한 칸. 없으면 맵 칸을 안 그린다. */
  map?: string | null;
  onMap?: (id: string | null) => void;
}

export function EnemySlots({
  enemies,
  size,
  lit,
  onRemove,
  onReset,
  title = '적 팀',
  synLabel = '상대팀 궁합',
  map,
  onMap,
}: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const cur = mapById(map);
  const slots = arrange(enemies, size);
  // 둘 이상 골랐을 때만 — 한 명은 짝이 없다.
  const syn = enemies.length >= 2 ? teamSynergy(enemies) : null;
  const [synOpen, setSynOpen] = useState(false);

  return (
    <section className="enemy">
      <h2 className="head">
        <span className="mode-pill">{title}</span>
        <span className="n">
          {enemies.length} / {size}
        </span>
        {/* 6v6 은 빈 자리에 역할이 안 적히니 탱커 수만 따로 보여 준다. */}
        {size === 6 && (
          <span
            className={
              'n' + (countRole(enemies, 'tank') >= LIMITS[6].tank ? ' max' : '')
            }
          >
            탱커 {countRole(enemies, 'tank')} / {LIMITS[6].tank}
          </span>
        )}
        {/* 팀 궁합 — 고른 영웅끼리의 궁합 합. 누르면 짝마다 어떻게 더했는지 창으로 보여 준다. */}
        {syn && (
          <button
            type="button"
            className={'syn ' + (syn.total > 0 ? 'up' : syn.total < 0 ? 'down' : '')}
            title="눌러서 점수가 어떻게 나왔는지 보기"
            onClick={() => setSynOpen(true)}
          >
            {synLabel} <b>{signed(syn.total)}</b> · {synergyVerdict(syn.avg)}
          </button>
        )}
      </h2>
      {synOpen && enemies.length >= 2 && <SynergyDialog ids={enemies} label={synLabel} onClose={() => setSynOpen(false)} />}

      {/* 칸 수를 격자에 그대로 넘긴다. flex 로 나누면 안쪽 글자 폭 때문에
          좁은 화면에서 마지막 칸이 밀려 나간다. */}
      <div className={'slots' + (onMap ? ' with-map' : '')} style={{ '--n': size } as CSSProperties}>
        {/* 비우는 대상과 같은 높이로, 맨 앞에. 머리줄에 작게 달려 있을 때는
            있는 줄도 몰랐다. */}
        <button
          type="button"
          className="wipe"
          disabled={enemies.length === 0}
          onClick={onReset}
        >
          <span className="x" aria-hidden="true">
            ✕
          </span>
          <span className="lbl">초기화</span>
        </button>

        {/* 맵 — 적처럼 "이번 판의 상황" 이라 영웅 칸 앞에 둔다. 초기화는 적만 비운다 —
            한 판 안에서 적은 자주 바뀌어도 맵은 그대로다. 비어 있을 땐 아무 맵이나 하나를
            회색으로 깔아 "여기에 맵이 들어간다" 를 글 없이 보여 준다. */}
        {onMap && (
          <div className={'slot map-slot' + (cur ? ' on' : '')}>
            <button
              type="button"
              className="map-slot-btn"
              style={{ backgroundImage: `url(${mapImage(cur ? cur.id : 'kings-row')})` }}
              aria-label={cur ? `맵 ${cur.ko} — 바꾸기` : '맵 고르기'}
              onClick={() => setMapOpen(true)}
            >
              <span className="map-slot-name">{cur ? cur.ko : '맵'}</span>
            </button>
            {cur && (
              <button type="button" className="map-slot-x" aria-label="맵 빼기" onClick={() => onMap(null)}>
                ✕
              </button>
            )}
          </div>
        )}

        {slots.map((slot, i) => {
          if (!slot.id) {
            const role = slot.role && ROLES.find((r) => r.k === slot.role);
            return (
              <div
                key={`empty-${i}`}
                className="slot empty"
                style={
                  slot.role
                    ? ({ '--role': `var(--${slot.role})` } as CSSProperties)
                    : undefined
                }
              >
                {role ? <span className="want">{role.ko}</span> : '비어 있음'}
              </div>
            );
          }
          const h = HEROES[slot.id];
          const id = slot.id;
          return (
            <button
              key={id}
              type="button"
              className={'slot filled' + (lit.includes(id) ? ' lit' : '')}
              style={{ '--role': `var(--${h.r})` } as CSSProperties}
              aria-label={`${h.full} 빼기`}
              onClick={() => onRemove(id)}
            >
              <span className="x" aria-hidden="true">
                ✕
              </span>
              <img className="pic" src={portrait(id)} alt="" decoding="async" />
              {/* 좁은 화면에서는 줄인 이름으로 바꾼다 — 66px 칸에
                  "위도우메이커"를 넣으면 잘려서 못 읽는다. */}
              <span className="ko">{h.full}</span>
              <span className="ko short">{h.ko}</span>
              <span className="en">{h.en}</span>
            </button>
          );
        })}
      </div>
      {mapOpen && onMap && (
        <MapDialog
          value={map ?? null}
          onPick={(id) => {
            onMap(id);
            setMapOpen(false);
          }}
          onClose={() => setMapOpen(false)}
        />
      )}
    </section>
  );
}
