import { useState, useMemo } from 'react';
import { useGameStore, getEnrichedPlayers } from '../store/gameStore';
import { useActivePlayerSeat } from '../store/gameSelectors';
import BetSizer from './BetSizer';

export default function ActionPanel() {
  const activePlayerSeat = useActivePlayerSeat();
  const players = useGameStore((s) => s.players);
  const handStateByPosition = useGameStore((s) => s.handStateByPosition);
  const enrichedPlayers = useMemo(
    () => getEnrichedPlayers(players, handStateByPosition),
    [players, handStateByPosition],
  );
  const pot = useGameStore((s) => s.pot);
  const settings = useGameStore((s) => s.settings);
  const playerAction = useGameStore((s) => s.playerAction);

  const [showRaiseSizer, setShowRaiseSizer] = useState(false);

  if (activePlayerSeat === null) return null;

  const activePlayer = enrichedPlayers.find((p) => p.seatIndex === activePlayerSeat);
  if (!activePlayer) return null;

  const { stackDisplayMode, bigBlind } = settings;
  const formatAmount = (value: number) =>
    stackDisplayMode === 'bb'
      ? `${(value / bigBlind).toFixed(2)} BB`
      : `$${value.toLocaleString()}`;

  const highestBet = Math.max(...enrichedPlayers.map((p) => p.currentBet));
  const callAmount = highestBet - activePlayer.currentBet;
  const minRaise = highestBet + settings.bigBlind;
  const maxBet = activePlayer.currentBet + activePlayer.stack;

  const handleFold = () => {
    playerAction(activePlayerSeat, 'fold');
    setShowRaiseSizer(false);
  };

  const handleCall = () => {
    playerAction(activePlayerSeat, 'call', highestBet);
    setShowRaiseSizer(false);
  };

  const handleRaiseConfirm = (amount: number) => {
    playerAction(activePlayerSeat, 'raise', amount);
    setShowRaiseSizer(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
        <div className="text-xs text-gray-400 mb-2 text-center">
          <span className="font-bold text-yellow-400">{activePlayer.position}</span>
          {' '}to act — Stack: {formatAmount(activePlayer.stack)}
        </div>

        {showRaiseSizer ? (
          <BetSizer
            minRaise={minRaise}
            maxBet={maxBet}
            pot={pot}
            stackDisplayMode={stackDisplayMode}
            bigBlind={bigBlind}
            onConfirm={handleRaiseConfirm}
            onCancel={() => setShowRaiseSizer(false)}
          />
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleFold}
              className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Fold
            </button>
            <button
              onClick={handleCall}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {callAmount > 0 ? `Call ${formatAmount(callAmount)}` : 'Check'}
            </button>
            <button
              onClick={() => setShowRaiseSizer(true)}
              className="px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Raise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
