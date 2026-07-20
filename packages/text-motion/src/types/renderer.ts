import type { ComponentType, ReactNode } from 'react';

import type { TextMotionComponentRendererProps, TextMotionRecipeConfig } from './recipe';
import type { TextMotionToken } from './token';

declare const textMotionRendererCapabilityBrand: unique symbol;
declare const textMotionRendererBrand: unique symbol;
declare const textMotionRenderedLineRendererBrand: unique symbol;

/** Branded renderer capability name for custom renderer packages. */
export type TextMotionRendererCapabilityExtension<Name extends string = string> = Name & {
  readonly [textMotionRendererCapabilityBrand]: 'TextMotionRendererCapabilityExtension';
};

/** Capability supported by a renderer and required by effects. */
export type TextMotionRendererCapability =
  | 'native-text'
  | 'style-transform'
  | TextMotionRendererCapabilityExtension;

/** @internal Built-in capability used by overlayText line-mask effects. */
export type TextMotionLineMaskCapability = TextMotionRendererCapabilityExtension<'line-mask'>;

/** Create a branded capability name for a custom renderer. */
export function createTextMotionRendererCapability<Name extends string>(
  name: Name,
): TextMotionRendererCapabilityExtension<Name> {
  return name as TextMotionRendererCapabilityExtension<Name>;
}

/** Props passed from the recipe component into a renderer component. */
export type TextMotionRendererProps<Recipe = TextMotionRecipeConfig> = {
  children: ReactNode;
  tokens: readonly TextMotionToken[];
  recipe: Recipe;
  textProps?: TextMotionComponentRendererProps;
};

/** @internal Renderer descriptor consumed by recipe internals. */
export type TextMotionRendererDescriptor<
  Capabilities extends TextMotionRendererCapability = TextMotionRendererCapability,
  Recipe = TextMotionRecipeConfig,
  MotionUnit extends 'source-token' | 'rendered-line' = 'source-token' | 'rendered-line',
> = {
  kind: string;
  capabilities: readonly Capabilities[];
  motionUnit?: MotionUnit;
  Component: ComponentType<TextMotionRendererProps<Recipe>>;
};

/** Renderer handle used by `.layout(...)`. */
export type TextMotionRenderer<
  Capabilities extends TextMotionRendererCapability = TextMotionRendererCapability,
  Recipe = unknown,
> = {
  readonly [textMotionRendererBrand]: {
    readonly capabilities: Capabilities;
    readonly recipe: Recipe;
  };
};

/** @internal Renderer handle for source-token renderers accepted after `.split(...)`. */
export type TextMotionSourceTokenRenderer<
  Capabilities extends TextMotionRendererCapability = TextMotionRendererCapability,
  Recipe = unknown,
> = TextMotionRenderer<Capabilities, Recipe> & {
  readonly [textMotionRenderedLineRendererBrand]?: never;
};

/** @internal Renderer handle for renderers that own rendered-line layout. */
export type TextMotionRenderedLineRenderer<
  Capabilities extends TextMotionRendererCapability = TextMotionRendererCapability,
  Recipe = unknown,
> = TextMotionRenderer<Capabilities, Recipe> & {
  readonly [textMotionRenderedLineRendererBrand]: 'rendered-line';
};

/** Capabilities required by an effect but missing from a renderer. */
export type TextMotionMissingCapabilities<
  RendererCapabilities extends TextMotionRendererCapability,
  RequiredCapabilities extends TextMotionRendererCapability,
> = Exclude<RequiredCapabilities, RendererCapabilities>;

/** Effect type gate that rejects effects incompatible with the selected renderer. */
export type TextMotionCompatibleEffect<
  RendererCapabilities extends TextMotionRendererCapability,
  RequiredCapabilities extends TextMotionRendererCapability,
  Effect,
> = [TextMotionMissingCapabilities<RendererCapabilities, RequiredCapabilities>] extends [never]
  ? Effect
  : never;
