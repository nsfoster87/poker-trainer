import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { computeSeatPositions, getSeatAngle } from '../utils/seatLayout';
import Seat from './Seat';
import ContextMenu from './ContextMenu';
import CommunityCards from './CommunityCards';

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
  const setPlayerStack = useGameStore((s) => s.setPlayerStack);
  const pot = useGameStore((s) => s.pot);
  const settings = useGameStore((s) => s.settings);
  const communityCards = useGameStore((s) => s.communityCards);
  const advanceToNextStreet = useGameStore((s) => s.advanceToNextStreet);

  const formatAmount = (value: number) =>
    settings.stackDisplayMode === 'bb'
      ? `${(value / settings.bigBlind).toFixed(2)} BB`
      : `$${value.toLocaleString()}`;
  const seatPositions = computeSeatPositions(seatCount);

  const [menu, setMenu] = useState<MenuState | null>(null);

  const handleSeatContextMenu = useCallback((seatIndex: number, e: React.MouseEvent) => {
    setMenu({ x: e.clientX, y: e.clientY, seatIndex });
  }, []);

  const menuOptions = menu
    ? [
        { label: 'Sit Here', onClick: () => setUserSeat(menu.seatIndex) },
        { label: 'Set Dealer', onClick: () => setDealerSeat(menu.seatIndex) },
        {
          label: 'Set stack…',
          onClick: () => {
            const raw = prompt('Stack amount:');
            const value = raw !== null ? Number(raw) : NaN;
            if (!Number.isNaN(value) && value >= 0) {
              setPlayerStack(menu.seatIndex, value);
            }
            setMenu(null);
          },
        },
      ]
    : [];

  const isDealt = street !== 'idle';
  const activePlayers = players.filter((p) => !p.hasFolded);
  const roundComplete = isDealt && activePlayerIndex === null && activePlayers.length > 1;
  const canAdvance = street === 'preflop' || street === 'flop' || street === 'turn';
  const showAdvance = roundComplete && canAdvance;

  return (
    <div className="relative w-full max-w-4xl aspect-[16/10] mx-auto">
      {/* Table felt */}
      <div className="absolute inset-[8%] rounded-[50%] bg-green-800 border-[12px] border-amber-900 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5),0_8px_40px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />

        {/* Center content: community cards + pot */}
        {isDealt && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
            {communityCards.length > 0 && <CommunityCards cards={communityCards} />}
            {pot > 0 && (
              <div className="text-sm text-yellow-300 font-bold bg-black/40 px-3 py-1 rounded-full">
                Pot: {formatAmount(pot)}
              </div>
            )}
            {showAdvance && (
              <button
                onClick={advanceToNextStreet}
                className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors"
              >
                {street === 'preflop' ? 'Deal Flop' : street === 'flop' ? 'Deal Turn' : 'Deal River'}
              </button>
            )}
            {isDealt && activePlayerIndex === null && activePlayers.length <= 1 && (
              <div className="text-sm text-green-400 font-bold bg-black/40 px-3 py-1 rounded-full">
                Hand complete — all folded
              </div>
            )}
            {street === 'river' && activePlayerIndex === null && activePlayers.length > 1 && (
              <div className="text-sm text-green-400 font-bold bg-black/40 px-3 py-1 rounded-full">
                Hand complete — showdown
              </div>
            )}
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
            angle={getSeatAngle(player.seatIndex, seatCount)}
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
