import { createTextMotionEffect } from './compose';
import { validateFiniteEffectNumber } from './validation';

/** Options for {@link scale}. */
export type ScaleOptions = {
  /** Starting scale. Defaults to `0.96`. */
  from?: number;
  /** Ending scale. Defaults to `1`. */
  to?: number;
};

/** Scale each token between two scale values. */
export function scale(options: ScaleOptions = {}) {
  return createTextMotionEffect('scale', {
    from: validateFiniteEffectNumber(options.from ?? 0.96, 'scale from'),
    to: validateFiniteEffectNumber(options.to ?? 1, 'scale to'),
  });
}
