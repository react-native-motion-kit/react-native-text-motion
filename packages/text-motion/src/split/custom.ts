import type {
  TextMotionSourceRange,
  TextMotionSplitContext,
  TextMotionSplitter,
  TextMotionToken,
} from '../types';

import { createTextMotionSplitterHandle } from '../recipe/descriptors';
import { createTextMotionToken } from './createToken';

/** Token object returned by a custom splitter when source metadata matters. */
export type TextMotionCustomSplitToken = {
  /** Optional metadata copied into the generated token. */
  metadata?: Record<string, unknown>;
  /** Explicit source range in the original input. */
  sourceRange?: TextMotionSourceRange;
  /** Text content for the token. */
  text: string;
};

/** Result item returned by a custom splitter. */
export type TextMotionCustomSplitResult = string | TextMotionCustomSplitToken;

/** Custom split function used by {@link custom}. */
export type TextMotionCustomSplit = (
  input: string,
  context?: TextMotionSplitContext,
) => readonly TextMotionCustomSplitResult[];

type CustomSplitAccumulator = {
  cursor: number;
  tokens: TextMotionToken<'custom'>[];
};

function findSourceRange(input: string, text: string, cursor: number) {
  const start = input.indexOf(text, cursor);
  const safeStart = start >= 0 ? start : cursor;

  return {
    end: safeStart + text.length,
    start: safeStart,
  };
}

function normalizeCustomSplitResult(
  input: string,
  result: TextMotionCustomSplitResult,
  index: number,
  cursor: number,
) {
  const text = typeof result === 'string' ? result : result.text;
  const sourceRange =
    typeof result === 'string' || !result.sourceRange
      ? findSourceRange(input, text, cursor)
      : result.sourceRange;

  return {
    cursor: sourceRange.end,
    token: createTextMotionToken({
      index,
      metadata: typeof result === 'string' ? undefined : result.metadata,
      sourceRange,
      text,
      unit: 'custom',
    }),
  };
}

/** Build a splitter from an app-defined split function. */
export function custom(split: TextMotionCustomSplit): TextMotionSplitter<'custom'> {
  return createTextMotionSplitterHandle({
    kind: 'custom',
    split(input, context): readonly TextMotionToken<'custom'>[] {
      const initialAccumulator: CustomSplitAccumulator = {
        cursor: 0,
        tokens: [],
      };

      return split(input, context).reduce((accumulator, result, index) => {
        const normalized = normalizeCustomSplitResult(input, result, index, accumulator.cursor);

        // Keep the token accumulator mutable so custom split normalization stays linear.
        accumulator.tokens.push(normalized.token);

        return {
          cursor: normalized.cursor,
          tokens: accumulator.tokens,
        };
      }, initialAccumulator).tokens;
    },
  });
}
