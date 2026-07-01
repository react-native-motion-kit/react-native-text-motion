import type {
  TextMotionAnyEffect,
  TextMotionAnyEffectDescriptor,
  TextMotionEffect,
  TextMotionEffectDescriptorOptions,
} from '../types/recipe';
import type { TextMotionRendererCapability } from '../types/renderer';

import {
  attachTextMotionEffectDescriptor,
  readTextMotionEffectDescriptor,
} from '../recipe/descriptors';

const DEFAULT_EFFECT_OPTIONS: TextMotionEffectDescriptorOptions = {};
const NATIVE_TEXT_CAPABILITIES: readonly ['native-text'] = ['native-text'];

function uniqueCapabilities<Capabilities extends TextMotionRendererCapability>(
  capabilities: readonly Capabilities[],
): readonly Capabilities[] {
  return Array.from(new Set(capabilities));
}

/** Compose multiple effects into one ordered effect. */
export function composeTextMotionEffects<Capabilities extends TextMotionRendererCapability>(
  effects: readonly TextMotionEffect<Capabilities>[],
): TextMotionEffect<Capabilities> {
  const descriptors = effects.map(readTextMotionEffectDescriptor);
  const requiredCapabilities = uniqueCapabilities(
    descriptors.flatMap((descriptor) => descriptor.requiredCapabilities),
  );

  const composed = {
    and<NextCapabilities extends TextMotionRendererCapability, NextName extends string>(
      effect: TextMotionEffect<NextCapabilities, NextName>,
    ) {
      return composeTextMotionEffects<Capabilities | NextCapabilities>([...effects, effect]);
    },
  } as TextMotionEffect<Capabilities>;

  return attachTextMotionEffectDescriptor<Capabilities, TextMotionEffectDescriptorOptions, string>(
    composed,
    {
      kind: 'effect',
      name: descriptors.map((descriptor) => descriptor.name).join('+'),
      requiredCapabilities,
      effects,
    },
  );
}

/** Create a custom native-text effect without descriptor options. */
export function createTextMotionEffect<Name extends string>(
  name: Name,
): TextMotionEffect<'native-text', Name>;

/** Create a custom native-text effect with typed descriptor options. */
export function createTextMotionEffect<
  Name extends string,
  Options extends TextMotionEffectDescriptorOptions,
>(name: Name, options: Options): TextMotionEffect<'native-text', Name>;

/** Create a custom effect with typed descriptor options and renderer capabilities. */
export function createTextMotionEffect<
  Name extends string,
  Options extends TextMotionEffectDescriptorOptions,
  Capabilities extends TextMotionRendererCapability,
>(
  name: Name,
  options: Options,
  requiredCapabilities: readonly Capabilities[],
): TextMotionEffect<Capabilities, Name>;

/** Create a custom text-motion effect for built-in or custom renderers. */
export function createTextMotionEffect(
  name: string,
  options: TextMotionEffectDescriptorOptions = DEFAULT_EFFECT_OPTIONS,
  requiredCapabilities: readonly TextMotionRendererCapability[] = NATIVE_TEXT_CAPABILITIES,
): TextMotionAnyEffect {
  const effect = {
    and<NextCapabilities extends TextMotionRendererCapability, NextName extends string>(
      nextEffect: TextMotionEffect<NextCapabilities, NextName>,
    ) {
      return composeTextMotionEffects<TextMotionRendererCapability | NextCapabilities>([
        effect,
        nextEffect,
      ]);
    },
  } as TextMotionAnyEffect;

  const descriptor: TextMotionAnyEffectDescriptor = {
    kind: 'effect',
    name,
    options,
    requiredCapabilities,
  };

  return attachTextMotionEffectDescriptor(effect, descriptor);
}
