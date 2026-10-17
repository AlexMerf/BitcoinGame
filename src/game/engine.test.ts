import { describe, expect, it } from 'vitest';
import { COIN_REMOVE_DELAY_SECONDS, STARTING_COINS, TARGET_COINS } from './config';
import { GameEngine, type GameEngineOptions } from './engine';
import { mulberry32 } from './rng';
import type { Coin } from './types';

function createEngine(seed = 1, options: GameEngineOptions = {}): GameEngine {
  return new GameEngine({ rng: mulberry32(seed), ...options });
}

function aliveCoins(engine: GameEngine): Coin[] {
  return engine.coins.filter((coin) => coin.phase === 'alive');
}

describe('GameEngine', () => {
  it('starts with three coins, full time and no score', () => {
    const engine = createEngine();
    engine.start();

    expect(engine.status).toBe('playing');
    expect(engine.coins).toHaveLength(STARTING_COINS);
    expect(aliveCoins(engine)).toHaveLength(STARTING_COINS);
    expect(engine.coinsCollected).toBe(0);
    expect(engine.misses).toBe(0);
    expect(engine.timeLeft).toBe(120);
    expect(engine.targetCoins).toBe(TARGET_COINS);
  });

  it('never spawns overlapping coins', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const engine = createEngine(seed);
      engine.start();
      const coins = engine.coins;

      for (let first = 0; first < coins.length; first += 1) {
        for (let second = first + 1; second < coins.length; second += 1) {
          const a = coins[first];
          const b = coins[second];
          expect(a).toBeDefined();
          expect(b).toBeDefined();
          if (!a || !b) continue;

          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan((a.size + b.size) / 2);
        }
      }
    }
  });

  it('advances time and animation frames', () => {
    const engine = createEngine();
    engine.start();
    const coin = engine.coins[0];
    expect(coin).toBeDefined();
    if (!coin) return;

    const frameBefore = coin.frame;
    engine.tick(1);

    expect(engine.timeLeft).toBe(119);
    expect(coin.frame).not.toBe(frameBefore);
    expect(coin.age).toBeCloseTo(1);
  });

  it('collects a coin, scores it and respawns a replacement after the fade', () => {
    const engine = createEngine();
    engine.start();
    const coin = engine.coins[0];
    expect(coin).toBeDefined();
    if (!coin) return;

    expect(engine.collectCoin(coin.id)).toBe(true);
    expect(engine.coinsCollected).toBe(1);
    expect(coin.phase).toBe('collected');
    expect(engine.status).toBe('playing');
    expect(engine.collectCoin(coin.id)).toBe(false);

    engine.tick(COIN_REMOVE_DELAY_SECONDS + 0.01);

    expect(engine.coins).toHaveLength(STARTING_COINS);
    expect(engine.coins.some((candidate) => candidate.id === coin.id)).toBe(false);
    expect(aliveCoins(engine)).toHaveLength(STARTING_COINS);
  });

  it('supports coordinate hits and counts empty clicks as misses', () => {
    const engine = createEngine();
    engine.start();
    const coin = engine.coins[0];
    expect(coin).toBeDefined();
    if (!coin) return;

    const result = engine.tryCollectAt(coin.x, coin.y);
    expect(result.hit).toBe(true);
    expect(result.coinId).toBe(coin.id);
    expect(engine.coinsCollected).toBe(1);

    const miss = engine.tryCollectAt(-100, -100);
    expect(miss.hit).toBe(false);
    expect(engine.misses).toBe(1);
  });

  it('counts an escaped coin as a miss and replaces it', () => {
    const engine = createEngine();
    engine.start();

    engine.tick(9);

    expect(engine.timeLeft).toBe(111);
    expect(engine.misses).toBe(STARTING_COINS);
    expect(engine.coins.every((coin) => coin.phase === 'escaped')).toBe(true);

    engine.tick(COIN_REMOVE_DELAY_SECONDS + 0.01);

    expect(engine.coins).toHaveLength(STARTING_COINS);
    expect(aliveCoins(engine)).toHaveLength(STARTING_COINS);
  });

  it('wins immediately when the target is reached', () => {
    const engine = createEngine(7, { targetCoins: 3 });
    engine.start();

    for (let index = 0; index < 3; index += 1) {
      const coin = aliveCoins(engine)[0];
      expect(coin).toBeDefined();
      if (!coin) return;
      expect(engine.collectCoin(coin.id)).toBe(true);
    }

    expect(engine.coinsCollected).toBe(3);
    expect(engine.status).toBe('won');
    expect(engine.timeLeft).toBe(120);
  });

  it('loses when the timer runs out', () => {
    const engine = createEngine(3, { durationSeconds: 0.5 });
    engine.start();

    engine.tick(0.6);

    expect(engine.status).toBe('lost');
    expect(engine.timeLeft).toBe(0);
  });

  it('freezes time while paused', () => {
    const engine = createEngine();
    engine.start();
    engine.tick(1);
    engine.pause();

    const time = engine.timeLeft;
    const frame = engine.coins[0]?.frame;
    engine.tick(5);

    expect(engine.status).toBe('paused');
    expect(engine.timeLeft).toBe(time);
    expect(engine.coins[0]?.frame).toBe(frame);

    engine.resume();
    engine.tick(1);
    expect(engine.status).toBe('playing');
    expect(engine.timeLeft).toBe(time - 1);
  });

  it('calculates accuracy from collected coins and misses', () => {
    const engine = createEngine();
    engine.start();
    const coin = engine.coins[0];
    expect(coin).toBeDefined();
    if (!coin) return;

    engine.collectCoin(coin.id);
    engine.miss();
    expect(engine.accuracy).toBeCloseTo(50);

    engine.collectCoin(aliveCoins(engine)[0]?.id ?? -1);
    expect(engine.accuracy).toBeCloseTo(200 / 3);
  });

  it('resets back to idle state', () => {
    const engine = createEngine();
    engine.start();
    engine.tick(2);
    engine.miss();
    engine.reset();

    expect(engine.status).toBe('idle');
    expect(engine.coins).toHaveLength(0);
    expect(engine.coinsCollected).toBe(0);
    expect(engine.misses).toBe(0);
    expect(engine.timeLeft).toBe(120);
  });
});
