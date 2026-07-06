import * as textMotion from '@react-native-motion-kit/text-motion';
import { graphemes, words } from '@react-native-motion-kit/text-motion';

import type { TextMotionToken } from '../types';

import { readTextMotionSplitterDescriptor } from '../recipe/descriptors';
import {
  createNativeTextLineLayoutProbeSnapshot,
  createNativeTextLineLayoutSignature,
  createNativeTextLineRanges,
  evaluateNativeTextLineLayoutCompatibility,
  groupNativeTextTokensByLineRanges,
  recordNativeTextLineLayoutMeasurement,
  type NativeTextRenderedLine,
} from '../renderers/nativeTextLineLayout';

function renderedLine(text: string): NativeTextRenderedLine {
  return {
    height: 20,
    index: 0,
    text,
    width: text.length * 10,
    x: 0,
    y: 0,
  };
}

function expectLineRanges(
  text: string,
  lineTexts: readonly string[],
): ReturnType<typeof createNativeTextLineRanges> {
  const result = createNativeTextLineRanges(text, lineTexts.map(renderedLine));

  expect(result.ok).toBe(true);

  return result;
}

function wordTokens(text: string) {
  return readTextMotionSplitterDescriptor(words()).split(text);
}

function graphemeTokens(text: string) {
  return readTextMotionSplitterDescriptor(graphemes()).split(text);
}

function testToken(
  id: string,
  text: string,
  start: number,
  end: number,
): TextMotionToken<'custom'> {
  return {
    id,
    index: 0,
    sourceRange: { end, start },
    text,
    unit: 'custom',
  };
}

describe('nativeTextLineLayout', () => {
  it('maps a single rendered line to the original source range', () => {
    const result = expectLineRanges('Design motion', ['Design motion']);

    expect(result).toMatchObject({
      ok: true,
      value: [
        {
          index: 0,
          sourceRange: { end: 13, start: 0 },
          text: 'Design motion',
        },
      ],
    });
  });

  it('maps repeated words by cursor instead of first-match lookup', () => {
    const result = expectLineRanges('move move move', ['move move', 'move']);

    expect(result).toMatchObject({
      ok: true,
      value: [
        { sourceRange: { end: 9, start: 0 }, text: 'move move' },
        { sourceRange: { end: 14, start: 10 }, text: 'move' },
      ],
    });
  });

  it('maps repeated phrases by source order', () => {
    const result = expectLineRanges('rise fade rise fade', ['rise fade', 'rise fade']);

    expect(result).toMatchObject({
      ok: true,
      value: [
        { sourceRange: { end: 9, start: 0 }, text: 'rise fade' },
        { sourceRange: { end: 19, start: 10 }, text: 'rise fade' },
      ],
    });
  });

  it('maps multiple spaces when the rendered lines preserve them', () => {
    const result = expectLineRanges('one  two   three', ['one  two', 'three']);

    expect(result).toMatchObject({
      ok: true,
      value: [
        { sourceRange: { end: 8, start: 0 }, text: 'one  two' },
        { sourceRange: { end: 16, start: 11 }, text: 'three' },
      ],
    });
  });

  it('maps explicit newline-separated rendered lines without including the newline separator', () => {
    const result = expectLineRanges('one\ntwo', ['one', 'two']);

    expect(result).toMatchObject({
      ok: true,
      value: [
        { sourceRange: { end: 3, start: 0 }, text: 'one' },
        { sourceRange: { end: 7, start: 4 }, text: 'two' },
      ],
    });
  });

  it('maps whitespace-only text when React Native preserves the line text', () => {
    const result = expectLineRanges('   ', ['   ']);

    expect(result).toMatchObject({
      ok: true,
      value: [{ sourceRange: { end: 3, start: 0 }, text: '   ' }],
    });
  });

  it('maps Korean, CJK, emoji, accents, and punctuation without corrupting ranges', () => {
    const sample = '한글 café 👨‍👩‍👧‍👦 文字, motion!';
    const firstLine = '한글 café 👨‍👩‍👧‍👦';
    const secondLine = '文字, motion!';
    const result = expectLineRanges(sample, [firstLine, secondLine]);

    expect(result).toMatchObject({
      ok: true,
      value: [
        { sourceRange: { end: firstLine.length, start: 0 }, text: firstLine },
        {
          sourceRange: { end: sample.length, start: firstLine.length + 1 },
          text: secondLine,
        },
      ],
    });
  });

  it('maps RTL text by source order without reversing source ranges', () => {
    const sample = 'שלום motion עולם';
    const firstLine = 'שלום motion';
    const secondLine = 'עולם';
    const result = expectLineRanges(sample, [firstLine, secondLine]);

    expect(result).toMatchObject({
      ok: true,
      value: [
        { sourceRange: { end: firstLine.length, start: 0 }, text: firstLine },
        {
          sourceRange: { end: sample.length, start: firstLine.length + 1 },
          text: secondLine,
        },
      ],
    });
  });

  it('supports empty text when React Native reports an empty rendered line', () => {
    const result = expectLineRanges('', ['']);

    expect(result).toMatchObject({
      ok: true,
      value: [{ sourceRange: { end: 0, start: 0 }, text: '' }],
    });
  });

  it('returns an unsupported result when a rendered line cannot be mapped', () => {
    const result = createNativeTextLineRanges('alpha beta', [renderedLine('gamma')]);

    expect(result).toMatchObject({
      ok: false,
      reason: 'line-text-not-found',
    });
  });

  it('groups word tokens into rendered line ranges and preserves whitespace tokens', () => {
    const text = 'one two three';
    const lineRanges = expectLineRanges(text, ['one ', 'two three']);

    if (!lineRanges.ok) {
      throw new Error('expected mapped line ranges');
    }

    const groups = groupNativeTextTokensByLineRanges(wordTokens(text), lineRanges.value);

    expect(groups).toMatchObject({
      ok: true,
      value: [
        { text: 'one ', tokens: [{ text: 'one' }, { text: ' ' }] },
        { text: 'two three', tokens: [{ text: 'two' }, { text: ' ' }, { text: 'three' }] },
      ],
    });
  });

  it('groups grapheme tokens into rendered line ranges', () => {
    const text = 'go now';
    const lineRanges = expectLineRanges(text, ['go ', 'now']);

    if (!lineRanges.ok) {
      throw new Error('expected mapped line ranges');
    }

    const groups = groupNativeTextTokensByLineRanges(graphemeTokens(text), lineRanges.value);

    expect(groups).toMatchObject({
      ok: true,
      value: [
        { text: 'go ', tokens: [{ text: 'g' }, { text: 'o' }, { text: ' ' }] },
        { text: 'now', tokens: [{ text: 'n' }, { text: 'o' }, { text: 'w' }] },
      ],
    });
  });

  it('returns token-crosses-line instead of silently assigning a split token', () => {
    const groups = groupNativeTextTokensByLineRanges(
      [testToken('long-word', 'motion', 0, 6)],
      [
        { index: 0, sourceRange: { end: 3, start: 0 }, text: 'mot' },
        { index: 1, sourceRange: { end: 6, start: 3 }, text: 'ion' },
      ],
    );

    expect(groups).toMatchObject({
      ok: false,
      reason: 'token-crosses-line',
      tokenId: 'long-word',
    });
  });

  it('marks renderer compatibility as go only when grouped token text matches line text', () => {
    const text = 'one two';
    const lineRanges = expectLineRanges(text, ['one ', 'two']);

    if (!lineRanges.ok) {
      throw new Error('expected mapped line ranges');
    }

    const groups = groupNativeTextTokensByLineRanges(wordTokens(text), lineRanges.value);

    if (!groups.ok) {
      throw new Error('expected token groups');
    }

    expect(evaluateNativeTextLineLayoutCompatibility(groups.value)).toMatchObject({
      lineCount: 2,
      status: 'go',
    });
  });

  it('marks renderer compatibility as no-go when line grouping text differs', () => {
    const text = 'one two';
    const lineRanges = expectLineRanges(text, ['one', 'two']);

    if (!lineRanges.ok) {
      throw new Error('expected mapped line ranges');
    }

    const groups = groupNativeTextTokensByLineRanges(wordTokens(text), lineRanges.value);

    if (!groups.ok) {
      throw new Error('expected token groups');
    }

    expect(evaluateNativeTextLineLayoutCompatibility(groups.value)).toMatchObject({
      actualText: 'one ',
      expectedText: 'one',
      lineIndex: 0,
      reason: 'line-group-text-mismatch',
      status: 'no-go',
    });
  });

  it('creates stable signatures for equivalent layout-affecting values', () => {
    const first = createNativeTextLineLayoutSignature({
      allowFontScaling: true,
      maxFontSizeMultiplier: 1.4,
      measuredWidth: 240,
      renderedLines: [renderedLine('Design motion')],
      style: [{ color: 'red' }, { fontSize: 24, fontWeight: '700' }],
      text: 'Design motion',
    });
    const second = createNativeTextLineLayoutSignature({
      allowFontScaling: true,
      maxFontSizeMultiplier: 1.4,
      measuredWidth: 240,
      renderedLines: [renderedLine('Design motion')],
      style: { fontSize: 24, fontWeight: '700' },
      text: 'Design motion',
    });

    expect(first).toBe(second);
  });

  it('changes signatures for width, line text, style, and font scale changes', () => {
    const base = createNativeTextLineLayoutSignature({
      allowFontScaling: true,
      maxFontSizeMultiplier: 1.2,
      measuredWidth: 240,
      renderedLines: [renderedLine('Design motion')],
      style: { fontSize: 24 },
      text: 'Design motion',
    });

    expect(
      createNativeTextLineLayoutSignature({
        allowFontScaling: true,
        maxFontSizeMultiplier: 1.2,
        measuredWidth: 320,
        renderedLines: [renderedLine('Design motion')],
        style: { fontSize: 24 },
        text: 'Design motion',
      }),
    ).not.toBe(base);
    expect(
      createNativeTextLineLayoutSignature({
        allowFontScaling: true,
        maxFontSizeMultiplier: 1.2,
        measuredWidth: 240,
        renderedLines: [renderedLine('Design'), renderedLine('motion')],
        style: { fontSize: 24 },
        text: 'Design motion',
      }),
    ).not.toBe(base);
    expect(
      createNativeTextLineLayoutSignature({
        allowFontScaling: true,
        maxFontSizeMultiplier: 1.2,
        measuredWidth: 240,
        renderedLines: [renderedLine('Design motion')],
        style: { fontSize: 28 },
        text: 'Design motion',
      }),
    ).not.toBe(base);
    expect(
      createNativeTextLineLayoutSignature({
        allowFontScaling: true,
        maxFontSizeMultiplier: 2,
        measuredWidth: 240,
        renderedLines: [renderedLine('Design motion')],
        style: { fontSize: 24 },
        text: 'Design motion',
      }),
    ).not.toBe(base);
  });

  it('records accepted updates only when the measurement signature changes', () => {
    const initial = createNativeTextLineLayoutProbeSnapshot();
    const first = recordNativeTextLineLayoutMeasurement(initial, {
      invalidationReason: 'initial',
      lineCount: 2,
      signature: 'same-layout',
      tokenCount: 6,
    });
    const duplicate = recordNativeTextLineLayoutMeasurement(first.snapshot, {
      invalidationReason: 'line-text',
      lineCount: 2,
      signature: 'same-layout',
      tokenCount: 6,
    });
    const replay = recordNativeTextLineLayoutMeasurement(duplicate.snapshot, {
      invalidationReason: 'line-text',
      lineCount: 2,
      signature: 'same-layout',
      tokenCount: 6,
    });
    const textChange = recordNativeTextLineLayoutMeasurement(replay.snapshot, {
      invalidationReason: 'text',
      lineCount: 3,
      signature: 'changed-text-layout',
      tokenCount: 8,
    });

    expect(first.accepted).toBe(true);
    expect(duplicate.accepted).toBe(false);
    expect(replay.accepted).toBe(false);
    expect(textChange.accepted).toBe(true);
    expect(textChange.snapshot).toMatchObject({
      acceptedMappingUpdates: 2,
      invalidationsByReason: {
        initial: 1,
        'line-text': 0,
        text: 1,
      },
      lineCount: 3,
      mappingComputations: 2,
      onTextLayoutCalls: 4,
      rejectedIdenticalPayloads: 2,
      tokenCount: 8,
    });
  });

  it('records one accepted update for each committed width, style, and font-scale change', () => {
    const first = recordNativeTextLineLayoutMeasurement(createNativeTextLineLayoutProbeSnapshot(), {
      invalidationReason: 'initial',
      lineCount: 2,
      signature: 'initial-layout',
      tokenCount: 6,
    });
    const widthChange = recordNativeTextLineLayoutMeasurement(first.snapshot, {
      invalidationReason: 'width',
      lineCount: 3,
      signature: 'width-layout',
      tokenCount: 6,
    });
    const repeatedWidth = recordNativeTextLineLayoutMeasurement(widthChange.snapshot, {
      invalidationReason: 'width',
      lineCount: 3,
      signature: 'width-layout',
      tokenCount: 6,
    });
    const styleChange = recordNativeTextLineLayoutMeasurement(repeatedWidth.snapshot, {
      invalidationReason: 'style',
      lineCount: 3,
      signature: 'style-layout',
      tokenCount: 6,
    });
    const fontScaleChange = recordNativeTextLineLayoutMeasurement(styleChange.snapshot, {
      invalidationReason: 'font-scale',
      lineCount: 4,
      signature: 'font-scale-layout',
      tokenCount: 6,
    });

    expect(fontScaleChange.snapshot).toMatchObject({
      acceptedMappingUpdates: 4,
      invalidationsByReason: {
        'font-scale': 1,
        initial: 1,
        style: 1,
        width: 1,
      },
      mappingComputations: 4,
      onTextLayoutCalls: 5,
      rejectedIdenticalPayloads: 1,
    });
  });

  it('keeps line layout helpers out of the public root API', () => {
    expect('createNativeTextLineRanges' in textMotion).toBe(false);
    expect('groupNativeTextTokensByLineRanges' in textMotion).toBe(false);
    expect('evaluateNativeTextLineLayoutCompatibility' in textMotion).toBe(false);
  });
});
