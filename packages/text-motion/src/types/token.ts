/** Unit of text produced by a splitter. */
export type TextMotionTokenUnit = 'grapheme' | 'word' | 'line' | 'custom';

/** Source character range for a token in the original string. */
export type TextMotionSourceRange = {
  start: number;
  end: number;
};

/** Token emitted by splitters and consumed by renderers. */
export type TextMotionToken<Unit extends TextMotionTokenUnit = TextMotionTokenUnit> = {
  id: string;
  text: string;
  index: number;
  unit: Unit;
  sourceRange: TextMotionSourceRange;
  metadata?: Record<string, unknown>;
};

/** Optional context passed to splitters. */
export type TextMotionSplitContext = {
  /** Locale forwarded to native `Intl.Segmenter` when the runtime provides it. */
  locale?: string | string[];
};

declare const textMotionSplitterBrand: unique symbol;

/** @internal Splitter descriptor consumed by recipe internals. */
export type TextMotionSplitterDescriptor<Unit extends TextMotionTokenUnit = TextMotionTokenUnit> = {
  kind: Unit;
  split(input: string, context?: TextMotionSplitContext): readonly TextMotionToken<Unit>[];
};

/** Opaque splitter handle accepted by `.split(...)`. */
export type TextMotionSplitter<Unit extends TextMotionTokenUnit = TextMotionTokenUnit> = {
  readonly [textMotionSplitterBrand]: {
    readonly unit: Unit;
  };
};
