import {
  defineTextMotion,
  fade,
  graphemes,
  nativeText,
  overlayText,
  parentLabelPolicy,
  rise,
  stagger,
  typewriter,
  type TextMotionMotionConfig,
} from '@react-native-motion-kit/text-motion';
import { act, render, screen } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import {
  createTextMotionControlsHandle,
  readTextMotionControlsDescriptor,
} from '../controls/descriptors';
import { createTextMotionComponent } from '../recipe/component';
import {
  readTextMotionRendererDescriptor,
  readTextMotionSplitterDescriptor,
} from '../recipe/descriptors';

function getToken(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

async function updateProgress(progress: Reanimated.SharedValue<number>, value: number) {
  await act(async () => {
    progress.value = value;
    await jest.advanceTimersByTimeAsync(1);
  });
}

describe('typewriter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    jest.mocked(Reanimated.useReducedMotion).mockReset();
    jest.useRealTimers();
  });

  it.each([
    [0, 0],
    [-1, 0],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [Number.NEGATIVE_INFINITY, 0],
    [0.000001, 1],
    [0.5, 1],
    [1, 1],
    [2, 1],
  ])('renders progress %s with discrete opacity %s', async (value, opacity) => {
    const progress = Reanimated.makeMutable(value);
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .effect(typewriter())
      .motion({ kind: 'timing', options: { duration: 0 } })
      .component();

    await render(<Reveal progress={progress}>가</Reveal>);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity });
    expect(Object.is(progress.value, value)).toBe(true);
  });

  it('keeps the existing timeline mapping and reverses without owning external progress', async () => {
    const progress = Reanimated.makeMutable(0.31);
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .timeline(stagger(0.05))
      .effect(typewriter())
      .motion({ kind: 'timing', options: { duration: 0 } })
      .component();
    await render(<Reveal progress={progress}>0123456789</Reveal>);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-8')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-9')).toHaveAnimatedStyle({ opacity: 0 });

    await updateProgress(progress, 0.311);

    expect(getToken('glyph-9')).toHaveAnimatedStyle({ opacity: 1 });
    expect(progress.value).toBe(0.311);

    await updateProgress(progress, 0.31);

    expect(getToken('glyph-9')).toHaveAnimatedStyle({ opacity: 0 });

    await updateProgress(progress, 0);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 0 });
    expect(getToken('glyph-9')).toHaveAnimatedStyle({ opacity: 0 });
    expect(progress.value).toBe(0);
  });

  it('preserves full text and layout nodes while whitespace and newlines consume no motion slots', async () => {
    const progress = Reanimated.makeMutable(0.05);
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .timeline(stagger(0.04))
      .effect(typewriter())
      .component();
    await render(
      <Reveal progress={progress} testID="sentence">
        {' A \r\nB! '}
      </Reveal>,
    );
    const initialChildren = screen.getByTestId('sentence').children.length;

    expect(getToken('glyph-0')).toHaveProp('children', ' ');
    expect(getToken('glyph-1')).toHaveTextContent('A');
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-2')).toHaveProp('children', ' ');
    expect(getToken('glyph-line-break-3')).toHaveProp('accessible', false);
    expect(getToken('glyph-4')).toHaveTextContent('B');
    expect(getToken('glyph-4')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-5')).toHaveTextContent('!');
    expect(getToken('glyph-5')).toHaveAnimatedStyle({ opacity: 0 });
    expect(getToken('glyph-6')).toHaveProp('children', ' ');

    await updateProgress(progress, 1);

    expect(screen.getByTestId('sentence').children).toHaveLength(initialChildren);
    expect(getToken('glyph-5')).toHaveAnimatedStyle({ opacity: 1 });
  });

  it('multiplies the existing fade opacity without changing effect order or rise progress', async () => {
    const progress = Reanimated.makeMutable(0);
    const TypewriterFirst = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'first' }))
      .effect(
        typewriter()
          .and(fade({ from: 0.2, to: 0.8 }))
          .and(rise({ y: 8 })),
      )
      .component();
    const TypewriterLast = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'last' }))
      .effect(
        fade({ from: 0.2, to: 0.8 })
          .and(rise({ y: 8 }))
          .and(typewriter()),
      )
      .component();
    await render(
      <>
        <TypewriterFirst progress={progress}>A</TypewriterFirst>
        <TypewriterLast progress={progress}>A</TypewriterLast>
      </>,
    );

    expect(getToken('first-0')).toHaveAnimatedStyle({ opacity: 0 });
    expect(getToken('last-0')).toHaveAnimatedStyle({ opacity: 0 });

    await updateProgress(progress, 0.5);

    const halfwayStyle = {
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 4 }, { scale: 1 }],
    };
    expect(getToken('first-0')).toHaveAnimatedStyle(halfwayStyle);
    expect(getToken('last-0')).toHaveAnimatedStyle(halfwayStyle);
  });

  it('replays, resets and stops visible tokens through the existing controls channel', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .timeline(stagger(0.2))
      .effect(typewriter())
      .motion({ kind: 'timing', options: { duration: 100 } })
      .component();
    const view = await render(<Reveal controls={controls}>AB</Reveal>);

    expect(descriptor.getListenerCount()).toBe(2);
    jest.advanceTimersByTime(50);
    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 0 });

    await act(async () => {
      controls.stop();
      await jest.advanceTimersByTimeAsync(1);
    });
    jest.advanceTimersByTime(500);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 0 });

    await act(async () => {
      controls.reset();
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 0 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 0 });

    await act(async () => {
      controls.play();
    });
    jest.advanceTimersByTime(350);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 1 });

    await act(async () => {
      controls.replay();
    });

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 0 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 0 });

    await view.rerender(<Reveal controls={controls}>AB</Reveal>);
    expect(descriptor.getListenerCount()).toBe(2);
    await view.unmount();
    expect(descriptor.getListenerCount()).toBe(0);
  });

  it('keeps the owned timeline running across the same-input parent rerender', async () => {
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .timeline(stagger(0.2))
      .effect(typewriter())
      .motion({ kind: 'timing', options: { duration: 100 } })
      .component();
    const view = await render(<Reveal>AB</Reveal>);

    jest.advanceTimersByTime(150);
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 0 });
    await view.rerender(<Reveal>AB</Reveal>);
    jest.advanceTimersByTime(100);

    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 1 });
  });

  it('keeps existing token playback when text is appended and delays only the new token', async () => {
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .timeline(stagger(0.2))
      .effect(typewriter())
      .motion({ kind: 'timing', options: { duration: 100 } })
      .component();
    const view = await render(<Reveal>AB</Reveal>);

    jest.advanceTimersByTime(150);
    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 0 });

    await view.rerender(<Reveal>ABC</Reveal>);
    jest.advanceTimersByTime(100);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-2')).toHaveTextContent('C');
    expect(getToken('glyph-2')).toHaveAnimatedStyle({ opacity: 0 });

    jest.advanceTimersByTime(350);

    expect(getToken('glyph-2')).toHaveAnimatedStyle({ opacity: 1 });
  });

  it('restarts the changed token when text is replaced without changing its shape', async () => {
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .effect(typewriter().and(rise({ y: 8 })))
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();
    const view = await render(<Reveal>A</Reveal>);

    jest.advanceTimersByTime(200);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 4 }, { scale: 1 }],
    });

    await view.rerender(<Reveal>B</Reveal>);

    expect(getToken('glyph-0')).toHaveTextContent('B');
    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      transform: [{ translateX: 0 }, { translateY: 8 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 4 }, { scale: 1 }],
    });
  });

  it('restarts the same text when the app changes its React key', async () => {
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .effect(typewriter().and(rise({ y: 8 })))
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();
    const view = await render(<Reveal key="first">A</Reveal>);

    jest.advanceTimersByTime(200);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 4 }, { scale: 1 }],
    });

    await view.rerender(<Reveal key="second">A</Reveal>);

    expect(getToken('glyph-0')).toHaveTextContent('A');
    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      transform: [{ translateX: 0 }, { translateY: 8 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 4 }, { scale: 1 }],
    });
  });

  it('reveals owned zero-duration tokens after their existing stagger delays', async () => {
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .timeline(stagger(0.04))
      .effect(typewriter())
      .motion({ kind: 'timing', options: { duration: 0 } })
      .component();

    await render(<Reveal>AB</Reveal>);
    jest.advanceTimersByTime(20);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 0 });

    jest.advanceTimersByTime(60);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({ opacity: 1 });
    expect(getToken('glyph-1')).toHaveAnimatedStyle({ opacity: 1 });
  });

  it('restarts playback when the gate changes even if the style endpoints stay identical', async () => {
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'glyph' }),
    ).Component;
    const tokens = readTextMotionSplitterDescriptor(graphemes()).split('A');
    const motion: TextMotionMotionConfig = { kind: 'timing', options: { duration: 400 } };
    const view = await render(
      <Renderer recipe={{ effects: [rise({ y: 8 })], motion }} tokens={tokens}>
        A
      </Renderer>,
    );

    jest.advanceTimersByTime(200);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 4 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer recipe={{ effects: [typewriter().and(rise({ y: 8 }))], motion }} tokens={tokens}>
        A
      </Renderer>,
    );

    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      transform: [{ translateX: 0 }, { translateY: 8 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(getToken('glyph-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 4 }, { scale: 1 }],
    });
  });

  it('uses the complete accessible label and final-state policy with external progress at zero', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);
    const progress = Reanimated.makeMutable(0);
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .timeline(stagger(0.04))
      .effect(typewriter())
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
      .component();

    await render(
      <Reveal progress={progress} testID="sentence">
        안녕!
      </Reveal>,
    );

    expect(screen.getByTestId('sentence')).toHaveAccessibleName('안녕!');
    ['glyph-0', 'glyph-1', 'glyph-2'].forEach((testID) => {
      expect(getToken(testID)).toHaveAnimatedStyle({ opacity: 1 });
      expect(getToken(testID)).toHaveProp('accessible', false);
      expect(getToken(testID)).toHaveProp('accessibilityElementsHidden', true);
    });
    expect(progress.value).toBe(0);
  });

  it('rejects a typewriter effect on overlayText through an unsafe runtime recipe', async () => {
    const UnsafeReveal = createTextMotionComponent({
      effects: [typewriter()],
      renderer: overlayText(),
    });

    await expect(render(<UnsafeReveal>Unsupported line typing</UnsafeReveal>)).rejects.toThrow(
      'effect "typewriter" requires capability "native-text", but renderer "overlayText" does not provide it',
    );
  });
});
