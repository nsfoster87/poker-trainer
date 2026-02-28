# Poker Trainer

A client-side poker hand range training tool built with React and TypeScript. Designed to run alongside an online poker session so you can visualize opponents' likely hand ranges in real time.

## What It Does

You simulate a poker hand by inputting the actions that occur at your table — deals, folds, calls, raises, community cards — and the app displays a 13×13 hand range chart for each active player based on their position and actions. Ranges update dynamically as the hand progresses.

**Key features:**

- Realistic oval poker table UI with 2–9 configurable seats
- Full hand simulation: pre-flop through river with proper action ordering
- Card picker for selecting hole cards and community cards
- Bet sizer with slider, numeric input, and preset buttons (Min, 1/3 Pot, 1/2 Pot, 2/3 Pot, Pot, All-In)
- Per-player hand range charts in a scrollable sidebar
- Action-based range narrowing (open, call vs raise, 3-bet, call vs 3-bet, 4-bet)
- Editable default ranges for all positions and action scenarios, saved to localStorage
- Right-click seats to reassign your position or move the dealer button
- Configurable blinds, antes, and seat count

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

1. Adjust seat count, blinds, and antes in the header if needed.
2. Click **Deal** — face-down cards appear for all players, and a card picker opens for you to select your hole cards.
3. The first player to act is highlighted. Use the **Fold** / **Call** / **Raise** buttons to input each player's action.
4. After pre-flop action completes, click **Deal Flop** and select the three flop cards. Repeat for turn and river.
5. The sidebar shows each active player's hand range chart, which updates based on their position and the actions they've taken.
6. Click **Next Hand** to rotate the dealer and start a new hand.

**Right-click any seat** to "Sit Here" (move your position) or "Set Dealer" (move the dealer button).

**Edit Ranges** in the header opens a full editor where you can customize default ranges for each position and action scenario. Changes persist in your browser's localStorage.

## Tech Stack

- **React 19** + **TypeScript** — UI and type safety
- **Vite 7** — dev server and build
- **Tailwind CSS v4** — utility-first styling
- **Zustand** — lightweight state management
- **localStorage** — range and settings persistence

No backend required — everything runs in the browser.

## Project Structure

```
src/
  components/   UI components (table, seats, cards, modals, etc.)
  store/        Zustand stores (gameStore, rangeStore, actionLogic)
  utils/        Pure functions (positions, seat layout, deck, range resolver)
  data/         Default hand range data
  types/        Shared TypeScript type definitions
docs/
  POKER_DOMAIN.md   Poker domain knowledge reference
```

See `docs/POKER_DOMAIN.md` for detailed poker rules, position definitions, hand range grid structure, and default GTO ranges.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
