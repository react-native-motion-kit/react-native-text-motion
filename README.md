# @react-native-motion-kit/text-motion

High-performance split text animations for React Native, powered by Reanimated and extensible renderers.

This repository is a pnpm workspace for the `@react-native-motion-kit/text-motion` package and Expo example app.

## Package

The library exposes a recipe pipeline:

```txt
split -> layout -> timeline -> effect -> renderer
```

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

## Stable MVP Scope

- recipe API: `defineTextMotion().split().layout().timeline().effect().component()`
- splitters: `graphemes`, `words`, `custom`, experimental newline-only `lines`
- renderer: `nativeText`
- timelines: `stagger`, `sequence`, `parallel`, `wave`
- effects: `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`
- presets subpath: `@react-native-motion-kit/text-motion/presets`
- accessibility default: parent label plus hidden decorative token nodes

`nativeText` executes the stable recipe timeline/effects/motion config through Reanimated per-token styles. Future renderer capabilities stay opaque until a real optional renderer package exercises them.

Skia, stable line reveal, controller playback, rich text, and RN-rendered line-to-token mapping are deferred.

## Install

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

The MVP targets Reanimated 4 and `react-native-worklets@0.10.x`. Follow the official Reanimated setup for New Architecture and worklets configuration.

## Development

```sh
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run build
corepack pnpm --filter example exec expo config --type public
```

## Workspace

```txt
packages/text-motion
example
```

## License

MIT
