import { useState, useEffect } from 'react';

interface BetSizerProps {
  minRaise: number;
  maxBet: number;
  pot: number;
  stackDisplayMode?: 'cash' | 'bb';
  bigBlind?: number;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

export default function BetSizer({
  minRaise,
  maxBet,
  pot,
  stackDisplayMode = 'cash',
  bigBlind = 2,
  onConfirm,
  onCancel,
}: BetSizerProps) {
  const [amount, setAmount] = useState(minRaise);

  useEffect(() => {
    setAmount(minRaise);
  }, [minRaise]);

  const presets = [
    { label: 'Min', value: minRaise },
    { label: '1/3 Pot', value: Math.max(minRaise, Math.round(pot / 3)) },
    { label: '1/2 Pot', value: Math.max(minRaise, Math.round(pot / 2)) },
    { label: '2/3 Pot', value: Math.max(minRaise, Math.round((pot * 2) / 3)) },
    { label: 'Pot', value: Math.max(minRaise, pot) },
    { label: 'All-In', value: maxBet },
  ];

  const clamp = (v: number) => Math.min(maxBet, Math.max(minRaise, v));

  const formatAmount = (value: number) =>
    stackDisplayMode === 'bb'
      ? `${(value / bigBlind).toFixed(2)} BB`
      : `$${value.toLocaleString()}`;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl">
      <div className="flex gap-2 mb-3 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setAmount(clamp(p.value))}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <input
          type="range"
          min={minRaise}
          max={maxBet}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="flex-1 accent-blue-500"
        />
        <input
          type="number"
          min={minRaise}
          max={maxBet}
          value={amount}
          onChange={(e) => setAmount(clamp(Number(e.target.value)))}
          className="w-20 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(amount)}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded transition-colors"
        >
          Raise to {formatAmount(amount)}
        </button>
      </div>
    </div>
  );
}
