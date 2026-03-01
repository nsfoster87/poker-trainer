import { useGameStore } from '../store/gameStore';

export default function BlindsEditor() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">SB:</label>
        <input
          type="number"
          min={1}
          value={settings.smallBlind}
          onChange={(e) => updateSettings({ smallBlind: Math.max(1, Number(e.target.value)) })}
          className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">BB:</label>
        <input
          type="number"
          min={1}
          value={settings.bigBlind}
          onChange={(e) => updateSettings({ bigBlind: Math.max(1, Number(e.target.value)) })}
          className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center"
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
