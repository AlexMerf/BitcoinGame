/**
 * Central tuning values. Change these to rebalance the game without touching
 * the rules or the rendering code.
 */
export const FIELD_SIZE = 800;

export const STARTING_COINS = 3;
export const GAME_DURATION_SECONDS = 120;
export const TARGET_COINS = 30;

// Frame 0 is a fully transparent placeholder, so the animation uses frames 1…17.
export const COIN_FRAME_COUNT = 17;
export const COIN_FRAME_SECONDS = 0.05;

export const COIN_MIN_SIZE = 128;
export const COIN_MAX_SIZE = 200;

export const COIN_MIN_TTL_SECONDS = 5;
export const COIN_MAX_TTL_SECONDS = 8;

export const COIN_MIN_SPEED = 6;
export const COIN_MAX_SPEED = 18;

/** How long a collected / escaped coin stays visible while it animates out. */
export const COIN_REMOVE_DELAY_SECONDS = 0.34;

export const COIN_SPAWN_MARGIN = 8;
export const COIN_SPAWN_ATTEMPTS = 32;
export const COIN_MIN_GAP = 16;
