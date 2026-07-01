import type {
  TextMotionAnyEffect,
  TextMotionAnyEffectDescriptor,
  TextMotionAnyTimeline,
  TextMotionAnyTimelineDescriptor,
  TextMotionEffect,
  TextMotionEffectDescriptor,
  TextMotionEffectDescriptorOptions,
  TextMotionTimeline,
  TextMotionTimelineDescriptor,
  TextMotionTimelineDescriptorOptions,
} from '../types/recipe';
import type {
  TextMotionRenderer,
  TextMotionRendererCapability,
  TextMotionRendererDescriptor,
} from '../types/renderer';
import type {
  TextMotionSplitter,
  TextMotionSplitterDescriptor,
  TextMotionTokenUnit,
} from '../types/token';

const effectDescriptors = new WeakMap<TextMotionAnyEffect, TextMotionAnyEffectDescriptor>();
const timelineDescriptors = new WeakMap<TextMotionAnyTimeline, TextMotionAnyTimelineDescriptor>();
const splitterDescriptors = new WeakMap<TextMotionSplitter, TextMotionSplitterDescriptor>();
const rendererDescriptors = new WeakMap<
  TextMotionRenderer<TextMotionRendererCapability, unknown>,
  TextMotionRendererDescriptor<TextMotionRendererCapability, unknown>
>();

export function attachTextMotionEffectDescriptor<
  RequiredCapabilities extends TextMotionRendererCapability,
  Options extends TextMotionEffectDescriptorOptions,
  Name extends string,
>(
  effect: TextMotionEffect<RequiredCapabilities, Name>,
  descriptor: TextMotionEffectDescriptor<RequiredCapabilities, Options, Name>,
): TextMotionEffect<RequiredCapabilities, Name> {
  effectDescriptors.set(effect, descriptor);

  return effect;
}

export function readTextMotionEffectDescriptor<
  RequiredCapabilities extends TextMotionRendererCapability,
  Name extends string,
>(
  effect: TextMotionEffect<RequiredCapabilities, Name>,
): TextMotionEffectDescriptor<RequiredCapabilities, TextMotionEffectDescriptorOptions, Name> {
  const descriptor = effectDescriptors.get(effect);

  if (descriptor) {
    return descriptor as TextMotionEffectDescriptor<
      RequiredCapabilities,
      TextMotionEffectDescriptorOptions,
      Name
    >;
  }

  throw new Error('@react-native-motion-kit/text-motion received an unknown effect handle.');
}

export function flattenTextMotionEffectDescriptors(
  effects: readonly TextMotionAnyEffect[],
): readonly TextMotionAnyEffectDescriptor[] {
  return effects.flatMap((effect) => {
    const descriptor = readTextMotionEffectDescriptor(effect);

    return descriptor.effects
      ? flattenTextMotionEffectDescriptors(descriptor.effects)
      : [descriptor];
  });
}

export function createTextMotionTimelineHandle<
  Options extends TextMotionTimelineDescriptorOptions,
  Name extends string,
>(descriptor: TextMotionTimelineDescriptor<Options, Name>): TextMotionTimeline<Name> {
  const timeline = {} as TextMotionTimeline<Name>;
  timelineDescriptors.set(timeline, descriptor);

  return timeline;
}

export function readTextMotionTimelineDescriptor(
  timeline: TextMotionAnyTimeline,
): TextMotionAnyTimelineDescriptor {
  const descriptor = timelineDescriptors.get(timeline);

  if (descriptor) {
    return descriptor;
  }

  throw new Error('@react-native-motion-kit/text-motion received an unknown timeline handle.');
}

export function createTextMotionSplitterHandle<Unit extends TextMotionTokenUnit>(
  descriptor: TextMotionSplitterDescriptor<Unit>,
): TextMotionSplitter<Unit> {
  const splitter = {} as TextMotionSplitter<Unit>;
  splitterDescriptors.set(splitter, descriptor);

  return splitter;
}

export function readTextMotionSplitterDescriptor<Unit extends TextMotionTokenUnit>(
  splitter: TextMotionSplitter<Unit>,
): TextMotionSplitterDescriptor<Unit> {
  const descriptor = splitterDescriptors.get(splitter);

  if (descriptor) {
    return descriptor as TextMotionSplitterDescriptor<Unit>;
  }

  throw new Error('@react-native-motion-kit/text-motion received an unknown splitter handle.');
}

export function createTextMotionRendererHandle<
  Capabilities extends TextMotionRendererCapability,
  Recipe,
>(
  descriptor: TextMotionRendererDescriptor<Capabilities, Recipe>,
): TextMotionRenderer<Capabilities, Recipe> {
  const renderer = {} as TextMotionRenderer<Capabilities, Recipe>;
  rendererDescriptors.set(
    renderer,
    descriptor as TextMotionRendererDescriptor<TextMotionRendererCapability, unknown>,
  );

  return renderer;
}

export function readTextMotionRendererDescriptor<
  Capabilities extends TextMotionRendererCapability,
  Recipe,
>(
  renderer: TextMotionRenderer<Capabilities, Recipe>,
): TextMotionRendererDescriptor<Capabilities, Recipe> {
  const descriptor = rendererDescriptors.get(renderer);

  if (descriptor) {
    return descriptor as TextMotionRendererDescriptor<Capabilities, Recipe>;
  }

  throw new Error('@react-native-motion-kit/text-motion received an unknown renderer handle.');
}
