import type { Position } from '../types';
import { assignPositions, findSeatByPosition } from '../utils/positions';
import { useGameStore } from './gameStore';

type GameStateSlice = {
  dealerSeatIndex: number;
  settings: { seatCount: number };
  activePosition: Position | null;
  lastRaiserPosition: Position | null;
};

export function getActivePlayerSeat(state: GameStateSlice): number | null {
  if (state.activePosition == null) return null;
  const posMap = assignPositions(state.dealerSeatIndex, state.settings.seatCount);
  return findSeatByPosition(posMap, state.activePosition);
}

export function getLastRaiserSeat(state: GameStateSlice): number | null {
  if (state.lastRaiserPosition == null) return null;
  const posMap = assignPositions(state.dealerSeatIndex, state.settings.seatCount);
  return findSeatByPosition(posMap, state.lastRaiserPosition);
}

export function useActivePlayerSeat(): number | null {
  return useGameStore(getActivePlayerSeat);
}
