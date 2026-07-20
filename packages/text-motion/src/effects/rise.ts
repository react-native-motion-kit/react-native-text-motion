import { createTextMotionEffect } from './compose';
import { validateFiniteEffectNumber } from './validation';

/** Options for {@link rise}. */
export type RiseOptions = {
  /** Initial downward offset in pixels. Defaults to `12`. */
  y?: number;
};

/** Move each token upward from a vertical offset. */
export function rise(options: RiseOptions = {}) {
  return createTextMotionEffect(
    'rise',
    {
      y: validateFiniteEffectNumber(options.y ?? 12, 'rise y'),
    },
    ['style-transform'],
  );
}
