import type {
  TextMotionComponent,
  TextMotionComponentProps,
  TextMotionInternalRecipeConfig,
} from '../types';
import type { TextMotionToken } from '../types/token';

import { readTextMotionRendererDescriptor, readTextMotionSplitterDescriptor } from './descriptors';

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
  recipe: TextMotionInternalRecipeConfig,
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
    const tokens = splitter ? splitter.split(children) : [createDefaultToken(children)];
    const Renderer = renderer?.Component;

    if (!Renderer) {
      throw new Error(
        '@react-native-motion-kit/text-motion requires a renderer. Add .layout(nativeText()) or another renderer before .component().',
      );
    }

    return (
      <Renderer recipe={recipe} textProps={textProps} tokens={tokens}>
        {children}
      </Renderer>
    );
  }

  TextMotionComponent.displayName = 'TextMotionComponent';

  return TextMotionComponent;
}
