import type { TextMotionTimeline } from '../types';

import { createTextMotionTimelineHandle } from '../recipe/descriptors';
import { validateNonNegativeTimelineNumber, validatePositiveTimelineNumber } from './validation';

/** Options for {@link wave}. */
export type TextMotionWaveOptions = {
  /** Maximum delay in seconds. Defaults to `0.08`. */
  amplitude?: number;
  /** Number of tokens per sine-wave cycle. Defaults to `4`. */
  wavelength?: number;
};

type TextMotionWaveTimelineOptions = {
  amplitude: number;
  wavelength: number;
};

/** Create sine-wave token delays for soft rolling text motion. */
export function wave(options: TextMotionWaveOptions = {}): TextMotionTimeline<'wave'> {
  const amplitude = validateNonNegativeTimelineNumber(options.amplitude ?? 0.08, 'wave amplitude');
  const wavelength = validatePositiveTimelineNumber(options.wavelength ?? 4, 'wave wavelength');

  return createTextMotionTimelineHandle<TextMotionWaveTimelineOptions, 'wave'>({
    kind: 'timeline',
    name: 'wave',
    options: { amplitude, wavelength },
    delayFor(index) {
      const phase = (index / wavelength) * Math.PI * 2;

      return ((Math.sin(phase) + 1) / 2) * amplitude;
    },
  });
}
