import type { Player } from '../types';
import { useGameStore } from '../store/gameStore';
import DealerChip from './DealerChip';
import PlayerCards from './PlayerCards';
import BetDisplay from './BetDisplay';

interface SeatProps {
  player: Player;
  isDealer: boolean;
  isActive: boolean;
  isDealt: boolean;
  angle: number;
  style: React.CSSProperties;
  onContextMenu: (e: React.MouseEvent) => void;
}

const BET_OFFSET_PX = 78;

export default function Seat({ player, isDealer, isActive, isDealt, angle, style, onContextMenu }: SeatProps) {
  const stackDisplayMode = useGameStore((s) => s.settings.stackDisplayMode);
  const bigBlind = useGameStore((s) => s.settings.bigBlind);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const formattedStack =
    stackDisplayMode === 'bb'
      ? `${(player.stack / bigBlind).toFixed(2)} BB`
      : `$${player.stack.toLocaleString()}`;

  const toggleDisplayMode = () =>
    updateSettings({ stackDisplayMode: stackDisplayMode === 'cash' ? 'bb' : 'cash' });

  const betDx = Math.cos(angle) * BET_OFFSET_PX;
  const betDy = -Math.sin(angle) * BET_OFFSET_PX;

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
      style={style}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e);
      }}
    >
      {isDealt && !player.hasFolded && (
        <div className="-mb-5 flex justify-center">
          <PlayerCards cards={player.cards} faceUp={player.isUser && !!player.cards} />
        </div>
      )}

      <div className="relative">
        {isDealer && (
          <div className="absolute -top-1 -right-1 z-10">
            <DealerChip />
          </div>
        )}
        <div
          className={`
            w-16 h-16 rounded-full flex items-center justify-center
            border-2 text-sm font-bold select-none transition-all
            ${player.isUser
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-gray-700 border-gray-500 text-gray-200'}
            ${isActive ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-green-900' : ''}
            ${player.hasFolded ? 'opacity-40' : ''}
          `}
        >
          {player.position}
        </div>

        {player.currentBet > 0 && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none z-20"
            style={{
              transform: `translate(calc(-50% + ${betDx}px), calc(-50% + ${betDy}px))`,
            }}
          >
            <BetDisplay amount={player.currentBet} stackDisplayMode={stackDisplayMode} bigBlind={bigBlind} />
          </div>
        )}
      </div>

      <div
        className="mt-1 text-xs text-gray-300 bg-gray-900/70 px-2 py-0.5 rounded whitespace-nowrap select-none"
        onDoubleClick={toggleDisplayMode}
        title="Double-click to toggle BB/cash"
      >
        {formattedStack}
      </div>
    </div>
  );
}
