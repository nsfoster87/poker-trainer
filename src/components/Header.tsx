import { useGameStore } from '../store/gameStore';
import BlindsEditor from './BlindsEditor';

interface HeaderProps {
  onOpenRangeEditor: () => void;
}

export default function Header({ onOpenRangeEditor }: HeaderProps) {
  const nextHand = useGameStore((s) => s.nextHand);
  const deal = useGameStore((s) => s.deal);
  const street = useGameStore((s) => s.street);
  const seatCount = useGameStore((s) => s.settings.seatCount);
  const updateSettings = useGameStore((s) => s.updateSettings);

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-700">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white">Poker Trainer</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Seats:</label>
          <select
            value={seatCount}
            onChange={(e) => updateSettings({ seatCount: Number(e.target.value) })}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onOpenRangeEditor}
          className="px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded transition-colors cursor-pointer"
        >
          Edit Ranges
        </button>
      </div>

      <BlindsEditor />

      <div className="flex items-center gap-3">
        {street === 'idle' && (
          <button
            onClick={deal}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded transition-colors cursor-pointer"
          >
            Deal
          </button>
        )}
        <button
          onClick={nextHand}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium rounded transition-colors cursor-pointer"
        >
          Next Hand
        </button>
      </div>
    </header>
  );
}
