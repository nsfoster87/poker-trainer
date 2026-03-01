const CHIP_COLORS = ['#ef4444', '#3b82f6', '#22c55e'];

interface BetDisplayProps {
  amount: number;
  stackDisplayMode: 'cash' | 'bb';
  bigBlind: number;
}

export default function BetDisplay({ amount, stackDisplayMode, bigBlind }: BetDisplayProps) {
  if (amount <= 0) return null;

  const chipCount = amount >= bigBlind * 5 ? 3 : amount >= bigBlind ? 2 : 1;

  const formattedAmount =
    stackDisplayMode === 'bb'
      ? `${(amount / bigBlind).toFixed(2)} BB`
      : `$${amount.toLocaleString()}`;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center">
        {Array.from({ length: chipCount }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border-2 border-white/30 shadow"
            style={{
              backgroundColor: CHIP_COLORS[i],
              marginTop: i > 0 ? '-8px' : undefined,
              zIndex: chipCount - i,
              position: 'relative',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-bold text-yellow-300 whitespace-nowrap mt-0.5">
        {formattedAmount}
      </span>
    </div>
  );
}
