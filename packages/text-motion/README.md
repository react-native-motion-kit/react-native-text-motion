# React Native Text Motion

> English | [한국어](https://github.com/react-native-motion-kit/react-native-text-motion/blob/main/packages/text-motion/README.ko.md)

<div align="center">
  <img src="https://raw.githubusercontent.com/react-native-motion-kit/react-native-text-motion/main/docs/docs/public/logo.png" width="300" alt="React Native Motion Kit logo" />
</div>

## Overview

`@react-native-motion-kit/text-motion` brings composable text animations to React Native with Reanimated. Build reusable animated components for short titles, labels, onboarding copy, and product copy by choosing how text is split, rendered, timed, and animated.

### Key Features

- **Composable recipes** — Combine splitting, layout, timelines, and effects with a typed API.
- **Word and character motion** — Animate words or graphemes with `nativeText()`, including character-by-character `typewriter()` reveals.
- **Rendered-line reveals** — Use `overlayText()` and `lineReveal()` to animate the lines React Native actually rendered.
- **Playback control** — Trigger play/replay/reset/stop from events or drive progress with an external Reanimated shared value.
- **Accessibility** — Read the whole phrase as one label, hide decorative tokens from screen readers, and respect reduced motion by default.
- **Ready-to-use presets** — Start with a preset, then customize its recipe when needed.

## Quick Start

### Documentation

[Full documentation](https://react-native-text-motion.pages.dev/) · [Installation](https://react-native-text-motion.pages.dev/guide/getting-started/installation.html) · [Quick start](https://react-native-text-motion.pages.dev/guide/getting-started/quick-start.html)

### Examples

- [Examples gallery](https://react-native-text-motion.pages.dev/guide/usage/examples.html) — Explore demos and their source code.
- [Expo example app](https://github.com/react-native-motion-kit/react-native-text-motion/tree/main/example) — Run recipes, playback controls, and native rendered-line examples.

### AI

See [Use with AI tools](https://react-native-text-motion.pages.dev/guide/getting-started/ai.html) for documentation workflows.

- [llms.txt](https://react-native-text-motion.pages.dev/llms.txt) — A structured index of documentation pages.
- [llms-full.txt](https://react-native-text-motion.pages.dev/llms-full.txt) — The complete documentation in one text file.
- [Korean index](https://react-native-text-motion.pages.dev/ko/llms.txt) · [Korean full documentation](https://react-native-text-motion.pages.dev/ko/llms-full.txt)

### Installation

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

The peer minimums are Reanimated `4.0.0` and Worklets `0.5.0`. These minimums are not a complete native compatibility matrix. Follow the [installation guide](https://react-native-text-motion.pages.dev/guide/getting-started/installation.html) and [official Reanimated setup](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) for your React Native or Expo version. Reanimated 4 requires the New Architecture.

### Basic Usage

Create a component from a preset and pass the text you want to animate:

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

// Create the reusable component outside render.
const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

For custom motion, compose a recipe. `stagger()` uses seconds, and `.component()` requires a renderer selected with `.layout(...)`.

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';

const WordReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(fade().and(rise({ y: 12 })))
  .component();
```

Continue with the [recipe API](https://react-native-text-motion.pages.dev/api/recipe.html), [renderers](https://react-native-text-motion.pages.dev/api/renderers.html), and [playback guide](https://react-native-text-motion.pages.dev/guide/usage/playback.html). Use either `controls` or external `progress` on an instance; they cannot be combined.

## Scope

Designed for short UI text, this library does not replace every native `Text` feature. `nativeText()` animates source tokens; `overlayText()` animates actual rendered lines and must not use `.split(...)`. The `lines()` splitter handles explicit `\n` characters only.

Measure long paragraphs and many animated rows on target devices. Browser demos are not native performance evidence. See [performance guidance](https://react-native-text-motion.pages.dev/guide/usage/performance.html) and [accessibility](https://react-native-text-motion.pages.dev/guide/usage/accessibility.html).

## Contributing

[Contributing guide and development setup](https://github.com/react-native-motion-kit/react-native-text-motion/blob/main/CONTRIBUTING.md)

## License

[MIT](./LICENSE)
