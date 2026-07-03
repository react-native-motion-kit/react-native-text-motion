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

Controlled progress is useful when text motion should follow something outside the component, such as a button, onboarding step, screen focus event, scroll position, or gesture progress. In that mode the app owns a Reanimated shared value and the text component only renders the current state.

Basic controlled progress usage:

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';
import { Button } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

const ControlledReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.08))
  .effect(fade().and(rise({ y: 12 })))
  .component();

export function Headline() {
  const progress = useSharedValue(0);

  return (
    <>
      <ControlledReveal progress={progress}>
        Progress drives the whole reveal
      </ControlledReveal>
      <Button title="Play" onPress={() => (progress.value = withTiming(1))} />
    </>
  );
}
```

`progress` is normalized whole-text progress: `0` is initial and `1` is final. Timeline delays still map that global value to each token's local progress, so `stagger()` and `wave()` keep their timing shape. This is handy when a headline should reveal as a user scrolls a card into view, when a label should animate only after a form step is valid, or when a screen wants to replay text on focus without remounting the component.

When `progress` is provided, `.motion()` does not run internal autoplay. Choose the playback feel where you update the shared value instead, for example `progress.value = withTiming(1, { duration: 720 })` or `progress.value = withSpring(1)`. Higher-level controller APIs such as `play`, `pause`, `reset`, and first-class scroll/gesture drivers remain deferred.

## Stable MVP Scope

- recipe API: `defineTextMotion().split().layout().timeline().effect().component()`
- splitters: `graphemes`, `words`, `custom`, experimental newline-only `lines`
- renderer: `nativeText`
- timelines: `stagger`, `sequence`, `parallel`, `wave`
- effects: `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`
- presets subpath: `@react-native-motion-kit/text-motion/presets`
- controlled progress via external Reanimated shared values
- accessibility default: parent label plus hidden decorative token nodes

`nativeText()` is a transform-first token renderer. It uses a wrapping `View` with animated `Text` tokens so transform effects are visible in React Native. It is not a full React Native `Text` drop-in, and layout props such as `numberOfLines`, `ellipsizeMode`, and `onTextLayout` are intentionally outside the stable MVP contract.

By default, playback is lifecycle-driven: animated tokens autoplay on mount, ordinary parent rerenders with the same text/recipe preserve in-flight progress, and text/effect/timeline/motion changes replay the affected token animation. Components also accept `progress`, a Reanimated `SharedValue<number>` from `0` to `1`, for externally controlled playback. When `progress` is provided, `.motion()` no longer runs internal autoplay; drive the shared value yourself with Reanimated timing, spring, scroll, gesture, or focus logic.

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
- externally controlled progress for button, scroll, gesture, or focus-driven text motion
- a lightweight core package without Skia as a required dependency

Wait for a later version if you need:

- stable playback controls such as `play`, `pause`, `seek`, `reset`, or `reverse`
- first-class scroll, gesture, or in-view drivers
- precise line reveal, masked reveal, or token-to-line mapping
- Skia effects such as blur, glow, shaders, masks, or glyph distortion
- rich nested text with links, selectable text, or full native `Text` layout parity
- heavy use across long paragraphs, virtualized lists, or dense UI without your own performance validation

Next focus: playback controls and drivers. Controlled shared-value progress is now the low-level primitive; future work should decide whether `play`, `pause`, `reset`, in-view, scroll, or gesture helpers are worth exposing on top of it. Line-aware effects and optional Skia renderers come after the native renderer, layout behavior, and performance envelope are more proven.

## License

MIT
