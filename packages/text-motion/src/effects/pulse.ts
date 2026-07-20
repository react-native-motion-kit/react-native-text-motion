import { createTextMotionEffect } from './compose';
import { validateFiniteEffectNumber } from './validation';

/** Options for {@link pulse}. */
export type PulseOptions = {
  /** Peak pulse scale reached around the middle of the motion. Defaults to `1.04`. */
  scale?: number;
};

/** Briefly emphasize each token by scaling it up and returning to its final scale. */
export function pulse(options: PulseOptions = {}) {
  return createTextMotionEffect(
    'pulse',
    {
      scale: validateFiniteEffectNumber(options.scale ?? 1.04, 'pulse scale'),
    },
    ['style-transform'],
  );
}
