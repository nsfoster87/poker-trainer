import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

const MIN_BB = 0.1;
const MIN_SB = 0.05;
const DEFAULT_WHEN_BLANK = 0.1;
const round2 = (n: number) => Math.round(n * 100) / 100;

const inputClass =
  'w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

export default function BlindsEditor() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const [editingSB, setEditingSB] = useState<string | null>(null);
  const [editingBB, setEditingBB] = useState<string | null>(null);

  const commitSB = useCallback(() => {
    if (editingSB === null) {
      setEditingBB(null);
      return;
    }
    const raw = editingSB.trim();
    const parsed = Number(raw);
    const sb =
      raw === '' || Number.isNaN(parsed) || parsed < MIN_SB
        ? DEFAULT_WHEN_BLANK
        : Math.max(MIN_SB, round2(parsed));
    const bb = Math.max(MIN_BB, round2(sb * 2));
    updateSettings({ smallBlind: sb, bigBlind: bb });
    setEditingSB(null);
    setEditingBB(null);
  }, [editingSB, updateSettings]);

  const commitBB = useCallback(() => {
    if (editingBB === null) {
      setEditingSB(null);
      return;
    }
    const raw = editingBB.trim();
    const parsed = Number(raw);
    const bb =
      raw === '' || Number.isNaN(parsed) || parsed < MIN_BB
        ? DEFAULT_WHEN_BLANK
        : Math.max(MIN_BB, round2(parsed));
    const sb = Math.max(MIN_SB, round2(bb / 2));
    updateSettings({ smallBlind: sb, bigBlind: bb });
    setEditingSB(null);
    setEditingBB(null);
  }, [editingBB, updateSettings]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">SB:</label>
        <input
          type="number"
          step="0.01"
          value={editingSB !== null ? editingSB : String(settings.smallBlind)}
          onFocus={() => setEditingSB(String(settings.smallBlind))}
          onChange={(e) => setEditingSB(e.target.value)}
          onBlur={commitSB}
          onKeyDown={(e) => e.key === 'Enter' && commitSB()}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">BB:</label>
        <input
          type="number"
          step="0.01"
          value={editingBB !== null ? editingBB : String(settings.bigBlind)}
          onFocus={() => setEditingBB(String(settings.bigBlind))}
          onChange={(e) => setEditingBB(e.target.value)}
          onBlur={commitBB}
          onKeyDown={(e) => e.key === 'Enter' && commitBB()}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Ante:</label>
        <input
          type="number"
          min={0}
          value={settings.ante}
          onChange={(e) => updateSettings({ ante: Math.max(0, Number(e.target.value)) })}
          className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">Starting stack:</label>
        <input
          type="number"
          min={1}
          value={settings.defaultStacks}
          onChange={(e) => updateSettings({ defaultStacks: Math.max(1, Number(e.target.value)) })}
          className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
}
