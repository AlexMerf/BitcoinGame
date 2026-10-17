/**
 * Tiny Web Audio sound engine. No audio files are needed: short oscillator
 * envelopes keep the bundle small and avoid an extra network request.
 *
 * Audio is created lazily on the first user gesture (the Play button), which
 * satisfies browser autoplay policies.
 */
export class SoundManager {
  private context: AudioContext | null = null;
  private muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!muted) {
      this.unlock();
    }
  }

  /** Call from a click handler to satisfy the browser autoplay policy. */
  unlock(): void {
    if (this.muted) {
      return;
    }

    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') {
        void this.context.resume();
      }
    } catch {
      // Audio is a nice-to-have; silently continue without it.
      this.context = null;
    }
  }

  collect(): void {
    this.tone(880, 0.07, 'square', 0.045);
    this.tone(1320, 0.09, 'square', 0.03, 0.055);
  }

  miss(): void {
    this.tone(180, 0.14, 'sawtooth', 0.03, 0, 90);
  }

  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      this.tone(frequency, 0.16, 'square', 0.035, index * 0.11);
    });
  }

  lose(): void {
    this.tone(320, 0.18, 'triangle', 0.04, 0, 180);
    this.tone(200, 0.3, 'triangle', 0.035, 0.16, 110);
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    endFrequency?: number,
  ): void {
    if (this.muted) {
      return;
    }

    const context = this.context;
    if (!context) {
      return;
    }

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }
}
