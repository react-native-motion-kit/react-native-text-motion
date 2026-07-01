import { custom, graphemes, lines, words } from '@react-native-motion-kit/text-motion';

import { readTextMotionSplitterDescriptor } from '../recipe/descriptors';
import { createSegmenter } from '../split/segmenter';

function fallbackSegments(input: string, granularity: 'grapheme' | 'word') {
  return Array.from(createSegmenter(granularity, undefined, {}).segment(input));
}

describe('splitters', () => {
  it('keeps ZWJ emoji sequences as single grapheme tokens', () => {
    const tokens = readTextMotionSplitterDescriptor(graphemes()).split('👨‍👩‍👧‍👦 motion');

    expect(tokens[0]?.text).toBe('👨‍👩‍👧‍👦');
    expect(tokens[0]?.sourceRange).toEqual({
      end: '👨‍👩‍👧‍👦'.length,
      start: 0,
    });
  });

  it('segments Korean, CJK, accents, and RTL text without throwing', () => {
    const sample = '한글 café 文字 שלום';
    const tokens = readTextMotionSplitterDescriptor(graphemes()).split(sample);

    expect(tokens.map((token) => token.text).join('')).toBe(sample);
  });

  it('preserves spacing metadata in word splitting', () => {
    const tokens = readTextMotionSplitterDescriptor(words()).split('one  two');

    expect(tokens.map((token) => token.text).join('')).toBe('one  two');
    expect(tokens.some((token) => token.metadata?.isWordLike === false)).toBe(true);
  });

  it('splits punctuation separately for public word tokens', () => {
    const tokens = readTextMotionSplitterDescriptor(words()).split('Hello, world!');

    expect(tokens.map((token) => token.text)).toEqual(['Hello', ',', ' ', 'world', '!']);
    expect(tokens.map((token) => token.metadata?.isWordLike)).toEqual([
      true,
      false,
      false,
      true,
      false,
    ]);
  });

  it('falls back when Intl.Segmenter is unavailable for word splitting', () => {
    const segments = fallbackSegments('Hello, world!', 'word');

    expect(segments.map((segment) => segment.segment)).toEqual(['Hello', ',', ' ', 'world', '!']);
    expect(segments.map((segment) => segment.isWordLike)).toEqual([
      true,
      false,
      false,
      true,
      false,
    ]);
  });

  it('falls back when Intl.Segmenter is unavailable for ZWJ graphemes', () => {
    const segments = fallbackSegments('👨‍👩‍👧‍👦 motion', 'grapheme');

    expect(segments[0]?.segment).toBe('👨‍👩‍👧‍👦');
    expect(segments.map((segment) => segment.segment).join('')).toBe('👨‍👩‍👧‍👦 motion');
  });

  it('normalizes custom split output into tokens', () => {
    const tokens = readTextMotionSplitterDescriptor(
      custom((input) => input.match(/\S+/g) ?? []),
    ).split('rise and fade');

    expect(tokens).toMatchObject([
      { index: 0, text: 'rise', unit: 'custom' },
      { index: 1, text: 'and', unit: 'custom' },
      { index: 2, text: 'fade', unit: 'custom' },
    ]);
  });

  it('preserves explicit custom split source ranges', () => {
    const tokens = readTextMotionSplitterDescriptor(
      custom(() => [
        { sourceRange: { end: 3, start: 0 }, text: 'pop' },
        {
          metadata: { emphasis: true },
          sourceRange: { end: 7, start: 4 },
          text: 'pop',
        },
      ]),
    ).split('pop pop');

    expect(tokens[1]).toMatchObject({
      metadata: { emphasis: true },
      sourceRange: { end: 7, start: 4 },
      text: 'pop',
    });
  });

  it('marks lines as experimental newline-only tokens', () => {
    const tokens = readTextMotionSplitterDescriptor(lines()).split('one\ntwo');

    expect(tokens.map((token) => token.text)).toEqual(['one\n', 'two']);
    expect(tokens[0]?.metadata).toMatchObject({
      experimental: true,
      mapping: 'newline-only',
    });
  });

  it('keeps descriptor fields off the public splitter runtime object', () => {
    expect(Object.keys(words())).toEqual([]);
  });
});
