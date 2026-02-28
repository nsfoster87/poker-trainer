import { useState, useCallback } from 'react';
import type { HandRange } from '../types';
import { getHandLabel, getHandType } from '../data/defaultRanges';

interface EditableRangeGridProps {
  range: HandRange;
  onChange: (range: HandRange) => void;
}

const TYPE_COLORS = {
  pair:    { active: 'bg-purple-500 hover:bg-purple-400', inactive: 'bg-gray-700 hover:bg-gray-600' },
  suited:  { active: 'bg-teal-500 hover:bg-teal-400', inactive: 'bg-gray-700 hover:bg-gray-600' },
  offsuit: { active: 'bg-orange-500 hover:bg-orange-400', inactive: 'bg-gray-700 hover:bg-gray-600' },
};

export default function EditableRangeGrid({ range, onChange }: EditableRangeGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);

  const toggleCell = useCallback((row: number, col: number, forceValue?: boolean) => {
    const newRange = range.map((r) => [...r]);
    newRange[row][col] = forceValue ?? !newRange[row][col];
    onChange(newRange);
  }, [range, onChange]);

  const handleMouseDown = useCallback((row: number, col: number) => {
    const newValue = !range[row][col];
    setIsDragging(true);
    setDragValue(newValue);
    toggleCell(row, col, newValue);
  }, [range, toggleCell]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (isDragging) {
      toggleCell(row, col, dragValue);
    }
  }, [isDragging, dragValue, toggleCell]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className="inline-grid grid-cols-13 gap-px select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {range.map((row, r) =>
        row.map((active, c) => {
          const handType = getHandType(r, c);
          const colors = TYPE_COLORS[handType];
          const label = getHandLabel(r, c);

          return (
            <div
              key={`${r}-${c}`}
              className={`
                w-8 h-8 flex items-center justify-center text-[9px] font-mono
                rounded-[2px] cursor-pointer transition-colors
                ${active ? colors.active + ' text-white font-bold' : colors.inactive + ' text-gray-500'}
              `}
              title={label}
              onMouseDown={() => handleMouseDown(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
            >
              {label}
            </div>
          );
        })
      )}
    </div>
  );
}
