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

export interface Player {
  seatIndex: number;
  position: Position;
  cards: [Card, Card] | null;
  hasFolded: boolean;
  currentBet: number;
  stack: number;
  isUser: boolean;
  actionHistory: ActionRecord[];
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'idle';

export interface GameState {
  street: Street;
  pot: number;
  communityCards: Card[];
  activePosition: Position | null;
  lastRaiserPosition: Position | null;
  dealerSeatIndex: number;
  players: Player[];
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
