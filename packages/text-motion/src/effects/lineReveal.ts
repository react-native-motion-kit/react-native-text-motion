import type { TextMotionLineMaskCapability } from '../types/renderer';

import { createTextMotionRendererCapability } from '../types/renderer';
import { createTextMotionEffect } from './compose';
import { validateFiniteEffectNumber } from './validation';

const LINE_MASK_CAPABILITY: TextMotionLineMaskCapability =
  createTextMotionRendererCapability('line-mask');

/** Options for {@link lineReveal}. */
export type LineRevealOptions = {
  /** Initial downward offset in points. Defaults to `16`. */
  y?: number;
  /** Initial opacity before each rendered line reveals. Defaults to `0`. */
  fromOpacity?: number;
};

/** Reveal each React Native rendered line through an `overlayText()` line mask. */
export function lineReveal(options: LineRevealOptions = {}) {
  return createTextMotionEffect(
    'lineReveal',
    {
      fromOpacity: validateFiniteEffectNumber(options.fromOpacity ?? 0, 'lineReveal fromOpacity'),
      y: validateFiniteEffectNumber(options.y ?? 16, 'lineReveal y'),
    },
    [LINE_MASK_CAPABILITY, 'style-transform'],
  );
}
