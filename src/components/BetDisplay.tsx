interface BetDisplayProps {
  amount: number;
}

export default function BetDisplay({ amount }: BetDisplayProps) {
  if (amount <= 0) return null;

  return (
    <div className="text-xs font-bold text-yellow-300 bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap">
      {amount}
    </div>
  );
}
