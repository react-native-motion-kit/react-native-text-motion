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
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { TextMotionControls } from '../controls';
import type { TextMotionComponentTextProps, TextMotionInternalRecipeConfig } from '../types/recipe';
import type { TextMotionRendererProps, TextMotionSourceTokenRenderer } from '../types/renderer';
import type { TextMotionToken } from '../types/token';

import {
  createHiddenTokenAccessibilityProps,
  createParentAccessibilityProps,
  parentLabelPolicy,
  resolveAccessibleText,
} from '../accessibility';
import { createTextMotionRendererHandle } from '../recipe/descriptors';
import { useNativeTextControlsPlayback } from './nativeTextControls';
import {
  areNativeTextPlaybackRunsEqual,
  createNativeTextPlaybackRun,
  type NativeTextPlaybackRun,
} from './nativeTextPlayback';
import {
  clampTextMotionProgress,
  createTextMotionControlledProgressPlan,
  createTextMotionControlledTimelineSpan,
  createTextMotionDelaySecondsByItemIndex,
  createTextMotionItemMotion,
  createTextMotionProgressAnimation,
  createTextMotionStyleTransformStatePair,
  readTextMotionProgressForAnimatedStyle,
  shouldRenderTextMotionFinalState,
  type TextMotionControlledProgressPlan,
  type TextMotionItemMotion,
  type TextMotionStyleTransformStatePair,
} from './rendererMotion';

type AnimatedTextProps = TextProps & {
  children?: ReactNode;
};

type StaticNativeTextTokenProps = AnimatedTextProps & {
  tokenMotion?: undefined;
};

type ControlledNativeTextTokenProps = AnimatedTextProps & {
  controlledProgress: SharedValue<number>;
  controlledProgressPlan: TextMotionControlledProgressPlan;
  tokenMotion: TextMotionItemMotion;
};

type UncontrolledNativeTextTokenProps = AnimatedTextProps & {
  controls?: TextMotionControls;
  playbackText: string;
  tokenMotion: TextMotionItemMotion;
};

type NativeTextTokenProps =
  | StaticNativeTextTokenProps
  | ControlledNativeTextTokenProps
  | UncontrolledNativeTextTokenProps;

type NativeTextAnimatedStyleOptions =
  | {
      controlled: true;
      controlledProgressPlan: TextMotionControlledProgressPlan;
      progress: SharedValue<number>;
      renderFinalState: boolean;
      tokenMotion: TextMotionItemMotion;
    }
  | {
      controlled: false;
      progress: SharedValue<number>;
      renderFinalState: boolean;
      tokenMotion: TextMotionItemMotion;
    };

type ControlledAnimatedNativeTextTokenProps = AnimatedTextProps & {
  controlledProgress: SharedValue<number>;
  controlledProgressPlan: TextMotionControlledProgressPlan;
  tokenMotion: TextMotionItemMotion;
};

type UncontrolledAnimatedNativeTextTokenProps = AnimatedTextProps & {
  controls?: TextMotionControls;
  playbackText: string;
  tokenMotion: TextMotionItemMotion;
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
  return createTextMotionDelaySecondsByItemIndex(recipe, count);
}

function createTokenMotion(
  recipe: NativeTextRendererProps['recipe'],
  motionIndex: number,
  styleState: TextMotionStyleTransformStatePair,
  delaySecondsByMotionIndex: readonly number[],
): TextMotionItemMotion {
  return createTextMotionItemMotion(
    recipe,
    styleState,
    delaySecondsByMotionIndex[motionIndex] ?? 0,
  );
}

function createControlledProgressPlan(
  motionIndex: number,
  delaySecondsByMotionIndex: readonly number[],
  totalTimelineSpan: number,
): TextMotionControlledProgressPlan {
  return createTextMotionControlledProgressPlan(
    motionIndex,
    delaySecondsByMotionIndex,
    totalTimelineSpan,
  );
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
  const itemDelaySeconds = controlled ? options.controlledProgressPlan.itemDelaySeconds : 0;
  const totalTimelineSpan = controlled ? options.controlledProgressPlan.totalTimelineSpan : 1;

  return useAnimatedStyle(() => {
    const current = readTextMotionProgressForAnimatedStyle({
      controlledProgressPlan: controlled
        ? {
            itemDelaySeconds,
            totalTimelineSpan,
          }
        : undefined,
      progress,
      renderFinalState,
    });
    const clampedCurrent = clampTextMotionProgress(current);
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
    itemDelaySeconds,
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
  const renderFinalState = shouldRenderTextMotionFinalState(reducedMotionEnabled, reducedMotion);
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
  const renderFinalState = shouldRenderTextMotionFinalState(reducedMotionEnabled, reducedMotion);
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
    progress.value = createTextMotionProgressAnimation(playbackRun);
  });

  useNativeTextControlsPlayback({
    controls,
    createProgressAnimation: createTextMotionProgressAnimation,
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
    const styleState = createTextMotionStyleTransformStatePair(recipe.effects, 'nativeText()');
    const { motionCount, motionIndexByTokenId } = createMotionIndexByTokenId(tokens);
    const delaySecondsByMotionIndex = createTokenDelaySecondsByMotionIndex(recipe, motionCount);
    const totalTimelineSpan = createTextMotionControlledTimelineSpan(delaySecondsByMotionIndex);
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
): TextMotionSourceTokenRenderer<
  'native-text' | 'style-transform',
  NativeTextRendererProps['recipe']
> {
  return createTextMotionRendererHandle({
    kind: 'nativeText',
    capabilities: ['native-text', 'style-transform'],
    motionUnit: 'source-token',
    Component: createNativeTextRendererComponent(options),
  });
}
