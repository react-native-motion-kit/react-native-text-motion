export { parentLabelPolicy } from './accessibility';
export { useTextMotionControls } from './controls';
export { fade, lineReveal, pulse, rise, scale, shake, slide } from './effects';
export { defineTextMotion } from './recipe';
export { nativeText, overlayText } from './renderers';
export { custom, graphemes, lines, words } from './split';
export { parallel, sequence, stagger, wave } from './timeline';
export type { ParentLabelPolicyOptions } from './accessibility';
export type { TextMotionControls } from './controls';
export type {
  FadeOptions,
  LineRevealOptions,
  PulseOptions,
  RiseOptions,
  ScaleOptions,
  ShakeOptions,
  SlideOptions,
} from './effects';
export type { NativeTextRendererOptions, OverlayTextRendererOptions } from './renderers';
export type {
  TextMotionCustomSplit,
  TextMotionCustomSplitResult,
  TextMotionCustomSplitToken,
} from './split';
export type {
  TextMotionStaggerFrom,
  TextMotionStaggerOptions,
  TextMotionWaveOptions,
} from './timeline';
export type {
  TextMotionAccessibilityPolicy,
  TextMotionComponent,
  TextMotionComponentAccessibilityProps,
  TextMotionComponentProps,
  TextMotionComponentTextProps,
  TextMotionEffect,
  TextMotionMotionConfig,
  TextMotionSpringOptions,
  TextMotionTimingOptions,
  TextMotionRenderer,
  TextMotionRendererCapability,
  TextMotionRendererProps,
  TextMotionSplitter,
  TextMotionTimeline,
  TextMotionToken,
} from './types';
