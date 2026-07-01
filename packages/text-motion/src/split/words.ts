import type { TextMotionSplitter } from '../types';

import { createTextMotionSplitterHandle } from '../recipe/descriptors';
import { createTextMotionToken } from './createToken';
import { createSegmenter } from './segmenter';

/** Split text into word, spacing, and punctuation tokens. */
export function words(): TextMotionSplitter<'word'> {
  return createTextMotionSplitterHandle({
    kind: 'word',
    split(input, context) {
      const segmenter = createSegmenter('word', context?.locale);

      return Array.from(segmenter.segment(input), (segment, index) =>
        createTextMotionToken({
          index,
          metadata: { isWordLike: segment.isWordLike === true },
          sourceRange: {
            start: segment.index,
            end: segment.index + segment.segment.length,
          },
          text: segment.segment,
          unit: 'word',
        }),
      );
    },
  });
}
