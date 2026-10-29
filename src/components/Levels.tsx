import { useState } from 'react';
import { HEROES, type HeroId } from '../data/heroes';
import { cellTone, signed } from '../lib/matrix';
import { ClampText } from './ClampText';

const Badge = ({ v }: { v: number | null }) => (
  <span className={'hs-badge ' + (v === null ? 'blank' : cellTone(v) || 'zero')}>
    {v === null ? '—' : v === 0 ? '0' : signed(v)}
  </span>
);

/**
 * 점수별로 묶어 보기 — +3 줄에 누구누구, +2 줄에 누구누구. 0 은 "정한 0"(중립)이고, 값이 없는
 * 것은 맨 아래 "적힌 것 없음". 빈 점수 줄은 그리지 않는다. 같은 점수 안에서는 원래 차례(역할 순).
 * 얼굴을 누르면 그 줄 아래에 이름과 설명을 편다 — 한 번에 하나.
 *
 * `picked` 는 지금 고른 영웅(인게임의 적 팀 · 우리 팀) — 얼굴에 팀 색 테두리를 두르고, 처음엔
 * 그중 첫 영웅의 설명을 펼쳐 둔다. 눌러서 설명을 볼 수 있다는 것이 바로 보이게.
 */
export function Levels({
  items,
  label,
  noteOf,
  picked = [],
  pickedLabel,
}: {
  items: { k: string; ko: string; pic: string; v: number | null; hero?: HeroId }[];
  label: Record<number, string>;
  noteOf: (h: HeroId) => string | undefined;
  picked?: HeroId[];
  /** 고른 영웅 얼굴에 올리면 붙는 말 — '적 팀' · '우리 팀'. */
  pickedLabel?: string;
}) {
  // undefined 는 "아직 안 누름(고른 영웅 중 첫째)", null 은 "다 접음".
  const [chosen, setOpen] = useState<HeroId | null | undefined>(undefined);
  const firstPicked = items.find((x) => x.hero && picked.includes(x.hero))?.hero ?? null;
  const open = chosen === undefined ? firstPicked : chosen;
  const rows = [3, 2, 1, 0, -1, -2, -3, null].map((lv) => ({ lv, list: items.filter((x) => x.v === lv) }));
  return (
    <div className="dv-levels">
      {rows
        .filter((r) => r.list.length > 0)
        .map(({ lv, list }) => (
          <div key={String(lv)} className="dv-level">
            <div className="dv-level-head">
              <Badge v={lv} />
              <span>{lv === null ? '적힌 것 없음' : label[lv]}</span>
            </div>
            <div className="dv-level-list">
              {list.map((x) =>
                x.hero ? (
                  // 얼굴만 크게 — 이름은 올리면(title) 보이고, 누르면 아래에 설명과 함께 편다.
                  <button
                    key={x.k}
                    type="button"
                    className={
                      'dv-face' + (open === x.hero ? ' on' : '') + (picked.includes(x.hero) ? ' picked' : '')
                    }
                    onClick={() => setOpen(open === x.hero ? null : x.hero!)}
                    title={`${x.ko}${picked.includes(x.hero) && pickedLabel ? ` · ${pickedLabel}` : ''} — 눌러서 설명 보기`}
                    aria-label={x.ko}
                    aria-expanded={open === x.hero}
                  >
                    <img src={x.pic} alt="" loading="lazy" decoding="async" />
                  </button>
                ) : (
                  <span key={x.k} className="dv-chip">
                    <img className="pic map" src={x.pic} alt="" loading="lazy" decoding="async" />
                    {x.ko}
                  </span>
                ),
              )}
            </div>
            {open && list.some((x) => x.hero === open) && (
              <ClampText key={open} className="dv-face-note">
                <b>{HEROES[open].ko}</b>
                {noteOf(open) ?? <span className="none">설명이 아직 없어요.</span>}
              </ClampText>
            )}
          </div>
        ))}
    </div>
  );
}
