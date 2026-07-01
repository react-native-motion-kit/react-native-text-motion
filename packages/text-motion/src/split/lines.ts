import type { TextMotionSplitter, TextMotionToken } from '../types';

import { createTextMotionSplitterHandle } from '../recipe/descriptors';
import { createTextMotionToken } from './createToken';

const LINE_SEGMENT_PATTERN = /[^\n]*\n|[^\n]+/g;

function lineParts(input: string) {
  if (input.length === 0) {
    return [{ start: 0, text: '' }];
  }

  return Array.from(input.matchAll(LINE_SEGMENT_PATTERN), (match) => ({
    start: match.index ?? 0,
    text: match[0] ?? '',
  }));
}

/** Split on newline boundaries. This is experimental and does not measure rendered line wraps. */
export function lines(): TextMotionSplitter<'line'> {
  return createTextMotionSplitterHandle({
    kind: 'line',
    split(input): readonly TextMotionToken<'line'>[] {
      return lineParts(input).map(({ start, text }, index) =>
        createTextMotionToken({
          index,
          metadata: { experimental: true, mapping: 'newline-only' },
          sourceRange: { start, end: start + text.length },
          text,
          unit: 'line',
        }),
      );
    },
  });
}
