import type { Card } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/deck';

interface CommunityCardsProps {
  cards: Card[];
}

function CommunityCard({ card }: { card: Card }) {
  return (
    <div className="w-14 h-20 rounded-lg bg-white border border-gray-300 flex flex-col items-center justify-center shadow-md text-base font-bold">
      <span style={{ color: SUIT_COLORS[card.suit] }}>{card.rank}</span>
      <span style={{ color: SUIT_COLORS[card.suit] }} className="text-xl leading-none">
        {SUIT_SYMBOLS[card.suit]}
      </span>
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="w-14 h-20 rounded-lg border-2 border-dashed border-green-600/40" />
  );
}

export default function CommunityCards({ cards }: CommunityCardsProps) {
  const slots = 5;
  return (
    <div className="flex gap-2">
      {Array.from({ length: slots }, (_, i) =>
        cards[i] ? (
          <CommunityCard key={i} card={cards[i]} />
        ) : (
          <EmptySlot key={i} />
        )
      )}
    </div>
  );
}
