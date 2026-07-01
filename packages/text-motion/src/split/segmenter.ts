export type SegmenterGranularity = 'grapheme' | 'word';

export type TextMotionSegment = {
  index: number;
  isWordLike?: boolean;
  segment: string;
};

type SegmenterLike = {
  segment(input: string): Iterable<TextMotionSegment>;
};

export type SegmenterRuntime = {
  Segmenter?: SegmenterConstructor;
};

export type SegmenterConstructor = new (
  locale?: string | string[],
  options?: { granularity: SegmenterGranularity },
) => SegmenterLike;

const WORD_CHARACTER_SOURCE =
  '[0-9A-Za-z_\\u00C0-\\u024F\\u0370-\\u03FF\\u0400-\\u04FF\\u0590-\\u05FF\\u0600-\\u06FF\\u0900-\\u097F\\u0E00-\\u0E7F\\u1100-\\u11FF\\u3040-\\u30FF\\u3130-\\u318F\\u3400-\\u9FFF\\uAC00-\\uD7AF\\uF900-\\uFAFF]';
const WORD_MARK_SOURCE =
  '[\\u0300-\\u036F\\u1AB0-\\u1AFF\\u1DC0-\\u1DFF\\u20D0-\\u20FF\\uFE20-\\uFE2F]';
const WORD_CONTINUATION_SOURCE = `(?:${WORD_CHARACTER_SOURCE}|${WORD_MARK_SOURCE})*`;
const WORD_UNIT_SOURCE = `${WORD_CHARACTER_SOURCE}${WORD_CONTINUATION_SOURCE}`;
const WORD_LIKE_SOURCE = `${WORD_UNIT_SOURCE}(?:[.'’]${WORD_UNIT_SOURCE})*`;
const WHITESPACE_SOURCE = '\\s+';
const WHITESPACE_PATTERN = /^\s+$/u;
const SURROGATE_PAIR_SOURCE = '[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]';
const CODE_POINT_SOURCE = `(?:\\r\\n|${SURROGATE_PAIR_SOURCE}|[\\s\\S])`;
const GRAPHEME_EXTENSION_SOURCE =
  '[\\u0300-\\u036F\\u1AB0-\\u1AFF\\u1DC0-\\u1DFF\\u20D0-\\u20FF\\uFE20-\\uFE2F\\uFE00-\\uFE0F\\u{E0100}-\\u{E01EF}\\u{1F3FB}-\\u{1F3FF}]';
const BASE_GRAPHEME_SOURCE = `${CODE_POINT_SOURCE}${GRAPHEME_EXTENSION_SOURCE}*`;
const JOINED_GRAPHEME_SOURCE = `${BASE_GRAPHEME_SOURCE}(?:\\u200D${BASE_GRAPHEME_SOURCE})*`;
const REGIONAL_INDICATOR_PAIR_SOURCE = '[\\u{1F1E6}-\\u{1F1FF}]{2}';
const GRAPHEME_SEGMENT_SOURCE = `${REGIONAL_INDICATOR_PAIR_SOURCE}|${JOINED_GRAPHEME_SOURCE}`;
const WORD_SEGMENT_SOURCE = `${WORD_LIKE_SOURCE}|${WHITESPACE_SOURCE}|${GRAPHEME_SEGMENT_SOURCE}`;
const WORD_LIKE_PATTERN = new RegExp(`^${WORD_LIKE_SOURCE}$`, 'u');

export function createSegmenter(
  granularity: SegmenterGranularity,
  locale?: string | string[],
  runtime: SegmenterRuntime | undefined = getDefaultSegmenterRuntime(),
): SegmenterLike {
  const Segmenter = runtime?.Segmenter;

  if (Segmenter) {
    return new Segmenter(locale, { granularity });
  }

  return createFallbackSegmenter(granularity);
}

function createFallbackSegmenter(granularity: SegmenterGranularity): SegmenterLike {
  return {
    segment(input) {
      return granularity === 'word'
        ? segmentWordsWithoutIntl(input)
        : segmentGraphemesWithoutIntl(input);
    },
  };
}

function segmentWordsWithoutIntl(input: string): TextMotionSegment[] {
  return Array.from(input.matchAll(createWordSegmentPattern()), createWordSegment);
}

function segmentGraphemesWithoutIntl(input: string): TextMotionSegment[] {
  return Array.from(input.matchAll(createGraphemeSegmentPattern()), createSegment);
}

function createWordSegment(match: RegExpMatchArray): TextMotionSegment {
  const segment = match[0] ?? '';

  return {
    index: match.index ?? 0,
    isWordLike: WORD_LIKE_PATTERN.test(segment) && !WHITESPACE_PATTERN.test(segment),
    segment,
  };
}

function createSegment(match: RegExpMatchArray): TextMotionSegment {
  return {
    index: match.index ?? 0,
    segment: match[0] ?? '',
  };
}

function createGraphemeSegmentPattern(): RegExp {
  return new RegExp(GRAPHEME_SEGMENT_SOURCE, 'gu');
}

function createWordSegmentPattern(): RegExp {
  return new RegExp(WORD_SEGMENT_SOURCE, 'gu');
}

function getDefaultSegmenterRuntime(): SegmenterRuntime | undefined {
  return globalThis.Intl as unknown as SegmenterRuntime | undefined;
}
