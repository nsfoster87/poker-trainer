import { useGameStore } from '../store/gameStore';
import { computeSeatPositions } from '../utils/seatLayout';
import Seat from './Seat';

export default function PokerTable() {
  const players = useGameStore((s) => s.players);
  const dealerSeatIndex = useGameStore((s) => s.dealerSeatIndex);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const seatCount = useGameStore((s) => s.settings.seatCount);
  const seatPositions = computeSeatPositions(seatCount);

  return (
    <div className="relative w-full max-w-4xl aspect-[16/10] mx-auto">
      {/* Table felt */}
      <div className="absolute inset-[8%] rounded-[50%] bg-green-800 border-[12px] border-amber-900 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5),0_8px_40px_rgba(0,0,0,0.6)]">
        {/* Felt texture overlay */}
        <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Seats */}
      {players.map((player) => {
        const pos = seatPositions[player.seatIndex];
        return (
          <Seat
            key={player.seatIndex}
            player={player}
            isDealer={player.seatIndex === dealerSeatIndex}
            isActive={player.seatIndex === activePlayerIndex}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          />
        );
      })}
    </div>
  );
}
