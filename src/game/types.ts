export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';

export type CoinPhase = 'alive' | 'collected' | 'escaped';

export interface Coin {
  readonly id: number;
  /** Centre of the coin inside the logical FIELD_SIZE × FIELD_SIZE board. */
  x: number;
  y: number;
  /** Width/height of the 200×200 sprite box, in board units. */
  size: number;
  vx: number;
  vy: number;
  age: number;
  ttl: number;
  frame: number;
  frameElapsed: number;
  phase: CoinPhase;
  phaseElapsed: number;
}

export interface ClickResult {
  readonly hit: boolean;
  readonly coinId?: number;
}
