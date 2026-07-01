# @react-native-motion-kit/text-motion

High-performance split text animations for React Native, powered by Reanimated and extensible renderers.

Korean documentation: [README.ko.md](./README.ko.md)

Package documentation: [packages/text-motion/README.md](./packages/text-motion/README.md)

This repository is a pnpm workspace for the `@react-native-motion-kit/text-motion` package and Expo example app.

## Package

`text-motion` is not a single prop-heavy wrapper like `<AnimatedText animation="fadeIn" />`. It helps you create reusable animated text components by choosing how the text is split, when each visible token starts, and which effects are applied.

The package exposes that as a recipe pipeline:

```txt
split -> layout(renderer) -> timeline -> effect -> motion/accessibility -> component
```

Use presets when you want a good default quickly. Compose a recipe when you need to control tokenization, timing, effects, accessibility, or renderer choice.

For TypeScript users, `.component()` is only available after a renderer is selected with `.layout(...)`. `.recipe()` can still be used before layout when you need to inspect or pass around an unfinished recipe.

Quick preset usage:

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

Custom recipe usage:

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
  .timeline(stagger(0.034))
  .effect(fade().and(rise({ y: 10 })))
  .component();
```

## Stable MVP Scope

- recipe API: `defineTextMotion().split().layout().timeline().effect().component()`
- splitters: `graphemes`, `words`, `custom`, experimental newline-only `lines`
- renderer: `nativeText`
- timelines: `stagger`, `sequence`, `parallel`, `wave`
- effects: `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`
- presets subpath: `@react-native-motion-kit/text-motion/presets`
- accessibility default: parent label plus hidden decorative token nodes

`nativeText()` is a transform-first token renderer. It uses a wrapping `View` with animated `Text` tokens so transform effects are visible in React Native. It is not a full React Native `Text` drop-in, and layout props such as `numberOfLines`, `ellipsizeMode`, and `onTextLayout` are intentionally outside the stable MVP contract.

Skia, stable line reveal, controller playback, rich text, and RN-rendered line-to-token mapping are deferred.

## Install

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

The MVP peer dependency minimums are `react-native-reanimated@>=4.0.0` and `react-native-worklets@>=0.5.0`. Follow the official Reanimated setup for New Architecture and Worklets configuration.

## Workspace

```txt
react-native-text-motion/
  example/
  packages/
    text-motion/
```

## Development

```sh
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run build
corepack pnpm run example:build
```

Useful package-level docs:

- [Package README](./packages/text-motion/README.md)
- [Package Korean README](./packages/text-motion/README.ko.md)

## Should You Use It?

Use this package today when you need:

- entrance motion for short React Native text such as titles, labels, onboarding copy, or product copy
- word-level or grapheme-level reveal effects powered by Reanimated
- reusable motion recipes instead of one-off animation props
- accessible split text that screen readers read as one phrase
- a lightweight core package without Skia as a required dependency

Wait for a later version if you need:

- stable playback controls such as `play`, `pause`, `seek`, `reset`, or `reverse`
- scroll-driven, gesture-driven, or in-view text motion
- precise line reveal, masked reveal, or token-to-line mapping
- Skia effects such as blur, glow, shaders, masks, or glyph distortion
- rich nested text with links, selectable text, or full native `Text` layout parity
- heavy use across long paragraphs, virtualized lists, or dense UI without your own performance validation

Next focus: motion drivers and playback control. The core should first make replay/reset/play behavior explicit, then support controlled progress through Reanimated shared values. Line-aware effects and optional Skia renderers come after the native renderer, layout behavior, and performance envelope are more proven.

## License

MIT
