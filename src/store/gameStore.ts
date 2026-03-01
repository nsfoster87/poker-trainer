import { create } from 'zustand';
import type { Player, HandState, EnrichedPlayer, Street, Card, Settings, ActionRecord, Position } from '../types';
import { assignPositions, findSeatByPosition, getPreflopActionOrder, getPositionsForSeatCount } from '../utils/positions';
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
  handStateByPosition: Partial<Record<Position, HandState>>;

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
      isUser: i === settings.userSeatIndex,
    });
  }
  return players;
}

function buildInitialHandStateByPosition(
  settings: Settings,
  existing: Partial<Record<Position, HandState>> | undefined,
): Partial<Record<Position, HandState>> {
  const positions = getPositionsForSeatCount(settings.seatCount);
  const out: Partial<Record<Position, HandState>> = {};
  for (const pos of positions) {
    const prev = existing?.[pos];
    out[pos] = {
      cards: null,
      hasFolded: false,
      currentBet: 0,
      stack: prev?.stack ?? settings.defaultStacks,
      actionHistory: [],
    };
  }
  return out;
}

export function getEnrichedPlayers(
  players: Player[],
  handStateByPosition: Partial<Record<Position, HandState>>,
): EnrichedPlayer[] {
  return players.map((p) => {
    const hand = handStateByPosition[p.position];
    return {
      ...p,
      cards: hand?.cards ?? null,
      hasFolded: hand?.hasFolded ?? false,
      currentBet: hand?.currentBet ?? 0,
      stack: hand?.stack ?? 0,
      actionHistory: hand?.actionHistory ?? [],
    };
  });
}

function computeUsedCards(
  handStateByPosition: Partial<Record<Position, HandState>>,
  communityCards: Card[],
): Set<string> {
  const keys = new Set<string>();
  for (const hand of Object.values(handStateByPosition)) {
    if (hand?.cards) {
      keys.add(cardKey(hand.cards[0]));
      keys.add(cardKey(hand.cards[1]));
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
  handStateByPosition: buildInitialHandStateByPosition(DEFAULT_SETTINGS, undefined),
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
    const { dealerSeatIndex } = get();
    const players = buildPlayers(newSettings, dealerSeatIndex);
    const handStateByPosition = buildInitialHandStateByPosition(newSettings, get().handStateByPosition);
    set({ settings: newSettings, players, handStateByPosition, street: 'idle', pot: 0, communityCards: [], activePosition: null, lastRaiserPosition: null, usedCardKeys: new Set() });
  },

  setDealerSeat: (seatIndex) => {
    const { settings } = get();
    const players = buildPlayers(settings, seatIndex);
    const handStateByPosition = buildInitialHandStateByPosition(settings, get().handStateByPosition);
    set({ dealerSeatIndex: seatIndex, players, handStateByPosition, street: 'idle', pot: 0, communityCards: [], activePosition: null, lastRaiserPosition: null, usedCardKeys: new Set() });
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
    const { players, handStateByPosition } = get();
    const player = players.find((p) => p.seatIndex === seatIndex);
    if (!player) return;
    const pos = player.position;
    const hand = handStateByPosition[pos];
    if (!hand) return;
    const next = { ...handStateByPosition, [pos]: { ...hand, stack: Math.max(0, stack) } };
    set({ handStateByPosition: next });
  },

  rotateDealerLeft: () => {
    const { dealerSeatIndex, settings } = get();
    const newDealer = (dealerSeatIndex + 1) % settings.seatCount;
    const players = buildPlayers(settings, newDealer);
    const handStateByPosition = buildInitialHandStateByPosition(settings, get().handStateByPosition);
    set({ dealerSeatIndex: newDealer, players, handStateByPosition, street: 'idle', pot: 0, communityCards: [], activePosition: null, lastRaiserPosition: null, usedCardKeys: new Set() });
  },

  initializePlayers: () => {
    const { settings, dealerSeatIndex } = get();
    const players = buildPlayers(settings, dealerSeatIndex);
    const handStateByPosition = buildInitialHandStateByPosition(settings, get().handStateByPosition);
    set({ players, handStateByPosition });
  },

  deal: () => {
    const { settings, dealerSeatIndex, handStateByPosition } = get();
    const players = buildPlayers(settings, dealerSeatIndex);
    const positions = getPositionsForSeatCount(settings.seatCount);
    const nextHand: Partial<Record<Position, HandState>> = {};

    let pot = 0;
    for (const pos of positions) {
      const hand = handStateByPosition[pos] ?? {
        cards: null,
        hasFolded: false,
        currentBet: 0,
        stack: settings.defaultStacks,
        actionHistory: [],
      };
      let stack = hand.stack;
      if (settings.ante > 0) {
        stack -= settings.ante;
        pot += settings.ante;
      }
      let currentBet = 0;
      if (pos === 'SB') {
        currentBet = settings.smallBlind;
        stack -= settings.smallBlind;
        pot += settings.smallBlind;
      } else if (pos === 'BB') {
        currentBet = settings.bigBlind;
        stack -= settings.bigBlind;
        pot += settings.bigBlind;
      }
      nextHand[pos] = {
        cards: null,
        hasFolded: false,
        currentBet,
        stack,
        actionHistory: [],
      };
    }

    set({
      players,
      handStateByPosition: nextHand,
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
    const { players, handStateByPosition } = get();
    const userPlayer = players.find((p) => p.isUser);
    if (!userPlayer) return;
    const pos = userPlayer.position;
    const hand = handStateByPosition[pos];
    if (!hand) return;
    const nextHand = { ...handStateByPosition, [pos]: { ...hand, cards } };
    const usedCardKeys = computeUsedCards(nextHand, get().communityCards);

    const { dealerSeatIndex, settings } = get();
    const posMap = assignPositions(dealerSeatIndex, settings.seatCount);
    const preflopOrder = getPreflopActionOrder(dealerSeatIndex, settings.seatCount);
    const firstToActSeat = preflopOrder[0];
    const firstToActPosition = posMap.get(firstToActSeat) ?? null;

    set({
      handStateByPosition: nextHand,
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
    const handStateByPosition = buildInitialHandStateByPosition(settings, get().handStateByPosition);
    set({
      players,
      handStateByPosition,
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
    const nextHand: Partial<Record<Position, HandState>> = {};
    for (const pos of Object.keys(state.handStateByPosition) as Position[]) {
      const hand = state.handStateByPosition[pos];
      if (hand) {
        nextHand[pos] = { ...hand, currentBet: 0, actionHistory: [] };
      }
    }
    const usedCardKeys = computeUsedCards(nextHand, communityCards);
    const enriched = getEnrichedPlayers(state.players, nextHand);
    const firstToActSeat = getFirstToAct(enriched, state.dealerSeatIndex, state.settings.seatCount, state.street);
    const posMap = assignPositions(state.dealerSeatIndex, state.settings.seatCount);
    const firstToActPosition = firstToActSeat != null ? posMap.get(firstToActSeat) ?? null : null;

    set({
      communityCards,
      usedCardKeys,
      cardPickerOpen: false,
      cardPickerMode: null,
      handStateByPosition: nextHand,
      activePosition: firstToActPosition,
      lastRaiserPosition: null,
    });
  },

  playerAction: (seatIndex, action, amount) => {
    const state = get();
    const player = state.players.find((p) => p.seatIndex === seatIndex);
    if (!player) return;
    const pos = player.position;
    const hand = state.handStateByPosition[pos];
    if (!hand) return;

    const record: ActionRecord = { action, amount };
    const actionHistory = [...hand.actionHistory, record];

    let potDelta = 0;
    let newLastRaiserPosition: Position | null = state.lastRaiserPosition;
    let nextHand: HandState = { ...hand, actionHistory };

    if (action === 'fold') {
      nextHand = { ...nextHand, hasFolded: true, cards: null };
    } else if (action === 'call') {
      const enriched = getEnrichedPlayers(state.players, state.handStateByPosition);
      const highestBet = Math.max(...enriched.map((p) => p.currentBet));
      const callAmount = Math.max(0, highestBet - hand.currentBet);
      nextHand = {
        ...nextHand,
        stack: hand.stack - callAmount,
        currentBet: highestBet,
      };
      potDelta = callAmount;
    } else if (action === 'raise') {
      const raiseTotal = amount ?? state.settings.bigBlind * 2;
      const additional = raiseTotal - hand.currentBet;
      nextHand = {
        ...nextHand,
        stack: hand.stack - additional,
        currentBet: raiseTotal,
      };
      potDelta = additional;
      newLastRaiserPosition = pos;
    }

    const nextHandStateByPosition = { ...state.handStateByPosition, [pos]: nextHand };
    const enriched = getEnrichedPlayers(state.players, nextHandStateByPosition);

    const posMap = assignPositions(state.dealerSeatIndex, state.settings.seatCount);
    const lastRaiserSeat =
      state.lastRaiserPosition != null
        ? findSeatByPosition(posMap, state.lastRaiserPosition)
        : null;

    const activePlayers = enriched.filter((p) => !p.hasFolded);
    let nextActiveSeat: number | null = null;
    if (activePlayers.length > 1) {
      nextActiveSeat = findNextActivePlayer(
        seatIndex,
        enriched,
        state.dealerSeatIndex,
        state.settings.seatCount,
        state.street,
        action === 'raise' ? seatIndex : lastRaiserSeat,
      );
    }

    const nextActivePosition = nextActiveSeat != null ? posMap.get(nextActiveSeat) ?? null : null;

    set({
      handStateByPosition: nextHandStateByPosition,
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
    const handStateByPosition = buildInitialHandStateByPosition(settings, get().handStateByPosition);
    set({
      dealerSeatIndex: newDealer,
      players,
      handStateByPosition,
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
