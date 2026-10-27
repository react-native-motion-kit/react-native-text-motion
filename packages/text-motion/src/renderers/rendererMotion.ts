import {
  ReduceMotion,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type {
  TextMotionAnyEffect,
  TextMotionAnyEffectDescriptor,
  TextMotionEffectDescriptorOptions,
  TextMotionInternalRecipeConfig,
  TextMotionMotionConfig,
} from '../types/recipe';

import {
  flattenTextMotionEffectDescriptors,
  readTextMotionTimelineDescriptor,
} from '../recipe/descriptors';

export const TEXT_MOTION_CONTROLLED_ITEM_TIMELINE_SPAN = 1;

export type TextMotionStyleTransformState = {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
};

export type TextMotionStyleTransformStatePair = {
  initial: TextMotionStyleTransformState;
  pulseScale: number;
  target: TextMotionStyleTransformState;
};

export type TextMotionOverlayStyleTransformStatePair = {
  frame: TextMotionStyleTransformStatePair;
  revealContent: TextMotionStyleTransformStatePair;
};

export type TextMotionItemMotion = {
  delayMs: number;
  initial: TextMotionStyleTransformState;
  target: TextMotionStyleTransformState;
  motion?: TextMotionMotionConfig;
  pulseScale: number;
  reducedMotion: 'final-state' | 'system';
};

export type TextMotionControlledProgressPlan = {
  itemDelaySeconds: number;
  totalTimelineSpan: number;
};

type TextMotionControlledProgressInput = TextMotionControlledProgressPlan & {
  progress: number;
};

type TextMotionNumberTransform = (value: number) => number;
type TextMotionStyleStateTransform = (
  state: TextMotionStyleTransformState,
) => TextMotionStyleTransformState;

type EffectStyleStateChange = {
  initial?: TextMotionStyleStateTransform;
  pulseScale?: TextMotionNumberTransform;
  target?: TextMotionStyleStateTransform;
};

type EffectStyleStateResolver = (effect: TextMotionAnyEffectDescriptor) => EffectStyleStateChange;
type TextMotionStyleNumberKey = keyof TextMotionStyleTransformState;

const DEFAULT_STYLE_STATE: TextMotionStyleTransformState = {
  opacity: 1,
  scale: 1,
  translateX: 0,
  translateY: 0,
};

const REDUCE_MOTION_CONFIG_BY_POLICY = {
  'final-state': ReduceMotion.Never,
  system: ReduceMotion.System,
} as const satisfies Record<TextMotionItemMotion['reducedMotion'], ReduceMotion>;

const preserveStyleState: TextMotionStyleStateTransform = (state) => state;
const preserveNumber: TextMotionNumberTransform = (value) => value;

const effectStyleStateResolvers: Record<string, EffectStyleStateResolver> = {
  fade(effect) {
    return {
      initial: setStyleNumber('opacity', numberOption(effect.options, 'from', 0)),
      target: setStyleNumber('opacity', numberOption(effect.options, 'to', 1)),
    };
  },
  lineReveal(effect) {
    return {
      initial: composeStyleTransforms(
        setStyleNumber('opacity', numberOption(effect.options, 'fromOpacity', 0)),
        mapStyleNumber(
          'translateY',
          (translateY) => translateY + numberOption(effect.options, 'y', 16),
        ),
      ),
      target: preserveStyleState,
    };
  },
  pulse(effect) {
    return {
      pulseScale: (scale) => scale * numberOption(effect.options, 'scale', 1.04),
    };
  },
  rise(effect) {
    return {
      initial: mapStyleNumber(
        'translateY',
        (translateY) => translateY + numberOption(effect.options, 'y', 12),
      ),
      target: preserveStyleState,
    };
  },
  scale(effect) {
    return {
      initial: mapStyleNumber(
        'scale',
        (scale) => scale * numberOption(effect.options, 'from', 0.96),
      ),
      target: mapStyleNumber('scale', (scale) => scale * numberOption(effect.options, 'to', 1)),
    };
  },
  shake(effect) {
    return {
      initial: mapStyleNumber(
        'translateX',
        (translateX) => translateX + numberOption(effect.options, 'x', 4),
      ),
      target: preserveStyleState,
    };
  },
  slide(effect) {
    return {
      initial: composeStyleTransforms(
        mapStyleNumber(
          'translateX',
          (translateX) => translateX + numberOption(effect.options, 'x', 0),
        ),
        mapStyleNumber(
          'translateY',
          (translateY) => translateY + numberOption(effect.options, 'y', 12),
        ),
      ),
      target: preserveStyleState,
    };
  },
};

const overlayFrameEffectStyleStateResolvers: Record<string, EffectStyleStateResolver> = {
  ...effectStyleStateResolvers,
  lineReveal(effect) {
    return {
      initial: setStyleNumber('opacity', numberOption(effect.options, 'fromOpacity', 0)),
      target: preserveStyleState,
    };
  },
};

const overlayRevealContentEffectStyleStateResolvers: Record<string, EffectStyleStateResolver> = {
  fade: preserveEffectStyleState,
  lineReveal(effect) {
    return {
      initial: mapStyleNumber(
        'translateY',
        (translateY) => translateY + numberOption(effect.options, 'y', 16),
      ),
      target: preserveStyleState,
    };
  },
  pulse: preserveEffectStyleState,
  rise: preserveEffectStyleState,
  scale: preserveEffectStyleState,
  shake: preserveEffectStyleState,
  slide: preserveEffectStyleState,
};

function numberOption(
  options: TextMotionEffectDescriptorOptions | undefined,
  key: string,
  fallback: number,
): number {
  const value = options?.[key];

  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new Error(
    `@react-native-motion-kit/text-motion effect option "${key}" must be a finite number.`,
  );
}

function validateDelaySeconds(delay: number): number {
  if (Number.isFinite(delay) && delay >= 0) {
    return delay;
  }

  throw new Error(
    '@react-native-motion-kit/text-motion timeline delay must be a finite number greater than or equal to 0.',
  );
}

function createDelayMs(delaySeconds: number): number {
  const delayMs = Math.round(delaySeconds * 1000);

  if (Number.isSafeInteger(delayMs)) {
    return delayMs;
  }

  throw new Error(
    '@react-native-motion-kit/text-motion timeline delay must convert to a safe integer millisecond value.',
  );
}

function createDefaultStyleStatePair(): TextMotionStyleTransformStatePair {
  return {
    initial: { ...DEFAULT_STYLE_STATE },
    pulseScale: 1,
    target: { ...DEFAULT_STYLE_STATE },
  };
}

function mapStyleNumber(
  key: TextMotionStyleNumberKey,
  mapValue: (value: number) => number,
): TextMotionStyleStateTransform {
  return (state) => {
    const nextState: TextMotionStyleTransformState = {
      ...state,
    };

    nextState[key] = mapValue(state[key]);

    return nextState;
  };
}

function setStyleNumber(
  key: TextMotionStyleNumberKey,
  value: number,
): TextMotionStyleStateTransform {
  return mapStyleNumber(key, () => value);
}

function composeStyleTransforms(
  ...transforms: readonly TextMotionStyleStateTransform[]
): TextMotionStyleStateTransform {
  return (state) => transforms.reduce((current, transform) => transform(current), state);
}

function preserveEffectStyleState(): EffectStyleStateChange {
  return {};
}

function resolveEffectStyleStateChange(
  effect: TextMotionAnyEffectDescriptor,
  unsupportedEffectSubject: string,
  resolvers: Record<string, EffectStyleStateResolver> = effectStyleStateResolvers,
): EffectStyleStateChange {
  const resolver = resolvers[effect.name];

  if (resolver) {
    return resolver(effect);
  }

  throw new Error(
    `${unsupportedEffectSubject} does not implement the "${effect.name}" effect. Use a built-in style-transform effect or a renderer that handles this effect.`,
  );
}

function applyResolvedEffectStyleStateChange(
  styleState: TextMotionStyleTransformStatePair,
  effectStyleStateChange: EffectStyleStateChange,
): TextMotionStyleTransformStatePair {
  const initial = effectStyleStateChange.initial ?? preserveStyleState;
  const pulseScale = effectStyleStateChange.pulseScale ?? preserveNumber;
  const target = effectStyleStateChange.target ?? preserveStyleState;

  return {
    initial: initial(styleState.initial),
    pulseScale: pulseScale(styleState.pulseScale),
    target: target(styleState.target),
  };
}

function applyDelay(animation: number, delayMs: number, reduceMotion: ReduceMotion): number {
  return delayMs > 0 ? withDelay(delayMs, animation, reduceMotion) : animation;
}

export function createTextMotionStyleTransformStatePair(
  effects: readonly TextMotionAnyEffect[],
  unsupportedEffectSubject = 'style-transform renderer',
): TextMotionStyleTransformStatePair {
  return createResolvedTextMotionStyleTransformStatePair(
    effects,
    unsupportedEffectSubject,
    effectStyleStateResolvers,
  );
}

function createResolvedTextMotionStyleTransformStatePair(
  effects: readonly TextMotionAnyEffect[],
  unsupportedEffectSubject: string,
  resolvers: Record<string, EffectStyleStateResolver>,
): TextMotionStyleTransformStatePair {
  return flattenTextMotionEffectDescriptors(effects).reduce<TextMotionStyleTransformStatePair>(
    (styleState, effect) =>
      applyResolvedEffectStyleStateChange(
        styleState,
        resolveEffectStyleStateChange(effect, unsupportedEffectSubject, resolvers),
      ),
    createDefaultStyleStatePair(),
  );
}

export function createOverlayTextStyleTransformStatePair(
  effects: readonly TextMotionAnyEffect[],
): TextMotionOverlayStyleTransformStatePair {
  return {
    frame: createResolvedTextMotionStyleTransformStatePair(
      effects,
      'overlayText()',
      overlayFrameEffectStyleStateResolvers,
    ),
    revealContent: createResolvedTextMotionStyleTransformStatePair(
      effects,
      'overlayText()',
      overlayRevealContentEffectStyleStateResolvers,
    ),
  };
}

export function createTextMotionDelaySecondsByItemIndex(
  recipe: TextMotionInternalRecipeConfig,
  count: number,
): readonly number[] {
  const timeline = recipe.timeline ? readTextMotionTimelineDescriptor(recipe.timeline) : undefined;

  return Array.from({ length: count }, (_, index) =>
    validateDelaySeconds(timeline?.delayFor(index, count) ?? 0),
  );
}

export function createTextMotionItemMotion(
  recipe: TextMotionInternalRecipeConfig,
  styleState: TextMotionStyleTransformStatePair,
  delaySeconds: number,
): TextMotionItemMotion {
  return {
    delayMs: createDelayMs(delaySeconds),
    initial: styleState.initial,
    motion: recipe.motion,
    pulseScale: styleState.pulseScale,
    reducedMotion: recipe.accessibility?.reducedMotion ?? 'system',
    target: styleState.target,
  };
}

export function createTextMotionControlledProgressPlan(
  itemIndex: number,
  delaySecondsByItemIndex: readonly number[],
  totalTimelineSpan: number,
): TextMotionControlledProgressPlan {
  return {
    itemDelaySeconds: delaySecondsByItemIndex[itemIndex] ?? 0,
    totalTimelineSpan,
  };
}

export function clampTextMotionProgress(progress: number): number {
  'worklet';

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

export function createTextMotionControlledTimelineSpan(
  delaySecondsByItemIndex: readonly number[],
): number {
  const maxDelaySeconds = delaySecondsByItemIndex.reduce(
    (maxDelay, delaySeconds) => Math.max(maxDelay, delaySeconds),
    0,
  );

  return maxDelaySeconds + TEXT_MOTION_CONTROLLED_ITEM_TIMELINE_SPAN;
}

export function mapTextMotionControlledProgressToItemProgress({
  progress,
  itemDelaySeconds,
  totalTimelineSpan,
}: TextMotionControlledProgressInput): number {
  'worklet';

  const virtualTime = clampTextMotionProgress(progress) * totalTimelineSpan;
  const itemProgress = (virtualTime - itemDelaySeconds) / TEXT_MOTION_CONTROLLED_ITEM_TIMELINE_SPAN;

  return clampTextMotionProgress(itemProgress);
}

export function resolveTextMotionReduceMotionConfig(
  reducedMotion: TextMotionItemMotion['reducedMotion'],
) {
  return REDUCE_MOTION_CONFIG_BY_POLICY[reducedMotion];
}

export function shouldRenderTextMotionFinalState(
  reducedMotionEnabled: boolean,
  reducedMotion: TextMotionItemMotion['reducedMotion'],
): boolean {
  return reducedMotionEnabled && reducedMotion !== 'system';
}

export function createTextMotionProgressAnimation({
  delayMs,
  motion,
  reducedMotion,
}: Pick<TextMotionItemMotion, 'delayMs' | 'motion' | 'reducedMotion'>): number {
  const reduceMotion = resolveTextMotionReduceMotionConfig(reducedMotion);

  if (motion?.kind === 'spring') {
    const animation = withSpring(1, {
      ...motion.options,
      reduceMotion,
    });

    return applyDelay(animation, delayMs, reduceMotion);
  }

  const timingOptions = motion?.kind === 'timing' ? motion.options : undefined;
  const animation = withTiming(1, {
    duration: 300,
    ...timingOptions,
    reduceMotion,
  });

  return applyDelay(animation, delayMs, reduceMotion);
}

export function readTextMotionProgressForAnimatedStyle({
  controlledProgressPlan,
  progress,
  renderFinalState,
}: {
  controlledProgressPlan?: TextMotionControlledProgressPlan;
  progress: SharedValue<number>;
  renderFinalState: boolean;
}): number {
  'worklet';

  const rawProgress = renderFinalState ? 1 : progress.value;

  if (!controlledProgressPlan) {
    return Number.isFinite(rawProgress) ? rawProgress : 0;
  }

  return mapTextMotionControlledProgressToItemProgress({
    progress: rawProgress,
    itemDelaySeconds: controlledProgressPlan.itemDelaySeconds,
    totalTimelineSpan: controlledProgressPlan.totalTimelineSpan,
  });
}
