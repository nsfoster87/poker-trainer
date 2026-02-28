import type { ActionRecord, ActionScenario } from '../types';

/**
 * Given a player's action history for the current street,
 * determine which range scenario best describes their line.
 *
 * Pre-flop scenarios:
 *   - open: player raised and no one raised before them (RFI)
 *   - vsRaiseCall: player called someone else's raise
 *   - vsRaise3Bet: player re-raised (3-bet) after someone opened
 *   - vs3BetCall: player called a 3-bet after having opened
 *   - vs3Bet4Bet: player 4-bet after opening and facing a 3-bet
 *
 * `priorActions` is the list of actions that occurred *before* this player acted,
 * from all players in action order.
 */
export function resolveScenario(
  playerActions: ActionRecord[],
  priorActions: ActionRecord[],
): ActionScenario {
  if (playerActions.length === 0) return 'open';

  const raiseCountBefore = priorActions.filter((a) => a.action === 'raise').length;
  const playerRaises = playerActions.filter((a) => a.action === 'raise').length;
  const playerCalls = playerActions.filter((a) => a.action === 'call').length;

  // Player's first significant action
  if (playerRaises > 0 && raiseCountBefore === 0) {
    // Player opened (RFI)
    if (playerRaises === 1 && playerCalls === 0) return 'open';
    // Player opened, then called a 3-bet
    if (playerRaises === 1 && playerCalls > 0) return 'vs3BetCall';
    // Player opened, faced a 3-bet, and 4-bet
    if (playerRaises >= 2) return 'vs3Bet4Bet';
  }

  if (raiseCountBefore >= 1) {
    // Someone raised before this player
    if (playerCalls > 0 && playerRaises === 0) return 'vsRaiseCall';
    if (playerRaises > 0) return 'vsRaise3Bet';
  }

  return 'open';
}

/**
 * Build the list of prior actions (from all players) that occurred before
 * a specific player's first action in this street.
 */
export function getPriorActions(
  allActionHistories: { seatIndex: number; actionHistory: ActionRecord[] }[],
  actionOrder: number[],
  targetSeatIndex: number,
): ActionRecord[] {
  const prior: ActionRecord[] = [];

  for (const seat of actionOrder) {
    if (seat === targetSeatIndex) break;
    const player = allActionHistories.find((p) => p.seatIndex === seat);
    if (player) {
      prior.push(...player.actionHistory);
    }
  }

  return prior;
}
