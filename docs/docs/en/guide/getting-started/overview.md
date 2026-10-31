# Overview

`@react-native-motion-kit/text-motion` creates reusable animated text components for React Native. Compose text splitting, rendering, timing, effects, and accessibility in a recipe, then render the result as a component.

```txt
split → layout(renderer) → timeline → effect → motion/accessibility → component
```

This documentation describes the current `0.1.0` public API.

## Choose your starting point

Use a [preset](../usage/presets.mdx) for common title, label, and product-copy animation. Use a [custom recipe](../usage/recipes.mdx) when you need to choose the motion unit, timing, or effects.

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroTitle = editorialRise().component();

export function Hero() {
  return <HeroTitle>Design motion that feels native</HeroTitle>;
}
```

The component accepts a plain string child. Define it outside your React render function so a parent rerender reuses the same component type.

## What you can build

| Need | Public API |
| --- | --- |
| Animate words or user-perceived characters | `words()` or `graphemes()` with `nativeText()` |
| Reveal the lines React Native actually wraps | `overlayText()` with `lineReveal()`, without `.split(...)` |
| Reveal characters while reserving the complete phrase's layout | `graphemes()`, `nativeText()`, and `typewriter()` |
| Replay after a button or another app event | `useTextMotionControls()` and the `controls` prop |
| Follow scroll, gestures, or another app-owned animation | A Reanimated shared value passed as `progress` |
| Keep the phrase readable to screen readers | Parent-label accessibility with decorative token nodes hidden |

`controls` sends playback commands; `progress` supplies the current visual state. An instance accepts one of these playback inputs at a time.

## Scope and limits

The intended workloads are short titles, headings, labels, onboarding copy, and product descriptions. Measure long paragraphs, many rows, and large grapheme counts on your target devices before adopting them.

`nativeText()` uses containers around moving tokens and does not reproduce every behavior of a single native `Text`. Rich nested children, inline links, selectable text, and text `onPress` are outside the component contract. `lines()` splits explicit `\n` characters only; use `overlayText()` for automatic wrapping.

The current public API does not include custom effect factories, a renderer-extension SDK, Skia effects, `pause`/`seek`/`reverse`, or built-in scroll, gesture, screen-focus, and in-view drivers. Apps can connect their own events through `controls` and continuous shared values through `progress`. Text changes are enter-only; the library does not retain old text for exit animation or provide a streaming-text API.

Continue with [installation](./installation.md), then create your first component in the [quick start](./quick-start.mdx).
