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

  it.each([
    ['decomposed syllables', '\u1112\u1161\u11ab\u1100\u1173\u11af', ['한', '글']],
    ['extended Jamo', '\ua960\ud7b0\ud7cb', ['\ua960\ud7b0\ud7cb']],
    ['leading Jamo runs', '\u1100\u1102', ['\u1100\u1102']],
    ['vowel and trailing runs', '\u1161\u1162\u11a8\u11ab', ['\u1161\u1162\u11a8\u11ab']],
    ['precomposed LV with Jamo', '가\u1161\u11a8', ['가\u1161\u11a8']],
    ['precomposed LVT with trailing Jamo', '\u1100각\u11a8', ['\u1100각\u11a8']],
    ['leading and trailing without a vowel', '\u1100\u11a8', ['\u1100', '\u11a8']],
    ['a vowel after a closed syllable', '각\u1161', ['각', '\u1161']],
    ['compatibility Jamo', 'ㄱㅏ', ['ㄱ', 'ㅏ']],
    ['a mark between Jamo', '\u1100\u0301\u1161', ['\u1100\u0301', '\u1161']],
    ['a mark after a syllable', '\u1112\u1161\u11ab\u0301', ['\u1112\u1161\u11ab\u0301']],
  ])('keeps Hangul grapheme boundaries without Intl: %s', (_name, input, expected) => {
    const segments = fallbackSegments(input, 'grapheme');

    expect(segments.map((segment) => segment.segment)).toEqual(expected);
    expect(segments.map((segment) => segment.segment).join('')).toBe(input);
  });

  it('keeps original UTF-16 offsets around decomposed Hangul and emoji without normalizing', () => {
    const input = 'A한👩🏽‍💻\r\n글';
    const segments = fallbackSegments(input, 'grapheme');

    expect(segments).toEqual([
      { index: 0, segment: 'A' },
      { index: 1, segment: '한' },
      { index: 4, segment: '👩🏽‍💻' },
      { index: 11, segment: '\r\n' },
      { index: 13, segment: '글' },
    ]);
    segments.forEach(({ index, segment }) => {
      expect(input.slice(index, index + segment.length)).toBe(segment);
    });
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
