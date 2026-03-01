export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Position = 'UTG' | 'UTG+1' | 'UTG+2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';

export type ActionScenario = 'open' | 'vsRaiseCall' | 'vsRaise3Bet' | 'vs3BetCall' | 'vs3Bet4Bet';

export type HandRange = boolean[][];

export type PositionRanges = Partial<Record<ActionScenario, HandRange>>;
export type RangeProfile = Record<Position, PositionRanges>;

export type PlayerAction = 'fold' | 'call' | 'raise' | 'check' | null;

export interface ActionRecord {
  action: PlayerAction;
  amount?: number;
}

/** Seat identity only: which seat has which position and who is the user. */
export interface Player {
  seatIndex: number;
  position: Position;
  isUser: boolean;
}

/** Hand data owned by a position (cards, stack, bet, status). */
export interface HandState {
  cards: [Card, Card] | null;
  hasFolded: boolean;
  currentBet: number;
  stack: number;
  actionHistory: ActionRecord[];
}

/** Player + HandState for action logic and UI that need both. */
export type EnrichedPlayer = Player & HandState;

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'idle';

export interface GameState {
  street: Street;
  pot: number;
  communityCards: Card[];
  activePosition: Position | null;
  lastRaiserPosition: Position | null;
  dealerSeatIndex: number;
  players: Player[];
  handStateByPosition: Partial<Record<Position, HandState>>;
}

export interface Settings {
  seatCount: number;
  userSeatIndex: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  defaultStacks: number;
  stackDisplayMode: 'cash' | 'bb';
}
