import type { TeamSize } from '../lib/roster';

interface Props {
  size: TeamSize;
  onSize: (n: TeamSize) => void;
}

export function SizeToggle({ size, onSize }: Props) {
  return (
    <div className="seg" role="group" aria-label="팀 인원">
      {([5, 6] as TeamSize[]).map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={size === n}
          onClick={() => onSize(n)}
        >
          {n} v {n}
        </button>
      ))}
    </div>
  );
}
