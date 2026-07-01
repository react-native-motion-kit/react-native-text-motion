import type { TextMotionTimeline } from '../types';

import { createTextMotionTimelineHandle } from '../recipe/descriptors';
import { validateFiniteTimelineNumber, validateNonNegativeTimelineNumber } from './validation';

/** Origin used when calculating stagger delays. */
export type TextMotionStaggerFrom = 'start' | 'center' | 'end' | 'edges' | number;

/** Options for {@link stagger}. */
export type TextMotionStaggerOptions = {
  /** Token index origin for the stagger. Defaults to `start`. */
  from?: TextMotionStaggerFrom;
};

type TextMotionStaggerTimelineOptions = {
  from: TextMotionStaggerFrom;
  step: number;
};

function offsetFrom(index: number, count: number, from: TextMotionStaggerFrom): number {
  if (typeof from === 'number') {
    return Math.abs(index - from);
  }

  if (from === 'center') {
    return Math.abs(index - (count - 1) / 2);
  }

  if (from === 'end') {
    return count - 1 - index;
  }

  if (from === 'edges') {
    return Math.min(index, count - 1 - index);
  }

  return index;
}

/** Delay each token by a fixed step from the chosen origin. */
export function stagger(
  step: number,
  options: TextMotionStaggerOptions = {},
): TextMotionTimeline<'stagger'> {
  const fromOption = options.from ?? 'start';
  const from =
    typeof fromOption === 'number'
      ? validateFiniteTimelineNumber(fromOption, 'stagger from')
      : fromOption;
  const safeStep = validateNonNegativeTimelineNumber(step, 'stagger step');

  return createTextMotionTimelineHandle<TextMotionStaggerTimelineOptions, 'stagger'>({
    kind: 'timeline',
    name: 'stagger',
    options: { from, step: safeStep },
    delayFor(index, count) {
      return offsetFrom(index, count, from) * safeStep;
    },
  });
}
