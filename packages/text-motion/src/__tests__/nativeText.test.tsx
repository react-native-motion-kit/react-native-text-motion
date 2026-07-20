import {
  custom,
  defineTextMotion,
  fade,
  graphemes,
  lines,
  nativeText,
  parentLabelPolicy,
  pulse,
  rise,
  scale,
  slide,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import type { TextMotionInternalRecipeConfig, TextMotionToken } from '../types';
import type { TextMotionComponentProps } from '../types';

import {
  createTextMotionControlsHandle,
  readTextMotionControlsDescriptor,
} from '../controls/descriptors';
import { createTextMotionEffect } from '../effects/compose';
import {
  createTextMotionTimelineHandle,
  readTextMotionRendererDescriptor,
  readTextMotionSplitterDescriptor,
} from '../recipe/descriptors';
import { createTextMotionRendererCapability } from '../types/renderer';

function getHiddenToken(testID: string) {
  return screen.getByTestId(testID, { includeHiddenElements: true });
}

function queryHiddenToken(testID: string) {
  return screen.queryByTestId(testID, { includeHiddenElements: true });
}

function isNativeTestInstance(value: unknown): value is ReturnType<typeof getHiddenToken> {
  return typeof value === 'object' && value !== null && 'children' in value && 'props' in value;
}

function getHiddenTokenText(testID: string) {
  const token = getHiddenToken(testID);
  const child = token.children.find(isNativeTestInstance);

  return child ?? token;
}

function expectBlankLineSpacer(testID: string) {
  const spacer = getHiddenToken(testID);

  expect(spacer).toHaveProp('children', ' ');
  expect(spacer.props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ flexBasis: '100%', opacity: 0 })]),
  );
}

function expectZeroHeightLineBreak(testID: string) {
  expect(getHiddenToken(testID).props.style).toEqual(
    expect.objectContaining({ flexBasis: '100%', height: 0 }),
  );
}

const DYNAMIC_FADE_TOKENS = readTextMotionSplitterDescriptor(words()).split('Hello motion');
const STATIC_TO_ANIMATED_STATIC_TOKEN: TextMotionToken<'custom'> = {
  id: 'stable-token',
  index: 0,
  sourceRange: { end: 1, start: 0 },
  text: ' ',
  unit: 'custom',
};
const STATIC_TO_ANIMATED_MOTION_TOKEN: TextMotionToken<'custom'> = {
  id: 'stable-token',
  index: 0,
  sourceRange: { end: 6, start: 0 },
  text: 'Motion',
  unit: 'custom',
};
const STABLE_EASING = (value: number) => value;
const ControlledProgressInteractionReveal = defineTextMotion()
  .split(words())
  .layout(nativeText({ testIDPrefix: 'word' }))
  .effect(fade().and(rise({ y: 10 })))
  .component();

function ControlledProgressInteractionHarness() {
  const progress = Reanimated.useSharedValue(0);

  return (
    <>
      <ControlledProgressInteractionReveal progress={progress}>
        Hello motion
      </ControlledProgressInteractionReveal>
      <Pressable
        testID="advance-progress"
        onPress={() => {
          progress.value = 1;
        }}
      />
    </>
  );
}

function createDynamicFadeRecipe(from: number): TextMotionInternalRecipeConfig {
  return {
    effects: [fade({ from })],
    motion: { kind: 'timing', options: { duration: 400 } },
  };
}

function createTimedFadeRecipe(
  motion: NonNullable<TextMotionInternalRecipeConfig['motion']>,
): TextMotionInternalRecipeConfig {
  return {
    effects: [fade()],
    motion,
  };
}

function createTimelineFadeRecipe(
  timeline: NonNullable<TextMotionInternalRecipeConfig['timeline']>,
): TextMotionInternalRecipeConfig {
  return {
    effects: [fade()],
    motion: { kind: 'timing', options: { duration: 400 } },
    timeline,
  };
}

function createFinalStateFadeRecipe(from: number): TextMotionInternalRecipeConfig {
  return {
    accessibility: parentLabelPolicy({ reducedMotion: 'final-state' }),
    effects: [fade({ from })],
    motion: { kind: 'timing', options: { duration: 400 } },
  };
}

describe('nativeText', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    jest.mocked(Reanimated.useReducedMotion).mockReset();
    jest.useRealTimers();
  });

  it('declares source-token native text and style-transform support', () => {
    expect(readTextMotionRendererDescriptor(nativeText())).toMatchObject({
      capabilities: ['native-text', 'style-transform'],
      motionUnit: 'source-token',
    });
  });

  it('keeps descriptor fields off the public renderer runtime object', () => {
    expect(Object.keys(nativeText())).toEqual([]);
  });

  it('renders parent label and hides token nodes from accessibility', async () => {
    const HeroReveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
      .component();

    await render(<HeroReveal testID="headline">Hello motion</HeroReveal>);

    expect(screen.getByTestId('headline')).toHaveAccessibleName('Hello motion');
    expect(getHiddenToken('word-0')).toHaveTextContent('Hello');
    expect(getHiddenToken('word-0')).toHaveProp('accessible', false);
    expect(getHiddenToken('word-0')).toHaveProp('accessibilityElementsHidden', true);
    expect(getHiddenToken('word-0')).toHaveProp('importantForAccessibility', 'no-hide-descendants');
  });

  it('renders hard newline separators as inaccessible line breaks', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal testID="headline">{'one\ntwo'}</Reveal>);

    expect(screen.getByTestId('headline')).toHaveAccessibleName('one\ntwo');
    expect(getHiddenToken('word-0')).toHaveTextContent('one');
    expect(getHiddenToken('word-2')).toHaveTextContent('two');
    expect(getHiddenToken('word-line-break-1')).toHaveProp('accessible', false);
    expect(getHiddenToken('word-line-break-1')).toHaveProp('accessibilityElementsHidden', true);
    expect(getHiddenToken('word-line-break-1')).toHaveProp(
      'importantForAccessibility',
      'no-hide-descendants',
    );
  });

  it('preserves repeated hard newlines as separate line breaks', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal>{'one\n\ntwo'}</Reveal>);

    expect(getHiddenToken('word-0')).toHaveTextContent('one');
    expect(getHiddenToken('word-3')).toHaveTextContent('two');
    expect(getHiddenToken('word-line-break-1')).toBeTruthy();
    expect(getHiddenToken('word-line-break-2')).toBeTruthy();
    expectZeroHeightLineBreak('word-line-break-1');
    expectBlankLineSpacer('word-line-break-2');
  });

  it('preserves leading hard newlines as blank line spacers', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal>{'\none'}</Reveal>);

    expectBlankLineSpacer('word-line-break-0');
    expect(getHiddenToken('word-1')).toHaveTextContent('one');
  });

  it('preserves trailing hard newlines as blank line spacers', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal>{'one\n'}</Reveal>);

    expect(getHiddenToken('word-0')).toHaveTextContent('one');
    expectBlankLineSpacer('word-line-break-1');
  });

  it('treats CRLF as one hard line break', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal>{'one\r\ntwo'}</Reveal>);

    expect(getHiddenToken('word-0')).toHaveTextContent('one');
    expect(getHiddenToken('word-2')).toHaveTextContent('two');
    expect(getHiddenToken('word-line-break-1')).toBeTruthy();
    expect(queryHiddenToken('word-line-break-2')).toBeNull();
  });

  it('keeps line-break scaffolding inaccessible when token hiding is disabled', async () => {
    const visibleTokenPolicy = {
      hideTokensFromAccessibility: false,
      kind: 'test-visible-token-policy',
      parentLabel: true,
      reducedMotion: 'system',
    } as const;
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .accessibility(visibleTokenPolicy)
      .effect(fade())
      .component();

    await render(<Reveal testID="headline">{'one\ntwo'}</Reveal>);

    expect(screen.getByTestId('headline')).toHaveAccessibleName('one\ntwo');
    expect(getHiddenToken('word-0')).not.toHaveProp('accessibilityElementsHidden', true);
    expect(getHiddenToken('word-line-break-1')).toHaveProp('accessible', false);
    expect(getHiddenToken('word-line-break-1')).toHaveProp('accessibilityElementsHidden', true);
  });

  it('keeps newline-only line splitter tokens compatible with nativeText rendering', async () => {
    const Reveal = defineTextMotion()
      .split(lines())
      .layout(nativeText({ testIDPrefix: 'line' }))
      .timeline(stagger(0.1))
      .effect(fade())
      .component();

    await render(<Reveal>{'First\nSecond'}</Reveal>);

    expect(getHiddenToken('line-0')).toHaveTextContent('First');
    expect(getHiddenToken('line-1')).toHaveTextContent('Second');
    expect(getHiddenToken('line-line-break-1')).toHaveProp('accessible', false);
  });

  it('forwards supported parent and token props intentionally', async () => {
    const Label = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .component();

    await render(
      <Label
        accessibilityLabel="Custom accessible label"
        accessibilityRole="header"
        allowFontScaling={false}
        maxFontSizeMultiplier={1.4}
        nativeID="custom-label"
        testID="label"
      >
        Hello motion
      </Label>,
    );

    expect(screen.getByTestId('label')).toHaveAccessibleName('Custom accessible label');
    expect(screen.getByTestId('label')).toHaveProp('accessibilityRole', 'header');
    expect(screen.getByTestId('label')).toHaveProp('nativeID', 'custom-label');
    expect(getHiddenTokenText('word-0')).toHaveProp('allowFontScaling', false);
    expect(getHiddenTokenText('word-0')).toHaveProp('maxFontSizeMultiplier', 1.4);
  });

  it('keeps animated token testIDs on containers and text props on inner Text', async () => {
    const Label = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(
      <Label allowFontScaling={false} maxFontSizeMultiplier={1.4}>
        Hello motion
      </Label>,
    );

    const tokenContainer = getHiddenToken('word-0');
    const tokenText = getHiddenTokenText('word-0');

    expect(tokenContainer).toHaveProp('accessibilityElementsHidden', true);
    expect(tokenContainer).toHaveProp('accessible', false);
    expect(tokenContainer).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    expect(tokenContainer).not.toHaveProp('allowFontScaling');
    expect(tokenContainer).not.toHaveProp('maxFontSizeMultiplier');
    expect(tokenText).toHaveTextContent('Hello');
    expect(tokenText).toHaveProp('allowFontScaling', false);
    expect(tokenText).toHaveProp('maxFontSizeMultiplier', 1.4);
  });

  it('animates token styles through Reanimated test utilities', async () => {
    const HeroReveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .timeline(stagger(0.05))
      .effect(rise({ y: 10 }).and(fade({ from: 0.2 })))
      .motion({ kind: 'timing', options: { duration: 480 } })
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
      .component();

    await render(<HeroReveal>Hello motion</HeroReveal>);

    const firstWord = getHiddenToken('word-0');
    const lastWord = getHiddenToken('word-2');

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0.2,
      transform: [{ translateX: 0 }, { translateY: 10 }, { scale: 1 }],
    });
    expect(lastWord).toHaveAnimatedStyle({
      opacity: 0.2,
      transform: [{ translateX: 0 }, { translateY: 10 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(480);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(lastWord).not.toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(100);

    expect(lastWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('composes built-in transform effects without changing the nativeText render tree', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(
        fade({ from: 0.25 })
          .and(slide({ x: 6, y: 8 }))
          .and(scale({ from: 0.5, to: 1.1 })),
      )
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    await render(<Reveal>Hello</Reveal>);

    const tokenContainer = getHiddenToken('word-0');
    const tokenText = getHiddenTokenText('word-0');

    expect(tokenText).toHaveTextContent('Hello');
    expect(tokenContainer).not.toHaveProp('allowFontScaling');
    expect(tokenContainer).toHaveAnimatedStyle({
      opacity: 0.25,
      transform: [{ translateX: 6 }, { translateY: 8 }, { scale: 0.5 }],
    });

    jest.advanceTimersByTime(400);

    expect(tokenContainer).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1.1 }],
    });
  });

  it('does not count whitespace tokens in timeline delays', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .timeline(stagger(0.1))
      .effect(fade().and(rise({ y: 10 })))
      .motion({ kind: 'timing', options: { duration: 200 } })
      .component();

    await render(<Reveal>One two three</Reveal>);

    const secondWord = getHiddenToken('word-2');
    const thirdWord = getHiddenToken('word-4');

    jest.advanceTimersByTime(300);

    expect(secondWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(thirdWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 5 }, { scale: 1 }],
    });
  });

  it('does not count hard newline tokens in timeline delays', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .timeline(stagger(0.1))
      .effect(fade().and(rise({ y: 10 })))
      .motion({ kind: 'timing', options: { duration: 200 } })
      .component();

    await render(<Reveal>{'One\ntwo three'}</Reveal>);

    const secondWord = getHiddenToken('word-2');
    const thirdWord = getHiddenToken('word-4');

    jest.advanceTimersByTime(300);

    expect(secondWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(thirdWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 5 }, { scale: 1 }],
    });
  });

  it('pulses scale at the midpoint and settles back to the final scale', async () => {
    const Emphasis = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(pulse({ scale: 1.2 }))
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    await render(<Emphasis>Hello</Emphasis>);

    const word = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(word).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1.2 }],
    });

    jest.advanceTimersByTime(200);

    expect(word).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('continues the current animation when a parent rerenders with the same text', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    const view = await render(<Reveal>Hello motion</Reveal>);
    const firstWord = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(<Reveal>Hello motion</Reveal>);
    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('replays changed text even when the token shape is unchanged', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    const view = await render(<Reveal>Alpha bravo</Reveal>);

    jest.advanceTimersByTime(400);

    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(<Reveal>Gamma delta</Reveal>);

    expect(getHiddenToken('word-0')).toHaveTextContent('Gamma');
    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('replays changed text when the token shape changes', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .timeline(stagger(0.1))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 200 } })
      .component();

    const view = await render(<Reveal>One two</Reveal>);

    jest.advanceTimersByTime(300);

    await view.rerender(<Reveal>One two three</Reveal>);

    expect(getHiddenToken('word-0')).toHaveTextContent('One');
    expect(getHiddenToken('word-1')).toHaveTextContent(' ');
    expect(getHiddenToken('word-2')).toHaveTextContent('two');
    expect(getHiddenToken('word-3')).toHaveTextContent(' ');
    expect(getHiddenToken('word-4')).toHaveTextContent('three');
    expect(getHiddenToken('word-4')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(400);

    expect(getHiddenToken('word-4')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('restarts when effect options change without changing text', async () => {
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const view = await render(
      <Renderer recipe={createDynamicFadeRecipe(0)} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );
    const firstWord = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer recipe={createDynamicFadeRecipe(0.25)} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );
    const updatedFirstWord = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(updatedFirstWord).toHaveAnimatedStyle({
      opacity: 0.625,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(updatedFirstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('restarts with the new timeline delay when the timeline changes', async () => {
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const view = await render(
      <Renderer recipe={createTimelineFadeRecipe(stagger(0))} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );
    const secondWord = getHiddenToken('word-2');

    jest.advanceTimersByTime(400);

    expect(secondWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer recipe={createTimelineFadeRecipe(stagger(0.2))} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );

    expect(secondWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(600);

    expect(secondWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('restarts with the new motion config when motion changes', async () => {
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const view = await render(
      <Renderer
        recipe={createTimedFadeRecipe({ kind: 'timing', options: { duration: 400 } })}
        tokens={DYNAMIC_FADE_TOKENS}
      >
        Hello motion
      </Renderer>,
    );
    const firstWord = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer
        recipe={createTimedFadeRecipe({ kind: 'timing', options: { duration: 800 } })}
        tokens={DYNAMIC_FADE_TOKENS}
      >
        Hello motion
      </Renderer>,
    );

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(400);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(400);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('keeps progress when equal nested spring options are cloned', async () => {
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const createSpringRecipe = () =>
      createTimedFadeRecipe({
        kind: 'spring',
        options: { clamp: { max: 1, min: 0 }, dampingRatio: 1, duration: 400 },
      });
    const view = await render(
      <Renderer recipe={createSpringRecipe()} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );
    const firstWord = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(firstWord).not.toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer recipe={createSpringRecipe()} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );

    expect(firstWord).not.toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('keeps progress when function-valued timing options keep the same reference', async () => {
    const createTimingRecipe = () =>
      createTimedFadeRecipe({ kind: 'timing', options: { duration: 400, easing: STABLE_EASING } });
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const view = await render(
      <Renderer recipe={createTimingRecipe()} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );
    const firstWord = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer recipe={createTimingRecipe()} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );

    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('keeps final-state reduced motion final when replaying inputs change', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);

    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const view = await render(
      <Renderer recipe={createFinalStateFadeRecipe(0)} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );
    const firstWord = getHiddenToken('word-0');

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer recipe={createFinalStateFadeRecipe(0.5)} tokens={DYNAMIC_FADE_TOKENS}>
        Hello motion
      </Renderer>,
    );

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('uses external progress without starting internal autoplay', async () => {
    const progress = Reanimated.makeMutable(0);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 100 } })
      .component();

    await render(<Reveal progress={progress}>Hello motion</Reveal>);
    const firstWord = getHiddenToken('word-0');

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('updates token styles when external progress changes after an interaction', async () => {
    await render(<ControlledProgressInteractionHarness />);
    const firstWord = getHiddenToken('word-0');

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 10 }, { scale: 1 }],
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('advance-progress'));
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('keeps mount autoplay when controls are provided', async () => {
    const controls = createTextMotionControlsHandle();
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 300 } })
      .component();

    await render(<Reveal controls={controls}>Hello</Reveal>);
    const word = getHiddenToken('word-0');

    expect(word).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(300);

    expect(word).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('replays controlled text with recipe motion and timeline delays', async () => {
    const controls = createTextMotionControlsHandle();
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .timeline(stagger(0.1))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 200 } })
      .component();

    await render(<Reveal controls={controls}>One two</Reveal>);
    const firstWord = getHiddenToken('word-0');
    const secondWord = getHiddenToken('word-2');

    jest.advanceTimersByTime(300);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(secondWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await act(async () => {
      controls.replay();
    });

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(secondWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(secondWord).not.toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(100);

    expect(secondWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('resets controlled playback to the initial state', async () => {
    const controls = createTextMotionControlsHandle();
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    await render(<Reveal controls={controls}>Hello</Reveal>);
    const word = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    expect(word).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await act(async () => {
      controls.reset();
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(word).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(400);

    expect(word).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('stops controlled playback while preserving current progress', async () => {
    const controls = createTextMotionControlsHandle();
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    await render(<Reveal controls={controls}>Hello</Reveal>);
    const word = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);

    await act(async () => {
      controls.stop();
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(word).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(400);

    expect(word).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('plays controlled playback from the current progress without resetting', async () => {
    const controls = createTextMotionControlsHandle();
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    await render(<Reveal controls={controls}>Hello</Reveal>);
    const word = getHiddenToken('word-0');

    jest.advanceTimersByTime(200);
    controls.stop();

    await act(async () => {
      controls.play();
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(word).not.toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(400);

    expect(word).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('broadcasts shared controls to multiple text motion components', async () => {
    const controls = createTextMotionControlsHandle();
    const FirstReveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'first' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 200 } })
      .component();
    const SecondReveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'second' }))
      .effect(rise({ y: 10 }).and(fade()))
      .motion({ kind: 'timing', options: { duration: 400 } })
      .component();

    await render(
      <>
        <FirstReveal controls={controls}>First</FirstReveal>
        <SecondReveal controls={controls}>Second</SecondReveal>
      </>,
    );

    jest.advanceTimersByTime(400);
    controls.replay();

    expect(getHiddenToken('first-0')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(getHiddenToken('second-0')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 10 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(getHiddenToken('first-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(getHiddenToken('second-0')).not.toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(getHiddenToken('second-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('replays the current text when controls run after a text change', async () => {
    const controls = createTextMotionControlsHandle();
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .motion({ kind: 'timing', options: { duration: 200 } })
      .component();
    const view = await render(<Reveal controls={controls}>Alpha</Reveal>);

    jest.advanceTimersByTime(200);

    await view.rerender(<Reveal controls={controls}>Bravo</Reveal>);
    await act(async () => {
      controls.replay();
    });

    const currentWord = getHiddenToken('word-0');

    expect(currentWord).toHaveTextContent('Bravo');
    expect(currentWord).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    jest.advanceTimersByTime(200);

    expect(currentWord).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('keeps controls subscriptions stable for dense grapheme text', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .effect(fade())
      .component();
    const view = await render(<Reveal controls={controls}>MotionKit</Reveal>);
    const initialListenerCount = descriptor.getListenerCount();

    expect(initialListenerCount).toBeGreaterThan(0);

    await view.rerender(<Reveal controls={controls}>MotionKit</Reveal>);

    expect(descriptor.getListenerCount()).toBe(initialListenerCount);

    controls.replay();
    controls.reset();
    controls.play();

    expect(descriptor.getListenerCount()).toBe(initialListenerCount);

    await view.unmount();

    expect(descriptor.getListenerCount()).toBe(0);
  });

  it('sums shared controls subscriptions across attached text motion components', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const WordReveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();
    const GraphemeReveal = defineTextMotion()
      .split(graphemes())
      .layout(nativeText({ testIDPrefix: 'glyph' }))
      .effect(fade())
      .component();
    const view = await render(
      <>
        <WordReveal controls={controls}>Alpha beta</WordReveal>
        <GraphemeReveal controls={controls}>Tone</GraphemeReveal>
      </>,
    );
    const attachedListenerCount = descriptor.getListenerCount();

    expect(attachedListenerCount).toBeGreaterThan(1);

    await view.rerender(<GraphemeReveal controls={controls}>Tone</GraphemeReveal>);
    const remainingListenerCount = descriptor.getListenerCount();

    expect(remainingListenerCount).toBeGreaterThan(0);
    expect(remainingListenerCount).toBeLessThan(attachedListenerCount);

    await view.unmount();

    expect(descriptor.getListenerCount()).toBe(0);
  });

  it('cleans up controls subscriptions on unmount and controls changes', async () => {
    const firstControls = createTextMotionControlsHandle();
    const secondControls = createTextMotionControlsHandle();
    const firstDescriptor = readTextMotionControlsDescriptor(firstControls);
    const secondDescriptor = readTextMotionControlsDescriptor(secondControls);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();
    const view = await render(<Reveal controls={firstControls}>Hello motion</Reveal>);
    const attachedListenerCount = firstDescriptor.getListenerCount();

    expect(attachedListenerCount).toBeGreaterThan(0);

    await view.rerender(<Reveal controls={firstControls}>Hello motion</Reveal>);

    expect(firstDescriptor.getListenerCount()).toBe(attachedListenerCount);

    await view.rerender(<Reveal controls={secondControls}>Hello motion</Reveal>);

    expect(firstDescriptor.getListenerCount()).toBe(0);
    expect(secondDescriptor.getListenerCount()).toBe(attachedListenerCount);

    await view.unmount();

    expect(secondDescriptor.getListenerCount()).toBe(0);
  });

  it('does not subscribe static whitespace tokens to controls', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal controls={controls}> </Reveal>);

    expect(descriptor.getListenerCount()).toBe(0);
  });

  it('does not subscribe standalone hard newline fragments to controls', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal controls={controls}>{'One\nTwo'}</Reveal>);

    expect(descriptor.getListenerCount()).toBe(2);
    expect(getHiddenToken('word-line-break-1')).toHaveProp('accessible', false);
  });

  it('keeps embedded custom-token newline controls behavior explicit', async () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const Reveal = defineTextMotion()
      .split(custom((input) => [input]))
      .layout(nativeText({ testIDPrefix: 'custom' }))
      .effect(fade())
      .component();

    await render(<Reveal controls={controls}>{'One\nTwo'}</Reveal>);

    expect(getHiddenToken('custom-0')).toHaveTextContent('One');
    expect(getHiddenToken('custom-0-1')).toHaveTextContent('Two');
    expect(getHiddenToken('custom-line-break-1')).toHaveProp('accessible', false);
    expect(descriptor.getListenerCount()).toBe(2);
  });

  it('throws when controls and raw progress are provided together', async () => {
    const controls = createTextMotionControlsHandle();
    const progress = Reanimated.makeMutable(0);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText())
      .effect(fade())
      .component();
    const unsafeProps = {
      children: 'Hello',
      controls,
      progress,
    } as unknown as TextMotionComponentProps;

    await expect(render(<Reveal {...unsafeProps} />)).rejects.toThrow(
      '@react-native-motion-kit/text-motion cannot receive both progress and controls. Use progress for raw app-owned values, or controls for event-driven playback.',
    );
  });

  it('keeps final-state reduced motion final when controls commands run', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);

    const controls = createTextMotionControlsHandle();
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
      .component();

    await render(<Reveal controls={controls}>Hello</Reveal>);
    const word = getHiddenToken('word-0');

    controls.reset();
    controls.replay();
    controls.stop();
    controls.play();

    expect(word).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('maps whole-text controlled progress to token-local progress with timeline delays', async () => {
    const progress = Reanimated.makeMutable(0.5);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .timeline(stagger(0.5))
      .effect(fade())
      .component();

    await render(<Reveal progress={progress}>One two three</Reveal>);

    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(getHiddenToken('word-2')).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
    expect(getHiddenToken('word-4')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('keeps external progress when controlled inputs change', async () => {
    const progress = Reanimated.makeMutable(0.5);
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const view = await render(
      <Renderer
        recipe={createTimelineFadeRecipe(stagger(0))}
        textProps={{ progress }}
        tokens={DYNAMIC_FADE_TOKENS}
      >
        Hello motion
      </Renderer>,
    );
    const firstWord = getHiddenToken('word-0');

    expect(firstWord).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    await view.rerender(
      <Renderer
        recipe={createDynamicFadeRecipe(0.25)}
        textProps={{ progress }}
        tokens={DYNAMIC_FADE_TOKENS}
      >
        Hello motion
      </Renderer>,
    );

    expect(progress.value).toBe(0.5);
    expect(getHiddenToken('word-0')).toHaveTextContent('Hello');
  });

  it('keeps changed text tied to app-owned progress values', async () => {
    const progress = Reanimated.makeMutable(0);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();
    const view = await render(<Reveal progress={progress}>Alpha</Reveal>);

    await view.rerender(<Reveal progress={progress}>Bravo</Reveal>);
    jest.advanceTimersByTime(200);

    expect(getHiddenToken('word-0')).toHaveTextContent('Bravo');
    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    progress.value = 0.5;

    await view.rerender(<Reveal progress={progress}>Charlie</Reveal>);

    expect(getHiddenToken('word-0')).toHaveTextContent('Charlie');
    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 0.5,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });

    progress.value = 1;

    await view.rerender(<Reveal progress={progress}>Delta</Reveal>);

    expect(getHiddenToken('word-0')).toHaveTextContent('Delta');
    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('clamps negative controlled progress to the initial state', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal progress={Reanimated.makeMutable(-1)}>Hello</Reveal>);

    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('clamps overflowing controlled progress to the final state', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal progress={Reanimated.makeMutable(2)}>Hello</Reveal>);

    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('treats non-finite controlled progress as the initial state', async () => {
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .component();

    await render(<Reveal progress={Reanimated.makeMutable(Number.NaN)}>Hello</Reveal>);

    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('keeps final-state reduced motion final when progress is controlled', async () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);

    const progress = Reanimated.makeMutable(0);
    const Reveal = defineTextMotion()
      .split(words())
      .layout(nativeText({ testIDPrefix: 'word' }))
      .effect(fade())
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
      .component();

    await render(<Reveal progress={progress}>Hello motion</Reveal>);

    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('switches a same-key token from static to animated without changing hook order', async () => {
    const Renderer = readTextMotionRendererDescriptor(
      nativeText({ testIDPrefix: 'word' }),
    ).Component;
    const view = await render(
      <Renderer recipe={createDynamicFadeRecipe(0)} tokens={[STATIC_TO_ANIMATED_STATIC_TOKEN]}>
        Stable child
      </Renderer>,
    );

    expect(getHiddenToken('word-0')).toBeTruthy();

    await view.rerender(
      <Renderer recipe={createDynamicFadeRecipe(0)} tokens={[STATIC_TO_ANIMATED_MOTION_TOKEN]}>
        Stable child
      </Renderer>,
    );

    expect(getHiddenToken('word-0')).toHaveTextContent('Motion');
    expect(getHiddenToken('word-0')).toHaveAnimatedStyle({
      opacity: 0,
      transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
    });
  });

  it('throws before rendering non-finite native effect option values', async () => {
    const unsafeFade = createTextMotionEffect('fade', { from: Number.NaN });
    const Broken = defineTextMotion()
      .split(words())
      .layout(nativeText())
      .effect(unsafeFade)
      .component();

    await expect(render(<Broken>Unsafe value</Broken>)).rejects.toThrow(
      'effect option "from" must be a finite number',
    );
  });

  it('throws before rendering non-number native effect option values', async () => {
    const unsafeFade = createTextMotionEffect('fade', { from: '0' });
    const Broken = defineTextMotion()
      .split(words())
      .layout(nativeText())
      .effect(unsafeFade)
      .component();

    await expect(render(<Broken>Unsafe value</Broken>)).rejects.toThrow(
      'effect option "from" must be a finite number',
    );
  });

  it('throws for native-text effects that nativeText does not implement', async () => {
    const unsupportedEffect = createTextMotionEffect('unsupported-native-effect');
    const Broken = defineTextMotion()
      .split(words())
      .layout(nativeText())
      .effect(unsupportedEffect)
      .component();

    await expect(render(<Broken>Unsupported</Broken>)).rejects.toThrow(
      'nativeText() does not implement the "unsupported-native-effect" effect',
    );
  });

  it('throws when a computed timeline delay is non-finite', async () => {
    const unsafeTimeline = createTextMotionTimelineHandle({
      kind: 'timeline',
      name: 'unsafe-delay',
      delayFor() {
        return Number.NaN;
      },
    });
    const Broken = defineTextMotion()
      .split(words())
      .layout(nativeText())
      .timeline(unsafeTimeline)
      .component();

    await expect(render(<Broken>Unsafe delay</Broken>)).rejects.toThrow(
      'timeline delay must be a finite number greater than or equal to 0',
    );
  });

  it('throws when a computed timeline delay cannot be converted to milliseconds', async () => {
    const Broken = defineTextMotion()
      .split(words())
      .layout(nativeText())
      .timeline(stagger(Number.MAX_VALUE))
      .component();

    await expect(render(<Broken>Unsafe delay</Broken>)).rejects.toThrow(
      'timeline delay must convert to a safe integer millisecond value',
    );
  });

  it('throws when a computed timeline delay converts to an unsafe finite millisecond value', async () => {
    const unsafeTimeline = createTextMotionTimelineHandle({
      kind: 'timeline',
      name: 'unsafe-finite-delay',
      delayFor() {
        return (Number.MAX_SAFE_INTEGER + 1) / 1000;
      },
    });
    const Broken = defineTextMotion()
      .split(words())
      .layout(nativeText())
      .timeline(unsafeTimeline)
      .component();

    await expect(render(<Broken>Unsafe delay</Broken>)).rejects.toThrow(
      'timeline delay must convert to a safe integer millisecond value',
    );
  });

  it('throws for non-native-text effects that reach nativeText', async () => {
    const skiaText = createTextMotionRendererCapability('skia-text');
    const unsupportedEffect = createTextMotionEffect('blur', {}, [skiaText]);
    const Renderer = readTextMotionRendererDescriptor(nativeText()).Component;

    await expect(
      render(
        <Renderer recipe={{ effects: [unsupportedEffect] }} tokens={DYNAMIC_FADE_TOKENS}>
          Unsupported
        </Renderer>,
      ),
    ).rejects.toThrow('nativeText() does not implement the "blur" effect');
  });
});
