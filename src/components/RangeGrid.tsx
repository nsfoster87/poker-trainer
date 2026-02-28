import type { HandRange } from '../types';
import { getHandLabel, getHandType } from '../data/defaultRanges';

interface RangeGridProps {
  range: HandRange;
  size?: 'sm' | 'md';
}

const TYPE_COLORS = {
  pair:    { active: 'bg-purple-500', inactive: 'bg-gray-700' },
  suited:  { active: 'bg-teal-500', inactive: 'bg-gray-700' },
  offsuit: { active: 'bg-orange-500', inactive: 'bg-gray-700' },
};

export default function RangeGrid({ range, size = 'sm' }: RangeGridProps) {
  const cellSize = size === 'sm' ? 'w-4 h-4 text-[5px]' : 'w-7 h-7 text-[9px]';

  return (
    <div className="inline-grid grid-cols-13 gap-px">
      {range.map((row, r) =>
        row.map((active, c) => {
          const handType = getHandType(r, c);
          const colors = TYPE_COLORS[handType];
          const label = getHandLabel(r, c);

          return (
            <div
              key={`${r}-${c}`}
              className={`
                ${cellSize} flex items-center justify-center font-mono leading-none
                rounded-[1px] select-none
                ${active ? colors.active + ' text-white' : colors.inactive + ' text-gray-500'}
              `}
              title={label}
            >
              {size === 'md' && label}
            </div>
          );
        })
      )}
    </div>
  );
}
