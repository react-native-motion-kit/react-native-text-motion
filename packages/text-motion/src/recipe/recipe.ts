import type {
  TextMotionAccessibilityPolicy,
  TextMotionAnyEffect,
  TextMotionAnyTimeline,
  TextMotionComponent,
  TextMotionEffect,
  TextMotionMotionConfig,
  TextMotionRecipeConfig,
  TextMotionCompatibleEffect,
  TextMotionRenderer,
  TextMotionRendererCapability,
  TextMotionSplitter,
} from '../types';

import { createTextMotionComponent } from './component';

type RecipeDraft<RendererCapabilities extends TextMotionRendererCapability> = {
  splitter?: TextMotionSplitter;
  renderer?: TextMotionRenderer<RendererCapabilities>;
  timeline?: TextMotionAnyTimeline;
  effects: readonly TextMotionAnyEffect[];
  motion?: TextMotionMotionConfig;
  accessibility?: TextMotionAccessibilityPolicy;
};

type RequiredCapabilitiesOfEffect<Effect extends TextMotionAnyEffect> =
  Effect extends TextMotionEffect<infer RequiredCapabilities> ? RequiredCapabilities : never;

function cloneTimingOptions(
  options: Extract<TextMotionMotionConfig, { kind: 'timing' }>['options'],
) {
  return options ? { ...options } : undefined;
}

function cloneSpringOptions(
  options: Extract<TextMotionMotionConfig, { kind: 'spring' }>['options'],
) {
  if (!options) {
    return undefined;
  }

  if (options.clamp) {
    return {
      ...options,
      clamp: { ...options.clamp },
    };
  }

  return { ...options };
}

function cloneAccessibilityPolicy(
  accessibility: TextMotionAccessibilityPolicy | undefined,
): TextMotionAccessibilityPolicy | undefined {
  return accessibility ? { ...accessibility } : undefined;
}

function validateMotionOptionValue(
  kind: TextMotionMotionConfig['kind'],
  path: string,
  value: unknown,
): void {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return;
  }

  if (typeof value === 'number') {
    throw new Error(
      `@react-native-motion-kit/text-motion ${kind} motion option "${path}" must be a finite number.`,
    );
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => validateMotionOptionValue(kind, `${path}[${index}]`, item));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nestedValue]) =>
      validateMotionOptionValue(kind, `${path}.${key}`, nestedValue),
    );
  }
}

function validateMotionConfig(motion: TextMotionMotionConfig): TextMotionMotionConfig {
  if (motion.kind === 'spring') {
    if (motion.options) {
      validateMotionOptionValue(motion.kind, 'options', motion.options);
    }

    return {
      kind: 'spring',
      options: cloneSpringOptions(motion.options),
    };
  }

  if (motion.kind === 'timing') {
    if (motion.options) {
      validateMotionOptionValue(motion.kind, 'options', motion.options);
    }

    return {
      kind: 'timing',
      options: cloneTimingOptions(motion.options),
    };
  }

  throw new Error('@react-native-motion-kit/text-motion motion kind must be "timing" or "spring".');
}

function cloneMotionConfig(
  motion: TextMotionMotionConfig | undefined,
): TextMotionMotionConfig | undefined {
  return motion ? validateMotionConfig(motion) : undefined;
}

function cloneDraft<RendererCapabilities extends TextMotionRendererCapability>(
  draft: RecipeDraft<RendererCapabilities>,
): RecipeDraft<RendererCapabilities> {
  return {
    ...draft,
    accessibility: cloneAccessibilityPolicy(draft.accessibility),
    effects: [...draft.effects],
    motion: cloneMotionConfig(draft.motion),
  };
}

/** Immutable builder used to compose a text motion recipe. */
export class TextMotionRecipeBuilder<
  RendererCapabilities extends TextMotionRendererCapability = never,
> {
  private readonly draft: RecipeDraft<RendererCapabilities>;

  constructor(draft: Partial<RecipeDraft<RendererCapabilities>> = {}) {
    this.draft = {
      effects: draft.effects ? [...draft.effects] : [],
      splitter: draft.splitter,
      renderer: draft.renderer,
      timeline: draft.timeline,
      motion: draft.motion,
      accessibility: draft.accessibility,
    };
  }

  /** Choose how the input string is split into tokens. */
  split(splitter: TextMotionSplitter): TextMotionRecipeBuilder<RendererCapabilities> {
    return new TextMotionRecipeBuilder({
      ...cloneDraft(this.draft),
      splitter,
    });
  }

  /** Choose the renderer responsible for measuring and drawing tokens. */
  layout<NextCapabilities extends TextMotionRendererCapability>(
    renderer: TextMotionRenderer<NextCapabilities>,
  ): TextMotionRecipeBuilder<NextCapabilities> {
    return new TextMotionRecipeBuilder<NextCapabilities>({
      ...cloneDraft(this.draft),
      renderer,
    });
  }

  /** Choose the timing strategy for token delays. */
  timeline(timeline: TextMotionAnyTimeline): TextMotionRecipeBuilder<RendererCapabilities> {
    return new TextMotionRecipeBuilder({
      ...cloneDraft(this.draft),
      timeline,
    });
  }

  /** Add an effect that is compatible with the selected renderer. */
  effect<Effect extends TextMotionAnyEffect>(
    effect: TextMotionCompatibleEffect<
      RendererCapabilities,
      RequiredCapabilitiesOfEffect<Effect>,
      Effect
    >,
  ): TextMotionRecipeBuilder<RendererCapabilities> {
    return new TextMotionRecipeBuilder({
      ...cloneDraft(this.draft),
      effects: [...this.draft.effects, effect],
    });
  }

  /** Configure the Reanimated motion primitive used by the renderer. */
  motion(motion: TextMotionMotionConfig): TextMotionRecipeBuilder<RendererCapabilities> {
    return new TextMotionRecipeBuilder({
      ...cloneDraft(this.draft),
      motion: validateMotionConfig(motion),
    });
  }

  /** Configure accessibility behavior such as reduced motion and token hiding. */
  accessibility(
    accessibility: TextMotionAccessibilityPolicy,
  ): TextMotionRecipeBuilder<RendererCapabilities> {
    return new TextMotionRecipeBuilder({
      ...cloneDraft(this.draft),
      accessibility,
    });
  }

  /** Return the immutable recipe config. */
  recipe(): TextMotionRecipeConfig<RendererCapabilities> {
    return cloneDraft(this.draft);
  }

  /** Create a React component from the current recipe. */
  component(): TextMotionComponent {
    return createTextMotionComponent(cloneDraft(this.draft));
  }
}
