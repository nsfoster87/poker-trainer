# Poker Domain Knowledge Reference

This document contains the poker domain knowledge required to develop and maintain the Poker Trainer application. It serves as the canonical reference for position names, hand ranges, action mechanics, and related concepts.

---

## Table Positions

### 9-Max Table (default)

Positions are listed in **pre-flop action order** (first to act -> last to act):

| # | Abbreviation | Full Name          | Notes                                |
|---|-------------|--------------------|--------------------------------------|
| 1 | UTG         | Under the Gun      | First to act pre-flop; tightest range |
| 2 | UTG+1       | Under the Gun +1   | Second early position                |
| 3 | UTG+2       | Under the Gun +2   | Third early position                 |
| 4 | LJ          | Lojack             | First middle position                |
| 5 | HJ          | Hijack             | Second middle position               |
| 6 | CO          | Cutoff             | One seat right of dealer; late position |
| 7 | BTN         | Button (Dealer)    | Best position; acts last post-flop   |
| 8 | SB          | Small Blind        | Posts half the big blind             |
| 9 | BB          | Big Blind          | Posts the full blind; last pre-flop  |

### Seating Order (clockwise from dealer)

Starting from BTN going clockwise: BTN -> SB -> BB -> UTG -> UTG+1 -> UTG+2 -> LJ -> HJ -> CO -> (back to BTN).

### Action Order

- **Pre-flop**: UTG -> UTG+1 -> UTG+2 -> LJ -> HJ -> CO -> BTN -> SB -> BB
- **Post-flop**: Starts with the first **active** (non-folded) player to the left of the dealer, then clockwise: SB -> BB -> UTG -> ... -> BTN

### Scaling for Fewer Seats

When the table has fewer than 9 seats, positions are removed from early/middle positions first. The blinds (SB, BB), dealer (BTN), and late positions (CO, HJ) are always preserved.

| Seats | Positions                                         |
|-------|---------------------------------------------------|
| 9     | UTG, UTG+1, UTG+2, LJ, HJ, CO, BTN, SB, BB     |
| 8     | UTG, UTG+1, UTG+2, HJ, CO, BTN, SB, BB          |
| 7     | UTG, UTG+1, HJ, CO, BTN, SB, BB                  |
| 6     | UTG, HJ, CO, BTN, SB, BB                         |
| 5     | UTG, CO, BTN, SB, BB                              |
| 4     | CO, BTN, SB, BB                                   |
| 3     | BTN, SB, BB                                       |
| 2     | BTN/SB, BB (heads-up; BTN is also SB)            |

---

## Blind and Ante Rules

- **Small Blind (SB)**: Posted by the player immediately left of the dealer. Amount = half the big blind (configurable).
- **Big Blind (BB)**: Posted by the player two seats left of the dealer. This is the minimum bet for pre-flop action.
- **Ante**: Optional forced bet from every player before the hand begins. Added to the pot before any action.
- **Dealer rotation**: After each hand, the dealer button moves one seat to the left (clockwise). All positions shift accordingly.

---

## Hand Range Chart (13x13 Grid)

### Structure

A hand range is represented as a 13x13 boolean matrix. Each cell maps to one of 169 unique starting hand types.

**Row and column labels** (index 0 through 12):

```
Index:  0    1    2    3    4    5    6    7    8    9   10   11   12
Label:  A    K    Q    J    T    9    8    7    6    5    4    3    2
```

**Grid regions:**

- **Diagonal** (row == col): Pocket pairs — AA, KK, QQ, JJ, TT, 99, 88, 77, 66, 55, 44, 33, 22
- **Upper-right triangle** (col > row): Suited hands — e.g., row=0 col=1 is AKs
- **Lower-left triangle** (row > col): Offsuit hands — e.g., row=1 col=0 is AKo

**Cell label formula:**
- If row == col: `RANKS[row] + RANKS[col]` (e.g., "AA", "KK")
- If col > row: `RANKS[row] + RANKS[col] + "s"` (suited)
- If row > col: `RANKS[row] + RANKS[col] + "o"` (offsuit)

### Hand Combination Math

There are **1,326 total** possible two-card combinations from a 52-card deck.

| Hand Type | Combos per hand | Count | Total Combos |
|-----------|----------------|-------|-------------|
| Pocket pair | 6 | 13 | 78 |
| Suited | 4 | 78 | 312 |
| Offsuit | 12 | 78 | 936 |
| **Total** | | **169** | **1,326** |

**Range percentage** = (sum of selected combos) / 1,326 * 100

Example: If a range includes AA (6 combos), KK (6), QQ (6), AKs (4), AKo (12) = 34 combos = 2.6%.

### Color Coding Convention

- **Pocket pairs (diagonal)**: Distinct color (e.g., blue/purple)
- **Suited hands (upper-right)**: Distinct color (e.g., green/teal)
- **Offsuit hands (lower-left)**: Distinct color (e.g., red/orange)
- **In range (selected)**: Filled/highlighted
- **Out of range**: Dimmed/gray

---

## Default Opening Ranges by Position (Approximate GTO)

These are the default **RFI (Raise First In)** ranges — hands a player opens with when folded to them.

### UTG (~15% of hands)
77+, ATs+, KQs, AJo+

### UTG+1 (~17%)
66+, A9s+, KJs+, QJs, AJo+, KQo

### UTG+2 (~19%)
55+, A8s+, KTs+, QTs+, JTs, ATo+, KQo

### LJ / Lojack (~22%)
44+, A5s, A7s+, K9s+, Q9s+, J9s+, T9s, ATo+, KJo+

### HJ / Hijack (~26%)
33+, A2s+, K8s+, Q9s+, J8s+, T8s+, 98s, 87s, ATo+, KTo+, QJo

### CO / Cutoff (~30%)
22+, A2s+, K5s+, Q7s+, J8s+, T7s+, 97s+, 86s+, 76s, 65s, A9o+, KTo+, QTo+, JTo

### BTN / Button (~45%)
22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 75s+, 64s+, 54s, A7o+, K9o+, Q9o+, J9o+, T9o

### SB / Small Blind (~35%)
22+, A2s+, K4s+, Q7s+, J8s+, T8s+, 97s+, 87s, 76s, 65s, A8o+, KTo+, QTo+, JTo

### BB / Big Blind
Defending range (calling or raising vs. an open). Very wide (~60%+ vs BTN open, tighter vs EP opens). Defaults will ship as approximately 50% of hands.

---

## Action-Based Range Scenarios

The range model supports multiple scenarios per position. Each scenario represents a different action a player might take in response to the betting so far.

| Scenario Key   | Description                                      | When Applied                                |
|---------------|--------------------------------------------------|---------------------------------------------|
| `open`        | Raise First In (RFI). Opening the pot.          | Player raises and no one has raised before them. |
| `vsRaiseCall` | Calling an open raise from another player.       | Player faces a raise and calls.             |
| `vsRaise3Bet` | Re-raising (3-betting) an open raise.            | Player faces a raise and re-raises.         |
| `vs3BetCall`  | Calling a 3-bet after having opened.             | Player opened, faced a 3-bet, and calls.    |
| `vs3Bet4Bet`  | 4-betting after opening and facing a 3-bet.      | Player opened, faced a 3-bet, and re-raises.|

**Range narrowing logic**: When a player acts, their displayed range chart is automatically switched to the scenario that matches their action. If no scenario-specific range is defined, fall back to the `open` range.

---

## Bet Sizing Conventions

### Terminology
- **"Raise TO"**: The total amount wagered (used in this app). Example: if the big blind is 2 and you "raise to 6", you are wagering 6 total.
- **Min-raise**: The minimum legal raise. Pre-flop, this equals 2x the big blind. Post-flop, it equals the big blind or the size of the previous bet/raise (whichever is larger).
- **Pot-sized bet**: A raise to the amount of the pot (after calling the current bet).

### Standard Preset Buttons
- **Min**: Minimum legal raise
- **1/3 Pot**: Raise to 1/3 of the current pot
- **1/2 Pot**: Raise to 1/2 of the current pot
- **2/3 Pot**: Raise to 2/3 of the current pot
- **Pot**: Raise to the full pot size
- **All-In**: Bet the player's entire remaining stack

### Slider Behavior
- Range: min-raise to all-in
- Continuous adjustment (not stepped)
- Synchronized with the numeric input box
