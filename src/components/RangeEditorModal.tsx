import { useState, useCallback } from 'react';
import { useRangeStore } from '../store/rangeStore';
import { rangePercentage } from '../data/defaultRanges';
import EditableRangeGrid from './EditableRangeGrid';
import type { Position, ActionScenario, HandRange } from '../types';

const ALL_POSITIONS: Position[] = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

const SCENARIOS: { key: ActionScenario; label: string }[] = [
  { key: 'open', label: 'Open (RFI)' },
  { key: 'vsRaiseCall', label: 'Call vs Raise' },
  { key: 'vsRaise3Bet', label: '3-Bet' },
  { key: 'vs3BetCall', label: 'Call vs 3-Bet' },
  { key: 'vs3Bet4Bet', label: '4-Bet' },
];

interface RangeEditorModalProps {
  onClose: () => void;
}

export default function RangeEditorModal({ onClose }: RangeEditorModalProps) {
  const rangeProfile = useRangeStore((s) => s.rangeProfile);
  const setRange = useRangeStore((s) => s.setRange);
  const saveAll = useRangeStore((s) => s.saveAll);
  const resetToDefaults = useRangeStore((s) => s.resetToDefaults);

  const [selectedPosition, setSelectedPosition] = useState<Position>('UTG');
  const [selectedScenario, setSelectedScenario] = useState<ActionScenario>('open');

  const emptyGrid = () => Array.from({ length: 13 }, () => Array(13).fill(false) as boolean[]);

  const currentRange = rangeProfile[selectedPosition]?.[selectedScenario] ?? emptyGrid();

  const handleRangeChange = useCallback((range: HandRange) => {
    setRange(selectedPosition, selectedScenario, range);
  }, [selectedPosition, selectedScenario, setRange]);

  const clearRange = useCallback(() => {
    setRange(selectedPosition, selectedScenario, emptyGrid());
  }, [selectedPosition, selectedScenario, setRange]);

  const selectAll = useCallback(() => {
    const full = Array.from({ length: 13 }, () => Array(13).fill(true) as boolean[]);
    setRange(selectedPosition, selectedScenario, full);
  }, [selectedPosition, selectedScenario, setRange]);

  const handleSave = useCallback(() => {
    saveAll();
    onClose();
  }, [saveAll, onClose]);

  const handleReset = useCallback(() => {
    resetToDefaults();
  }, [resetToDefaults]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Edit Default Hand Ranges</h2>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-600 rounded transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
            >
              Save & Close
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Position tabs */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {ALL_POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded transition-colors
                  ${pos === selectedPosition
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}
                `}
              >
                {pos}
              </button>
            ))}
          </div>

          {/* Scenario tabs */}
          <div className="flex gap-1 mb-4 flex-wrap">
            {SCENARIOS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedScenario(key)}
                className={`
                  px-3 py-1 text-xs font-medium rounded transition-colors
                  ${key === selectedScenario
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-500 hover:text-white hover:bg-gray-700'}
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Range info */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-300">
              <span className="font-bold">{selectedPosition}</span>
              {' — '}
              <span className="text-teal-400">{SCENARIOS.find((s) => s.key === selectedScenario)?.label}</span>
              {' — '}
              <span className="text-gray-400">{rangePercentage(currentRange).toFixed(1)}% of hands</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearRange}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex justify-center">
            <EditableRangeGrid range={currentRange} onChange={handleRangeChange} />
          </div>

          {/* Legend */}
          <div className="flex gap-4 justify-center mt-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span>Pairs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-teal-500" />
              <span>Suited</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-orange-500" />
              <span>Offsuit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
