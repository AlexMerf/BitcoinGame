import frame01 from './coin/frame-01.png';
import frame02 from './coin/frame-02.png';
import frame03 from './coin/frame-03.png';
import frame04 from './coin/frame-04.png';
import frame05 from './coin/frame-05.png';
import frame06 from './coin/frame-06.png';
import frame07 from './coin/frame-07.png';
import frame08 from './coin/frame-08.png';
import frame09 from './coin/frame-09.png';
import frame10 from './coin/frame-10.png';
import frame11 from './coin/frame-11.png';
import frame12 from './coin/frame-12.png';
import frame13 from './coin/frame-13.png';
import frame14 from './coin/frame-14.png';
import frame15 from './coin/frame-15.png';
import frame16 from './coin/frame-16.png';
import frame17 from './coin/frame-17.png';

/**
 * The 17 visible frames of the coin spin, in order. frame-00.png is a fully
 * transparent placeholder from the original 1998 sprite set, so it is
 * deliberately skipped here; it stays in the folder for the legacy page.
 */
export const COIN_FRAMES: readonly string[] = [
  frame01,
  frame02,
  frame03,
  frame04,
  frame05,
  frame06,
  frame07,
  frame08,
  frame09,
  frame10,
  frame11,
  frame12,
  frame13,
  frame14,
  frame15,
  frame16,
  frame17,
];

/** A face-on frame, handy for logos and reward screens. */
export const COIN_FACE = frame08;
