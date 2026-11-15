import type { StyleProp, ViewStyle } from 'react-native';
import type { TestInstance } from 'test-renderer';

import {
  defineTextMotion,
  lineReveal,
  overlayText,
  pulse,
  scale,
  stagger,
} from '@react-native-motion-kit/text-motion';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

type NativeLine = {
  height: number;
  text: string;
  width: number;
  x: number;
  y: number;
};

const SOURCE_TEXT = 'AAAA\nbbbb';
const LINES: readonly NativeLine[] = [
  { height: 30, text: 'AAAA', width: 100, x: 0, y: 0 },
  { height: 30, text: 'bbbb', width: 90, x: 0, y: 36 },
];
const FRACTIONAL_LINES: readonly NativeLine[] = [
  { height: 30.25, text: 'AAAA', width: 100, x: 0, y: 0.25 },
  { height: 30.25, text: 'bbbb', width: 90, x: 0, y: 36.75 },
];

function hidden(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function styleOf(node: TestInstance): ViewStyle {
  const style = StyleSheet.flatten(node.props.style as StyleProp<ViewStyle>) ?? {};
  return node.props.jestAnimatedStyle ? { ...style, ...Reanimated.getAnimatedStyle(node) } : style;
}

/**
 * Follow a native glyph band's vertical interval through the rendered host tree.
 * Local overflow clips apply before the element's position/translation. Stop in
 * the outer mask's coordinates: its frame scale/pulse cannot introduce a source
 * band that was already excluded. These fixtures use translation-only content.
 */
function visibleBandHeight(targetIndex: number, sourceLine: NativeLine): number {
  const mask = hidden(`band-${targetIndex}`);
  let node: TestInstance | null = hidden(`band-${targetIndex}-copy`);
  let start = sourceLine.y;
  let end = sourceLine.y + sourceLine.height;

  while (node) {
    const style = styleOf(node);
    if (style.overflow === 'hidden') {
      if (typeof style.height !== 'number') {
        throw new Error('A vertical line clip must have a numeric height.');
      }
      start = Math.max(0, start);
      end = Math.min(style.height, end);
      if (end <= start) return 0;
    }

    if (node === mask) return end - start;

    const translateY = Array.isArray(style.transform)
      ? style.transform.reduce(
          (offset, transform) =>
            'translateY' in transform && typeof transform.translateY === 'number'
              ? offset + transform.translateY
              : offset,
          0,
        )
      : 0;
    const offset = (typeof style.top === 'number' ? style.top : 0) + translateY;
    start += offset;
    end += offset;
    node = node.parent;
  }

  throw new Error('The paragraph copy must be contained by its own line mask.');
}

async function renderLines({
  offset,
  progress = 0.2,
  lines = LINES,
  scaleFrame = false,
}: {
  offset: number;
  progress?: number;
  lines?: readonly NativeLine[];
  scaleFrame?: boolean;
}) {
  const effect = lineReveal({ y: offset });
  const Reveal = defineTextMotion()
    .layout(overlayText({ testIDPrefix: 'band' }))
    .timeline(stagger(0.16))
    .effect(scaleFrame ? effect.and(scale({ from: 1.5 })).and(pulse({ scale: 1.2 })) : effect)
    .component();

  await render(<Reveal progress={Reanimated.makeMutable(progress)}>{SOURCE_TEXT}</Reveal>);
  const source = screen.getByText(SOURCE_TEXT, { includeHiddenElements: true });
  await fireEvent(source, 'textLayout', { nativeEvent: { lines } });
}

describe('overlayText line source isolation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    jest.mocked(Reanimated.useReducedMotion).mockReset();
    jest.useRealTimers();
  });

  it.each([
    { name: 'previous line during downward reveal', offset: 24, target: 1, neighbor: 0 },
    { name: 'next line during upward reveal', offset: -24, target: 0, neighbor: 1 },
  ])('never exposes the $name', async ({ offset, target, neighbor }) => {
    await renderLines({ offset });

    expect(visibleBandHeight(target, LINES[neighbor]!)).toBe(0);
    expect(visibleBandHeight(target, LINES[target]!)).toBeGreaterThan(0);
  });

  it('keeps a mask empty while its own line is completely outside the reveal window', async () => {
    await renderLines({ offset: 48 });

    expect(visibleBandHeight(1, LINES[0]!)).toBe(0);
    expect(visibleBandHeight(1, LINES[1]!)).toBe(0);
  });

  it('isolates neighboring glyph bands with fractional native line geometry', async () => {
    await renderLines({ offset: 24, lines: FRACTIONAL_LINES });

    expect(visibleBandHeight(1, FRACTIONAL_LINES[0]!)).toBe(0);
    expect(visibleBandHeight(1, FRACTIONAL_LINES[1]!)).toBeGreaterThan(0);
  });

  it.each([24, -24])(
    'shows only each complete intended line at final progress for offset %s',
    async (offset) => {
      await renderLines({ offset, progress: 1 });

      for (const [index, line] of LINES.entries()) {
        expect(visibleBandHeight(index, line)).toBeCloseTo(line.height);
        expect(visibleBandHeight(index, LINES[index === 0 ? 1 : 0]!)).toBe(0);
      }
    },
  );

  it('retains source isolation while the outer frame grows with scale and pulse', async () => {
    await renderLines({ offset: 24, scaleFrame: true });

    expect(visibleBandHeight(1, LINES[0]!)).toBe(0);
    expect(visibleBandHeight(1, LINES[1]!)).toBeGreaterThan(0);
    const frame = styleOf(hidden('band-1'));
    const scaleTransform = Array.isArray(frame.transform)
      ? frame.transform.find((transform) => 'scale' in transform)
      : undefined;
    expect(scaleTransform?.scale).toBeGreaterThan(1);
  });
});
