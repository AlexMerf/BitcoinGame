import { COIN_FACE, COIN_FRAMES } from '../assets/coin';
import { GameEngine } from '../game/engine';
import { formatAccuracy, formatTime } from '../game/format';
import { createRandom } from '../game/rng';
import type { Coin, GameStatus } from '../game/types';
import { SoundManager } from './sound';
import { loadBest, loadMuted, saveBest, saveMuted } from './storage';

type Screen = 'start' | 'pause' | 'result';

const LOW_TIME_SECONDS = 10;
const RESULT_DELAY_MS = 550;
const EFFECT_CLEANUP_MS = 900;

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

/**
 * DOM renderer and input layer. All rules live in GameEngine; this class only
 * translates state into elements, handles pointer/keyboard input, and drives
 * the animation loop.
 */
export class GameView {
  private readonly engine: GameEngine;
  private readonly sound: SoundManager;

  private readonly board = query<HTMLElement>('#board');
  private readonly coinsLayer = query<HTMLElement>('#coins');
  private readonly overlay = query<HTMLDialogElement>('#overlay');
  private readonly coinTemplate = query<HTMLTemplateElement>('#coin-template');
  private readonly cards: Record<Screen, HTMLElement> = {
    start: query<HTMLElement>('[data-view="start"]'),
    pause: query<HTMLElement>('[data-view="pause"]'),
    result: query<HTMLElement>('[data-view="result"]'),
  };

  private readonly statCoins = query<HTMLOutputElement>('#stat-coins');
  private readonly statMisses = query<HTMLOutputElement>('#stat-misses');
  private readonly statTime = query<HTMLOutputElement>('#stat-time');
  private readonly timeRow = query<HTMLElement>('.hud__row--time');
  private readonly progress = query<HTMLElement>('#progress');
  private readonly progressBar = query<HTMLElement>('#progress-bar');
  private readonly pauseButton = query<HTMLButtonElement>('[data-action="pause"]');
  private readonly soundButton = query<HTMLButtonElement>('[data-action="sound"]');
  private readonly soundOnIcon = query<SVGElement>('.icon--sound-on');
  private readonly soundOffIcon = query<SVGElement>('.icon--sound-off');
  private readonly live = query<HTMLElement>('#live');
  private readonly bestStart = query<HTMLElement>('#best-start');

  private readonly resultEyebrow = query<HTMLElement>('#result-eyebrow');
  private readonly resultTitle = query<HTMLElement>('#result-title');
  private readonly resultText = query<HTMLElement>('#result-text');
  private readonly resultCoins = query<HTMLElement>('#result-coins');
  private readonly resultMisses = query<HTMLElement>('#result-misses');
  private readonly resultAccuracy = query<HTMLElement>('#result-accuracy');
  private readonly resultBest = query<HTMLElement>('#result-best');
  private readonly resultCoin = query<HTMLImageElement>('#result-coin');

  private readonly coinElements = new Map<number, HTMLButtonElement>();
  private lastHud = { coins: '', misses: '', time: '', progress: -1, low: false };

  private screen: Screen = 'start';
  private lastStatus: GameStatus = 'idle';
  private lastFrameTime = performance.now();
  private resultTimer: number | undefined;
  private muted: boolean;
  private best: number;

  constructor() {
    this.muted = loadMuted();
    this.best = loadBest();
    this.sound = new SoundManager(this.muted);
    this.engine = new GameEngine({ rng: createRandom() });
    this.resultCoin.src = COIN_FACE;
  }

  init(): void {
    this.bindEvents();
    this.setPauseEnabled(false);
    this.updateSoundUi();
    this.updateBestLabel();
    this.renderHud(true);
    this.showScreen('start');
    window.requestAnimationFrame(this.loop);
  }

  private bindEvents(): void {
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.board.addEventListener('pointerdown', this.handleBoardPointerDown);
    this.board.addEventListener('contextmenu', this.handleContextMenu);
    this.coinsLayer.addEventListener('click', this.handleCoinClick);
    this.overlay.addEventListener('cancel', this.handleDialogCancel);
    this.overlay.addEventListener('click', this.handleDialogClick);
  }

  private readonly loop = (timestamp: number): void => {
    const delta = Math.min(Math.max((timestamp - this.lastFrameTime) / 1000, 0), 0.1);
    this.lastFrameTime = timestamp;

    if (this.engine.status === 'playing') {
      this.engine.tick(delta);
    }

    this.syncStatus();
    this.renderCoins();
    this.renderHud();

    window.requestAnimationFrame(this.loop);
  };

  private syncStatus(): void {
    const status = this.engine.status;
    if (status === this.lastStatus) {
      return;
    }

    this.lastStatus = status;
    this.setPauseEnabled(status === 'playing' || status === 'paused');

    switch (status) {
      case 'idle':
        this.showScreen('start');
        break;
      case 'playing':
        this.closeOverlay();
        break;
      case 'paused':
        this.showScreen('pause');
        break;
      case 'won':
      case 'lost':
        this.setPauseEnabled(false);
        this.scheduleResult();
        break;
    }
  }

  private startGame(): void {
    this.cancelResult();
    this.engine.start();
    this.clearCoins();
    this.lastStatus = 'playing';
    this.closeOverlay();
    this.sound.unlock();
    this.setPauseEnabled(true);
    this.lastFrameTime = performance.now();
    this.renderHud(true);
    this.renderCoins();
    this.board.focus({ preventScroll: true });
    this.announce(`Игра началась. Собери ${this.engine.targetCoins} монет за две минуты.`);
  }

  private pauseGame(): void {
    if (this.engine.status !== 'playing') {
      return;
    }

    this.engine.pause();
    this.syncStatus();
  }

  private resumeGame(): void {
    if (this.engine.status !== 'paused') {
      return;
    }

    this.engine.resume();
    this.lastStatus = 'playing';
    this.closeOverlay();
    this.setPauseEnabled(true);
    this.lastFrameTime = performance.now();
    this.board.focus({ preventScroll: true });
    this.announce('Продолжаем.');
  }

  private togglePause(): void {
    if (this.engine.status === 'playing') {
      this.pauseGame();
    } else if (this.engine.status === 'paused') {
      this.resumeGame();
    }
  }

  private goHome(): void {
    this.cancelResult();
    this.engine.reset();
    this.clearCoins();
    this.lastStatus = 'idle';
    this.setPauseEnabled(false);
    this.renderHud(true);
    this.updateBestLabel();
    this.showScreen('start');
    this.announce('Главный экран.');
  }

  private scheduleResult(): void {
    this.cancelResult();
    this.resultTimer = window.setTimeout(() => {
      this.resultTimer = undefined;
      this.showResult();
    }, RESULT_DELAY_MS);
  }

  private cancelResult(): void {
    if (this.resultTimer !== undefined) {
      window.clearTimeout(this.resultTimer);
      this.resultTimer = undefined;
    }
  }

  private showResult(): void {
    const status = this.engine.status;
    if (status !== 'won' && status !== 'lost') {
      return;
    }

    const won = status === 'won';
    const collected = this.engine.coinsCollected;
    const target = this.engine.targetCoins;
    const remaining = Math.max(0, target - collected);

    this.cards.result.dataset.result = won ? 'win' : 'lose';
    this.resultEyebrow.textContent = won ? 'Победа' : 'Результат';
    this.resultTitle.textContent = won ? 'Награда получена!' : 'Время вышло';
    this.resultText.textContent = won
      ? `Собрано ${collected} из ${target}. Осталось ${formatTime(this.engine.timeLeft)}.`
      : `Собрано ${collected} из ${target}. Не хватило ${remaining}.`;
    this.resultCoins.textContent = `${collected} / ${target}`;
    this.resultMisses.textContent = String(this.engine.misses);
    this.resultAccuracy.textContent = formatAccuracy(this.engine.accuracy);
    this.resultCoin.src = won ? COIN_FACE : (COIN_FRAMES[COIN_FRAMES.length - 1] ?? COIN_FACE);

    const isRecord = collected > this.best;
    if (isRecord) {
      this.best = collected;
      saveBest(this.best);
    }
    this.resultBest.hidden = !isRecord;
    this.updateBestLabel();

    this.showScreen('result');
    if (won) {
      this.sound.win();
      this.announce(`Награда получена. Собрано ${collected} монет.`);
    } else {
      this.sound.lose();
      this.announce(`Время вышло. Собрано ${collected} из ${target}.`);
    }
  }

  private showScreen(screen: Screen): void {
    this.screen = screen;

    for (const key of Object.keys(this.cards) as Screen[]) {
      this.cards[key].hidden = key !== screen;
    }

    const headingId =
      screen === 'start' ? 'overlay-title' : screen === 'pause' ? 'pause-title' : 'result-title';
    this.overlay.setAttribute('aria-labelledby', headingId);

    if (!this.overlay.open) {
      this.overlay.showModal();
    }

    this.cards[screen].querySelector<HTMLElement>('.btn')?.focus();
  }

  private closeOverlay(): void {
    if (this.overlay.open) {
      this.overlay.close();
    }
  }

  private setPauseEnabled(enabled: boolean): void {
    this.pauseButton.disabled = !enabled;
    const paused = this.engine.status === 'paused';
    this.pauseButton.setAttribute('aria-label', paused ? 'Продолжить' : 'Пауза');
    this.pauseButton.title = paused ? 'Продолжить (Esc)' : 'Пауза (Esc)';
  }

  private updateSoundUi(): void {
    const on = !this.muted;
    this.soundButton.setAttribute('aria-pressed', String(on));
    this.soundButton.setAttribute('aria-label', 'Звук');
    this.soundButton.title = on ? 'Выключить звук' : 'Включить звук';
    this.setHidden(this.soundOnIcon, !on);
    this.setHidden(this.soundOffIcon, on);
  }

  private setHidden(element: Element, hidden: boolean): void {
    if (hidden) {
      element.setAttribute('hidden', '');
    } else {
      element.removeAttribute('hidden');
    }
  }

  private toggleSound(): void {
    this.muted = !this.muted;
    this.sound.setMuted(this.muted);
    saveMuted(this.muted);
    this.updateSoundUi();

    if (!this.muted) {
      this.sound.collect();
    }
  }

  private updateBestLabel(): void {
    this.bestStart.textContent = this.best > 0 ? String(this.best) : '—';
  }

  private renderHud(force = false): void {
    const coinsText = `${this.engine.coinsCollected} / ${this.engine.targetCoins}`;
    if (force || this.lastHud.coins !== coinsText) {
      this.statCoins.textContent = coinsText;
      this.lastHud.coins = coinsText;
    }

    const missesText = String(this.engine.misses);
    if (force || this.lastHud.misses !== missesText) {
      this.statMisses.textContent = missesText;
      this.lastHud.misses = missesText;
    }

    const timeText = formatTime(this.engine.timeLeft);
    if (force || this.lastHud.time !== timeText) {
      this.statTime.textContent = timeText;
      this.lastHud.time = timeText;
    }

    const progress = this.engine.progress;
    if (force || this.lastHud.progress !== progress) {
      this.progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
      this.progress.setAttribute('aria-valuenow', String(this.engine.coinsCollected));
      this.progress.setAttribute('aria-valuemax', String(this.engine.targetCoins));
      this.lastHud.progress = progress;
    }

    const low = this.engine.status === 'playing' && this.engine.timeLeft <= LOW_TIME_SECONDS;
    if (force || this.lastHud.low !== low) {
      this.timeRow.classList.toggle('is-low', low);
      this.lastHud.low = low;
    }
  }

  private renderCoins(): void {
    const fieldSize = this.engine.fieldSize;
    const seen = new Set<number>();

    for (const coin of this.engine.coins) {
      seen.add(coin.id);
      let element = this.coinElements.get(coin.id);

      if (!element) {
        element = this.createCoinElement(coin);
        this.coinElements.set(coin.id, element);
        this.coinsLayer.append(element);
      }

      element.style.left = `${(coin.x / fieldSize) * 100}%`;
      element.style.top = `${(coin.y / fieldSize) * 100}%`;
      element.style.width = `${(coin.size / fieldSize) * 100}%`;
      element.style.zIndex = String(1000 + Math.round(coin.y));

      const frame = String(coin.frame);
      if (element.dataset.frame !== frame) {
        const image = element.querySelector<HTMLImageElement>('.coin__img');
        if (image) {
          image.src = COIN_FRAMES[coin.frame] ?? COIN_FACE;
        }
        element.dataset.frame = frame;
      }

      const collected = coin.phase === 'collected';
      const escaped = coin.phase === 'escaped';
      element.classList.toggle('is-collected', collected);
      element.classList.toggle('is-escaped', escaped);

      const interactive = coin.phase === 'alive' && this.engine.status === 'playing';
      element.tabIndex = interactive ? 0 : -1;

      const label = collected ? 'Монета собрана' : escaped ? 'Монета упущена' : 'Монета. Собрать';
      if (element.getAttribute('aria-label') !== label) {
        element.setAttribute('aria-label', label);
      }
    }

    for (const [id, element] of this.coinElements) {
      if (seen.has(id)) {
        continue;
      }

      if (element.contains(document.activeElement)) {
        this.board.focus({ preventScroll: true });
      }
      element.remove();
      this.coinElements.delete(id);
    }
  }

  private createCoinElement(coin: Coin): HTMLButtonElement {
    const fragment = this.coinTemplate.content.cloneNode(true) as DocumentFragment;
    const element = fragment.querySelector<HTMLButtonElement>('.coin');
    if (!element) {
      throw new Error('Coin template is missing a .coin element');
    }

    element.dataset.id = String(coin.id);
    element.dataset.frame = String(coin.frame);
    element.style.setProperty('--bob-delay', `${((coin.id * 0.43) % 2.4).toFixed(2)}s`);

    const image = element.querySelector<HTMLImageElement>('.coin__img');
    if (image) {
      image.src = COIN_FRAMES[coin.frame] ?? COIN_FACE;
    }

    return element;
  }

  private clearCoins(): void {
    for (const element of this.coinElements.values()) {
      element.remove();
    }
    this.coinElements.clear();
    this.coinsLayer.replaceChildren();
  }

  private readonly handleBoardPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0 || this.engine.status !== 'playing') {
      return;
    }

    const coinElement =
      event.target instanceof Element ? event.target.closest<HTMLElement>('.coin[data-id]') : null;

    if (coinElement) {
      const id = Number(coinElement.dataset.id);
      if (Number.isInteger(id) && this.engine.collectCoin(id)) {
        this.handleCollect(coinElement);
      }
      return;
    }

    if (this.engine.miss()) {
      this.sound.miss();
      this.spawnRipple(event);
    }
  };

  private readonly handleContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private readonly handleCoinClick = (event: MouseEvent): void => {
    // A pointer click already went through pointerdown. detail === 0 means the
    // button was activated by keyboard or assistive technology.
    if (event.detail !== 0 || this.engine.status !== 'playing') {
      return;
    }

    const coinElement =
      event.target instanceof Element ? event.target.closest<HTMLElement>('.coin[data-id]') : null;
    if (!coinElement) {
      return;
    }

    const id = Number(coinElement.dataset.id);
    if (Number.isInteger(id) && this.engine.collectCoin(id)) {
      this.handleCollect(coinElement);
    }
  };

  private handleCollect(element: HTMLElement): void {
    this.sound.collect();
    this.spawnFloatScore(element);
    this.renderHud(true);

    const collected = this.engine.coinsCollected;
    if (this.engine.status === 'won') {
      this.announce(`Награда получена. Собрано ${collected} монет.`);
    } else if (collected > 0 && collected % 5 === 0) {
      this.announce(`Собрано ${collected} из ${this.engine.targetCoins}.`);
    }
  }

  private spawnFloatScore(element: HTMLElement): void {
    const boardRect = this.board.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    if (boardRect.width === 0 || boardRect.height === 0) {
      return;
    }

    const score = document.createElement('span');
    score.className = 'float-score';
    score.textContent = '+1';
    score.setAttribute('aria-hidden', 'true');
    score.style.left = `${((rect.left + rect.width / 2 - boardRect.left) / boardRect.width) * 100}%`;
    score.style.top = `${((rect.top + rect.height / 2 - boardRect.top) / boardRect.height) * 100}%`;
    this.coinsLayer.append(score);
    this.removeEffectLater(score);
  }

  private spawnRipple(event: PointerEvent): void {
    const boardRect = this.board.getBoundingClientRect();
    if (boardRect.width === 0 || boardRect.height === 0) {
      return;
    }

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.left = `${((event.clientX - boardRect.left) / boardRect.width) * 100}%`;
    ripple.style.top = `${((event.clientY - boardRect.top) / boardRect.height) * 100}%`;
    this.coinsLayer.append(ripple);
    this.removeEffectLater(ripple);
  }

  private removeEffectLater(element: HTMLElement): void {
    const remove = (): void => {
      element.remove();
    };

    element.addEventListener('animationend', remove, { once: true });
    window.setTimeout(remove, EFFECT_CLEANUP_MS);
  }

  private readonly handleDocumentClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const actionElement = event.target.closest<HTMLElement>('[data-action]');
    const action = actionElement?.dataset.action;
    if (!action) {
      return;
    }

    event.preventDefault();

    switch (action) {
      case 'play':
      case 'restart':
        this.startGame();
        break;
      case 'pause':
        this.togglePause();
        break;
      case 'resume':
        this.resumeGame();
        break;
      case 'home':
        this.goHome();
        break;
      case 'sound':
        this.toggleSound();
        break;
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.repeat) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const isPauseKey = event.key === 'Escape' || event.key.toLowerCase() === 'p';
    if (!isPauseKey || this.overlay.open || this.engine.status !== 'playing') {
      return;
    }

    event.preventDefault();
    this.pauseGame();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden' && this.engine.status === 'playing') {
      this.pauseGame();
    }
  };

  private readonly handleDialogCancel = (event: Event): void => {
    event.preventDefault();
    if (this.screen === 'pause') {
      this.resumeGame();
    }
  };

  private readonly handleDialogClick = (event: MouseEvent): void => {
    if (event.target !== this.overlay) {
      return;
    }

    if (this.screen === 'pause') {
      this.resumeGame();
    }
  };

  private announce(message: string): void {
    this.live.textContent = message;
  }
}
