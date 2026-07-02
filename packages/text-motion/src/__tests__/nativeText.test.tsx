import {
  defineTextMotion,
  fade,
  nativeText,
  parentLabelPolicy,
  pulse,
  rise,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';
import { render, screen } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';

import type { TextMotionInternalRecipeConfig, TextMotionToken } from '../types';

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

  it('declares native-text capability', () => {
    expect(readTextMotionRendererDescriptor(nativeText()).capabilities).toEqual(['native-text']);
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
    expect(getHiddenToken('word-0')).toHaveProp('allowFontScaling', false);
    expect(getHiddenToken('word-0')).toHaveProp('maxFontSizeMultiplier', 1.4);
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
