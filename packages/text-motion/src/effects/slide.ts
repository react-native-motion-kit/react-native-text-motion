import { createTextMotionEffect } from './compose';
import { validateFiniteEffectNumber } from './validation';

/** Options for {@link slide}. */
export type SlideOptions = {
  /** Initial horizontal offset in pixels. Defaults to `0`. */
  x?: number;
  /** Initial vertical offset in pixels. Defaults to `12`. */
  y?: number;
};

/** Move each token from an x/y offset into place. */
export function slide(options: SlideOptions = {}) {
  return createTextMotionEffect(
    'slide',
    {
      x: validateFiniteEffectNumber(options.x ?? 0, 'slide x'),
      y: validateFiniteEffectNumber(options.y ?? 12, 'slide y'),
    },
    ['style-transform'],
  );
}
