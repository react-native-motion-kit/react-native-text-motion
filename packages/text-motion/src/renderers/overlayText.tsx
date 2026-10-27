import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type MutableRefObject,
  type ReactElement,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextLayoutEvent,
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
import type {
  TextMotionLineMaskCapability,
  TextMotionRenderedLineRenderer,
  TextMotionRendererProps,
} from '../types/renderer';

import {
  createHiddenTokenAccessibilityProps,
  createParentAccessibilityProps,
  parentLabelPolicy,
  resolveAccessibleText,
} from '../accessibility';
import { createTextMotionRendererHandle } from '../recipe/descriptors';
import { createTextMotionRendererCapability } from '../types/renderer';
import { useNativeTextControlsPlayback } from './nativeTextControls';
import {
  areNativeTextPlaybackRunsEqual,
  createNativeTextPlaybackRun,
  type NativeTextPlaybackRun,
} from './nativeTextPlayback';
import {
  compareOverlayTextLayouts,
  createOverlayTextLayout,
  type OverlayTextLayoutReady,
  type OverlayTextMotionLine,
} from './overlayTextLayout';
import {
  clampTextMotionProgress,
  createTextMotionControlledProgressPlan,
  createTextMotionControlledTimelineSpan,
  createTextMotionDelaySecondsByItemIndex,
  createTextMotionItemMotion,
  createOverlayTextStyleTransformStatePair,
  createTextMotionProgressAnimation,
  createTextMotionStyleTransformStatePair,
  readTextMotionProgressForAnimatedStyle,
  shouldRenderTextMotionFinalState,
  type TextMotionControlledProgressPlan,
  type TextMotionItemMotion,
} from './rendererMotion';

type OverlayTextRendererProps = Omit<TextMotionRendererProps, 'recipe'> & {
  recipe: TextMotionInternalRecipeConfig;
};

type OverlayTextContainerProps = Pick<
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

type OverlayTextTypographyProps = Pick<
  TextMotionComponentTextProps,
  'allowFontScaling' | 'maxFontSizeMultiplier'
>;

type OverlayTextFinalSourceProps = {
  children: OverlayTextRendererProps['children'];
  containerProps: OverlayTextContainerProps;
  sourceAccessibilityProps: ReturnType<typeof createHiddenTokenAccessibilityProps>;
  textStyle: StyleProp<TextStyle>;
  typographyProps: OverlayTextTypographyProps;
};

type OverlayTextActiveRendererProps = {
  children: OverlayTextRendererProps['children'];
  containerProps: OverlayTextContainerProps;
  recipe: OverlayTextRendererProps['recipe'];
  sourceAccessibilityProps: ReturnType<typeof createHiddenTokenAccessibilityProps>;
  text: string;
  textProps: OverlayTextRendererProps['textProps'];
  textStyle: StyleProp<TextStyle>;
  typographyProps: OverlayTextTypographyProps;
};

type OverlayTextAnimatedStyleOptions =
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

type OverlayTextAnimatedLineProps = {
  children: string;
  line: OverlayTextMotionLine;
  maskTestID?: string;
  motionTestID?: string;
  paragraphTestID?: string;
  revealContentMotion: TextMotionItemMotion;
  textStyle: StyleProp<TextStyle>;
  frameMotion: TextMotionItemMotion;
  typographyProps: OverlayTextTypographyProps;
};

type OverlayTextUncontrolledLineProps = OverlayTextAnimatedLineProps & {
  controls?: TextMotionControls;
  playbackIdentity: string;
};

type OverlayTextControlledLineProps = OverlayTextAnimatedLineProps & {
  controlledProgress: SharedValue<number>;
  controlledProgressPlan: TextMotionControlledProgressPlan;
};

type OverlayTextLineMaskProps = Pick<
  OverlayTextAnimatedLineProps,
  | 'children'
  | 'line'
  | 'maskTestID'
  | 'motionTestID'
  | 'paragraphTestID'
  | 'textStyle'
  | 'typographyProps'
> & {
  frameAnimatedStyle: ReturnType<typeof useOverlayTextAnimatedStyle>;
  revealContentAnimatedStyle: ReturnType<typeof useOverlayTextAnimatedStyle>;
};

type OverlayTextLayoutResult = {
  fallbackReason?: string;
  inputKey: string;
  layout?: OverlayTextLayoutReady;
};

export type OverlayTextRendererOptions = {
  /** Prefix used for generated line mask `testID` values. */
  testIDPrefix?: string;
};

const AnimatedView = createAnimatedComponent(View);
const LINE_MASK_CAPABILITY: TextMotionLineMaskCapability =
  createTextMotionRendererCapability('line-mask');
const HIDDEN_ACCESSIBILITY_PROPS = {
  accessibilityElementsHidden: true,
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
} as const;
const OVERLAY_CONTAINER_STYLE = {
  ...StyleSheet.absoluteFill,
  pointerEvents: 'none',
} as const satisfies ViewStyle;
const PENDING_OVERLAY_CONTAINER_STYLE = {
  opacity: 0,
} as const satisfies ViewStyle;
const SOURCE_LAYOUT_STYLE = {
  alignSelf: 'stretch',
} as const satisfies TextStyle;
const READY_SOURCE_STYLE = {
  opacity: 0,
} as const satisfies TextStyle;
const MASK_STYLE = {
  left: 0,
  overflow: 'hidden',
  position: 'absolute',
  right: 0,
} as const satisfies ViewStyle;
const LINE_ANIMATION_STYLE = {
  left: 0,
  position: 'absolute',
  top: 0,
  width: '100%',
} as const satisfies ViewStyle;
const PARAGRAPH_COPY_STYLE = {
  left: 0,
  position: 'absolute',
  width: '100%',
} as const satisfies TextStyle;
const OVERLAY_TEXT_SHAPING_STYLE_KEYS = [
  'direction',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'includeFontPadding',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textAlignVertical',
  'textTransform',
  'verticalAlign',
  'writingDirection',
] as const satisfies readonly (keyof TextStyle)[];
const OVERLAY_TEXT_BOX_LAYOUT_STYLE_KEYS = [
  'alignSelf',
  'aspectRatio',
  'borderBottomWidth',
  'borderEndWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'borderStartWidth',
  'borderTopWidth',
  'borderWidth',
  'bottom',
  'boxSizing',
  'display',
  'end',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'height',
  'inset',
  'insetBlock',
  'insetBlockEnd',
  'insetBlockStart',
  'insetInline',
  'insetInlineEnd',
  'insetInlineStart',
  'left',
  'margin',
  'marginBlock',
  'marginBlockEnd',
  'marginBlockStart',
  'marginBottom',
  'marginEnd',
  'marginHorizontal',
  'marginInline',
  'marginInlineEnd',
  'marginInlineStart',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'padding',
  'paddingBlock',
  'paddingBlockEnd',
  'paddingBlockStart',
  'paddingBottom',
  'paddingEnd',
  'paddingHorizontal',
  'paddingInline',
  'paddingInlineEnd',
  'paddingInlineStart',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingTop',
  'paddingVertical',
  'position',
  'right',
  'start',
  'top',
  'width',
] as const satisfies readonly (keyof TextStyle)[];
const OVERLAY_TEXT_LAYOUT_STYLE_KEYS = [
  ...OVERLAY_TEXT_SHAPING_STYLE_KEYS,
  ...OVERLAY_TEXT_BOX_LAYOUT_STYLE_KEYS,
] as const;

type OverlayTextLayoutStyleSnapshot = Partial<
  Record<(typeof OVERLAY_TEXT_LAYOUT_STYLE_KEYS)[number], unknown>
>;

function createContainerProps(
  textProps: TextMotionComponentTextProps | undefined,
  parentAccessibilityProps: ReturnType<typeof createParentAccessibilityProps>,
): OverlayTextContainerProps {
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

function createTypographyProps(
  textProps: TextMotionComponentTextProps | undefined,
): OverlayTextTypographyProps {
  return {
    allowFontScaling: textProps?.allowFontScaling,
    maxFontSizeMultiplier: textProps?.maxFontSizeMultiplier,
  };
}

function OverlayTextFinalSource({
  children,
  containerProps,
  sourceAccessibilityProps,
  textStyle,
  typographyProps,
}: OverlayTextFinalSourceProps) {
  return (
    <View {...containerProps}>
      <Text
        {...sourceAccessibilityProps}
        {...typographyProps}
        style={[textStyle, SOURCE_LAYOUT_STYLE]}
      >
        {children}
      </Text>
    </View>
  );
}

function createInitialTextStyle(tokenMotion: TextMotionItemMotion): StyleProp<TextStyle> {
  return {
    opacity: tokenMotion.initial.opacity,
    transform: [
      { translateX: tokenMotion.initial.translateX },
      { translateY: tokenMotion.initial.translateY },
      { scale: tokenMotion.initial.scale },
    ],
  };
}

function createSourceTextMotionStyle(
  layout: OverlayTextLayoutReady | undefined,
  pendingMotion: TextMotionItemMotion,
): StyleProp<TextStyle> {
  if (layout) {
    return READY_SOURCE_STYLE;
  }

  if (pendingMotion.initial.scale !== 1) {
    return PENDING_OVERLAY_CONTAINER_STYLE;
  }

  return createInitialTextStyle(pendingMotion);
}

function createLineFrameStyle(line: OverlayTextMotionLine): StyleProp<ViewStyle> {
  return {
    height: line.height,
    top: line.y,
    transformOrigin: [line.x + line.width / 2, line.height / 2, 0],
  };
}

function isSerializableRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createStableLayoutInputValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(createStableLayoutInputValue);
  }

  if (!isSerializableRecord(value)) {
    return value;
  }

  const entries = Object.entries(value);

  entries.sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(
    entries.map(([key, nestedValue]) => [key, createStableLayoutInputValue(nestedValue)]),
  );
}

function createOverlayTextLayoutStyleSnapshot(
  style: StyleProp<TextStyle>,
): OverlayTextLayoutStyleSnapshot {
  const flattenedStyle = StyleSheet.flatten(style) ?? {};

  return OVERLAY_TEXT_LAYOUT_STYLE_KEYS.reduce<OverlayTextLayoutStyleSnapshot>((snapshot, key) => {
    const value = flattenedStyle[key];

    if (value === undefined) {
      return snapshot;
    }

    return {
      ...snapshot,
      [key]: createStableLayoutInputValue(value),
    };
  }, {});
}

function createOverlayTextInputKey(
  text: string,
  textProps: TextMotionComponentTextProps | undefined,
): string {
  return JSON.stringify({
    allowFontScaling: textProps?.allowFontScaling,
    maxFontSizeMultiplier: textProps?.maxFontSizeMultiplier,
    style: createOverlayTextLayoutStyleSnapshot(textProps?.style),
    text,
  });
}

function createParagraphCopyOffset(line: OverlayTextMotionLine): number {
  return line.y === 0 ? 0 : -line.y;
}

function OverlayTextLineMask({
  children,
  frameAnimatedStyle,
  line,
  maskTestID,
  motionTestID,
  paragraphTestID,
  revealContentAnimatedStyle,
  textStyle,
  typographyProps,
}: OverlayTextLineMaskProps): ReactElement {
  return (
    <AnimatedView
      {...HIDDEN_ACCESSIBILITY_PROPS}
      pointerEvents="none"
      style={[MASK_STYLE, createLineFrameStyle(line), frameAnimatedStyle]}
      testID={maskTestID}
    >
      <AnimatedView
        style={[LINE_ANIMATION_STYLE, revealContentAnimatedStyle] as StyleProp<ViewStyle>}
        testID={motionTestID}
      >
        <Text
          {...HIDDEN_ACCESSIBILITY_PROPS}
          {...typographyProps}
          style={[textStyle, PARAGRAPH_COPY_STYLE, { top: createParagraphCopyOffset(line) }]}
          testID={paragraphTestID}
        >
          {children}
        </Text>
      </AnimatedView>
    </AnimatedView>
  );
}

function useOverlayTextAnimatedStyle(options: OverlayTextAnimatedStyleOptions) {
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

function OverlayTextUncontrolledLine({
  children,
  controls,
  line,
  maskTestID,
  motionTestID,
  paragraphTestID,
  playbackIdentity,
  revealContentMotion,
  textStyle,
  frameMotion,
  typographyProps,
}: OverlayTextUncontrolledLineProps) {
  const reducedMotionEnabled = useReducedMotion();
  const renderFinalState = shouldRenderTextMotionFinalState(
    reducedMotionEnabled,
    frameMotion.reducedMotion,
  );
  const progress = useSharedValue(renderFinalState ? 1 : 0);
  const playbackRun = createNativeTextPlaybackRun(frameMotion, renderFinalState, playbackIdentity);
  const previousPlaybackRun = useRef<NativeTextPlaybackRun | undefined>(undefined);
  const frameAnimatedStyle = useOverlayTextAnimatedStyle({
    controlled: false,
    progress,
    renderFinalState,
    tokenMotion: frameMotion,
  });
  const revealContentAnimatedStyle = useOverlayTextAnimatedStyle({
    controlled: false,
    progress,
    renderFinalState,
    tokenMotion: revealContentMotion,
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
    tokenMotion: frameMotion,
  });

  return (
    <OverlayTextLineMask
      frameAnimatedStyle={frameAnimatedStyle}
      line={line}
      maskTestID={maskTestID}
      motionTestID={motionTestID}
      paragraphTestID={paragraphTestID}
      revealContentAnimatedStyle={revealContentAnimatedStyle}
      textStyle={textStyle}
      typographyProps={typographyProps}
    >
      {children}
    </OverlayTextLineMask>
  );
}

function OverlayTextControlledLine({
  children,
  controlledProgress,
  controlledProgressPlan,
  line,
  maskTestID,
  motionTestID,
  paragraphTestID,
  revealContentMotion,
  textStyle,
  frameMotion,
  typographyProps,
}: OverlayTextControlledLineProps) {
  const reducedMotionEnabled = useReducedMotion();
  const renderFinalState = shouldRenderTextMotionFinalState(
    reducedMotionEnabled,
    frameMotion.reducedMotion,
  );
  const frameAnimatedStyle = useOverlayTextAnimatedStyle({
    controlled: true,
    controlledProgressPlan,
    progress: controlledProgress,
    renderFinalState,
    tokenMotion: frameMotion,
  });
  const revealContentAnimatedStyle = useOverlayTextAnimatedStyle({
    controlled: true,
    controlledProgressPlan,
    progress: controlledProgress,
    renderFinalState,
    tokenMotion: revealContentMotion,
  });

  return (
    <OverlayTextLineMask
      frameAnimatedStyle={frameAnimatedStyle}
      line={line}
      maskTestID={maskTestID}
      motionTestID={motionTestID}
      paragraphTestID={paragraphTestID}
      revealContentAnimatedStyle={revealContentAnimatedStyle}
      textStyle={textStyle}
      typographyProps={typographyProps}
    >
      {children}
    </OverlayTextLineMask>
  );
}

function warnOverlayTextFallbackOnce(warnedRef: MutableRefObject<boolean>, reason: string) {
  if (warnedRef.current) {
    return;
  }

  warnedRef.current = true;

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      `@react-native-motion-kit/text-motion overlayText() received unsupported line layout (${reason}); rendering readable final text instead.`,
    );
  }
}

function isTextLayoutEventRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readTextLayoutNativeEvent(event: unknown): unknown {
  if (!isTextLayoutEventRecord(event) || !('nativeEvent' in event)) {
    return event;
  }

  const nativeEvent = event.nativeEvent;

  if (!isTextLayoutEventRecord(nativeEvent) || 'lines' in nativeEvent) {
    return nativeEvent;
  }

  return 'nativeEvent' in nativeEvent ? nativeEvent.nativeEvent : nativeEvent;
}

function createMaskTestID(prefix: string | undefined, line: OverlayTextMotionLine) {
  return prefix ? `${prefix}-${line.motionIndex}` : undefined;
}

function createParagraphTestID(prefix: string | undefined, line: OverlayTextMotionLine) {
  return prefix ? `${prefix}-${line.motionIndex}-copy` : undefined;
}

function createMotionTestID(prefix: string | undefined, line: OverlayTextMotionLine) {
  return prefix ? `${prefix}-${line.motionIndex}-motion` : undefined;
}

function createOverlayTestID(prefix: string | undefined) {
  return prefix ? `${prefix}-overlay` : undefined;
}

function createOverlayTextRendererComponent(
  options: OverlayTextRendererOptions,
): ComponentType<OverlayTextRendererProps> {
  function OverlayTextActiveRenderer({
    children,
    containerProps,
    recipe,
    sourceAccessibilityProps,
    text,
    textProps,
    textStyle,
    typographyProps,
  }: OverlayTextActiveRendererProps) {
    const inputKey = createOverlayTextInputKey(text, textProps);
    const styleState = createTextMotionStyleTransformStatePair(recipe.effects, 'overlayText()');
    const overlayStyleState = createOverlayTextStyleTransformStatePair(recipe.effects);
    const delaySecondsByLineIndex = createTextMotionDelaySecondsByItemIndex(recipe, 1);
    const pendingMotion = createTextMotionItemMotion(
      recipe,
      styleState,
      delaySecondsByLineIndex[0] ?? 0,
    );
    const [layoutResult, setLayoutResult] = useState<OverlayTextLayoutResult | undefined>(
      undefined,
    );
    const boundInputKey = layoutResult?.inputKey;
    const retainedLayout = layoutResult?.layout;
    const currentLayout = boundInputKey === inputKey ? retainedLayout : undefined;
    const fallbackReason = boundInputKey === inputKey ? layoutResult?.fallbackReason : undefined;
    const layoutPending = Boolean(retainedLayout && boundInputKey !== inputKey);
    const warnedFallback = useRef(false);
    const externalProgress = textProps?.progress;
    const controls = textProps?.controls;
    const delaySecondsByMotionIndex = retainedLayout
      ? createTextMotionDelaySecondsByItemIndex(recipe, retainedLayout.motionCount)
      : [];
    const totalTimelineSpan = createTextMotionControlledTimelineSpan(delaySecondsByMotionIndex);
    const onTextLayout = useCallback(
      (event: NativeSyntheticEvent<TextLayoutEvent['nativeEvent']>) => {
        const nextLayout = createOverlayTextLayout(text, readTextLayoutNativeEvent(event));

        if (nextLayout.kind === 'static') {
          setLayoutResult({ inputKey });
          return;
        }

        if (nextLayout.kind === 'fallback') {
          setLayoutResult({ fallbackReason: nextLayout.reason, inputKey });
          warnOverlayTextFallbackOnce(warnedFallback, nextLayout.reason);
          return;
        }

        const change = compareOverlayTextLayouts(retainedLayout, nextLayout);

        if (change === 'identical' && boundInputKey === inputKey) {
          return;
        }

        setLayoutResult({ inputKey, layout: nextLayout });
      },
      [boundInputKey, inputKey, retainedLayout, text],
    );

    if (text.trim().length === 0 || fallbackReason) {
      return (
        <OverlayTextFinalSource
          containerProps={containerProps}
          sourceAccessibilityProps={sourceAccessibilityProps}
          textStyle={textStyle}
          typographyProps={typographyProps}
        >
          {children}
        </OverlayTextFinalSource>
      );
    }

    return (
      <View {...containerProps} style={{ position: 'relative' }}>
        <Text
          {...sourceAccessibilityProps}
          {...typographyProps}
          onTextLayout={onTextLayout}
          style={[
            textStyle,
            SOURCE_LAYOUT_STYLE,
            createSourceTextMotionStyle(currentLayout, pendingMotion),
          ]}
        >
          {children}
        </Text>
        {retainedLayout ? (
          <View
            {...HIDDEN_ACCESSIBILITY_PROPS}
            pointerEvents="none"
            style={[
              OVERLAY_CONTAINER_STYLE,
              layoutPending ? PENDING_OVERLAY_CONTAINER_STYLE : undefined,
            ]}
            testID={createOverlayTestID(options.testIDPrefix)}
          >
            {retainedLayout.motionLines.map((line) => {
              const frameMotion = createTextMotionItemMotion(
                recipe,
                overlayStyleState.frame,
                delaySecondsByMotionIndex[line.motionIndex] ?? 0,
              );
              const revealContentMotion = createTextMotionItemMotion(
                recipe,
                overlayStyleState.revealContent,
                delaySecondsByMotionIndex[line.motionIndex] ?? 0,
              );

              if (!externalProgress) {
                return (
                  <OverlayTextUncontrolledLine
                    controls={controls}
                    key={line.index}
                    line={line}
                    maskTestID={createMaskTestID(options.testIDPrefix, line)}
                    motionTestID={createMotionTestID(options.testIDPrefix, line)}
                    paragraphTestID={createParagraphTestID(options.testIDPrefix, line)}
                    playbackIdentity={retainedLayout.playbackSignature}
                    revealContentMotion={revealContentMotion}
                    textStyle={textStyle}
                    frameMotion={frameMotion}
                    typographyProps={typographyProps}
                  >
                    {text}
                  </OverlayTextUncontrolledLine>
                );
              }

              return (
                <OverlayTextControlledLine
                  controlledProgress={externalProgress}
                  controlledProgressPlan={createTextMotionControlledProgressPlan(
                    line.motionIndex,
                    delaySecondsByMotionIndex,
                    totalTimelineSpan,
                  )}
                  key={line.index}
                  line={line}
                  maskTestID={createMaskTestID(options.testIDPrefix, line)}
                  motionTestID={createMotionTestID(options.testIDPrefix, line)}
                  paragraphTestID={createParagraphTestID(options.testIDPrefix, line)}
                  revealContentMotion={revealContentMotion}
                  textStyle={textStyle}
                  frameMotion={frameMotion}
                  typographyProps={typographyProps}
                >
                  {text}
                </OverlayTextControlledLine>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  }

  function OverlayTextRenderer({ children, recipe, textProps, tokens }: OverlayTextRendererProps) {
    const reducedMotionEnabled = useReducedMotion();
    const text = typeof children === 'string' ? children : '';
    const textStyle = textProps?.style;
    const policy = recipe.accessibility ?? parentLabelPolicy();
    const accessibilityLabel = resolveAccessibleText(text, tokens);
    const parentAccessibilityProps = createParentAccessibilityProps(policy, accessibilityLabel);
    const sourceAccessibilityProps = createHiddenTokenAccessibilityProps(policy);
    const containerProps = createContainerProps(textProps, parentAccessibilityProps);
    const typographyProps = createTypographyProps(textProps);
    const externalProgress = textProps?.progress;
    const controls = textProps?.controls;

    if (externalProgress && controls) {
      throw new Error(
        '@react-native-motion-kit/text-motion cannot receive both progress and controls. Use progress for raw app-owned values, or controls for event-driven playback.',
      );
    }

    if (reducedMotionEnabled) {
      return (
        <OverlayTextFinalSource
          containerProps={containerProps}
          sourceAccessibilityProps={sourceAccessibilityProps}
          textStyle={textStyle}
          typographyProps={typographyProps}
        >
          {children}
        </OverlayTextFinalSource>
      );
    }

    return (
      <OverlayTextActiveRenderer
        containerProps={containerProps}
        recipe={recipe}
        sourceAccessibilityProps={sourceAccessibilityProps}
        text={text}
        textProps={textProps}
        textStyle={textStyle}
        typographyProps={typographyProps}
      >
        {children}
      </OverlayTextActiveRenderer>
    );
  }

  OverlayTextRenderer.displayName = 'OverlayTextRenderer';

  return OverlayTextRenderer;
}

/** Render one native paragraph with animated masks for each actual rendered line. */
export function overlayText(
  options: OverlayTextRendererOptions = {},
): TextMotionRenderedLineRenderer<
  TextMotionLineMaskCapability | 'style-transform',
  OverlayTextRendererProps['recipe']
> {
  return createTextMotionRendererHandle({
    kind: 'overlayText',
    capabilities: [LINE_MASK_CAPABILITY, 'style-transform'],
    motionUnit: 'rendered-line',
    Component: createOverlayTextRendererComponent(options),
  });
}
