import { useGameStore } from '../store/gameStore';
import { useRangeStore } from '../store/rangeStore';
import { rangePercentage } from '../data/defaultRanges';
import RangeGrid from './RangeGrid';

export default function RangeSidebar() {
  const players = useGameStore((s) => s.players);
  const street = useGameStore((s) => s.street);
  const getRange = useRangeStore((s) => s.getRange);

  if (street === 'idle') return null;

  const activePlayers = players.filter((p) => !p.hasFolded);

  return (
    <div className="w-64 bg-gray-900/80 border-l border-gray-700 overflow-y-auto p-3 space-y-3">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Hand Ranges</h2>

      {activePlayers.map((player) => {
        const range = getRange(player.position, 'open');
        const pct = rangePercentage(range);

        return (
          <div
            key={player.seatIndex}
            className={`
              p-2 rounded-lg border
              ${player.isUser
                ? 'border-blue-500/50 bg-blue-900/20'
                : 'border-gray-700 bg-gray-800/50'}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-200">
                {player.position}
              </span>
              <span className="text-[10px] text-gray-400">
                {pct.toFixed(1)}%
              </span>
            </div>
            <RangeGrid range={range} size="sm" />
          </div>
        );
      })}
    </div>
  );
}
