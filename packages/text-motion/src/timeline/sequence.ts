import type { TextMotionAnyTimeline, TextMotionTimeline } from '../types';

import {
  createTextMotionTimelineHandle,
  readTextMotionTimelineDescriptor,
} from '../recipe/descriptors';

type TextMotionCompositeTimelineOptions = {
  timelines: readonly string[];
};

/** Combine timelines by adding each timeline delay for a token. */
export function sequence(
  ...timelines: readonly TextMotionAnyTimeline[]
): TextMotionTimeline<'sequence'> {
  const descriptors = timelines.map(readTextMotionTimelineDescriptor);

  return createTextMotionTimelineHandle<TextMotionCompositeTimelineOptions, 'sequence'>({
    kind: 'timeline',
    name: 'sequence',
    options: { timelines: descriptors.map((descriptor) => descriptor.name) },
    delayFor(index, count) {
      return descriptors.reduce(
        (delay, descriptor) => delay + descriptor.delayFor(index, count),
        0,
      );
    },
  });
}
