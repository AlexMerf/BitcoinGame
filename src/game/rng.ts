export type Rng = () => number;

/**
 * Small, deterministic PRNG (mulberry32). Useful for tests and for keeping
 * spawn sequences reproducible when that matters.
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Cryptographically seeded RNG for real play, with a Date fallback. */
export function createRandom(): Rng {
  const cryptoApi = globalThis.crypto;
  let seed = Date.now() >>> 0;

  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    seed = cryptoApi.getRandomValues(new Uint32Array(1))[0] ?? seed;
  }

  return mulberry32(seed);
}

export function randomBetween(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randomInt(rng: Rng, minInclusive: number, maxExclusive: number): number {
  return Math.floor(randomBetween(rng, minInclusive, maxExclusive));
}
