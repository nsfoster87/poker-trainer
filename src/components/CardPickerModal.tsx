import type { Card } from '../types';
import { RANKS, SUITS, SUIT_SYMBOLS, SUIT_COLORS, cardKey } from '../utils/deck';

interface CardPickerModalProps {
  selectedCards: Card[];
  usedCards: Set<string>;
  maxSelections: number;
  onSelect: (card: Card) => void;
  onDeselect: (card: Card) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
}

export default function CardPickerModal({
  selectedCards,
  usedCards,
  maxSelections,
  onSelect,
  onDeselect,
  onConfirm,
  onCancel,
  title,
}: CardPickerModalProps) {
  const selectedKeys = new Set(selectedCards.map(cardKey));

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-600">
        <h2 className="text-lg font-bold text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">
          Select {maxSelections} card{maxSelections > 1 ? 's' : ''} ({selectedCards.length}/{maxSelections})
        </p>

        <div className="space-y-2">
          {SUITS.map((suit) => (
            <div key={suit} className="flex gap-1">
              {RANKS.map((rank) => {
                const card: Card = { rank, suit };
                const key = cardKey(card);
                const isSelected = selectedKeys.has(key);
                const isUsed = usedCards.has(key) && !isSelected;

                return (
                  <button
                    key={key}
                    disabled={isUsed}
                    onClick={() => {
                      if (isSelected) {
                        onDeselect(card);
                      } else if (selectedCards.length < maxSelections) {
                        onSelect(card);
                      }
                    }}
                    className={`
                      w-10 h-12 rounded border text-xs font-bold flex flex-col items-center justify-center
                      transition-all select-none
                      ${isUsed
                        ? 'bg-gray-700 border-gray-600 text-gray-600 cursor-not-allowed'
                        : isSelected
                          ? 'bg-yellow-400 border-yellow-300 scale-105 shadow-lg'
                          : 'bg-white border-gray-300 hover:bg-gray-100 cursor-pointer'}
                    `}
                  >
                    <span style={{ color: isUsed ? undefined : SUIT_COLORS[suit] }}>{rank}</span>
                    <span style={{ color: isUsed ? undefined : SUIT_COLORS[suit] }}>{SUIT_SYMBOLS[suit]}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={selectedCards.length !== maxSelections}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 text-white text-sm font-medium rounded transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
