# @react-native-motion-kit/text-motion

High-performance split text animations for React Native, powered by Reanimated and extensible renderers.

This package is the stable MVP for short titles, labels, and product copy. It is built around a recipe pipeline:

```txt
split -> layout -> timeline -> effect -> renderer
```

## Installation

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

The MVP targets Reanimated 4:

- `react-native-reanimated`: `>=4.0.0 <5`
- `react-native-worklets`: `0.10.x`

Follow the official Reanimated and Worklets setup for your app, including the New Architecture requirements of Reanimated 4.

## Usage

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  scale,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';

const HeroReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.032, { from: 'center' }))
  .effect(rise({ y: 14 }).and(fade()).and(scale({ from: 0.98 })))
  .motion({ kind: 'timing', options: { duration: 320 } })
  .component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

Presets are composable recipe factories:

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();
```

## Stable MVP

- `defineTextMotion()`
- `graphemes()`, `words()`, `custom()`
- experimental newline-only `lines()`
- `nativeText()`
- `stagger()`, `sequence()`, `parallel()`, `wave()`
- `fade()`, `rise()`, `slide()`, `scale()`, `pulse()`, `shake()`
- parent-label accessibility policy with hidden animated token nodes
- `/presets` subpath recipe factories

`nativeText()` consumes the recipe timeline, effects, motion config, and reduced-motion policy to drive per-token Reanimated styles. Custom splitters may return either strings or `{ text, sourceRange, metadata }` objects when exact token provenance matters.

## Deferred

These are intentionally not stable exports in the MVP:

- `lineReveal`
- `wipe`
- `typewriter`
- `scramble`
- stable `overlayText`
- Skia renderer or Skia-only effects
- controller playback APIs such as `play`, `pause`, `seek`, `reset`, `reverse`
- RN-rendered line-to-token mapping

Skia remains an optional future package boundary, not a dependency of this core package.

## Accessibility

The default renderer uses a parent accessible label and hides decorative animated token nodes, so screen readers read the phrase once instead of token by token.

## Development

```sh
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run build
```

## License

MIT
