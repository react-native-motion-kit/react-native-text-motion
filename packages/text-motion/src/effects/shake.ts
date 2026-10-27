import { createTextMotionEffect } from './compose';
import { validateFiniteEffectNumber } from './validation';

/** Options for {@link shake}. */
export type ShakeOptions = {
  /** Initial horizontal offset in pixels. Defaults to `4`. */
  x?: number;
};

/** Offset each token horizontally for a shake-like entrance. */
export function shake(options: ShakeOptions = {}) {
  return createTextMotionEffect(
    'shake',
    {
      x: validateFiniteEffectNumber(options.x ?? 4, 'shake x'),
    },
    ['style-transform'],
  );
}
