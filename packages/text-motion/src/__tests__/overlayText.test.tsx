import {
  defineTextMotion,
  fade,
  lineReveal,
  overlayText,
  parentLabelPolicy,
  pulse,
  scale,
  stagger,
} from '@react-native-motion-kit/text-motion';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import type { TextMotionAccessibilityPolicy, TextMotionComponentProps } from '../types';

import {
  createTextMotionControlsHandle,
  readTextMotionControlsDescriptor,
} from '../controls/descriptors';
import { readTextMotionRendererDescriptor } from '../recipe/descriptors';

const TWO_LINE_PAYLOAD = {
  nativeEvent: {
    lines: [
      { height: 20, text: 'Hello', width: 80, x: 0, y: 0 },
      { height: 20, text: 'motion', width: 96, x: 0, y: 20 },
    ],
  },
};
const TWO_LINE_GEOMETRY_ONLY_PAYLOAD = {
  nativeEvent: {
    lines: [
      { height: 20, text: 'Hello', width: 80, x: 0, y: 0 },
      { height: 20, text: 'motion', width: 96, x: 0, y: 20.75 },
    ],
  },
};
const THREE_LINE_TOPOLOGY_PAYLOAD = {
  nativeEvent: {
    lines: [
      { height: 20, text: 'Hello', width: 80, x: 0, y: 0 },
      { height: 20, text: 'native', width: 84, x: 0, y: 20 },
      { height: 20, text: 'motion', width: 96, x: 0, y: 40 },
    ],
  },
};
const FRESH_TWO_LINE_PAYLOAD = {
  nativeEvent: {
    lines: [
      { height: 20, text: 'Fresh', width: 80, x: 0, y: 0 },
      { height: 20, text: 'motion', width: 96, x: 0, y: 20 },
    ],
  },
};
const CENTERED_LINE_PAYLOAD = {
  nativeEvent: {
    lines: [{ height: 20, text: 'Hello motion', width: 100, x: 50, y: 0 }],
  },
};
const RIGHT_TWO_LINE_GEOMETRY_ONLY_PAYLOAD = {
  nativeEvent: {
    lines: [
      { height: 20, text: 'Hello', width: 80, x: 100, y: 0 },
      { height: 20, text: 'motion', width: 96, x: 104, y: 20.75 },
    ],
  },
};
const INVALID_LAYOUT_PAYLOAD = {
  nativeEvent: {
    lines: [{ height: 0, text: 'Hello', width: 80, x: 0, y: 0 }],
  },
};
const SOURCE_ACCESSIBLE_POLICY = {
  hideTokensFromAccessibility: false,
  kind: 'source-accessible',
  parentLabel: false,
  reducedMotion: 'system',
} as const satisfies TextMotionAccessibilityPolicy;

function getHidden(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function expectLineOverlayPending() {
  expect(getHidden('line-overlay').props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
  );
}

function expectLineOverlayReady() {
  expect(getHidden('line-overlay').props.style).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
  );
}

function expectLineFrameStyle(testID: string, opacity: number, scaleValue = 1) {
  expect(getHidden(testID)).toHaveAnimatedStyle({
    opacity,
    transform: [{ translateX: 0 }, { translateY: 0 }, { scale: scaleValue }],
  });
}

function expectRevealContentStyle(testID: string, translateY: number) {
  expect(getHidden(testID)).toHaveAnimatedStyle({
    opacity: 1,
    transform: [{ translateX: 0 }, { translateY }, { scale: 1 }],
  });
}

function expectTwoLineMaskTopology() {
  expect(getHidden('line-0')).toBeTruthy();
  expect(getHidden('line-1')).toBeTruthy();
  expect(screen.queryByTestId('line-2', { includeHiddenElements: true })).toBeNull();
}

function getSourceText(text: string) {
  const source = screen.getAllByText(text, { includeHiddenElements: true })[0];

  if (!source) {
    throw new Error(`Missing source text "${text}".`);
  }

  return source;
}

function getTextLayoutHandler(source: ReturnType<typeof getSourceText>) {
  const onTextLayout = source.props.onTextLayout;

  if (typeof onTextLayout !== 'function') {
    throw new Error('Expected source Text to expose onTextLayout.');
  }

  return onTextLayout;
}

async function emitTextLayout(
  source: ReturnType<typeof getSourceText>,
  event: { nativeEvent: { lines: readonly unknown[] } },
) {
  const onTextLayout = getTextLayoutHandler(source);

  await act(async () => {
    onTextLayout(event);
  });
}

function repeatSequentially(count: number, operation: (index: number) => Promise<void>) {
  return Array.from({ length: count }, (_, index) => index).reduce(
    (sequence, index) => sequence.then(() => operation(index)),
    Promise.resolve(),
  );
}

describe('overlayText', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    jest.mocked(Reanimated.useReducedMotion).mockReset();
    jest.useRealTimers();
  });

  it('declares rendered-line line-mask and style-transform support', () => {
    expect(readTextMotionRendererDescriptor(overlayText())).toMatchObject({
      capabilities: ['line-mask', 'style-transform'],
      motionUnit: 'rendered-line',
    });
    expect(Object.keys(overlayText())).toEqual([]);
  });

  it('renders pending source with the initial visual state, then line masks after layout', async () => {
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal({ fromOpacity: 0.25, y: 12 }))
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();

    await render(<Reveal testID="headline">Hello motion</Reveal>);
    const source = getSourceText('Hello motion');

    expect(screen.getByTestId('headline')).toHaveAccessibleName('Hello motion');
    expect(source).toHaveProp('accessible', false);
    expect(source.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opacity: 0.25,
          transform: [{ translateX: 0 }, { translateY: 12 }, { scale: 1 }],
        }),
      ]),
    );
    expect(screen.queryByTestId('line-overlay', { includeHiddenElements: true })).toBeNull();

    await emitTextLayout(source, TWO_LINE_PAYLOAD);

    expect(getHidden('line-0').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 20, top: 0 })]),
    );
    expect(getHidden('line-1').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 20, top: 20 })]),
    );
    expect(getHidden('line-0-copy').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ top: 0 })]),
    );
    expect(getHidden('line-1-copy').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ top: -20 })]),
    );
    expect(getHidden('line-0').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ transformOrigin: [40, 10, 0] })]),
    );
    expectLineFrameStyle('line-0', 0.25);
    expectRevealContentStyle('line-0-motion', 12);
  });

  it('maps external progress over rendered lines without internal autoplay', async () => {
    expect.hasAssertions();

    const progress = Reanimated.makeMutable(0.5);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .timeline(stagger(0.5))
      .effect(lineReveal({ y: 10 }))
      .motion({ kind: 'timing', options: { duration: 100 } })
      .component();

    const result = await render(
      <Reveal progress={progress} style={{ fontSize: 18 }}>
        Hello motion
      </Reveal>,
    );

    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(200);
    });

    expectLineFrameStyle('line-0', 0.75);
    expectLineFrameStyle('line-1', 0.25);
    expectRevealContentStyle('line-0-motion', 2.5);
    expectRevealContentStyle('line-1-motion', 7.5);

    await result.rerender(
      <Reveal progress={progress} style={{ fontSize: 24 }}>
        Hello motion
      </Reveal>,
    );

    expectLineOverlayPending();
    expectLineFrameStyle('line-0', 0.75);
    expectRevealContentStyle('line-0-motion', 2.5);

    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_GEOMETRY_ONLY_PAYLOAD);

    expectLineOverlayReady();
    expectLineFrameStyle('line-0', 0.75);
    expectLineFrameStyle('line-1', 0.25);
    expectRevealContentStyle('line-0-motion', 2.5);
    expectRevealContentStyle('line-1-motion', 7.5);
  });

  it('places scale and pulse on the outer frame so the reveal content remains mask-relative', async () => {
    const progress = Reanimated.makeMutable(0.5);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(
        lineReveal({ y: 10 })
          .and(scale({ from: 1.5, to: 1 }))
          .and(pulse({ scale: 1.2 })),
      )
      .component();

    await render(<Reveal progress={progress}>Hello motion</Reveal>);
    await emitTextLayout(getSourceText('Hello motion'), CENTERED_LINE_PAYLOAD);

    expect(getHidden('line-0').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ transformOrigin: [100, 10, 0] })]),
    );
    expectLineFrameStyle('line-0', 0.5, 1.5);
    expectRevealContentStyle('line-0-motion', 5);
  });

  it('renders final overlay channel states from already-advanced controlled progress', async () => {
    expect.hasAssertions();

    const progress = Reanimated.makeMutable(1);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(
        lineReveal({ y: 10 })
          .and(scale({ from: 1.5, to: 1 }))
          .and(pulse({ scale: 1.2 })),
      )
      .component();

    await render(<Reveal progress={progress}>Hello motion</Reveal>);
    await emitTextLayout(getSourceText('Hello motion'), CENTERED_LINE_PAYLOAD);

    expectLineFrameStyle('line-0', 1);
    expectRevealContentStyle('line-0-motion', 0);
  });

  it('keeps non-identity initial scale invisible until valid line geometry is ready', async () => {
    const ScaleReveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(scale({ from: 1.5, to: 1 }))
      .component();

    await render(<ScaleReveal>Hello motion</ScaleReveal>);

    expect(getSourceText('Hello motion').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
    );
    expect(screen.queryByTestId('line-overlay', { includeHiddenElements: true })).toBeNull();

    await emitTextLayout(getSourceText('Hello motion'), CENTERED_LINE_PAYLOAD);

    expectLineOverlayReady();
    expectLineFrameStyle('line-0', 1, 1.5);
    expectRevealContentStyle('line-0-motion', 0);
  });

  it('keeps exact identity initial scale on the combined pending source style', async () => {
    const PulseReveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(pulse({ scale: 1.05 }))
      .component();

    await render(<PulseReveal>Hello motion</PulseReveal>);

    expect(getSourceText('Hello motion').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opacity: 1,
          transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
        }),
      ]),
    );
  });

  it('treats near-identity initial scale as non-identity for pending visibility', async () => {
    const NearIdentityReveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(scale({ from: 1.0001, to: 1 }))
      .component();

    await render(<NearIdentityReveal>Hello motion</NearIdentityReveal>);

    expect(getSourceText('Hello motion').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
    );
  });

  it('lets fade set overlay frame opacity after lineReveal in composed order', async () => {
    expect.hasAssertions();

    const progress = Reanimated.makeMutable(0);
    const RevealThenFade = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal({ fromOpacity: 0.2 }).and(fade({ from: 0.4, to: 0.7 })))
      .component();
    await render(<RevealThenFade progress={progress}>Hello motion</RevealThenFade>);

    await emitTextLayout(getSourceText('Hello motion'), CENTERED_LINE_PAYLOAD);

    expectLineFrameStyle('line-0', 0.4);
  });

  it('lets lineReveal set overlay frame opacity after fade without overwriting fade target', async () => {
    expect.hasAssertions();

    const progress = Reanimated.makeMutable(1);
    const FadeThenReveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(fade({ from: 0.4, to: 0.7 }).and(lineReveal({ fromOpacity: 0.2 })))
      .component();

    await render(<FadeThenReveal progress={progress}>Hello motion</FadeThenReveal>);
    await emitTextLayout(getSourceText('Hello motion'), CENTERED_LINE_PAYLOAD);

    expectLineFrameStyle('line-0', 0.7);
  });

  it('keeps geometry-only relayout on the current run and restarts topology changes', async () => {
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();

    await render(<Reveal>Hello motion</Reveal>);
    const source = getSourceText('Hello motion');

    await emitTextLayout(source, TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);

    await emitTextLayout(source, TWO_LINE_GEOMETRY_ONLY_PAYLOAD);

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);

    await emitTextLayout(source, RIGHT_TWO_LINE_GEOMETRY_ONLY_PAYLOAD);

    expect(getHidden('line-0').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ transformOrigin: [140, 10, 0] })]),
    );
    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);

    await emitTextLayout(source, THREE_LINE_TOPOLOGY_PAYLOAD);

    expectLineFrameStyle('line-0', 0);
    expectRevealContentStyle('line-0-motion', 16);
  });

  it('hides retained masks while children are pending and restarts changed topology once', async () => {
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();
    const result = await render(<Reveal>Hello motion</Reveal>);

    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
    expect(getHidden('line-0-copy')).toHaveTextContent('Hello motion');

    await result.rerender(<Reveal>Fresh motion</Reveal>);

    expectLineOverlayPending();
    expect(getHidden('line-0-copy')).toHaveTextContent('Fresh motion');
    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);

    await emitTextLayout(getSourceText('Fresh motion'), FRESH_TWO_LINE_PAYLOAD);

    expectLineOverlayReady();
    expectLineFrameStyle('line-0', 0);
    expectRevealContentStyle('line-0-motion', 16);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    await emitTextLayout(getSourceText('Fresh motion'), FRESH_TWO_LINE_PAYLOAD);

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
  });

  it('restarts owned playback when accepted source text changes with identical line topology', async () => {
    expect.hasAssertions();

    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();
    const result = await render(<Reveal>Hello motion</Reveal>);

    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);

    await result.rerender(<Reveal>{'Hello motion\n'}</Reveal>);
    await emitTextLayout(getSourceText('Hello motion\n'), TWO_LINE_PAYLOAD);

    expectLineFrameStyle('line-0', 0);
    expectRevealContentStyle('line-0-motion', 16);
  });

  it.each([
    ['identical geometry', TWO_LINE_PAYLOAD],
    ['geometry-only change', TWO_LINE_GEOMETRY_ONLY_PAYLOAD],
  ])('preserves playback through a cross-input %s rebind', async (_layoutKind, nextPayload) => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();
    const result = await render(
      <Reveal controls={controls} style={{ fontSize: 18 }}>
        Hello motion
      </Reveal>,
    );

    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
    expect(descriptor.getListenerCount()).toBe(2);

    await result.rerender(
      <Reveal controls={controls} style={{ fontSize: 24 }}>
        Hello motion
      </Reveal>,
    );

    expectLineOverlayPending();
    expect(getSourceText('Hello motion').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opacity: 0,
          transform: [{ translateX: 0 }, { translateY: 16 }, { scale: 1 }],
        }),
      ]),
    );
    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
    expect(descriptor.getListenerCount()).toBe(2);

    await emitTextLayout(getSourceText('Hello motion'), nextPayload);

    expectLineOverlayReady();
    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
    expect(descriptor.getListenerCount()).toBe(2);
  });

  it('preserves mask listeners and in-flight progress for 100 identical layout payloads', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();

    await render(<Reveal controls={controls}>Hello motion</Reveal>);
    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    expectTwoLineMaskTopology();
    expect(descriptor.getListenerCount()).toBe(2);
    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);

    const onTextLayout = getTextLayoutHandler(getSourceText('Hello motion'));

    await act(async () => {
      Array.from({ length: 100 }).forEach(() => {
        onTextLayout(TWO_LINE_PAYLOAD);
      });
    });

    expectTwoLineMaskTopology();
    expect(descriptor.getListenerCount()).toBe(2);
    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
  });

  it('keeps two line listeners and masks after ten controls replay commands', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .component();

    await render(<Reveal controls={controls}>Hello motion</Reveal>);
    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    expectTwoLineMaskTopology();
    expect(descriptor.getListenerCount()).toBe(2);

    await act(async () => {
      Array.from({ length: 10 }).forEach(() => {
        controls.replay();
      });
    });

    expectTwoLineMaskTopology();
    expect(descriptor.getListenerCount()).toBe(2);
  });

  it('preserves mask topology across repeated external progress writes without relayout', async () => {
    expect.hasAssertions();

    const progress = Reanimated.makeMutable(0.75);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .component();

    const result = await render(<Reveal progress={progress}>Hello motion</Reveal>);
    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    expectTwoLineMaskTopology();
    expectLineFrameStyle('line-0', 0.75);
    expectRevealContentStyle('line-0-motion', 4);

    await repeatSequentially(20, async (index) => {
      const nextProgress = index % 2 === 0 ? 0.25 : 0.75;

      await act(async () => {
        progress.value = nextProgress;
      });

      await result.rerender(<Reveal progress={progress}>Hello motion</Reveal>);

      expectTwoLineMaskTopology();
    });

    expectTwoLineMaskTopology();
    expectLineOverlayReady();
    expectLineFrameStyle('line-0', 0.75);
    expectLineFrameStyle('line-1', 0.75);
    expectRevealContentStyle('line-0-motion', 4);
    expectRevealContentStyle('line-1-motion', 4);
  });

  it('returns shared controls listener count to zero after each overlay mount cycle', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .component();

    await repeatSequentially(20, async (cycle) => {
      expect(descriptor.getListenerCount()).toBe(0);

      const result = await render(
        <Reveal controls={controls}>{`Hello motion cycle ${cycle}`}</Reveal>,
      );

      await emitTextLayout(getSourceText(`Hello motion cycle ${cycle}`), TWO_LINE_PAYLOAD);

      expect(descriptor.getListenerCount()).toBe(2);

      await act(async () => {
        result.unmount();
      });

      expect(descriptor.getListenerCount()).toBe(0);
    });
  });

  it('keeps structurally equal fresh style objects on the current layout run', async () => {
    expect.hasAssertions();

    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();
    const result = await render(
      <Reveal style={[{ color: 'black' }, { fontSize: 18 }]}>Hello motion</Reveal>,
    );

    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    await result.rerender(
      <Reveal style={[{ fontSize: 18 }, { color: 'black' }]}>Hello motion</Reveal>,
    );

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
  });

  it('keeps the current layout run for color-only changes and updates paragraph copies', async () => {
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();
    const result = await render(
      <Reveal style={{ color: 'red', fontSize: 18 }}>Hello motion</Reveal>,
    );

    await emitTextLayout(getSourceText('Hello motion'), TWO_LINE_PAYLOAD);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(150);
    });

    await result.rerender(<Reveal style={{ color: 'blue', fontSize: 18 }}>Hello motion</Reveal>);

    expectLineFrameStyle('line-0', 0.5);
    expectRevealContentStyle('line-0-motion', 8);
    expect(getHidden('line-0-copy').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: 'blue' })]),
    );
  });

  it('does not create listeners for structural blank lines', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .component();

    await render(<Reveal controls={controls}>{'Hello\n\nmotion'}</Reveal>);

    await emitTextLayout(getSourceText('Hello\n\nmotion'), {
      nativeEvent: {
        lines: [
          { height: 20, text: 'Hello', width: 80, x: 0, y: 0 },
          { height: 20, text: '', width: 0, x: 0, y: 20 },
          { height: 20, text: 'motion', width: 96, x: 0, y: 40 },
        ],
      },
    });

    expect(descriptor.getListenerCount()).toBe(2);
    expect(screen.queryByTestId('line-2', { includeHiddenElements: true })).toBeNull();

    controls.reset();

    expectLineFrameStyle('line-0', 0);
    expectRevealContentStyle('line-0-motion', 16);
  });

  it('falls back to readable final text for invalid layout and warns once in dev', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .component();

    await render(<Reveal testID="headline">Hello motion</Reveal>);
    const source = getSourceText('Hello motion');
    const onTextLayout = getTextLayoutHandler(source);

    await act(async () => {
      onTextLayout(INVALID_LAYOUT_PAYLOAD);
      onTextLayout(INVALID_LAYOUT_PAYLOAD);
    });

    expect(screen.getByTestId('headline')).toHaveAccessibleName('Hello motion');
    expect(screen.queryByTestId('line-0', { includeHiddenElements: true })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });

  it('keeps final-source layout stretch when invalid layout falls back', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .component();

    await render(
      <Reveal style={{ textAlign: 'right' }} testID="headline">
        Hello motion
      </Reveal>,
    );

    await emitTextLayout(getSourceText('Hello motion'), INVALID_LAYOUT_PAYLOAD);

    expect(getSourceText('Hello motion').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ textAlign: 'right' }),
        expect.objectContaining({ alignSelf: 'stretch' }),
      ]),
    );

    warn.mockRestore();
  });

  it('recovers from fallback when the next input has a valid layout', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .component();
    const result = await render(<Reveal testID="headline">Hello motion</Reveal>);
    const onTextLayout = getTextLayoutHandler(getSourceText('Hello motion'));

    await act(async () => {
      onTextLayout(INVALID_LAYOUT_PAYLOAD);
    });

    expect(screen.queryByTestId('line-0', { includeHiddenElements: true })).toBeNull();

    await result.rerender(<Reveal testID="headline">Fresh motion</Reveal>);

    await emitTextLayout(getSourceText('Fresh motion'), {
      nativeEvent: {
        lines: [
          { height: 20, text: 'Fresh', width: 80, x: 0, y: 0 },
          { height: 20, text: 'motion', width: 96, x: 0, y: 20 },
        ],
      },
    });

    expect(getHidden('line-0-copy')).toHaveTextContent('Fresh motion');

    warn.mockRestore();
  });

  it('renders final state immediately for reduced motion and forwards accessibility props', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);

    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
      .component();

    await render(
      <Reveal
        accessibilityHint="Motion headline"
        accessibilityLabel="Custom label"
        accessibilityRole="header"
        accessibilityState={{ busy: false }}
        testID="headline"
      >
        Hello motion
      </Reveal>,
    );

    expect(screen.getByTestId('headline')).toHaveAccessibleName('Custom label');
    expect(screen.getByTestId('headline')).toHaveProp('accessibilityHint', 'Motion headline');
    expect(screen.getByTestId('headline')).toHaveProp('accessibilityRole', 'header');
    expect(screen.getByTestId('headline')).toHaveProp('accessibilityState', { busy: false });
    expect(getSourceText('Hello motion').props.onTextLayout).toBeUndefined();
    expect(screen.queryByTestId('line-0', { includeHiddenElements: true })).toBeNull();
  });

  it('keeps source text accessible through pending, ready, and fallback states when policy requests it', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .accessibility(SOURCE_ACCESSIBLE_POLICY)
      .component();
    const result = await render(<Reveal>Hello motion</Reveal>);
    const pendingSource = getSourceText('Hello motion');

    expect(pendingSource).not.toHaveProp('accessible', false);
    expect(pendingSource).not.toHaveProp('importantForAccessibility', 'no-hide-descendants');

    await emitTextLayout(pendingSource, TWO_LINE_PAYLOAD);

    expect(getSourceText('Hello motion')).not.toHaveProp('accessible', false);
    expect(getHidden('line-0-copy')).toHaveProp('accessible', false);

    await result.rerender(<Reveal>Fresh motion</Reveal>);
    await emitTextLayout(getSourceText('Fresh motion'), INVALID_LAYOUT_PAYLOAD);

    const fallbackSource = getSourceText('Fresh motion');

    expect(fallbackSource.props.onTextLayout).toBeUndefined();
    expect(fallbackSource).not.toHaveProp('accessible', false);
    expect(fallbackSource).not.toHaveProp('importantForAccessibility', 'no-hide-descendants');

    warn.mockRestore();
  });

  it('keeps final source text accessible when reduced motion skips overlay measurement', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);
    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .accessibility(SOURCE_ACCESSIBLE_POLICY)
      .component();

    await render(<Reveal>Hello motion</Reveal>);

    const source = getSourceText('Hello motion');

    expect(source.props.onTextLayout).toBeUndefined();
    expect(source).not.toHaveProp('accessible', false);
    expect(source).not.toHaveProp('importantForAccessibility', 'no-hide-descendants');
  });

  it('keeps final-source layout stretch when reduced motion skips measurement', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);

    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
      .component();

    await render(
      <Reveal style={{ textAlign: 'center' }} testID="headline">
        Hello motion
      </Reveal>,
    );

    expect(getSourceText('Hello motion').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ textAlign: 'center' }),
        expect.objectContaining({ alignSelf: 'stretch' }),
      ]),
    );
    expect(getSourceText('Hello motion').props.onTextLayout).toBeUndefined();
  });

  it('keeps system reduced motion on the final source without measurement or playback', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);

    const Reveal = defineTextMotion()
      .layout(overlayText({ testIDPrefix: 'line' }))
      .effect(lineReveal())
      .accessibility(parentLabelPolicy({ reducedMotion: 'system' }))
      .component();

    await render(<Reveal controls={controls}>Hello motion</Reveal>);

    const source = getSourceText('Hello motion');

    expect(source.props.style).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opacity: 0,
        }),
      ]),
    );
    expect(source.props.onTextLayout).toBeUndefined();
    expect(descriptor.getListenerCount()).toBe(0);

    await fireEvent(source, 'textLayout', TWO_LINE_PAYLOAD);

    expect(screen.queryByTestId('line-0', { includeHiddenElements: true })).toBeNull();
    expect(screen.queryByTestId('line-0-copy', { includeHiddenElements: true })).toBeNull();
    expect(descriptor.getListenerCount()).toBe(0);
  });

  it('rejects controls and progress together at runtime', async () => {
    const controls = createTextMotionControlsHandle();
    const progress = Reanimated.makeMutable(0);
    const Reveal = defineTextMotion().layout(overlayText()).effect(lineReveal()).component();
    const unsafeProps = {
      children: 'Hello',
      controls,
      progress,
    } as unknown as TextMotionComponentProps;

    await expect(render(<Reveal {...unsafeProps} />)).rejects.toThrow(
      '@react-native-motion-kit/text-motion cannot receive both progress and controls. Use progress for raw app-owned values, or controls for event-driven playback.',
    );
  });
});
