import type { Player } from '../types';
import DealerChip from './DealerChip';
import PlayerCards from './PlayerCards';
import BetDisplay from './BetDisplay';

interface SeatProps {
  player: Player;
  isDealer: boolean;
  isActive: boolean;
  isDealt: boolean;
  style: React.CSSProperties;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function Seat({ player, isDealer, isActive, isDealt, style, onContextMenu }: SeatProps) {
  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
      style={style}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e);
      }}
    >
      {/* Cards above the seat */}
      {isDealt && !player.hasFolded && (
        <div className="mb-1">
          <PlayerCards cards={player.cards} faceUp={player.isUser && !!player.cards} />
        </div>
      )}

      {isDealer && (
        <div className="absolute -top-1 -right-1 z-10">
          <DealerChip />
        </div>
      )}
      <div
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          border-2 text-sm font-bold select-none cursor-pointer transition-all
          ${player.isUser
            ? 'bg-blue-600 border-blue-400 text-white'
            : 'bg-gray-700 border-gray-500 text-gray-200'}
          ${isActive ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-green-900' : ''}
          ${player.hasFolded ? 'opacity-40' : ''}
        `}
      >
        {player.position}
      </div>
      <div className="mt-1 text-xs text-gray-300 bg-gray-900/70 px-2 py-0.5 rounded whitespace-nowrap">
        {player.stack}
      </div>

      {/* Current bet */}
      {player.currentBet > 0 && (
        <div className="mt-0.5">
          <BetDisplay amount={player.currentBet} />
        </div>
      )}
    </div>
  );
}
