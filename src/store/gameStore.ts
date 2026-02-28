import { create } from 'zustand';
import type { Player, Street, Card, Settings, ActionRecord } from '../types';
import { assignPositions, getPreflopActionOrder } from '../utils/positions';
import { cardKey } from '../utils/deck';

interface GameStore {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  street: Street;
  pot: number;
  communityCards: Card[];
  activePlayerIndex: number | null;
  dealerSeatIndex: number;
  players: Player[];

  // All cards currently in use (hole cards + community cards)
  usedCardKeys: Set<string>;

  // Card picker state
  cardPickerOpen: boolean;
  cardPickerMode: 'hole' | 'flop' | 'turn' | 'river' | null;

  setDealerSeat: (seatIndex: number) => void;
  setUserSeat: (seatIndex: number) => void;
  rotateDealerLeft: () => void;
  initializePlayers: () => void;
  deal: () => void;
  setUserHoleCards: (cards: [Card, Card]) => void;
  openCardPicker: (mode: 'hole' | 'flop' | 'turn' | 'river') => void;
  closeCardPicker: () => void;
  setCommunityCards: (cards: Card[]) => void;
  playerAction: (seatIndex: number, action: 'fold' | 'call' | 'raise', amount?: number) => void;
  advanceToNextStreet: () => void;
  nextHand: () => void;
}

function buildPlayers(settings: Settings, dealerSeatIndex: number): Player[] {
  const posMap = assignPositions(dealerSeatIndex, settings.seatCount);
  const players: Player[] = [];

  for (let i = 0; i < settings.seatCount; i++) {
    players.push({
      seatIndex: i,
      position: posMap.get(i)!,
      cards: null,
      hasFolded: false,
      currentBet: 0,
      stack: settings.defaultStacks * settings.bigBlind,
      isUser: i === settings.userSeatIndex,
      actionHistory: [] as ActionRecord[],
    });
  }

  return players;
}

function computeUsedCards(players: Player[], communityCards: Card[]): Set<string> {
  const keys = new Set<string>();
  for (const p of players) {
    if (p.cards) {
      keys.add(cardKey(p.cards[0]));
      keys.add(cardKey(p.cards[1]));
    }
  }
  for (const c of communityCards) {
    keys.add(cardKey(c));
  }
  return keys;
}

const DEFAULT_SETTINGS: Settings = {
  seatCount: 9,
  userSeatIndex: 0,
  smallBlind: 1,
  bigBlind: 2,
  ante: 0,
  defaultStacks: 100,
};

export const useGameStore = create<GameStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  street: 'idle',
  pot: 0,
  communityCards: [],
  activePlayerIndex: null,
  dealerSeatIndex: 4,
  players: buildPlayers(DEFAULT_SETTINGS, 4),
  usedCardKeys: new Set(),
  cardPickerOpen: false,
  cardPickerMode: null,

  updateSettings: (patch) => {
    const newSettings = { ...get().settings, ...patch };
    const players = buildPlayers(newSettings, get().dealerSeatIndex);
    set({ settings: newSettings, players, street: 'idle', pot: 0, communityCards: [], activePlayerIndex: null, usedCardKeys: new Set() });
  },

  setDealerSeat: (seatIndex) => {
    const players = buildPlayers(get().settings, seatIndex);
    set({ dealerSeatIndex: seatIndex, players, street: 'idle', pot: 0, communityCards: [], activePlayerIndex: null, usedCardKeys: new Set() });
  },

  setUserSeat: (seatIndex) => {
    const newSettings = { ...get().settings, userSeatIndex: seatIndex };
    const players = buildPlayers(newSettings, get().dealerSeatIndex);
    set({ settings: newSettings, players });
  },

  rotateDealerLeft: () => {
    const { dealerSeatIndex, settings } = get();
    const newDealer = (dealerSeatIndex + 1) % settings.seatCount;
    const players = buildPlayers(settings, newDealer);
    set({ dealerSeatIndex: newDealer, players, street: 'idle', pot: 0, communityCards: [], activePlayerIndex: null, usedCardKeys: new Set() });
  },

  initializePlayers: () => {
    const { settings, dealerSeatIndex } = get();
    set({ players: buildPlayers(settings, dealerSeatIndex) });
  },

  deal: () => {
    const { settings, dealerSeatIndex } = get();
    const players = buildPlayers(settings, dealerSeatIndex);

    // Post blinds and antes
    let pot = 0;
    for (const p of players) {
      if (settings.ante > 0) {
        p.stack -= settings.ante;
        pot += settings.ante;
      }
    }

    const posMap = assignPositions(dealerSeatIndex, settings.seatCount);
    for (const p of players) {
      const pos = posMap.get(p.seatIndex);
      if (pos === 'SB') {
        const sbAmount = settings.smallBlind;
        p.currentBet = sbAmount;
        p.stack -= sbAmount;
        pot += sbAmount;
      } else if (pos === 'BB') {
        const bbAmount = settings.bigBlind;
        p.currentBet = bbAmount;
        p.stack -= bbAmount;
        pot += bbAmount;
      }
      // Give face-down cards to all players (represented as null until user picks)
      p.cards = null;
    }

    set({
      players,
      street: 'preflop',
      pot,
      communityCards: [],
      activePlayerIndex: null,
      usedCardKeys: new Set(),
      cardPickerOpen: true,
      cardPickerMode: 'hole',
    });
  },

  setUserHoleCards: (cards) => {
    const players = [...get().players];
    const userIdx = players.findIndex((p) => p.isUser);
    if (userIdx >= 0) {
      players[userIdx] = { ...players[userIdx], cards };
    }
    // Mark all non-user players as having face-down cards (placeholder)
    for (let i = 0; i < players.length; i++) {
      if (!players[i].isUser && !players[i].cards) {
        // Use a sentinel to indicate dealt but unknown cards
        players[i] = { ...players[i], cards: null };
      }
    }

    const { dealerSeatIndex, settings } = get();
    const preflopOrder = getPreflopActionOrder(dealerSeatIndex, settings.seatCount);
    const firstToAct = preflopOrder[0];

    const usedCardKeys = computeUsedCards(players, get().communityCards);
    set({
      players,
      usedCardKeys,
      cardPickerOpen: false,
      cardPickerMode: null,
      activePlayerIndex: firstToAct,
    });
  },

  openCardPicker: (mode) => {
    set({ cardPickerOpen: true, cardPickerMode: mode });
  },

  closeCardPicker: () => {
    set({ cardPickerOpen: false, cardPickerMode: null });
  },

  setCommunityCards: (newCards) => {
    const communityCards = [...get().communityCards, ...newCards];
    const usedCardKeys = computeUsedCards(get().players, communityCards);
    set({ communityCards, usedCardKeys, cardPickerOpen: false, cardPickerMode: null });
  },

  playerAction: (seatIndex, action, amount) => {
    const state = get();
    const players = [...state.players];
    const idx = players.findIndex((p) => p.seatIndex === seatIndex);
    if (idx < 0) return;

    const player = { ...players[idx] };
    const record: ActionRecord = { action, amount };
    player.actionHistory = [...player.actionHistory, record];

    let potDelta = 0;
    if (action === 'fold') {
      player.hasFolded = true;
      player.cards = null;
    } else if (action === 'call') {
      const callAmount = Math.max(0, (amount ?? state.settings.bigBlind) - player.currentBet);
      player.stack -= callAmount;
      potDelta = callAmount;
      player.currentBet += callAmount;
    } else if (action === 'raise') {
      const raiseTotal = amount ?? state.settings.bigBlind * 2;
      const additional = raiseTotal - player.currentBet;
      player.stack -= additional;
      potDelta = additional;
      player.currentBet = raiseTotal;
    }

    players[idx] = player;

    // Find next active player
    const { dealerSeatIndex, settings, street } = state;
    const actionOrder = getPreflopActionOrder(dealerSeatIndex, settings.seatCount);
    const currentOrderIdx = actionOrder.indexOf(seatIndex);
    let nextActive: number | null = null;

    for (let i = 1; i < actionOrder.length; i++) {
      const candidateIdx = (currentOrderIdx + i) % actionOrder.length;
      const candidateSeat = actionOrder[candidateIdx];
      const candidatePlayer = players.find((p) => p.seatIndex === candidateSeat);
      if (candidatePlayer && !candidatePlayer.hasFolded) {
        // Check if this player has already had a chance to act
        if (candidatePlayer.actionHistory.length === 0 || (action === 'raise' && candidateSeat !== seatIndex)) {
          nextActive = candidateSeat;
          break;
        }
      }
    }

    // Check if only one player remains
    const activePlayers = players.filter((p) => !p.hasFolded);
    if (activePlayers.length <= 1) {
      nextActive = null;
    }

    set({
      players,
      pot: state.pot + potDelta,
      activePlayerIndex: nextActive,
    });

    // If no next active and street is not yet complete, handle street transition
    if (nextActive === null && activePlayers.length > 1 && street === 'preflop') {
      // Will be handled by advanceToNextStreet
    }
  },

  advanceToNextStreet: () => {
    const { street, players } = get();
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river'];
    const currentIdx = streetOrder.indexOf(street);
    if (currentIdx < 0 || currentIdx >= streetOrder.length - 1) return;

    const nextStreet = streetOrder[currentIdx + 1];

    // Reset current bets for all players
    const updatedPlayers = players.map((p) => ({ ...p, currentBet: 0 }));

    if (nextStreet === 'flop') {
      set({ street: nextStreet, players: updatedPlayers, activePlayerIndex: null, cardPickerOpen: true, cardPickerMode: 'flop' });
    } else if (nextStreet === 'turn') {
      set({ street: nextStreet, players: updatedPlayers, activePlayerIndex: null, cardPickerOpen: true, cardPickerMode: 'turn' });
    } else if (nextStreet === 'river') {
      set({ street: nextStreet, players: updatedPlayers, activePlayerIndex: null, cardPickerOpen: true, cardPickerMode: 'river' });
    }
  },

  nextHand: () => {
    const { dealerSeatIndex, settings } = get();
    const newDealer = (dealerSeatIndex + 1) % settings.seatCount;
    const players = buildPlayers(settings, newDealer);
    set({
      dealerSeatIndex: newDealer,
      players,
      street: 'idle',
      pot: 0,
      communityCards: [],
      activePlayerIndex: null,
      usedCardKeys: new Set(),
      cardPickerOpen: false,
      cardPickerMode: null,
    });
  },
}));
