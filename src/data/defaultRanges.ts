import type { Position, HandRange, RangeProfile } from '../types';
import { RANKS } from '../utils/deck';
import type { Rank } from '../types';

/**
 * Build a 13x13 HandRange (all false) grid.
 */
function emptyRange(): HandRange {
  return Array.from({ length: 13 }, () => Array(13).fill(false) as boolean[]);
}

function rankIndex(r: Rank): number {
  return RANKS.indexOf(r);
}

/**
 * Parse a shorthand range notation into a 13x13 boolean grid.
 *
 * Supports:
 *   - Pairs: "AA", "77+"
 *   - Suited: "AKs", "ATs+"
 *   - Offsuit: "AKo", "AJo+"
 *   - Comma separated: "AA,KK,AKs"
 */
function parseRange(notation: string): HandRange {
  const grid = emptyRange();
  const parts = notation.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.endsWith('+')) {
      const base = part.slice(0, -1);
      if (base.length === 2 && base[0] === base[1]) {
        // Pair+: e.g. "77+" means 77,88,99,...,AA
        const idx = rankIndex(base[0] as Rank);
        for (let i = 0; i <= idx; i++) {
          grid[i][i] = true;
        }
      } else if (base.length === 3 && base[2] === 's') {
        // Suited+: e.g. "ATs+" means ATs,AJs,AQs,AKs
        const r1 = rankIndex(base[0] as Rank);
        const r2 = rankIndex(base[1] as Rank);
        for (let c = r1 + 1; c <= r2; c++) {
          grid[r1][c] = true;
        }
      } else if (base.length === 3 && base[2] === 'o') {
        // Offsuit+: e.g. "AJo+" means AJo,AQo,AKo
        const r1 = rankIndex(base[0] as Rank);
        const r2 = rankIndex(base[1] as Rank);
        for (let r = r1 + 1; r <= r2; r++) {
          grid[r][r1] = true;
        }
      }
    } else if (part.length === 2 && part[0] === part[1]) {
      // Specific pair: "AA"
      const idx = rankIndex(part[0] as Rank);
      grid[idx][idx] = true;
    } else if (part.length === 3 && part[2] === 's') {
      // Specific suited: "AKs"
      const r1 = rankIndex(part[0] as Rank);
      const r2 = rankIndex(part[1] as Rank);
      grid[r1][r2] = true;
    } else if (part.length === 3 && part[2] === 'o') {
      // Specific offsuit: "AKo"
      const r1 = rankIndex(part[0] as Rank);
      const r2 = rankIndex(part[1] as Rank);
      grid[r2][r1] = true;
    } else if (part.length === 2) {
      // Ambiguous: treat as suited and offsuit
      const r1 = rankIndex(part[0] as Rank);
      const r2 = rankIndex(part[1] as Rank);
      if (r1 === r2) {
        grid[r1][r2] = true;
      } else {
        grid[r1][r2] = true; // suited
        grid[r2][r1] = true; // offsuit
      }
    }
  }

  return grid;
}

const DEFAULT_OPEN_RANGES: Record<Position, string> = {
  'UTG':   '77+,ATs+,KQs,AJo+',
  'UTG+1': '66+,A9s+,KJs+,QJs,AJo+,KQo',
  'UTG+2': '55+,A8s+,KTs+,QTs+,JTs,ATo+,KQo',
  'LJ':    '44+,A5s,A7s+,K9s+,Q9s+,J9s+,T9s,ATo+,KJo+',
  'HJ':    '33+,A2s+,K8s+,Q9s+,J8s+,T8s+,98s,87s,ATo+,KTo+,QJo',
  'CO':    '22+,A2s+,K5s+,Q7s+,J8s+,T7s+,97s+,86s+,76s,65s,A9o+,KTo+,QTo+,JTo',
  'BTN':   '22+,A2s+,K2s+,Q4s+,J6s+,T6s+,96s+,85s+,75s+,64s+,54s,A7o+,K9o+,Q9o+,J9o+,T9o',
  'SB':    '22+,A2s+,K4s+,Q7s+,J8s+,T8s+,97s+,87s,76s,65s,A8o+,KTo+,QTo+,JTo',
  'BB':    '22+,A2s+,K2s+,Q2s+,J5s+,T6s+,96s+,85s+,75s+,64s+,54s,A2o+,K5o+,Q8o+,J8o+,T8o+,98o',
};

function buildDefaultProfile(): RangeProfile {
  const profile = {} as RangeProfile;
  for (const [pos, notation] of Object.entries(DEFAULT_OPEN_RANGES)) {
    const openRange = parseRange(notation);
    profile[pos as Position] = { open: openRange };
  }
  return profile;
}

export const DEFAULT_RANGE_PROFILE: RangeProfile = buildDefaultProfile();

/**
 * Get the hand label for a cell in the 13x13 grid.
 */
export function getHandLabel(row: number, col: number): string {
  if (row === col) return `${RANKS[row]}${RANKS[col]}`;
  if (col > row) return `${RANKS[row]}${RANKS[col]}s`;
  return `${RANKS[row]}${RANKS[col]}o`;
}

/**
 * Get the type of hand at a grid position.
 */
export function getHandType(row: number, col: number): 'pair' | 'suited' | 'offsuit' {
  if (row === col) return 'pair';
  if (col > row) return 'suited';
  return 'offsuit';
}

/**
 * Count the number of combos selected in a range.
 */
export function countCombos(range: HandRange): number {
  let count = 0;
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      if (range[r][c]) {
        if (r === c) count += 6;       // pair
        else if (c > r) count += 4;    // suited
        else count += 12;              // offsuit
      }
    }
  }
  return count;
}

export function rangePercentage(range: HandRange): number {
  return (countCombos(range) / 1326) * 100;
}
