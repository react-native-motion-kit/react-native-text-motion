import { useLayoutEffect, useRef, type ComponentType, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  createAnimatedComponent,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { TextMotionControls } from '../controls';
import type {
  TextMotionAnyEffect,
  TextMotionAnyEffectDescriptor,
  TextMotionComponentTextProps,
  TextMotionEffectDescriptorOptions,
  TextMotionInternalRecipeConfig,
} from '../types/recipe';
import type { TextMotionRenderer, TextMotionRendererProps } from '../types/renderer';
import type { TextMotionToken } from '../types/token';

import {
  createHiddenTokenAccessibilityProps,
  createParentAccessibilityProps,
  parentLabelPolicy,
  resolveAccessibleText,
} from '../accessibility';
import {
  flattenTextMotionEffectDescriptors,
  createTextMotionRendererHandle,
  readTextMotionTimelineDescriptor,
} from '../recipe/descriptors';
import { useNativeTextControlsPlayback } from './nativeTextControls';
import {
  areNativeTextPlaybackRunsEqual,
  createNativeTextPlaybackRun,
  type NativeTextPlaybackRun,
  type NativeTextStyleState,
  type NativeTextTokenMotion,
} from './nativeTextPlayback';
import {
  clampNativeTextProgress,
  createNativeTextControlledTimelineSpan,
  mapNativeTextControlledProgressToTokenProgress,
  type NativeTextControlledProgressPlan,
} from './nativeTextProgress';

type AnimatedTextProps = TextProps & {
  children?: ReactNode;
};

type NativeTextStyleStatePair = {
  initial: NativeTextStyleState;
  pulseScale: number;
  target: NativeTextStyleState;
};

type NativeTextNumberTransform = (value: number) => number;
type NativeTextStyleStateTransform = (state: NativeTextStyleState) => NativeTextStyleState;

type EffectStyleStateChange = {
  initial?: NativeTextStyleStateTransform;
  pulseScale?: NativeTextNumberTransform;
  target?: NativeTextStyleStateTransform;
};

type EffectStyleStateResolver = (effect: TextMotionAnyEffectDescriptor) => EffectStyleStateChange;

type NativeTextStyleNumberKey = keyof NativeTextStyleState;

type NativeTextProgressAnimationConfig = Pick<
  NativeTextTokenMotion,
  'delayMs' | 'motion' | 'reducedMotion'
>;

type StaticNativeTextTokenProps = AnimatedTextProps & {
  tokenMotion?: undefined;
};

type ControlledNativeTextTokenProps = AnimatedTextProps & {
  controlledProgress: SharedValue<number>;
  controlledProgressPlan: NativeTextControlledProgressPlan;
  tokenMotion: NativeTextTokenMotion;
};

type UncontrolledNativeTextTokenProps = AnimatedTextProps & {
  controls?: TextMotionControls;
  playbackText: string;
  tokenMotion: NativeTextTokenMotion;
};

type NativeTextTokenProps =
  | StaticNativeTextTokenProps
  | ControlledNativeTextTokenProps
  | UncontrolledNativeTextTokenProps;

type NativeTextAnimatedStyleOptions =
  | {
      controlled: true;
      controlledProgressPlan: NativeTextControlledProgressPlan;
      progress: SharedValue<number>;
      renderFinalState: boolean;
      tokenMotion: NativeTextTokenMotion;
    }
  | {
      controlled: false;
      progress: SharedValue<number>;
      renderFinalState: boolean;
      tokenMotion: NativeTextTokenMotion;
    };

type ControlledAnimatedNativeTextTokenProps = AnimatedTextProps & {
  controlledProgress: SharedValue<number>;
  controlledProgressPlan: NativeTextControlledProgressPlan;
  tokenMotion: NativeTextTokenMotion;
};

type UncontrolledAnimatedNativeTextTokenProps = AnimatedTextProps & {
  controls?: TextMotionControls;
  playbackText: string;
  tokenMotion: NativeTextTokenMotion;
};

type NativeTextAnimatedTokenContainerProps = Pick<
  AnimatedTextProps,
  'accessibilityElementsHidden' | 'accessible' | 'importantForAccessibility' | 'testID'
>;

type NativeTextContainerProps = Pick<
  TextMotionComponentTextProps,
  | 'accessibilityActions'
  | 'accessibilityHint'
  | 'accessibilityLanguage'
  | 'accessibilityRole'
  | 'accessibilityState'
  | 'accessibilityValue'
  | 'nativeID'
  | 'onAccessibilityAction'
  | 'testID'
> &
  ReturnType<typeof createParentAccessibilityProps>;

type NativeTextRendererProps = Omit<TextMotionRendererProps, 'recipe'> & {
  recipe: TextMotionInternalRecipeConfig;
};

type NativeTextTokenTextProps = Pick<
  TextMotionComponentTextProps,
  'allowFontScaling' | 'maxFontSizeMultiplier'
>;

type NativeTextTextRenderFragment = {
  kind: 'text';
  key: string;
  renderIndex: number;
  text: string;
  textFragmentIndex: number;
  token: TextMotionToken;
};

type NativeTextLineBreakRenderFragment = {
  kind: 'line-break';
  key: string;
  preservesLineHeight: boolean;
  renderIndex: number;
};

type NativeTextRenderFragment = NativeTextTextRenderFragment | NativeTextLineBreakRenderFragment;

type NativeTextTextRenderFragmentDraft = Omit<NativeTextTextRenderFragment, 'renderIndex'>;
type NativeTextLineBreakRenderFragmentDraft = Omit<
  NativeTextLineBreakRenderFragment,
  'renderIndex'
>;
type NativeTextRenderFragmentDraft =
  | NativeTextTextRenderFragmentDraft
  | NativeTextLineBreakRenderFragmentDraft;

export type NativeTextRendererOptions = {
  /** Prefix used for generated token `testID` values. */
  testIDPrefix?: string;
};

const AnimatedView = createAnimatedComponent(View);

const TEXT_ALIGN_TO_JUSTIFY_CONTENT = {
  auto: 'flex-start',
  center: 'center',
  justify: 'flex-start',
  left: 'flex-start',
  right: 'flex-end',
} as const satisfies Record<NonNullable<TextStyle['textAlign']>, ViewStyle['justifyContent']>;

const DEFAULT_STYLE_STATE: NativeTextStyleState = {
  opacity: 1,
  scale: 1,
  translateX: 0,
  translateY: 0,
};

const NATIVE_TEXT_LINE_BREAK_PATTERN = /\r\n|\n/g;
const NATIVE_TEXT_LINE_BREAK_MARKER_STYLE = {
  flexBasis: '100%',
  height: 0,
  width: '100%',
} as const satisfies ViewStyle;
const NATIVE_TEXT_BLANK_LINE_SPACER_STYLE = {
  flexBasis: '100%',
  opacity: 0,
  width: '100%',
} as const satisfies TextStyle;
const NATIVE_TEXT_BLANK_LINE_SPACER_TEXT = ' ';
const NATIVE_TEXT_ANIMATED_TOKEN_CONTAINER_STYLE = {
  overflow: 'visible',
} as const satisfies ViewStyle;

const preserveStyleState: NativeTextStyleStateTransform = (state) => state;
const preserveNumber: NativeTextNumberTransform = (value) => value;

const REDUCE_MOTION_CONFIG_BY_POLICY = {
  'final-state': ReduceMotion.Never,
  system: ReduceMotion.System,
} as const satisfies Record<NativeTextTokenMotion['reducedMotion'], ReduceMotion>;

const effectStyleStateResolvers: Record<string, EffectStyleStateResolver> = {
  fade(effect) {
    return {
      initial: setStyleNumber('opacity', numberOption(effect.options, 'from', 0)),
      target: setStyleNumber('opacity', numberOption(effect.options, 'to', 1)),
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

function createDefaultStyleStatePair(): NativeTextStyleStatePair {
  return {
    initial: { ...DEFAULT_STYLE_STATE },
    pulseScale: 1,
    target: { ...DEFAULT_STYLE_STATE },
  };
}

function mapStyleNumber(
  key: NativeTextStyleNumberKey,
  mapValue: (value: number) => number,
): NativeTextStyleStateTransform {
  return (state) => {
    const nextState: NativeTextStyleState = {
      ...state,
    };

    nextState[key] = mapValue(state[key]);

    return nextState;
  };
}

function setStyleNumber(
  key: NativeTextStyleNumberKey,
  value: number,
): NativeTextStyleStateTransform {
  return mapStyleNumber(key, () => value);
}

function composeStyleTransforms(
  ...transforms: readonly NativeTextStyleStateTransform[]
): NativeTextStyleStateTransform {
  return (state) => transforms.reduce((current, transform) => transform(current), state);
}

function resolveEffectStyleStateChange(
  effect: TextMotionAnyEffectDescriptor,
): EffectStyleStateChange {
  const resolver = effectStyleStateResolvers[effect.name];

  if (resolver) {
    return resolver(effect);
  }

  throw new Error(
    `nativeText() does not implement the "${effect.name}" effect. Use a built-in nativeText effect or a renderer that handles this effect.`,
  );
}

function applyEffectStyleStateChange(
  styleState: NativeTextStyleStatePair,
  effect: TextMotionAnyEffectDescriptor,
): NativeTextStyleStatePair {
  const styleStateChange = resolveEffectStyleStateChange(effect);
  const initial = styleStateChange.initial ?? preserveStyleState;
  const pulseScale = styleStateChange.pulseScale ?? preserveNumber;
  const target = styleStateChange.target ?? preserveStyleState;

  return {
    initial: initial(styleState.initial),
    pulseScale: pulseScale(styleState.pulseScale),
    target: target(styleState.target),
  };
}

function createNativeTextStyleStatePair(
  effects: readonly TextMotionAnyEffect[],
): NativeTextStyleStatePair {
  return flattenTextMotionEffectDescriptors(effects).reduce<NativeTextStyleStatePair>(
    applyEffectStyleStateChange,
    createDefaultStyleStatePair(),
  );
}

function createNativeTextTokenMotion(
  recipe: NativeTextRendererProps['recipe'],
  styleState: NativeTextStyleStatePair,
  delaySeconds: number,
): NativeTextTokenMotion {
  return {
    delayMs: createDelayMs(delaySeconds),
    initial: styleState.initial,
    motion: recipe.motion,
    pulseScale: styleState.pulseScale,
    reducedMotion: recipe.accessibility?.reducedMotion ?? 'system',
    target: styleState.target,
  };
}

function shouldAnimateToken(token: TextMotionToken): boolean {
  return token.text.trim().length > 0;
}

function createMotionIndexByTokenId(tokens: readonly TextMotionToken[]) {
  const motionTokens = tokens.filter(shouldAnimateToken);
  const motionIndexByTokenId = new Map(
    motionTokens.map<[string, number]>((token, motionIndex) => [token.id, motionIndex]),
  );

  return {
    motionCount: motionTokens.length,
    motionIndexByTokenId,
  };
}

function createTokenDelaySecondsByMotionIndex(
  recipe: NativeTextRendererProps['recipe'],
  count: number,
): readonly number[] {
  const timeline = recipe.timeline ? readTextMotionTimelineDescriptor(recipe.timeline) : undefined;

  return Array.from({ length: count }, (_, index) =>
    validateDelaySeconds(timeline?.delayFor(index, count) ?? 0),
  );
}

function createTokenMotion(
  recipe: NativeTextRendererProps['recipe'],
  motionIndex: number,
  styleState: NativeTextStyleStatePair,
  delaySecondsByMotionIndex: readonly number[],
): NativeTextTokenMotion {
  return createNativeTextTokenMotion(
    recipe,
    styleState,
    delaySecondsByMotionIndex[motionIndex] ?? 0,
  );
}

function createControlledProgressPlan(
  motionIndex: number,
  delaySecondsByMotionIndex: readonly number[],
  totalTimelineSpan: number,
): NativeTextControlledProgressPlan {
  return {
    tokenDelaySeconds: delaySecondsByMotionIndex[motionIndex] ?? 0,
    totalTimelineSpan,
  };
}

function resolveReduceMotionConfig(reducedMotion: NativeTextTokenMotion['reducedMotion']) {
  return REDUCE_MOTION_CONFIG_BY_POLICY[reducedMotion];
}

function shouldRenderFinalState(
  reducedMotionEnabled: boolean,
  reducedMotion: NativeTextTokenMotion['reducedMotion'],
): boolean {
  return reducedMotionEnabled && reducedMotion !== 'system';
}

function createNativeTextTextFragment(
  token: TextMotionToken,
  text: string,
  textFragmentIndex: number,
): NativeTextTextRenderFragmentDraft {
  return {
    kind: 'text',
    key: textFragmentIndex === 0 ? token.id : `${token.id}:text:${textFragmentIndex}`,
    text,
    textFragmentIndex,
    token,
  };
}

function createNativeTextLineBreakFragment(
  token: TextMotionToken,
  lineBreakIndex: number,
  preservesLineHeight: boolean,
): NativeTextLineBreakRenderFragmentDraft {
  return {
    kind: 'line-break',
    key: `${token.id}:line-break:${lineBreakIndex}`,
    preservesLineHeight,
  };
}

function hasNativeTextLineContent(text: string): boolean {
  return text.replace(NATIVE_TEXT_LINE_BREAK_PATTERN, '').length > 0;
}

function hasNativeTextLineContentAfter(sourceText: string, sourceIndex: number): boolean {
  return hasNativeTextLineContent(sourceText.slice(sourceIndex));
}

function createNativeTextTokenRenderFragments(
  token: TextMotionToken,
  sourceText: string,
  currentLineHasText: boolean,
): {
  currentLineHasText: boolean;
  fragments: readonly NativeTextRenderFragmentDraft[];
} {
  if (!token.text.includes('\n')) {
    return {
      currentLineHasText: currentLineHasText || token.text.length > 0,
      fragments: [createNativeTextTextFragment(token, token.text, 0)],
    };
  }

  const lineBreaks = Array.from(token.text.matchAll(NATIVE_TEXT_LINE_BREAK_PATTERN));

  const initialAccumulator = {
    cursor: 0,
    currentLineHasText,
    fragments: [] as NativeTextRenderFragmentDraft[],
    textFragmentIndex: 0,
  };
  const result = lineBreaks.reduce((accumulator, lineBreak, lineBreakIndex) => {
    const start = lineBreak.index ?? accumulator.cursor;
    const lineBreakEnd = start + lineBreak[0].length;
    const textBeforeLineBreak = token.text.slice(accumulator.cursor, start);
    const textFragment =
      textBeforeLineBreak.length > 0
        ? [createNativeTextTextFragment(token, textBeforeLineBreak, accumulator.textFragmentIndex)]
        : [];
    const lineHasText = accumulator.currentLineHasText || textBeforeLineBreak.length > 0;
    const hasTextAfterLineBreak = hasNativeTextLineContentAfter(
      sourceText,
      token.sourceRange.start + lineBreakEnd,
    );

    return {
      cursor: lineBreakEnd,
      currentLineHasText: false,
      fragments: [
        ...accumulator.fragments,
        ...textFragment,
        createNativeTextLineBreakFragment(
          token,
          lineBreakIndex,
          !lineHasText || !hasTextAfterLineBreak,
        ),
      ],
      textFragmentIndex: accumulator.textFragmentIndex + textFragment.length,
    };
  }, initialAccumulator);
  const trailingText = token.text.slice(result.cursor);

  if (trailingText.length === 0) {
    return {
      currentLineHasText: result.currentLineHasText,
      fragments: result.fragments,
    };
  }

  return {
    currentLineHasText: true,
    fragments: [
      ...result.fragments,
      createNativeTextTextFragment(token, trailingText, result.textFragmentIndex),
    ],
  };
}

function createNativeTextRenderFragments(
  tokens: readonly TextMotionToken[],
  sourceText: string,
): readonly NativeTextRenderFragment[] {
  const result = tokens.reduce(
    (accumulator, token) => {
      const tokenResult = createNativeTextTokenRenderFragments(
        token,
        sourceText,
        accumulator.currentLineHasText,
      );

      return {
        currentLineHasText: tokenResult.currentLineHasText,
        fragments: [...accumulator.fragments, ...tokenResult.fragments],
      };
    },
    {
      currentLineHasText: false,
      fragments: [] as NativeTextRenderFragmentDraft[],
    },
  );

  return result.fragments.map((fragment, renderIndex) => ({
    ...fragment,
    renderIndex,
  }));
}

function createNativeTextFragmentTestID(
  prefix: string | undefined,
  fragment: NativeTextTextRenderFragment,
): string | undefined {
  if (!prefix) {
    return undefined;
  }

  if (fragment.textFragmentIndex === 0) {
    return `${prefix}-${fragment.token.index}`;
  }

  return `${prefix}-${fragment.token.index}-${fragment.textFragmentIndex}`;
}

function createNativeTextLineBreakTestID(
  prefix: string | undefined,
  fragment: NativeTextLineBreakRenderFragment,
): string | undefined {
  return prefix ? `${prefix}-line-break-${fragment.renderIndex}` : undefined;
}

function applyTokenDelay(animation: number, delayMs: number, reduceMotion: ReduceMotion): number {
  return delayMs > 0 ? withDelay(delayMs, animation, reduceMotion) : animation;
}

function createProgressAnimation({
  delayMs,
  motion,
  reducedMotion,
}: NativeTextProgressAnimationConfig): number {
  const reduceMotion = resolveReduceMotionConfig(reducedMotion);

  if (motion?.kind === 'spring') {
    const animation = withSpring(1, {
      ...motion.options,
      reduceMotion,
    });

    return applyTokenDelay(animation, delayMs, reduceMotion);
  }

  const timingOptions = motion?.kind === 'timing' ? motion.options : undefined;
  const animation = withTiming(1, {
    duration: 300,
    ...timingOptions,
    reduceMotion,
  });

  return applyTokenDelay(animation, delayMs, reduceMotion);
}

function StaticNativeTextToken({ children, style, ...tokenProps }: AnimatedTextProps) {
  return (
    <Text {...tokenProps} style={style}>
      {children}
    </Text>
  );
}

function splitAnimatedTokenProps({
  accessibilityElementsHidden,
  accessible,
  importantForAccessibility,
  testID,
  ...textProps
}: AnimatedTextProps) {
  return {
    containerProps: {
      accessibilityElementsHidden,
      accessible,
      importantForAccessibility,
      testID,
    } satisfies NativeTextAnimatedTokenContainerProps,
    textProps,
  };
}

function AnimatedNativeTextTokenContent({ children, style, ...tokenProps }: AnimatedTextProps) {
  return (
    <Text {...tokenProps} style={style}>
      {children}
    </Text>
  );
}

function useNativeTextAnimatedStyle(options: NativeTextAnimatedStyleOptions) {
  const { controlled, progress, renderFinalState, tokenMotion } = options;
  const initialOpacity = tokenMotion.initial.opacity;
  const initialScale = tokenMotion.initial.scale;
  const initialTranslateX = tokenMotion.initial.translateX;
  const initialTranslateY = tokenMotion.initial.translateY;
  const targetOpacity = tokenMotion.target.opacity;
  const targetScale = tokenMotion.target.scale;
  const targetTranslateX = tokenMotion.target.translateX;
  const targetTranslateY = tokenMotion.target.translateY;
  const pulseScale = tokenMotion.pulseScale;
  const tokenDelaySeconds = controlled ? options.controlledProgressPlan.tokenDelaySeconds : 0;
  const totalTimelineSpan = controlled ? options.controlledProgressPlan.totalTimelineSpan : 1;

  return useAnimatedStyle(() => {
    const rawProgress = renderFinalState ? 1 : progress.value;
    const uncontrolledProgress = Number.isFinite(rawProgress) ? rawProgress : 0;
    const current = controlled
      ? mapNativeTextControlledProgressToTokenProgress({
          progress: rawProgress,
          tokenDelaySeconds,
          totalTimelineSpan,
        })
      : uncontrolledProgress;
    const clampedCurrent = clampNativeTextProgress(current);
    const baseScale = initialScale + (targetScale - initialScale) * current;
    const pulseProgress = 1 - Math.abs(clampedCurrent * 2 - 1);
    const pulseMultiplier = 1 + (pulseScale - 1) * pulseProgress;

    return {
      opacity: initialOpacity + (targetOpacity - initialOpacity) * current,
      transform: [
        {
          translateX: initialTranslateX + (targetTranslateX - initialTranslateX) * current,
        },
        {
          translateY: initialTranslateY + (targetTranslateY - initialTranslateY) * current,
        },
        {
          scale: baseScale * pulseMultiplier,
        },
      ],
    };
  }, [
    initialOpacity,
    initialScale,
    initialTranslateX,
    initialTranslateY,
    controlled,
    progress,
    pulseScale,
    renderFinalState,
    targetOpacity,
    targetScale,
    targetTranslateX,
    targetTranslateY,
    tokenDelaySeconds,
    totalTimelineSpan,
  ]);
}

function ControlledAnimatedNativeTextToken({
  children,
  controlledProgress,
  controlledProgressPlan,
  style,
  tokenMotion,
  ...tokenProps
}: ControlledAnimatedNativeTextTokenProps) {
  const reducedMotion = tokenMotion.reducedMotion;
  const reducedMotionEnabled = useReducedMotion();
  const renderFinalState = shouldRenderFinalState(reducedMotionEnabled, reducedMotion);
  const { containerProps, textProps } = splitAnimatedTokenProps(tokenProps);
  const animatedStyle = useNativeTextAnimatedStyle({
    controlled: true,
    controlledProgressPlan,
    progress: controlledProgress,
    renderFinalState,
    tokenMotion,
  });

  return (
    <AnimatedView
      {...containerProps}
      style={[NATIVE_TEXT_ANIMATED_TOKEN_CONTAINER_STYLE, animatedStyle] as StyleProp<ViewStyle>}
    >
      <AnimatedNativeTextTokenContent {...textProps} style={style}>
        {children}
      </AnimatedNativeTextTokenContent>
    </AnimatedView>
  );
}

function UncontrolledAnimatedNativeTextToken({
  children,
  controls,
  playbackText,
  style,
  tokenMotion,
  ...tokenProps
}: UncontrolledAnimatedNativeTextTokenProps) {
  const reducedMotion = tokenMotion.reducedMotion;
  const reducedMotionEnabled = useReducedMotion();
  const renderFinalState = shouldRenderFinalState(reducedMotionEnabled, reducedMotion);
  const progress = useSharedValue(renderFinalState ? 1 : 0);
  const playbackRun = createNativeTextPlaybackRun(tokenMotion, renderFinalState, playbackText);
  const previousPlaybackRun = useRef<NativeTextPlaybackRun | undefined>(undefined);
  const { containerProps, textProps } = splitAnimatedTokenProps(tokenProps);
  const animatedStyle = useNativeTextAnimatedStyle({
    controlled: false,
    progress,
    renderFinalState,
    tokenMotion,
  });

  useLayoutEffect(() => {
    if (areNativeTextPlaybackRunsEqual(previousPlaybackRun.current, playbackRun)) {
      return;
    }

    previousPlaybackRun.current = playbackRun;

    if (playbackRun.renderFinalState) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = createProgressAnimation(playbackRun);
  });

  useNativeTextControlsPlayback({
    controls,
    createProgressAnimation,
    progress,
    renderFinalState,
    tokenMotion,
  });

  return (
    <AnimatedView
      {...containerProps}
      style={[NATIVE_TEXT_ANIMATED_TOKEN_CONTAINER_STYLE, animatedStyle] as StyleProp<ViewStyle>}
    >
      <AnimatedNativeTextTokenContent {...textProps} style={style}>
        {children}
      </AnimatedNativeTextTokenContent>
    </AnimatedView>
  );
}

function NativeTextToken(props: NativeTextTokenProps) {
  if (!props.tokenMotion) {
    const { tokenMotion: _tokenMotion, ...tokenProps } = props;

    return <StaticNativeTextToken {...tokenProps} />;
  }

  if ('controlledProgress' in props) {
    const { controlledProgress, controlledProgressPlan, tokenMotion, ...tokenProps } = props;

    return (
      <ControlledAnimatedNativeTextToken
        {...tokenProps}
        controlledProgress={controlledProgress}
        controlledProgressPlan={controlledProgressPlan}
        tokenMotion={tokenMotion}
      />
    );
  }

  const { controls, playbackText, tokenMotion, ...tokenProps } = props;

  return (
    <UncontrolledAnimatedNativeTextToken
      {...tokenProps}
      controls={controls}
      playbackText={playbackText}
      tokenMotion={tokenMotion}
    />
  );
}

function NativeTextLineBreak({
  preservesLineHeight,
  testID,
  textStyle,
  tokenTextProps,
}: {
  preservesLineHeight: boolean;
  testID?: string;
  textStyle: StyleProp<TextStyle>;
  tokenTextProps: NativeTextTokenTextProps;
}) {
  if (preservesLineHeight) {
    return (
      <Text
        {...tokenTextProps}
        accessibilityElementsHidden
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[textStyle, NATIVE_TEXT_BLANK_LINE_SPACER_STYLE]}
        testID={testID}
      >
        {NATIVE_TEXT_BLANK_LINE_SPACER_TEXT}
      </Text>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={NATIVE_TEXT_LINE_BREAK_MARKER_STYLE}
      testID={testID}
    />
  );
}

function resolveJustifyContent(style: StyleProp<TextStyle>): ViewStyle['justifyContent'] {
  const textAlign = StyleSheet.flatten(style)?.textAlign;

  return textAlign ? TEXT_ALIGN_TO_JUSTIFY_CONTENT[textAlign] : 'flex-start';
}

function createContainerStyle(style: StyleProp<TextStyle>): StyleProp<ViewStyle> {
  return {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: resolveJustifyContent(style),
  };
}

function createContainerProps(
  textProps: TextMotionComponentTextProps | undefined,
  parentAccessibilityProps: ReturnType<typeof createParentAccessibilityProps>,
): NativeTextContainerProps {
  return {
    accessibilityActions: textProps?.accessibilityActions,
    accessibilityHint: textProps?.accessibilityHint,
    accessibilityLabel:
      textProps?.accessibilityLabel ?? parentAccessibilityProps.accessibilityLabel,
    accessibilityLanguage: textProps?.accessibilityLanguage,
    accessibilityRole: textProps?.accessibilityRole,
    accessibilityState: textProps?.accessibilityState,
    accessibilityValue: textProps?.accessibilityValue,
    accessible: parentAccessibilityProps.accessible,
    nativeID: textProps?.nativeID,
    onAccessibilityAction: textProps?.onAccessibilityAction,
    testID: textProps?.testID,
  };
}

function createTokenTextProps(
  textProps: TextMotionComponentTextProps | undefined,
): NativeTextTokenTextProps {
  return {
    allowFontScaling: textProps?.allowFontScaling,
    maxFontSizeMultiplier: textProps?.maxFontSizeMultiplier,
  };
}

function createNativeTextRendererComponent(
  options: NativeTextRendererOptions,
): ComponentType<NativeTextRendererProps> {
  function NativeTextRenderer({ children, recipe, textProps, tokens }: NativeTextRendererProps) {
    const text = typeof children === 'string' ? children : '';
    const textStyle = textProps?.style;
    const policy = recipe.accessibility ?? parentLabelPolicy();
    const accessibilityLabel = resolveAccessibleText(text, tokens);
    const parentAccessibilityProps = createParentAccessibilityProps(policy, accessibilityLabel);
    const tokenAccessibilityProps = createHiddenTokenAccessibilityProps(policy);
    const containerProps = createContainerProps(textProps, parentAccessibilityProps);
    const tokenTextProps = createTokenTextProps(textProps);
    const styleState = createNativeTextStyleStatePair(recipe.effects);
    const { motionCount, motionIndexByTokenId } = createMotionIndexByTokenId(tokens);
    const delaySecondsByMotionIndex = createTokenDelaySecondsByMotionIndex(recipe, motionCount);
    const totalTimelineSpan = createNativeTextControlledTimelineSpan(delaySecondsByMotionIndex);
    const externalProgress = textProps?.progress;
    const controls = textProps?.controls;
    const fragments = createNativeTextRenderFragments(tokens, text);

    if (externalProgress && controls) {
      throw new Error(
        '@react-native-motion-kit/text-motion cannot receive both progress and controls. Use progress for raw app-owned values, or controls for event-driven playback.',
      );
    }

    return (
      <View {...containerProps} style={createContainerStyle(textStyle)}>
        {fragments.map((fragment) => {
          if (fragment.kind === 'line-break') {
            return (
              <NativeTextLineBreak
                key={fragment.key}
                preservesLineHeight={fragment.preservesLineHeight}
                testID={createNativeTextLineBreakTestID(options.testIDPrefix, fragment)}
                textStyle={textStyle}
                tokenTextProps={tokenTextProps}
              />
            );
          }

          const token = fragment.token;
          const motionIndex = motionIndexByTokenId.get(token.id);
          const commonTokenProps = {
            ...tokenAccessibilityProps,
            ...tokenTextProps,
            style: textStyle,
            testID: createNativeTextFragmentTestID(options.testIDPrefix, fragment),
          };

          if (typeof motionIndex !== 'number') {
            return (
              <NativeTextToken {...commonTokenProps} key={fragment.key}>
                {fragment.text}
              </NativeTextToken>
            );
          }

          const tokenMotion = createTokenMotion(
            recipe,
            motionIndex,
            styleState,
            delaySecondsByMotionIndex,
          );

          if (!externalProgress) {
            return (
              <NativeTextToken
                {...commonTokenProps}
                controls={controls}
                key={fragment.key}
                playbackText={fragment.text}
                tokenMotion={tokenMotion}
              >
                {fragment.text}
              </NativeTextToken>
            );
          }

          return (
            <NativeTextToken
              {...commonTokenProps}
              controlledProgress={externalProgress}
              controlledProgressPlan={createControlledProgressPlan(
                motionIndex,
                delaySecondsByMotionIndex,
                totalTimelineSpan,
              )}
              key={fragment.key}
              tokenMotion={tokenMotion}
            >
              {fragment.text}
            </NativeTextToken>
          );
        })}
      </View>
    );
  }

  NativeTextRenderer.displayName = 'NativeTextRenderer';

  return NativeTextRenderer;
}

/** Render text as wrapping React Native Text tokens animated by Reanimated. */
export function nativeText(
  options: NativeTextRendererOptions = {},
): TextMotionRenderer<'native-text', NativeTextRendererProps['recipe']> {
  return createTextMotionRendererHandle({
    kind: 'nativeText',
    capabilities: ['native-text'],
    Component: createNativeTextRendererComponent(options),
  });
}
