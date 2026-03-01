import type { EnrichedPlayer } from '../types';
import { getPreflopActionOrder, getPostflopActionOrder } from '../utils/positions';

/**
 * Determine the next player to act in a betting round.
 *
 * A betting round ends when all non-folded players have acted at least once
 * AND all active players have matched the highest bet (or are all-in).
 *
 * `lastRaiserSeat` tracks who last raised -- action continues until we
 * circle back to them.
 */
export function findNextActivePlayer(
  currentSeatIndex: number,
  players: EnrichedPlayer[],
  dealerSeatIndex: number,
  seatCount: number,
  street: string,
  lastRaiserSeat: number | null,
): number | null {
  const actionOrder = street === 'preflop'
    ? getPreflopActionOrder(dealerSeatIndex, seatCount)
    : getPostflopActionOrder(dealerSeatIndex, seatCount);

  const activePlayers = players.filter((p) => !p.hasFolded && p.stack > 0);
  if (activePlayers.length <= 1) return null;

  const currentOrderIdx = actionOrder.indexOf(currentSeatIndex);
  if (currentOrderIdx === -1) return null;

  const highestBet = Math.max(...players.map((p) => p.currentBet));

  for (let i = 1; i < actionOrder.length; i++) {
    const candidateOrderIdx = (currentOrderIdx + i) % actionOrder.length;
    const candidateSeat = actionOrder[candidateOrderIdx];

    // If we've looped back to the last raiser, the round is over
    if (candidateSeat === lastRaiserSeat) return null;

    const candidate = players.find((p) => p.seatIndex === candidateSeat);
    if (!candidate || candidate.hasFolded || candidate.stack <= 0) continue;

    const hasActed = candidate.actionHistory.length > 0;
    const isMatchingBet = candidate.currentBet >= highestBet;

    // Player needs to act if they haven't acted yet, or if they haven't matched a raise
    if (!hasActed || !isMatchingBet) {
      return candidateSeat;
    }
  }

  return null;
}

/**
 * Get the first player to act for a given street.
 */
export function getFirstToAct(
  players: EnrichedPlayer[],
  dealerSeatIndex: number,
  seatCount: number,
  street: string,
): number | null {
  const actionOrder = street === 'preflop'
    ? getPreflopActionOrder(dealerSeatIndex, seatCount)
    : getPostflopActionOrder(dealerSeatIndex, seatCount);

  for (const seat of actionOrder) {
    const player = players.find((p) => p.seatIndex === seat);
    if (player && !player.hasFolded && player.stack > 0) {
      return seat;
    }
  }
  return null;
}
