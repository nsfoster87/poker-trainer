import { create } from 'zustand';
import type { Player, Street, Card, Settings, ActionRecord, Position } from '../types';
import { assignPositions, findSeatByPosition, getPreflopActionOrder } from '../utils/positions';
import { cardKey } from '../utils/deck';
import { findNextActivePlayer, getFirstToAct } from './actionLogic';

interface GameStore {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  street: Street;
  pot: number;
  communityCards: Card[];
  activePosition: Position | null;
  lastRaiserPosition: Position | null;
  dealerSeatIndex: number;
  players: Player[];

  usedCardKeys: Set<string>;
  cardPickerOpen: boolean;
  cardPickerMode: 'hole' | 'flop' | 'turn' | 'river' | null;

  setDealerSeat: (seatIndex: number) => void;
  setUserSeat: (seatIndex: number) => void;
  setPlayerStack: (seatIndex: number, stack: number) => void;
  rotateDealerLeft: () => void;
  initializePlayers: () => void;
  deal: () => void;
  setUserHoleCards: (cards: [Card, Card]) => void;
  openCardPicker: (mode: 'hole' | 'flop' | 'turn' | 'river') => void;
  closeCardPicker: () => void;
  cancelDeal: () => void;
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
      stack: settings.defaultStacks,
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
  defaultStacks: 200,
  stackDisplayMode: 'cash',
};

export const useGameStore = create<GameStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  street: 'idle',
  pot: 0,
  communityCards: [],
  activePosition: null,
  lastRaiserPosition: null,
  dealerSeatIndex: 4,
  players: buildPlayers(DEFAULT_SETTINGS, 4),
  usedCardKeys: new Set(),
  cardPickerOpen: false,
  cardPickerMode: null,

  updateSettings: (patch) => {
    const newSettings = { ...get().settings, ...patch };
    const displayOnlyKeys: (keyof Settings)[] = ['stackDisplayMode'];
    const patchKeys = Object.keys(patch) as (keyof Settings)[];
    const onlyDisplayOnly =
      patchKeys.length > 0 &&
      patchKeys.every((k) => displayOnlyKeys.includes(k));
    if (onlyDisplayOnly) {
      set({ settings: newSettings });
      return;
    }
    const players = buildPlayers(newSettings, get().dealerSeatIndex);
    set({ settings: newSettings, players, street: 'idle', pot: 0, communityCards: [], activePosition: null, lastRaiserPosition: null, usedCardKeys: new Set() });
  },

  setDealerSeat: (seatIndex) => {
    const players = buildPlayers(get().settings, seatIndex);
    set({ dealerSeatIndex: seatIndex, players, street: 'idle', pot: 0, communityCards: [], activePosition: null, lastRaiserPosition: null, usedCardKeys: new Set() });
  },

  setUserSeat: (seatIndex) => {
    const { settings, dealerSeatIndex, players } = get();
    const n = settings.seatCount;
    if (seatIndex < 0 || seatIndex >= n) return;
    if (seatIndex === settings.userSeatIndex) return;

    const oldUserSeat = settings.userSeatIndex;
    const oldOffset = (oldUserSeat - dealerSeatIndex + n) % n;
    const newDealer = (seatIndex - oldOffset + n) % n;
    const newPosMap = assignPositions(newDealer, n);
    const updatedPlayers = players.map((p) => ({
      ...p,
      position: newPosMap.get(p.seatIndex)!,
      isUser: p.seatIndex === seatIndex,
    }));
    set({
      dealerSeatIndex: newDealer,
      settings: { ...settings, userSeatIndex: seatIndex },
      players: updatedPlayers,
    });
  },

  setPlayerStack: (seatIndex, stack) => {
    const players = get().players.map((p) =>
      p.seatIndex === seatIndex ? { ...p, stack: Math.max(0, stack) } : p
    );
    set({ players });
  },

  rotateDealerLeft: () => {
    const { dealerSeatIndex, settings } = get();
    const newDealer = (dealerSeatIndex + 1) % settings.seatCount;
    const players = buildPlayers(settings, newDealer);
    set({ dealerSeatIndex: newDealer, players, street: 'idle', pot: 0, communityCards: [], activePosition: null, lastRaiserPosition: null, usedCardKeys: new Set() });
  },

  initializePlayers: () => {
    const { settings, dealerSeatIndex } = get();
    set({ players: buildPlayers(settings, dealerSeatIndex) });
  },

  deal: () => {
    const { settings, dealerSeatIndex } = get();
    const players = buildPlayers(settings, dealerSeatIndex);

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
        p.currentBet = settings.smallBlind;
        p.stack -= settings.smallBlind;
        pot += settings.smallBlind;
      } else if (pos === 'BB') {
        p.currentBet = settings.bigBlind;
        p.stack -= settings.bigBlind;
        pot += settings.bigBlind;
      }
    }

    set({
      players,
      street: 'preflop',
      pot,
      communityCards: [],
      activePosition: null,
      lastRaiserPosition: null,
      usedCardKeys: new Set(),
      cardPickerOpen: true,
      cardPickerMode: 'hole',
    });
  },

  setUserHoleCards: (cards) => {
    const players = get().players.map((p) =>
      p.isUser ? { ...p, cards } : p
    );

    const { dealerSeatIndex, settings } = get();
    const posMap = assignPositions(dealerSeatIndex, settings.seatCount);
    const preflopOrder = getPreflopActionOrder(dealerSeatIndex, settings.seatCount);
    const firstToActSeat = preflopOrder[0];
    const firstToActPosition = posMap.get(firstToActSeat) ?? null;

    const usedCardKeys = computeUsedCards(players, get().communityCards);
    set({
      players,
      usedCardKeys,
      cardPickerOpen: false,
      cardPickerMode: null,
      activePosition: firstToActPosition,
    });
  },

  openCardPicker: (mode) => {
    set({ cardPickerOpen: true, cardPickerMode: mode });
  },

  closeCardPicker: () => {
    set({ cardPickerOpen: false, cardPickerMode: null });
  },

  cancelDeal: () => {
    const { settings, dealerSeatIndex } = get();
    const players = buildPlayers(settings, dealerSeatIndex);
    set({
      players,
      street: 'idle',
      pot: 0,
      communityCards: [],
      activePosition: null,
      lastRaiserPosition: null,
      usedCardKeys: new Set(),
      cardPickerOpen: false,
      cardPickerMode: null,
    });
  },

  setCommunityCards: (newCards) => {
    const state = get();
    const communityCards = [...state.communityCards, ...newCards];
    const usedCardKeys = computeUsedCards(state.players, communityCards);

    // Reset bets for new street and find first to act
    const players = state.players.map((p) => ({
      ...p,
      currentBet: 0,
      actionHistory: [] as ActionRecord[],
    }));
    const posMap = assignPositions(state.dealerSeatIndex, state.settings.seatCount);
    const firstToActSeat = getFirstToAct(players, state.dealerSeatIndex, state.settings.seatCount, state.street);
    const firstToActPosition = firstToActSeat != null ? posMap.get(firstToActSeat) ?? null : null;

    set({
      communityCards,
      usedCardKeys,
      cardPickerOpen: false,
      cardPickerMode: null,
      players,
      activePosition: firstToActPosition,
      lastRaiserPosition: null,
    });
  },

  playerAction: (seatIndex, action, amount) => {
    const state = get();
    const players = state.players.map((p) => (p.seatIndex === seatIndex ? { ...p } : p));
    const player = players.find((p) => p.seatIndex === seatIndex);
    if (!player) return;

    const record: ActionRecord = { action, amount };
    player.actionHistory = [...player.actionHistory, record];

    let potDelta = 0;
    let newLastRaiserPosition: Position | null = state.lastRaiserPosition;

    if (action === 'fold') {
      player.hasFolded = true;
      player.cards = null;
    } else if (action === 'call') {
      const highestBet = Math.max(...players.map((p) => p.currentBet));
      const callAmount = Math.max(0, highestBet - player.currentBet);
      player.stack -= callAmount;
      potDelta = callAmount;
      player.currentBet = highestBet;
    } else if (action === 'raise') {
      const raiseTotal = amount ?? state.settings.bigBlind * 2;
      const additional = raiseTotal - player.currentBet;
      player.stack -= additional;
      potDelta = additional;
      player.currentBet = raiseTotal;
      newLastRaiserPosition = player.position;
    }

    const posMap = assignPositions(state.dealerSeatIndex, state.settings.seatCount);
    const lastRaiserSeat =
      state.lastRaiserPosition != null
        ? findSeatByPosition(posMap, state.lastRaiserPosition)
        : null;

    // Check if only one player remains
    const activePlayers = players.filter((p) => !p.hasFolded);
    let nextActiveSeat: number | null = null;

    if (activePlayers.length > 1) {
      nextActiveSeat = findNextActivePlayer(
        seatIndex,
        players,
        state.dealerSeatIndex,
        state.settings.seatCount,
        state.street,
        action === 'raise' ? seatIndex : lastRaiserSeat,
      );
    }

    const nextActivePosition = nextActiveSeat != null ? posMap.get(nextActiveSeat) ?? null : null;

    set({
      players,
      pot: state.pot + potDelta,
      activePosition: nextActivePosition,
      lastRaiserPosition: newLastRaiserPosition,
    });
  },

  advanceToNextStreet: () => {
    const { street } = get();
    const streetMap: Record<string, { next: Street; pickerMode: 'flop' | 'turn' | 'river' }> = {
      preflop: { next: 'flop', pickerMode: 'flop' },
      flop: { next: 'turn', pickerMode: 'turn' },
      turn: { next: 'river', pickerMode: 'river' },
    };

    const transition = streetMap[street];
    if (!transition) return;

    set({
      street: transition.next,
      activePosition: null,
      lastRaiserPosition: null,
      cardPickerOpen: true,
      cardPickerMode: transition.pickerMode,
    });
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
      activePosition: null,
      lastRaiserPosition: null,
      usedCardKeys: new Set(),
      cardPickerOpen: false,
      cardPickerMode: null,
    });
  },
}));
