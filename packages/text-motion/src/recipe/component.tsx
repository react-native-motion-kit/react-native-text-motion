import type {
  TextMotionComponent,
  TextMotionComponentProps,
  TextMotionInternalRecipeConfig,
  TextMotionRendererCapability,
} from '../types';
import type { TextMotionToken } from '../types/token';

import {
  flattenTextMotionEffectDescriptors,
  readTextMotionRendererDescriptor,
  readTextMotionSplitterDescriptor,
} from './descriptors';

function validateTextMotionRendererCapabilities(
  recipe: TextMotionInternalRecipeConfig<TextMotionRendererCapability>,
  renderer: ReturnType<typeof readTextMotionRendererDescriptor>,
): void {
  flattenTextMotionEffectDescriptors(recipe.effects).forEach((effect) => {
    effect.requiredCapabilities.forEach((capability) => {
      if (renderer.capabilities.includes(capability)) {
        return;
      }

      throw new Error(
        `@react-native-motion-kit/text-motion effect "${effect.name}" requires capability "${capability}", but renderer "${renderer.kind}" does not provide it.`,
      );
    });
  });
}

function createDefaultToken(text: string): TextMotionToken<'custom'> {
  return {
    id: 'token-0',
    index: 0,
    metadata: { reason: 'default-unsplit-token' },
    sourceRange: { start: 0, end: text.length },
    text,
    unit: 'custom',
  };
}

export function createTextMotionComponent(
  recipe: TextMotionInternalRecipeConfig<TextMotionRendererCapability>,
): TextMotionComponent {
  function TextMotionComponent({ children, ...textProps }: TextMotionComponentProps) {
    if (typeof children !== 'string') {
      throw new Error(
        '@react-native-motion-kit/text-motion expects a string child. Pass plain text or split non-string content before rendering.',
      );
    }

    const splitter = recipe.splitter
      ? readTextMotionSplitterDescriptor(recipe.splitter)
      : undefined;
    const renderer = recipe.renderer
      ? readTextMotionRendererDescriptor(recipe.renderer)
      : undefined;
    const rendererMotionUnit = renderer?.motionUnit ?? 'source-token';

    if (recipe.splitter && rendererMotionUnit === 'rendered-line') {
      throw new Error(
        '@react-native-motion-kit/text-motion rendered-line renderers cannot be combined with .split(...). Remove the splitter or choose a source-token renderer such as nativeText().',
      );
    }

    const tokens = splitter ? splitter.split(children) : [createDefaultToken(children)];
    const Renderer = renderer?.Component;

    if (!Renderer) {
      throw new Error(
        '@react-native-motion-kit/text-motion requires a renderer. Add .layout(nativeText()) or another renderer before .component().',
      );
    }

    validateTextMotionRendererCapabilities(recipe, renderer);

    return (
      <Renderer recipe={recipe} textProps={textProps} tokens={tokens}>
        {children}
      </Renderer>
    );
  }

  TextMotionComponent.displayName = 'TextMotionComponent';

  return TextMotionComponent;
}
