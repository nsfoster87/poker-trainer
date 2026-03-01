import type { Position } from '../types';

const NINE_MAX_POSITIONS: Position[] = [
  'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB',
];

const POSITION_SETS: Record<number, Position[]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['CO', 'BTN', 'SB', 'BB'],
  5: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  6: ['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  7: ['UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  8: ['UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  9: NINE_MAX_POSITIONS,
};

export function getPositionsForSeatCount(seatCount: number): Position[] {
  return POSITION_SETS[seatCount] ?? NINE_MAX_POSITIONS;
}

/**
 * Given the dealer's seat index and total seat count,
 * return a map from seatIndex -> Position.
 *
 * Positions are assigned clockwise starting from the dealer seat:
 * dealer = BTN, next = SB, next = BB, then UTG onward.
 */
export function assignPositions(
  dealerSeatIndex: number,
  seatCount: number,
): Map<number, Position> {
  const positions = getPositionsForSeatCount(seatCount);
  const posMap = new Map<number, Position>();

  const btnIdx = positions.indexOf('BTN');
  if (btnIdx === -1) return posMap;

  for (let i = 0; i < seatCount; i++) {
    const seatIdx = (dealerSeatIndex + i) % seatCount;
    const posIdx = (btnIdx + i) % positions.length;
    posMap.set(seatIdx, positions[posIdx]);
  }

  return posMap;
}

/**
 * Return the seat index that has the given position, or null if none.
 */
export function findSeatByPosition(
  posMap: Map<number, Position>,
  position: Position,
): number | null {
  for (const [seat, pos] of posMap) {
    if (pos === position) return seat;
  }
  return null;
}

/**
 * Get the pre-flop action order as seat indices.
 * Pre-flop: UTG first, BB last.
 */
export function getPreflopActionOrder(
  dealerSeatIndex: number,
  seatCount: number,
): number[] {
  const positions = getPositionsForSeatCount(seatCount);
  const posMap = assignPositions(dealerSeatIndex, seatCount);

  const blindsAndBtn: Position[] = ['BTN', 'SB', 'BB'];
  const preflopOrder: Position[] = [
    ...positions.filter((p): p is Position => !blindsAndBtn.includes(p)),
    ...blindsAndBtn.filter((p): p is Position => positions.includes(p)),
  ];

  const seatOrder: number[] = [];
  for (const pos of preflopOrder) {
    for (const [seat, p] of posMap) {
      if (p === pos) {
        seatOrder.push(seat);
        break;
      }
    }
  }
  return seatOrder;
}

/**
 * Get post-flop action order: SB first, then clockwise to BTN.
 */
export function getPostflopActionOrder(
  dealerSeatIndex: number,
  seatCount: number,
): number[] {
  const positions = getPositionsForSeatCount(seatCount);
  const posMap = assignPositions(dealerSeatIndex, seatCount);

  const blindsAndBtn: Position[] = ['BTN', 'SB', 'BB'];
  const postflopOrder: Position[] = [
    ...(['SB', 'BB'] as Position[]).filter(p => positions.includes(p)),
    ...positions.filter((p): p is Position => !blindsAndBtn.includes(p)),
    ...(['BTN'] as Position[]).filter(p => positions.includes(p)),
  ];

  const seatOrder: number[] = [];
  for (const pos of postflopOrder) {
    for (const [seat, p] of posMap) {
      if (p === pos) {
        seatOrder.push(seat);
        break;
      }
    }
  }
  return seatOrder;
}
