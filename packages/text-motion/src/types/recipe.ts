import type { ComponentType } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import type { SharedValue, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

import type { TextMotionControls } from '../controls';
import type {
  TextMotionCompatibleEffect,
  TextMotionRenderer,
  TextMotionRendererCapability,
} from './renderer';
import type { TextMotionSplitter } from './token';

type DistributiveOmit<T, Keys extends PropertyKey> = T extends unknown ? Omit<T, Keys> : never;

declare const textMotionEffectBrand: unique symbol;
declare const textMotionTimelineBrand: unique symbol;

/** @internal Serializable metadata attached to effect descriptors. */
export type TextMotionEffectDescriptorOptions = Readonly<Record<string, unknown>>;

/** @internal Serializable metadata attached to timeline descriptors. */
export type TextMotionTimelineDescriptorOptions = Readonly<Record<string, unknown>>;

/** @internal Timeline descriptor consumed by recipe and renderer internals. */
export type TextMotionTimelineDescriptor<
  Options extends TextMotionTimelineDescriptorOptions = TextMotionTimelineDescriptorOptions,
  Name extends string = string,
> = {
  kind: 'timeline';
  name: Name;
  options?: Options;
  delayFor(index: number, count: number): number;
};

/** @internal Timeline descriptor with extension-level options for recipe internals. */
export type TextMotionAnyTimelineDescriptor = TextMotionTimelineDescriptor;

/** Opaque timeline handle accepted by `.timeline(...)`. */
export type TextMotionTimeline<Name extends string = string> = {
  readonly [textMotionTimelineBrand]: {
    readonly name: Name;
  };
};

/** Opaque timeline handle with any timeline name. */
export type TextMotionAnyTimeline = TextMotionTimeline;

/** @internal Effect descriptor consumed by renderers. */
export type TextMotionEffectDescriptor<
  RequiredCapabilities extends TextMotionRendererCapability = TextMotionRendererCapability,
  Options extends TextMotionEffectDescriptorOptions = TextMotionEffectDescriptorOptions,
  Name extends string = string,
> = {
  kind: 'effect';
  name: Name;
  options?: Options;
  requiredCapabilities: readonly RequiredCapabilities[];
  effects?: readonly TextMotionAnyEffect[];
};

/** @internal Effect descriptor with extension-level options for renderer internals. */
export type TextMotionAnyEffectDescriptor = TextMotionEffectDescriptor;

/** Opaque effect handle accepted by `.effect(...)`. */
export type TextMotionEffect<
  RequiredCapabilities extends TextMotionRendererCapability = 'native-text',
  Name extends string = string,
> = {
  readonly [textMotionEffectBrand]: {
    readonly requiredCapabilities: RequiredCapabilities;
    readonly name: Name;
  };
  and<NextCapabilities extends TextMotionRendererCapability, NextName extends string>(
    effect: TextMotionEffect<NextCapabilities, NextName>,
  ): TextMotionEffect<RequiredCapabilities | NextCapabilities>;
};

/** Opaque effect handle with any required capability. */
export type TextMotionAnyEffect = TextMotionEffect<TextMotionRendererCapability>;

/** Timing options accepted by text motion renderers. Reduced motion is controlled by accessibility policy. */
export type TextMotionTimingOptions = DistributiveOmit<WithTimingConfig, 'reduceMotion'>;

/** Spring options accepted by text motion renderers. Reduced motion is controlled by accessibility policy. */
export type TextMotionSpringOptions = DistributiveOmit<WithSpringConfig, 'reduceMotion'>;

/** Motion primitive used by Reanimated renderers. */
export type TextMotionMotionConfig =
  | {
      kind: 'timing';
      options?: TextMotionTimingOptions;
    }
  | {
      kind: 'spring';
      options?: TextMotionSpringOptions;
    };

/** Accessibility behavior for a text motion recipe. */
export type TextMotionAccessibilityPolicy = {
  kind: string;
  parentLabel: boolean;
  hideTokensFromAccessibility: boolean;
  reducedMotion: 'final-state' | 'system';
};

/** Immutable recipe config produced by {@link TextMotionRecipeBuilder}. */
export type TextMotionRecipeConfig<
  _RendererCapabilities extends TextMotionRendererCapability = TextMotionRendererCapability,
  Timeline extends TextMotionAnyTimeline = TextMotionTimeline,
  Effects extends readonly TextMotionAnyEffect[] = readonly TextMotionAnyEffect[],
> = {
  splitter?: TextMotionSplitter;
  renderer?: TextMotionRenderer;
  timeline?: Timeline;
  effects: Effects;
  motion?: TextMotionMotionConfig;
  accessibility?: TextMotionAccessibilityPolicy;
};

/** Internal recipe shape used by runtime renderers after recipe composition. */
export type TextMotionInternalRecipeConfig<
  RendererCapabilities extends TextMotionRendererCapability = TextMotionRendererCapability,
> = TextMotionRecipeConfig<
  RendererCapabilities,
  TextMotionAnyTimeline,
  readonly TextMotionAnyEffect[]
>;

/** Accessibility props intentionally supported by text motion components. */
export type TextMotionComponentAccessibilityProps = Pick<
  TextProps,
  | 'accessibilityActions'
  | 'accessibilityHint'
  | 'accessibilityLabel'
  | 'accessibilityLanguage'
  | 'accessibilityRole'
  | 'accessibilityState'
  | 'accessibilityValue'
  | 'onAccessibilityAction'
>;

/** Non-child props intentionally supported by text motion components. */
export type TextMotionComponentTextProps = TextMotionComponentAccessibilityProps &
  Pick<TextProps, 'allowFontScaling' | 'maxFontSizeMultiplier' | 'nativeID' | 'testID'> & {
    /** Text style applied to each rendered token. Layout-only text props are not supported. */
    style?: StyleProp<TextStyle>;
  };

type TextMotionRawProgressPlaybackProps = {
  /**
   * Raw app-owned normalized progress for externally driven playback.
   *
   * `0` renders the initial text motion state and `1` renders the final state. Finite values
   * outside `0..1` are clamped by the renderer; non-finite values are treated as `0`. When
   * provided, `.motion()` does not drive playback. Use this for scroll, gesture, or synchronized
   * shared values where the app owns the exact progress.
   */
  progress?: SharedValue<number>;
  controls?: never;
};

type TextMotionControlsPlaybackProps = {
  progress?: never;
  /**
   * Command channel for event-driven playback.
   *
   * The component owns playback execution and uses its recipe `.motion()` config. Use this for
   * buttons, screen focus, onboarding steps, and replay/reset/stop interactions.
   */
  controls?: TextMotionControls;
};

type TextMotionComponentPlaybackProps =
  | TextMotionRawProgressPlaybackProps
  | TextMotionControlsPlaybackProps;

/** Props forwarded from a text motion component to its renderer. */
export type TextMotionComponentRendererProps = TextMotionComponentTextProps &
  TextMotionComponentPlaybackProps;

/** Props accepted by components created from text motion recipes. */
export type TextMotionComponentProps = TextMotionComponentRendererProps & {
  /** Plain string rendered and split by the recipe splitter. */
  children: string;
};

/** React component produced by a text motion recipe. */
export type TextMotionComponent = ComponentType<TextMotionComponentProps>;

/** Type helper used by `.effect(...)` to enforce renderer capability compatibility. */
export type TextMotionEffectForRenderer<
  RendererCapabilities extends TextMotionRendererCapability,
  RequiredCapabilities extends TextMotionRendererCapability,
  Effect extends TextMotionEffect<RequiredCapabilities> = TextMotionEffect<RequiredCapabilities>,
> = TextMotionCompatibleEffect<RendererCapabilities, RequiredCapabilities, Effect>;
