import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { computeSeatPositions } from '../utils/seatLayout';
import Seat from './Seat';
import ContextMenu from './ContextMenu';

interface MenuState {
  x: number;
  y: number;
  seatIndex: number;
}

export default function PokerTable() {
  const players = useGameStore((s) => s.players);
  const dealerSeatIndex = useGameStore((s) => s.dealerSeatIndex);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const seatCount = useGameStore((s) => s.settings.seatCount);
  const street = useGameStore((s) => s.street);
  const setDealerSeat = useGameStore((s) => s.setDealerSeat);
  const setUserSeat = useGameStore((s) => s.setUserSeat);
  const pot = useGameStore((s) => s.pot);
  const seatPositions = computeSeatPositions(seatCount);

  const [menu, setMenu] = useState<MenuState | null>(null);

  const handleSeatContextMenu = useCallback((seatIndex: number, e: React.MouseEvent) => {
    setMenu({ x: e.clientX, y: e.clientY, seatIndex });
  }, []);

  const menuOptions = menu
    ? [
        { label: 'Sit Here', onClick: () => setUserSeat(menu.seatIndex) },
        { label: 'Set Dealer', onClick: () => setDealerSeat(menu.seatIndex) },
      ]
    : [];

  const isDealt = street !== 'idle';

  return (
    <div className="relative w-full max-w-4xl aspect-[16/10] mx-auto">
      {/* Table felt */}
      <div className="absolute inset-[8%] rounded-[50%] bg-green-800 border-[12px] border-amber-900 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5),0_8px_40px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />

        {/* Pot display */}
        {isDealt && pot > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-sm text-yellow-300 font-bold bg-black/40 px-3 py-1 rounded-full">
              Pot: {pot}
            </div>
          </div>
        )}
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
            isDealt={isDealt}
            onContextMenu={(e) => handleSeatContextMenu(player.seatIndex, e)}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          />
        );
      })}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          options={menuOptions}
        />
      )}
    </div>
  );
}
