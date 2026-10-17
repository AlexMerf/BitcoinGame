import {
  COIN_FRAME_COUNT,
  COIN_FRAME_SECONDS,
  COIN_MAX_SIZE,
  COIN_MAX_SPEED,
  COIN_MAX_TTL_SECONDS,
  COIN_MIN_GAP,
  COIN_MIN_SIZE,
  COIN_MIN_SPEED,
  COIN_MIN_TTL_SECONDS,
  COIN_REMOVE_DELAY_SECONDS,
  COIN_SPAWN_ATTEMPTS,
  COIN_SPAWN_MARGIN,
  FIELD_SIZE,
  GAME_DURATION_SECONDS,
  STARTING_COINS,
  TARGET_COINS,
} from './config';
import { randomBetween, randomInt, type Rng } from './rng';
import type { ClickResult, Coin, GameStatus } from './types';

export interface GameEngineOptions {
  /** Injectable RNG: tests pass a seeded one, the app passes a random one. */
  readonly rng?: Rng;
  readonly startingCoins?: number;
  readonly durationSeconds?: number;
  readonly targetCoins?: number;
}

/**
 * Pure, framework-free game rules.
 *
 * The engine owns time, coins, scoring and the state machine. It never touches
 * the DOM, so every rule can be unit-tested in isolation and the renderer can
 * be replaced without changing gameplay.
 */
export class GameEngine {
  readonly fieldSize = FIELD_SIZE;
  readonly targetCoins: number;

  private readonly rng: Rng;
  private readonly startingCoins: number;
  private readonly durationSeconds: number;

  private _coins: Coin[] = [];
  private _status: GameStatus = 'idle';
  private _coinsCollected = 0;
  private _misses = 0;
  private _timeLeft: number;
  private nextCoinId = 1;

  constructor(options: GameEngineOptions = {}) {
    this.rng = options.rng ?? Math.random;
    this.startingCoins = options.startingCoins ?? STARTING_COINS;
    this.durationSeconds = options.durationSeconds ?? GAME_DURATION_SECONDS;
    this.targetCoins = options.targetCoins ?? TARGET_COINS;
    this._timeLeft = this.durationSeconds;
  }

  get status(): GameStatus {
    return this._status;
  }

  get coins(): readonly Coin[] {
    return this._coins;
  }

  get coinsCollected(): number {
    return this._coinsCollected;
  }

  get misses(): number {
    return this._misses;
  }

  get timeLeft(): number {
    return this._timeLeft;
  }

  get progress(): number {
    return Math.min(1, this._coinsCollected / this.targetCoins);
  }

  get remainingCoins(): number {
    return Math.max(0, this.targetCoins - this._coinsCollected);
  }

  get accuracy(): number {
    const attempts = this._coinsCollected + this._misses;
    return attempts === 0 ? 0 : (this._coinsCollected / attempts) * 100;
  }

  start(): void {
    this._status = 'playing';
    this._coinsCollected = 0;
    this._misses = 0;
    this._timeLeft = this.durationSeconds;
    this._coins = [];
    this.nextCoinId = 1;

    for (let index = 0; index < this.startingCoins; index += 1) {
      this._coins.push(this.spawnCoin());
    }
  }

  reset(): void {
    this._status = 'idle';
    this._coinsCollected = 0;
    this._misses = 0;
    this._timeLeft = this.durationSeconds;
    this._coins = [];
    this.nextCoinId = 1;
  }

  pause(): void {
    if (this._status === 'playing') {
      this._status = 'paused';
    }
  }

  resume(): void {
    if (this._status === 'paused') {
      this._status = 'playing';
    }
  }

  /**
   * Advance the simulation. The view calls this with a delta in seconds,
   * clamped to avoid huge jumps after a background tab.
   */
  tick(deltaSeconds: number): void {
    if (this._status !== 'playing' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    this._timeLeft = Math.max(0, this._timeLeft - deltaSeconds);
    if (this._timeLeft <= 0) {
      this.finish('lost');
      return;
    }

    for (const coin of this._coins) {
      this.updateCoin(coin, deltaSeconds);
    }

    this.removeFinishedCoins();
  }

  /** Collect a specific coin (used by keyboard / assistive tech). */
  collectCoin(id: number): boolean {
    if (this._status !== 'playing') {
      return false;
    }

    const coin = this._coins.find(
      (candidate) => candidate.id === id && candidate.phase === 'alive',
    );
    if (!coin) {
      return false;
    }

    coin.phase = 'collected';
    coin.phaseElapsed = 0;
    this._coinsCollected += 1;

    if (this._coinsCollected >= this.targetCoins) {
      this.finish('won');
    }

    return true;
  }

  /** Coordinate-based hit test, useful for canvas-like input and tests. */
  tryCollectAt(x: number, y: number): ClickResult {
    if (this._status !== 'playing') {
      return { hit: false };
    }

    for (let index = this._coins.length - 1; index >= 0; index -= 1) {
      const coin = this._coins[index];
      if (!coin || coin.phase !== 'alive') {
        continue;
      }

      if (Math.hypot(coin.x - x, coin.y - y) <= coin.size * 0.45) {
        this.collectCoin(coin.id);
        return { hit: true, coinId: coin.id };
      }
    }

    this.miss();
    return { hit: false };
  }

  /** Register a click that did not hit any coin. */
  miss(): boolean {
    if (this._status !== 'playing') {
      return false;
    }

    this._misses += 1;
    return true;
  }

  private finish(status: 'won' | 'lost'): void {
    if (this._status === 'won' || this._status === 'lost') {
      return;
    }

    this._status = status;
    if (status === 'lost') {
      this._timeLeft = 0;
    }
  }

  private updateCoin(coin: Coin, deltaSeconds: number): void {
    coin.age += deltaSeconds;
    coin.frameElapsed += deltaSeconds;

    while (coin.frameElapsed >= COIN_FRAME_SECONDS) {
      coin.frameElapsed -= COIN_FRAME_SECONDS;
      coin.frame = (coin.frame + 1) % COIN_FRAME_COUNT;
    }

    if (coin.phase !== 'alive') {
      coin.phaseElapsed += deltaSeconds;
      return;
    }

    coin.ttl -= deltaSeconds;
    if (coin.ttl <= 0) {
      coin.phase = 'escaped';
      coin.phaseElapsed = 0;
      this._misses += 1;
      return;
    }

    coin.x += coin.vx * deltaSeconds;
    coin.y += coin.vy * deltaSeconds;

    const half = coin.size / 2;
    const max = this.fieldSize - half;

    if (coin.x < half) {
      coin.x = half;
      coin.vx = Math.abs(coin.vx);
    } else if (coin.x > max) {
      coin.x = max;
      coin.vx = -Math.abs(coin.vx);
    }

    if (coin.y < half) {
      coin.y = half;
      coin.vy = Math.abs(coin.vy);
    } else if (coin.y > max) {
      coin.y = max;
      coin.vy = -Math.abs(coin.vy);
    }
  }

  private removeFinishedCoins(): void {
    const before = this._coins.length;
    this._coins = this._coins.filter(
      (coin) => coin.phase === 'alive' || coin.phaseElapsed < COIN_REMOVE_DELAY_SECONDS,
    );

    const removed = before - this._coins.length;
    for (let index = 0; index < removed; index += 1) {
      this._coins.push(this.spawnCoin());
    }
  }

  private spawnCoin(): Coin {
    const size = randomBetween(this.rng, COIN_MIN_SIZE, COIN_MAX_SIZE);
    const half = size / 2;
    const minimum = half + COIN_SPAWN_MARGIN;
    const maximum = Math.max(minimum, this.fieldSize - half - COIN_SPAWN_MARGIN);

    let x = this.fieldSize / 2;
    let y = this.fieldSize / 2;
    let bestDistance = -1;

    for (let attempt = 0; attempt < COIN_SPAWN_ATTEMPTS; attempt += 1) {
      const candidateX = randomBetween(this.rng, minimum, maximum);
      const candidateY = randomBetween(this.rng, minimum, maximum);
      const closest = this.closestCoinDistance(candidateX, candidateY);

      if (closest > bestDistance) {
        bestDistance = closest;
        x = candidateX;
        y = candidateY;
      }

      if (closest >= size / 2 + COIN_MIN_GAP) {
        break;
      }
    }

    const angle = randomBetween(this.rng, 0, Math.PI * 2);
    const speed = randomBetween(this.rng, COIN_MIN_SPEED, COIN_MAX_SPEED);

    return {
      id: this.nextCoinId++,
      x,
      y,
      size,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      ttl: randomBetween(this.rng, COIN_MIN_TTL_SECONDS, COIN_MAX_TTL_SECONDS),
      frame: randomInt(this.rng, 0, COIN_FRAME_COUNT),
      frameElapsed: 0,
      phase: 'alive',
      phaseElapsed: 0,
    };
  }

  private closestCoinDistance(x: number, y: number): number {
    let closest = Number.POSITIVE_INFINITY;

    for (const coin of this._coins) {
      const distance = Math.hypot(coin.x - x, coin.y - y) - coin.size / 2;
      if (distance < closest) {
        closest = distance;
      }
    }

    return closest === Number.POSITIVE_INFINITY ? this.fieldSize : closest;
  }
}
