import l1 from '../l1.png';
import l2 from '../l2.png';
import l3 from '../l3.png';
import l4 from '../l4.png';
import l5 from '../l5.png';
import l6 from '../l6.png';
import l7 from '../l7.png';
import l8 from '../l8.png';
import l9 from '../l9.png';
import l10 from '../l10.png';
import l11 from '../l11.png';
import l12 from '../l12.png';
import l13 from '../l13.png';
import l14 from '../l14.png';
import l15 from '../l15.png';
import l16 from '../l16.png';
import l17 from '../l17.png';

/**
 * The 17 visible frames of the coin spin, in order. l0.png is an empty
 * placeholder from the original 1998 sprite set and is deliberately skipped.
 */
export const COIN_FRAMES: readonly string[] = [
  l1,
  l2,
  l3,
  l4,
  l5,
  l6,
  l7,
  l8,
  l9,
  l10,
  l11,
  l12,
  l13,
  l14,
  l15,
  l16,
  l17,
];

/** A face-on frame, handy for logos and reward screens. */
export const COIN_FACE = l8;
