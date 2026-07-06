import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import type { TextMotionSourceRange, TextMotionToken } from '../types';

const LAYOUT_TEXT_STYLE_KEYS = [
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'includeFontPadding',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textTransform',
  'writingDirection',
] as const satisfies readonly (keyof TextStyle)[];

const NATIVE_TEXT_LINE_LAYOUT_INVALIDATION_REASONS = [
  'font-scale',
  'initial',
  'line-text',
  'style',
  'text',
  'width',
] as const;

export type NativeTextLineLayoutFailureReason =
  | 'empty-line-text-unsupported'
  | 'line-group-text-mismatch'
  | 'line-text-not-found'
  | 'token-crosses-line'
  | 'token-outside-lines';

export type NativeTextLineLayoutFailure = {
  lineIndex?: number;
  lineRange?: TextMotionSourceRange;
  message: string;
  reason: NativeTextLineLayoutFailureReason;
  sourceRange?: TextMotionSourceRange;
  tokenId?: string;
};

export type NativeTextLineLayoutResult<Value> =
  | {
      ok: true;
      value: Value;
    }
  | ({
      ok: false;
    } & NativeTextLineLayoutFailure);

export type NativeTextRenderedLine = {
  height: number;
  index: number;
  text: string;
  width: number;
  x: number;
  y: number;
};

export type NativeTextLineRange = {
  index: number;
  sourceRange: TextMotionSourceRange;
  text: string;
};

export type NativeTextLineTokenGroup = {
  line: NativeTextLineRange;
  text: string;
  tokens: readonly TextMotionToken[];
};

export type NativeTextLineLayoutCompatibilityReport =
  | {
      lineCount: number;
      status: 'go';
      tokenCount: number;
    }
  | {
      actualText: string;
      expectedText: string;
      lineIndex: number;
      reason: 'line-group-text-mismatch';
      status: 'no-go';
    };

export type NativeTextLineLayoutInvalidationReason =
  (typeof NATIVE_TEXT_LINE_LAYOUT_INVALIDATION_REASONS)[number];

export type NativeTextLineLayoutProbeSnapshot = {
  acceptedMappingUpdates: number;
  invalidationsByReason: Record<NativeTextLineLayoutInvalidationReason, number>;
  lineCount: number;
  mappingComputations: number;
  onTextLayoutCalls: number;
  rejectedIdenticalPayloads: number;
  signature?: string;
  tokenCount: number;
};

export type NativeTextLineLayoutMeasurement = {
  invalidationReason: NativeTextLineLayoutInvalidationReason;
  lineCount: number;
  signature: string;
  tokenCount: number;
};

export type NativeTextLineLayoutProbeUpdate = {
  accepted: boolean;
  snapshot: NativeTextLineLayoutProbeSnapshot;
};

export type NativeTextLineLayoutSignatureInput = {
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number | null;
  measuredWidth: number;
  renderedLines: readonly Pick<NativeTextRenderedLine, 'height' | 'text' | 'width' | 'x' | 'y'>[];
  style?: StyleProp<TextStyle>;
  text: string;
};

type NativeTextLineLayoutStyleSnapshot = Partial<
  Record<(typeof LAYOUT_TEXT_STYLE_KEYS)[number], unknown>
>;

type NativeTextLineRangeAccumulator =
  | { cursor: number; lines: NativeTextLineRange[]; ok: true }
  | ({ ok: false } & NativeTextLineLayoutFailure);

function createNativeTextLineLayoutFailure(
  reason: NativeTextLineLayoutFailureReason,
  message: string,
  details: Omit<NativeTextLineLayoutFailure, 'message' | 'reason'> = {},
): NativeTextLineLayoutResult<never> {
  return {
    ok: false,
    reason,
    message,
    ...details,
  };
}

function createNativeTextLineRange(
  text: string,
  lineText: string,
  lineIndex: number,
  cursor: number,
): NativeTextLineLayoutResult<NativeTextLineRange> {
  if (lineText.length === 0 && text.length === 0 && cursor === 0) {
    return {
      ok: true,
      value: {
        index: lineIndex,
        sourceRange: { end: 0, start: 0 },
        text: lineText,
      },
    };
  }

  if (lineText.length === 0) {
    return createNativeTextLineLayoutFailure(
      'empty-line-text-unsupported',
      'nativeText line layout cannot map an empty rendered line to a stable source range yet.',
      { lineIndex, sourceRange: { end: cursor, start: cursor } },
    );
  }

  const start = text.indexOf(lineText, cursor);

  if (start < 0) {
    return createNativeTextLineLayoutFailure(
      'line-text-not-found',
      'nativeText line layout could not find the rendered line text after the previous source range.',
      { lineIndex, sourceRange: { end: cursor, start: cursor } },
    );
  }

  return {
    ok: true,
    value: {
      index: lineIndex,
      sourceRange: { end: start + lineText.length, start },
      text: lineText,
    },
  };
}

function rangesIntersect(first: TextMotionSourceRange, second: TextMotionSourceRange): boolean {
  return first.start < second.end && second.start < first.end;
}

function rangeContainsRange(outer: TextMotionSourceRange, inner: TextMotionSourceRange): boolean {
  return inner.start >= outer.start && inner.end <= outer.end;
}

function findWhitespaceSeparatorLineIndex(
  sourceRange: TextMotionSourceRange,
  lineRanges: readonly NativeTextLineRange[],
): number | undefined {
  const previousIndex = lineRanges.reduce<number | undefined>(
    (match, lineRange, index) => (lineRange.sourceRange.end <= sourceRange.start ? index : match),
    undefined,
  );

  if (typeof previousIndex === 'number') {
    return previousIndex;
  }

  const firstLine = lineRanges[0];

  if (firstLine && sourceRange.end <= firstLine.sourceRange.start) {
    return 0;
  }

  return undefined;
}

function findLineIndexForToken(
  token: TextMotionToken,
  lineRanges: readonly NativeTextLineRange[],
): NativeTextLineLayoutResult<number | undefined> {
  if (token.sourceRange.start === token.sourceRange.end) {
    return { ok: true, value: undefined };
  }

  const intersectingIndexes = lineRanges.flatMap((lineRange, index) =>
    rangesIntersect(token.sourceRange, lineRange.sourceRange) ? [index] : [],
  );

  if (intersectingIndexes.length > 1) {
    return createNativeTextLineLayoutFailure(
      'token-crosses-line',
      'nativeText line layout cannot silently assign one token to multiple rendered lines.',
      { sourceRange: token.sourceRange, tokenId: token.id },
    );
  }

  const lineIndex = intersectingIndexes[0];

  if (typeof lineIndex === 'number') {
    const lineRange = lineRanges[lineIndex];

    if (lineRange && rangeContainsRange(lineRange.sourceRange, token.sourceRange)) {
      return { ok: true, value: lineIndex };
    }

    return createNativeTextLineLayoutFailure(
      'token-crosses-line',
      'nativeText line layout found a partial token and requires deterministic handling before stable line support.',
      { lineIndex, sourceRange: token.sourceRange, tokenId: token.id },
    );
  }

  if (token.text.trim().length === 0) {
    return {
      ok: true,
      value: findWhitespaceSeparatorLineIndex(token.sourceRange, lineRanges),
    };
  }

  return createNativeTextLineLayoutFailure(
    'token-outside-lines',
    'nativeText line layout found a non-whitespace token outside all rendered line ranges.',
    { sourceRange: token.sourceRange, tokenId: token.id },
  );
}

function createStyleSnapshot(style: StyleProp<TextStyle>): NativeTextLineLayoutStyleSnapshot {
  const flattenedStyle = StyleSheet.flatten(style) ?? {};

  return LAYOUT_TEXT_STYLE_KEYS.reduce<NativeTextLineLayoutStyleSnapshot>((snapshot, key) => {
    const value = flattenedStyle[key];

    if (value === undefined) {
      return snapshot;
    }

    return {
      ...snapshot,
      [key]: value,
    };
  }, {});
}

function normalizeFiniteNumber(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function createInitialInvalidationsByReason(): Record<
  NativeTextLineLayoutInvalidationReason,
  number
> {
  return NATIVE_TEXT_LINE_LAYOUT_INVALIDATION_REASONS.reduce<
    Record<NativeTextLineLayoutInvalidationReason, number>
  >(
    (invalidations, reason) => ({
      ...invalidations,
      [reason]: 0,
    }),
    {
      'font-scale': 0,
      initial: 0,
      'line-text': 0,
      style: 0,
      text: 0,
      width: 0,
    },
  );
}

export function createNativeTextLineRanges(
  text: string,
  renderedLines: readonly Pick<NativeTextRenderedLine, 'text'>[],
): NativeTextLineLayoutResult<readonly NativeTextLineRange[]> {
  const result: NativeTextLineRangeAccumulator = { cursor: 0, lines: [], ok: true };

  // Keep this accumulator mutable so source mapping stays linear for stress probes.
  for (const [lineIndex, renderedLine] of renderedLines.entries()) {
    const lineRange = createNativeTextLineRange(text, renderedLine.text, lineIndex, result.cursor);

    if (!lineRange.ok) {
      return lineRange;
    }

    result.cursor = lineRange.value.sourceRange.end;
    result.lines.push(lineRange.value);
  }

  if (text.length > 0 && result.lines.length === 0) {
    return createNativeTextLineLayoutFailure(
      'line-text-not-found',
      'nativeText line layout needs rendered line data for non-empty text.',
      { sourceRange: { end: 0, start: 0 } },
    );
  }

  return {
    ok: true,
    value: result.lines,
  };
}

export function groupNativeTextTokensByLineRanges(
  tokens: readonly TextMotionToken[],
  lineRanges: readonly NativeTextLineRange[],
): NativeTextLineLayoutResult<readonly NativeTextLineTokenGroup[]> {
  const groups: { line: NativeTextLineRange; tokens: TextMotionToken[] }[] = lineRanges.map(
    (line) => ({
      line,
      tokens: [],
    }),
  );

  for (const token of tokens) {
    const lineIndex = findLineIndexForToken(token, lineRanges);

    if (!lineIndex.ok) {
      return lineIndex;
    }

    if (typeof lineIndex.value !== 'number') {
      continue;
    }

    const group = groups[lineIndex.value];

    if (!group) {
      return createNativeTextLineLayoutFailure(
        'token-outside-lines',
        'nativeText line layout resolved a token to a missing line group.',
        { sourceRange: token.sourceRange, tokenId: token.id },
      );
    }

    group.tokens.push(token);
  }

  return {
    ok: true,
    value: groups.map(({ line, tokens: groupTokens }) => ({
      line,
      text: groupTokens.map((token) => token.text).join(''),
      tokens: groupTokens,
    })),
  };
}

export function evaluateNativeTextLineLayoutCompatibility(
  groups: readonly NativeTextLineTokenGroup[],
): NativeTextLineLayoutCompatibilityReport {
  const mismatch = groups.find((group) => group.text !== group.line.text);

  if (mismatch) {
    return {
      actualText: mismatch.text,
      expectedText: mismatch.line.text,
      lineIndex: mismatch.line.index,
      reason: 'line-group-text-mismatch',
      status: 'no-go',
    };
  }

  return {
    lineCount: groups.length,
    status: 'go',
    tokenCount: groups.reduce((count, group) => count + group.tokens.length, 0),
  };
}

export function createNativeTextLineLayoutSignature({
  allowFontScaling,
  maxFontSizeMultiplier,
  measuredWidth,
  renderedLines,
  style,
  text,
}: NativeTextLineLayoutSignatureInput): string {
  return JSON.stringify({
    allowFontScaling,
    maxFontSizeMultiplier,
    measuredWidth: normalizeFiniteNumber(measuredWidth),
    renderedLines: renderedLines.map((line) => ({
      height: normalizeFiniteNumber(line.height),
      text: line.text,
      width: normalizeFiniteNumber(line.width),
      x: normalizeFiniteNumber(line.x),
      y: normalizeFiniteNumber(line.y),
    })),
    style: createStyleSnapshot(style),
    text,
  });
}

export function createNativeTextLineLayoutProbeSnapshot(
  initial?: Partial<
    Pick<
      NativeTextLineLayoutProbeSnapshot,
      | 'acceptedMappingUpdates'
      | 'lineCount'
      | 'mappingComputations'
      | 'onTextLayoutCalls'
      | 'rejectedIdenticalPayloads'
      | 'signature'
      | 'tokenCount'
    >
  >,
): NativeTextLineLayoutProbeSnapshot {
  return {
    acceptedMappingUpdates: initial?.acceptedMappingUpdates ?? 0,
    invalidationsByReason: createInitialInvalidationsByReason(),
    lineCount: initial?.lineCount ?? 0,
    mappingComputations: initial?.mappingComputations ?? 0,
    onTextLayoutCalls: initial?.onTextLayoutCalls ?? 0,
    rejectedIdenticalPayloads: initial?.rejectedIdenticalPayloads ?? 0,
    signature: initial?.signature,
    tokenCount: initial?.tokenCount ?? 0,
  };
}

export function recordNativeTextLineLayoutMeasurement(
  snapshot: NativeTextLineLayoutProbeSnapshot,
  measurement: NativeTextLineLayoutMeasurement,
): NativeTextLineLayoutProbeUpdate {
  if (snapshot.signature === measurement.signature) {
    return {
      accepted: false,
      snapshot: {
        ...snapshot,
        lineCount: measurement.lineCount,
        onTextLayoutCalls: snapshot.onTextLayoutCalls + 1,
        rejectedIdenticalPayloads: snapshot.rejectedIdenticalPayloads + 1,
        tokenCount: measurement.tokenCount,
      },
    };
  }

  return {
    accepted: true,
    snapshot: {
      ...snapshot,
      acceptedMappingUpdates: snapshot.acceptedMappingUpdates + 1,
      invalidationsByReason: {
        ...snapshot.invalidationsByReason,
        [measurement.invalidationReason]:
          snapshot.invalidationsByReason[measurement.invalidationReason] + 1,
      },
      lineCount: measurement.lineCount,
      mappingComputations: snapshot.mappingComputations + 1,
      onTextLayoutCalls: snapshot.onTextLayoutCalls + 1,
      signature: measurement.signature,
      tokenCount: measurement.tokenCount,
    },
  };
}
