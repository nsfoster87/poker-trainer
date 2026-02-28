import { create } from 'zustand';
import type { Player, Street, Card, Settings, ActionRecord } from '../types';
import { assignPositions } from '../utils/positions';

interface GameStore {
  // Settings
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  // Game state
  street: Street;
  pot: number;
  communityCards: Card[];
  activePlayerIndex: number | null;
  dealerSeatIndex: number;
  players: Player[];

  // Actions
  setDealerSeat: (seatIndex: number) => void;
  setUserSeat: (seatIndex: number) => void;
  rotateDealerLeft: () => void;
  initializePlayers: () => void;
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

  updateSettings: (patch) => {
    const newSettings = { ...get().settings, ...patch };
    const players = buildPlayers(newSettings, get().dealerSeatIndex);
    set({ settings: newSettings, players });
  },

  setDealerSeat: (seatIndex) => {
    const players = buildPlayers(get().settings, seatIndex);
    set({ dealerSeatIndex: seatIndex, players, street: 'idle', pot: 0, communityCards: [], activePlayerIndex: null });
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
    set({ dealerSeatIndex: newDealer, players, street: 'idle', pot: 0, communityCards: [], activePlayerIndex: null });
  },

  initializePlayers: () => {
    const { settings, dealerSeatIndex } = get();
    set({ players: buildPlayers(settings, dealerSeatIndex) });
  },
}));
