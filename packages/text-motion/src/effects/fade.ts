import { createTextMotionEffect } from './compose';
import { validateFiniteEffectNumber } from './validation';

/** Options for {@link fade}. */
export type FadeOptions = {
  /** Starting opacity. Defaults to `0`. */
  from?: number;
  /** Ending opacity. Defaults to `1`. */
  to?: number;
};

/** Fade each token between opacity values. */
export function fade(options: FadeOptions = {}) {
  return createTextMotionEffect(
    'fade',
    {
      from: validateFiniteEffectNumber(options.from ?? 0, 'fade from'),
      to: validateFiniteEffectNumber(options.to ?? 1, 'fade to'),
    },
    ['style-transform'],
  );
}
