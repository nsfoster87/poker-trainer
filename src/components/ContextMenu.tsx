import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: { label: string; onClick: () => void }[];
}

export default function ContextMenu({ x, y, onClose, options }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {options.map((opt) => (
        <button
          key={opt.label}
          className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
          onClick={() => {
            opt.onClick();
            onClose();
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
