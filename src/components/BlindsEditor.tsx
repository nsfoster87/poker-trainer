import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

const MIN_BB = 0.1;
const MIN_SB = 0.05;
const DEFAULT_WHEN_BLANK = 0.1;
const round2 = (n: number) => Math.round(n * 100) / 100;

const inputClass =
  'w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

type EditingField = 'sb' | 'bb' | null;

export default function BlindsEditor() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  // Which field is being actively typed in, and its current raw string
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editingValue, setEditingValue] = useState('');

  // Derive the live display value for the sibling field while typing
  const derivedSB = (): string => {
    if (editingField === 'bb') {
      const parsed = Number(editingValue);
      if (editingValue.trim() !== '' && !Number.isNaN(parsed) && parsed > 0) {
        return String(round2(parsed / 2));
      }
    }
    if (editingField === 'sb') return editingValue;
    return String(settings.smallBlind);
  };

  const derivedBB = (): string => {
    if (editingField === 'sb') {
      const parsed = Number(editingValue);
      if (editingValue.trim() !== '' && !Number.isNaN(parsed) && parsed > 0) {
        return String(round2(parsed * 2));
      }
    }
    if (editingField === 'bb') return editingValue;
    return String(settings.bigBlind);
  };

  const commit = useCallback(() => {
    if (editingField === null) return;
    const raw = editingValue.trim();
    const parsed = Number(raw);
    if (editingField === 'sb') {
      const sb =
        raw === '' || Number.isNaN(parsed) || parsed < MIN_SB
          ? DEFAULT_WHEN_BLANK
          : Math.max(MIN_SB, round2(parsed));
      const bb = Math.max(MIN_BB, round2(sb * 2));
      updateSettings({ smallBlind: sb, bigBlind: bb });
    } else {
      const bb =
        raw === '' || Number.isNaN(parsed) || parsed < MIN_BB
          ? DEFAULT_WHEN_BLANK
          : Math.max(MIN_BB, round2(parsed));
      const sb = Math.max(MIN_SB, round2(bb / 2));
      updateSettings({ smallBlind: sb, bigBlind: bb });
    }
    setEditingField(null);
    setEditingValue('');
  }, [editingField, editingValue, updateSettings]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">SB:</label>
        <input
          type="number"
          step="0.01"
          value={derivedSB()}
          onFocus={() => { setEditingField('sb'); setEditingValue(String(settings.smallBlind)); }}
          onChange={(e) => { setEditingField('sb'); setEditingValue(e.target.value); }}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">BB:</label>
        <input
          type="number"
          step="0.01"
          value={derivedBB()}
          onFocus={() => { setEditingField('bb'); setEditingValue(String(settings.bigBlind)); }}
          onChange={(e) => { setEditingField('bb'); setEditingValue(e.target.value); }}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
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
