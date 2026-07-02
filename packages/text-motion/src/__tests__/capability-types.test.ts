import {
  defineTextMotion,
  fade,
  graphemes,
  nativeText,
  parentLabelPolicy,
  stagger,
  wave,
  words,
  type TextMotionComponentProps,
  type TextMotionEffect,
  type TextMotionRendererProps,
} from '@react-native-motion-kit/text-motion';

import { createTextMotionEffect } from '../effects/compose';
import { createTextMotionRendererCapability } from '../types/renderer';

describe('renderer capability types', () => {
  it('keeps capability checks in the TypeScript surface', () => {
    expect(true).toBe(true);
  });
});

declare const publicApi: typeof import('@react-native-motion-kit/text-motion');
declare const publicRendererProps: TextMotionRendererProps;

function expectExtensionFactoriesStayInternal() {
  // @ts-expect-error custom effect factories are intentionally not root public API in the MVP.
  void publicApi.createTextMotionEffect;

  // @ts-expect-error renderer capability factories are intentionally not root public API in the MVP.
  void publicApi.createTextMotionRendererCapability;

  // @ts-expect-error recipe implementation factories are intentionally not root public API.
  void publicApi.createTextMotionRecipeBuilder;
}

void expectExtensionFactoriesStayInternal;

function expectNativeTextRejectsSkiaOnlyEffects() {
  const skiaText = createTextMotionRendererCapability('skia-text');
  const skiaOnlyEffect = createTextMotionEffect('blur', {}, [skiaText]);

  // @ts-expect-error nativeText cannot accept effects that require skia-text.
  defineTextMotion().layout(nativeText()).effect(skiaOnlyEffect);
}

void expectNativeTextRejectsSkiaOnlyEffects;

function expectComponentRequiresLayout() {
  defineTextMotion().recipe();

  // @ts-expect-error component requires a renderer selected with .layout(...).
  defineTextMotion().component();

  defineTextMotion()
    .split(words())
    .timeline(stagger(0.032))
    .motion({ kind: 'timing', options: { duration: 240 } })
    .accessibility(parentLabelPolicy())
    .recipe();

  defineTextMotion()
    .split(words())
    .timeline(stagger(0.032))
    .motion({ kind: 'timing', options: { duration: 240 } })
    .accessibility(parentLabelPolicy())
    // @ts-expect-error component requires a renderer selected with .layout(...).
    .component();

  defineTextMotion().layout(nativeText()).component();
}

void expectComponentRequiresLayout;

function expectStableMotionKindsOnly() {
  // @ts-expect-error custom motion is deferred until it has a runtime contract.
  defineTextMotion().motion({ kind: 'custom' });
}

void expectStableMotionKindsOnly;

function expectMotionOptionsMatchMotionKind() {
  defineTextMotion().motion({
    kind: 'timing',
    options: { duration: 320 },
  });

  defineTextMotion().motion({
    kind: 'spring',
    options: { damping: 14, stiffness: 160 },
  });

  defineTextMotion().motion({
    kind: 'timing',
    options: {
      // @ts-expect-error damping is a spring option, not a timing option.
      damping: 14,
    },
  });

  defineTextMotion().motion({
    kind: 'spring',
    options: {
      // @ts-expect-error reduceMotion is controlled by accessibility policy.
      reduceMotion: 'system',
    },
  });
}

void expectMotionOptionsMatchMotionKind;

function expectEffectOptionsRemainTyped() {
  const fadeEffect = fade({ from: 0.2, to: 0.9 });
  const customEffect = createTextMotionEffect('blur', { radius: 8 });
  const defaultEffect: TextMotionEffect = createTextMotionEffect('no-options');

  // @ts-expect-error fade effect options do not accept slide-specific y.
  fade({ y: 10 });

  // @ts-expect-error effect handles do not expose descriptor options.
  void fadeEffect.options;

  // @ts-expect-error effect handles do not expose descriptor names.
  void customEffect.name;

  // @ts-expect-error effect handles do not expose descriptor kinds.
  void customEffect.kind;

  // @ts-expect-error effect handles do not expose renderer capabilities.
  void defaultEffect.requiredCapabilities;
}

void expectEffectOptionsRemainTyped;

function expectTimelineOptionsRemainTyped() {
  const staggerTimeline = stagger(0.032, { from: 'center' });
  const waveTimeline = wave({ amplitude: 0.06, wavelength: 5 });

  // @ts-expect-error stagger origin does not accept arbitrary strings.
  stagger(0.032, { from: 'middle' });

  // @ts-expect-error wave options do not accept stagger-specific from.
  wave({ from: 'center' });

  // @ts-expect-error timeline handles do not expose descriptor options.
  void staggerTimeline.options;

  // @ts-expect-error timeline handles do not expose descriptor names.
  void staggerTimeline.name;

  // @ts-expect-error timeline handles do not expose renderer delay calculation.
  void waveTimeline.delayFor(0, 1);
}

void expectTimelineOptionsRemainTyped;

function expectSplitterHandlesDoNotExposeDescriptors() {
  const wordSplitter = words();
  const graphemeSplitter = graphemes();

  // @ts-expect-error splitter handles do not expose descriptor kinds.
  void wordSplitter.kind;

  // @ts-expect-error splitter handles do not expose split implementation.
  void graphemeSplitter.split('text');
}

void expectSplitterHandlesDoNotExposeDescriptors;

function expectRendererHandlesDoNotExposeDescriptors() {
  const renderer = nativeText();

  // @ts-expect-error renderer handles do not expose descriptor kinds.
  void renderer.kind;

  // @ts-expect-error renderer handles do not expose supported capabilities.
  void renderer.capabilities;

  // @ts-expect-error renderer handles do not expose implementation components.
  void renderer.Component;
}

void expectRendererHandlesDoNotExposeDescriptors;

function expectPublicRendererRecipeDoesNotWidenDescriptorOptions() {
  // @ts-expect-error public renderer props expose effect handles, not descriptors.
  void publicRendererProps.recipe.effects[0]?.options;

  // @ts-expect-error public renderer props expose timeline handles, not descriptors.
  void publicRendererProps.recipe.timeline?.delayFor(0, 1);

  // @ts-expect-error public renderer props expose splitter handles, not descriptors.
  void publicRendererProps.recipe.splitter?.split('text');

  // @ts-expect-error public renderer props expose renderer handles, not descriptors.
  void publicRendererProps.recipe.renderer?.Component;
}

void expectPublicRendererRecipeDoesNotWidenDescriptorOptions;

function expectTextMotionComponentsRejectUnsupportedTextProps() {
  const props: TextMotionComponentProps = {
    accessibilityLabel: 'Readable title',
    allowFontScaling: true,
    children: 'Readable title',
    maxFontSizeMultiplier: 1.4,
    nativeID: 'readable-title',
    style: { fontSize: 18 },
    testID: 'readable-title',
  };

  const propsWithNumberOfLines: TextMotionComponentProps = {
    children: 'Readable title',
    // @ts-expect-error nativeText does not support ellipsis layout as a Text drop-in.
    numberOfLines: 1,
  };

  const propsWithPressHandler: TextMotionComponentProps = {
    children: 'Readable title',
    // @ts-expect-error nativeText does not expose text press handling in the MVP contract.
    onPress() {},
  };

  const propsWithReplayKey: TextMotionComponentProps = {
    children: 'Readable title',
    // @ts-expect-error public replay keys are deferred until playback ownership is designed.
    replayKey: 1,
  };

  const propsWithControls: TextMotionComponentProps = {
    children: 'Readable title',
    // @ts-expect-error public controls are deferred until playback ownership is designed.
    controls: {},
  };

  const propsWithProgress: TextMotionComponentProps = {
    children: 'Readable title',
    // @ts-expect-error controlled progress is deferred until playback ownership is designed.
    progress: {},
  };

  void props;
  void propsWithNumberOfLines;
  void propsWithPressHandler;
  void propsWithReplayKey;
  void propsWithControls;
  void propsWithProgress;
}

void expectTextMotionComponentsRejectUnsupportedTextProps;
