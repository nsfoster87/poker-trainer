import { useState, useCallback } from 'react';
import Header from './components/Header';
import PokerTable from './components/PokerTable';
import CardPickerModal from './components/CardPickerModal';
import { useGameStore } from './store/gameStore';
import type { Card } from './types';
import { cardKey } from './utils/deck';

export default function App() {
  const cardPickerOpen = useGameStore((s) => s.cardPickerOpen);
  const cardPickerMode = useGameStore((s) => s.cardPickerMode);
  const usedCardKeys = useGameStore((s) => s.usedCardKeys);
  const setUserHoleCards = useGameStore((s) => s.setUserHoleCards);
  const closeCardPicker = useGameStore((s) => s.closeCardPicker);
  const setCommunityCards = useGameStore((s) => s.setCommunityCards);

  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const maxSelections = cardPickerMode === 'hole' ? 2
    : cardPickerMode === 'flop' ? 3
    : 1;

  const title = cardPickerMode === 'hole' ? 'Select Your Hole Cards'
    : cardPickerMode === 'flop' ? 'Select Flop Cards'
    : cardPickerMode === 'turn' ? 'Select Turn Card'
    : 'Select River Card';

  const handleSelect = useCallback((card: Card) => {
    setSelectedCards((prev) => [...prev, card]);
  }, []);

  const handleDeselect = useCallback((card: Card) => {
    const key = cardKey(card);
    setSelectedCards((prev) => prev.filter((c) => cardKey(c) !== key));
  }, []);

  const handleConfirm = useCallback(() => {
    if (cardPickerMode === 'hole' && selectedCards.length === 2) {
      setUserHoleCards(selectedCards as [Card, Card]);
    } else if (cardPickerMode && selectedCards.length === maxSelections) {
      setCommunityCards(selectedCards);
    }
    setSelectedCards([]);
  }, [cardPickerMode, selectedCards, maxSelections, setUserHoleCards, setCommunityCards]);

  const handleCancel = useCallback(() => {
    setSelectedCards([]);
    closeCardPicker();
  }, [closeCardPicker]);

  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <PokerTable />
      </main>

      {cardPickerOpen && cardPickerMode && (
        <CardPickerModal
          selectedCards={selectedCards}
          usedCards={usedCardKeys}
          maxSelections={maxSelections}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          title={title}
        />
      )}
    </div>
  );
}
