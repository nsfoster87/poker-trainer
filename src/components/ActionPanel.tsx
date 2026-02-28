import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import BetSizer from './BetSizer';

export default function ActionPanel() {
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);
  const pot = useGameStore((s) => s.pot);
  const settings = useGameStore((s) => s.settings);
  const playerAction = useGameStore((s) => s.playerAction);

  const [showRaiseSizer, setShowRaiseSizer] = useState(false);

  if (activePlayerIndex === null) return null;

  const activePlayer = players.find((p) => p.seatIndex === activePlayerIndex);
  if (!activePlayer) return null;

  const highestBet = Math.max(...players.map((p) => p.currentBet));
  const callAmount = highestBet - activePlayer.currentBet;
  const minRaise = highestBet + settings.bigBlind;
  const maxBet = activePlayer.currentBet + activePlayer.stack;

  const handleFold = () => {
    playerAction(activePlayerIndex, 'fold');
    setShowRaiseSizer(false);
  };

  const handleCall = () => {
    playerAction(activePlayerIndex, 'call', highestBet);
    setShowRaiseSizer(false);
  };

  const handleRaiseConfirm = (amount: number) => {
    playerAction(activePlayerIndex, 'raise', amount);
    setShowRaiseSizer(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-gray-900/95 border border-gray-700 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
        <div className="text-xs text-gray-400 mb-2 text-center">
          <span className="font-bold text-yellow-400">{activePlayer.position}</span>
          {' '}to act — Stack: {activePlayer.stack}
        </div>

        {showRaiseSizer ? (
          <BetSizer
            minRaise={minRaise}
            maxBet={maxBet}
            pot={pot}
            onConfirm={handleRaiseConfirm}
            onCancel={() => setShowRaiseSizer(false)}
          />
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleFold}
              className="px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Fold
            </button>
            <button
              onClick={handleCall}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {callAmount > 0 ? `Call ${callAmount}` : 'Check'}
            </button>
            <button
              onClick={() => setShowRaiseSizer(true)}
              className="px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Raise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
