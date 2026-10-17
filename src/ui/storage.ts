const PREFIX = 'bitcoin-game:';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(`${PREFIX}${key}`);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, value);
  } catch {
    // Private mode, disabled storage, or a full quota: the game still works.
  }
}

export function loadBest(): number {
  const parsed = Number(read('best'));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

export function saveBest(value: number): void {
  write('best', String(Math.max(0, Math.floor(value))));
}

export function loadMuted(): boolean {
  return read('muted') === '1';
}

export function saveMuted(muted: boolean): void {
  write('muted', muted ? '1' : '0');
}
