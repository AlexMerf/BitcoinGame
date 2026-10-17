import '@fontsource/press-start-2p/400.css';
import './style.css';
import { COIN_FRAMES } from './assets/coin';
import { GameView } from './ui/GameView';

// Warm the HTTP cache for every animation frame so the first spin does not
// flicker while individual frames are being fetched.
for (const frame of COIN_FRAMES) {
  const image = new Image();
  image.decoding = 'async';
  image.src = frame;
}

const view = new GameView();
view.init();
