import { create } from 'zustand';
import type { RangeProfile, Position, ActionScenario, HandRange } from '../types';
import { DEFAULT_RANGE_PROFILE } from '../data/defaultRanges';

const STORAGE_KEY = 'poker-trainer-ranges';

function loadRanges(): RangeProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as RangeProfile;
    }
  } catch {
    // Fall through to defaults
  }
  return structuredClone(DEFAULT_RANGE_PROFILE);
}

function saveRanges(profile: RangeProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or unavailable
  }
}

interface RangeStore {
  rangeProfile: RangeProfile;

  getRange: (position: Position, scenario?: ActionScenario) => HandRange;
  setRange: (position: Position, scenario: ActionScenario, range: HandRange) => void;
  saveAll: () => void;
  resetToDefaults: () => void;
}

export const useRangeStore = create<RangeStore>((set, get) => ({
  rangeProfile: loadRanges(),

  getRange: (position, scenario = 'open') => {
    const posRanges = get().rangeProfile[position];
    if (!posRanges) return Array.from({ length: 13 }, () => Array(13).fill(false) as boolean[]);
    return posRanges[scenario] ?? posRanges.open ?? Array.from({ length: 13 }, () => Array(13).fill(false) as boolean[]);
  },

  setRange: (position, scenario, range) => {
    const profile = structuredClone(get().rangeProfile);
    if (!profile[position]) {
      profile[position] = {};
    }
    profile[position][scenario] = range;
    set({ rangeProfile: profile });
  },

  saveAll: () => {
    saveRanges(get().rangeProfile);
  },

  resetToDefaults: () => {
    const profile = structuredClone(DEFAULT_RANGE_PROFILE);
    set({ rangeProfile: profile });
    saveRanges(profile);
  },
}));
