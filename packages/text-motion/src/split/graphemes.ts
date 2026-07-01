import type { TextMotionSplitter } from '../types';

import { createTextMotionSplitterHandle } from '../recipe/descriptors';
import { createTextMotionToken } from './createToken';
import { createSegmenter } from './segmenter';

/** Split text into grapheme-aware tokens for character-level motion. */
export function graphemes(): TextMotionSplitter<'grapheme'> {
  return createTextMotionSplitterHandle({
    kind: 'grapheme',
    split(input, context) {
      const segmenter = createSegmenter('grapheme', context?.locale);

      return Array.from(segmenter.segment(input), (segment, index) =>
        createTextMotionToken({
          index,
          sourceRange: {
            start: segment.index,
            end: segment.index + segment.segment.length,
          },
          text: segment.segment,
          unit: 'grapheme',
        }),
      );
    },
  });
}
