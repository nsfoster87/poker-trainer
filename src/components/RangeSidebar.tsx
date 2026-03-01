import { useGameStore } from '../store/gameStore';
import { useRangeStore } from '../store/rangeStore';
import { rangePercentage } from '../data/defaultRanges';
import { resolveScenario, getPriorActions } from '../utils/rangeResolver';
import { getPreflopActionOrder, getPostflopActionOrder } from '../utils/positions';
import RangeGrid from './RangeGrid';
import type { ActionScenario } from '../types';

const SCENARIO_LABELS: Record<ActionScenario, string> = {
  open: 'Open',
  vsRaiseCall: 'Call vs Raise',
  vsRaise3Bet: '3-Bet',
  vs3BetCall: 'Call vs 3-Bet',
  vs3Bet4Bet: '4-Bet',
};

const PLACEHOLDER_UI = (
  <div className="w-64 bg-gray-900/80 border-r border-gray-700 overflow-y-auto p-3 space-y-3">
    <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Hand Ranges</h2>
    <p className="text-xs text-gray-500">Deal to see ranges</p>
  </div>
);

export default function RangeSidebar() {
  const players = useGameStore((s) => s.players);
  const street = useGameStore((s) => s.street);
  const cardPickerOpen = useGameStore((s) => s.cardPickerOpen);
  const cardPickerMode = useGameStore((s) => s.cardPickerMode);
  const dealerSeatIndex = useGameStore((s) => s.dealerSeatIndex);
  const seatCount = useGameStore((s) => s.settings.seatCount);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const getRange = useRangeStore((s) => s.getRange);

  if (street === 'idle') return PLACEHOLDER_UI;

  if (street === 'preflop' && cardPickerOpen && cardPickerMode === 'hole') return PLACEHOLDER_UI;

  const actionOrder = street === 'preflop'
    ? getPreflopActionOrder(dealerSeatIndex, seatCount)
    : getPostflopActionOrder(dealerSeatIndex, seatCount);

  const activePlayers = players.filter((p) => !p.hasFolded);
  const activeSeatsInActionOrder = actionOrder.filter((seat) =>
    activePlayers.some((p) => p.seatIndex === seat),
  );

  const idx = activePlayerIndex != null
    ? activeSeatsInActionOrder.indexOf(activePlayerIndex)
    : -1;
  const N = activeSeatsInActionOrder.length;
  const startIndex =
    idx >= 0 ? (idx === 0 ? 0 : (idx - 1 + N) % N) : 0;
  const displayOrder =
    idx >= 0
      ? [
          ...activeSeatsInActionOrder.slice(startIndex),
          ...activeSeatsInActionOrder.slice(0, startIndex),
        ]
      : activeSeatsInActionOrder;

  const playerBySeat = new Map(players.map((p) => [p.seatIndex, p]));

  return (
    <div className="w-64 bg-gray-900/80 border-r border-gray-700 overflow-y-auto p-3 space-y-3">
      <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Hand Ranges</h2>

      {displayOrder.map((seatIndex) => {
        const player = playerBySeat.get(seatIndex);
        if (!player || player.hasFolded) return null;
        const priorActions = getPriorActions(
          players.map((p) => ({ seatIndex: p.seatIndex, actionHistory: p.actionHistory })),
          actionOrder,
          player.seatIndex,
        );

        const scenario = player.actionHistory.length > 0
          ? resolveScenario(player.actionHistory, priorActions)
          : 'open';

        const range = getRange(player.position, scenario);
        const pct = rangePercentage(range);

        return (
          <div
            key={player.seatIndex}
            className={`
              p-2 rounded-lg border
              ${player.seatIndex === activePlayerIndex
                ? 'border-yellow-400 bg-yellow-900/20'
                : player.isUser
                  ? 'border-blue-500/50 bg-blue-900/20'
                  : 'border-gray-700 bg-gray-800/50'}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-200">
                {player.position}
              </span>
              <span className="text-[10px] text-gray-400">
                {pct.toFixed(1)}%
              </span>
            </div>
            {player.actionHistory.length > 0 && (
              <div className="text-[10px] text-blue-400 mb-1">
                {SCENARIO_LABELS[scenario]}
              </div>
            )}
            <RangeGrid range={range} size="sm" />
          </div>
        );
      })}
    </div>
  );
}
