import type { Card } from '../types';
import { SUIT_SYMBOLS, SUIT_COLORS } from '../utils/deck';

interface PlayerCardsProps {
  cards: [Card, Card] | null;
  faceUp: boolean;
  largeText?: boolean;
}

function CardFace({ card, largeText }: { card: Card; largeText?: boolean }) {
  return (
    <div
      className={
        largeText
          ? 'w-10 h-14 rounded bg-white border border-gray-300 flex flex-col items-center justify-center gap-0 shadow-sm text-sm font-bold leading-none py-0.5 px-1'
          : 'w-10 h-14 rounded bg-white border border-gray-300 flex flex-col items-center justify-center shadow-sm text-xs font-bold leading-none'
      }
    >
      <span style={{ color: SUIT_COLORS[card.suit] }}>{card.rank}</span>
      <span style={{ color: SUIT_COLORS[card.suit] }}>{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  );
}

function CardBack() {
  return (
    <div className="w-10 h-14 rounded bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-500 shadow-sm flex items-center justify-center">
      <div className="w-5 h-7 rounded-sm border border-blue-400/40 bg-blue-800/60" />
    </div>
  );
}

export default function PlayerCards({ cards, faceUp, largeText = false }: PlayerCardsProps) {
  return (
    <div className="flex gap-0.5">
      {faceUp && cards ? (
        <>
          <CardFace card={cards[0]} largeText={largeText} />
          <CardFace card={cards[1]} largeText={largeText} />
        </>
      ) : (
        <>
          <CardBack />
          <CardBack />
        </>
      )}
    </div>
  );
}
