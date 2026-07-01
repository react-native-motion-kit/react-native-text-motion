import type { TextMotionAnyTimeline, TextMotionTimeline } from '../types';

import {
  createTextMotionTimelineHandle,
  readTextMotionTimelineDescriptor,
} from '../recipe/descriptors';

type TextMotionCompositeTimelineOptions = {
  timelines: readonly string[];
};

/** Combine timelines by using the earliest delay for each token. */
export function parallel(
  ...timelines: readonly TextMotionAnyTimeline[]
): TextMotionTimeline<'parallel'> {
  const descriptors = timelines.map(readTextMotionTimelineDescriptor);

  return createTextMotionTimelineHandle<TextMotionCompositeTimelineOptions, 'parallel'>({
    kind: 'timeline',
    name: 'parallel',
    options: { timelines: descriptors.map((descriptor) => descriptor.name) },
    delayFor(index, count) {
      if (descriptors.length === 0) {
        return 0;
      }

      return Math.min(...descriptors.map((descriptor) => descriptor.delayFor(index, count)));
    },
  });
}
