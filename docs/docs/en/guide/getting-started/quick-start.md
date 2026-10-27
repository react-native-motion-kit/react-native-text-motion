# Quick Start

Complete [installation](./installation.md), then choose a preset or create a recipe. Both approaches return a reusable React component.

## Start with a preset

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return (
    <HeroReveal style={{ fontSize: 32, fontWeight: '700' }}>
      Design motion that feels native
    </HeroReveal>
  );
}
```

`editorialRise()` uses word tokens, a centered stagger, and combined rise, fade, and scale effects. The component autoplays when it mounts.

## Create a word reveal

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  parentLabelPolicy,
  rise,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';

const WordReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(fade().and(rise({ y: 12 })))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();

export function Headline() {
  return <WordReveal style={{ fontSize: 28 }}>Make every word count</WordReveal>;
}
```

The timeline uses **seconds**: `stagger(0.04)` starts visible words 40ms apart. Motion `duration` uses **milliseconds**: each token animates for 420ms after its delay. Whitespace keeps its layout space without taking a delay slot. The accessibility policy exposes the complete phrase once and shows the final state when reduced motion is enabled.

## Reveal actual rendered lines

Use `overlayText()` when width and font settings should determine the animated lines. This renderer owns line measurement, so omit `.split(...)`.

```tsx
import {
  defineTextMotion,
  lineReveal,
  overlayText,
  stagger,
} from '@react-native-motion-kit/text-motion';

const LineTitle = defineTextMotion()
  .layout(overlayText())
  .timeline(stagger(0.08))
  .effect(lineReveal({ y: 18 }))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

export function ResponsiveTitle() {
  return (
    <LineTitle style={{ fontSize: 32, lineHeight: 40, maxWidth: 320 }}>
      Motion follows the lines your layout creates
    </LineTitle>
  );
}
```

`lines()` is different: it splits only explicit newline characters and does not measure wrapping.

## Next steps

- Learn how [recipes](../usage/recipes.md) compose and how to customize [presets](../usage/presets.md).
- Add [playback controls or external progress](../usage/playback.md).
- Compare [renderers](../../api/renderers.md), [effects](../../api/effects.md), and [component props](../../api/component-props.md).
