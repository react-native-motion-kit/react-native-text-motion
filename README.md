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

Playback controls are useful when an event should tell a text motion component to play, replay, reset, or stop without remounting. In that mode the app owns the event, while the component still owns playback execution and uses its recipe `.motion()` config.

Basic controls usage:

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  useTextMotionControls,
  words,
} from '@react-native-motion-kit/text-motion';
import { Button } from 'react-native';

const ReplayableReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(fade().and(rise({ y: 12 })))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

export function Headline() {
  const controls = useTextMotionControls();

  return (
    <>
      <ReplayableReveal controls={controls}>
        Replay without remounting
      </ReplayableReveal>
      <Button title="Replay" onPress={controls.replay} />
    </>
  );
}
```

`controls` is a command channel, not a progress value. Use it for buttons, screen focus, onboarding steps, example replay controls, and coordinated title/subtitle replay.

Performance note: controls are intended for short UI text such as titles, labels, and product copy. If you plan to animate long paragraphs, grapheme-split copy, or many rows at once, measure in your target app before treating that as a supported workload.

Controlled progress is useful when text motion should follow a raw value outside the component, such as scroll position, gesture progress, or another Reanimated shared value. In that mode the app owns the exact progress and the text component only renders the current state.

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

`progress` is normalized whole-text progress: `0` is initial and `1` is final. Timeline delays still map that global value to each token's local progress, so `stagger()` and `wave()` keep their timing shape. This is handy when a headline should reveal as a user scrolls a card into view, when text should follow a gesture, or when several UI elements need to share one progress value.

When `progress` is provided, `.motion()` does not run internal autoplay. Choose the playback feel where you update the shared value instead, for example `progress.value = withTiming(1, { duration: 720 })` or `progress.value = withSpring(1)`. `controls` and `progress` cannot be used together.

## Stable MVP Scope

- recipe API: `defineTextMotion().split().layout().timeline().effect().component()`
- splitters: `graphemes`, `words`, `custom`, experimental newline-only `lines`
- renderer: `nativeText`
- timelines: `stagger`, `sequence`, `parallel`, `wave`
- effects: `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`
- presets subpath: `@react-native-motion-kit/text-motion/presets`
- explicit playback `controls` for event-driven play/replay/reset/stop
- controlled progress via external Reanimated shared values
- accessibility default: parent label plus hidden decorative token nodes

`nativeText()` is a transform-first token renderer. It uses a wrapping `View` with animated `Text` tokens so transform effects are visible in React Native. It is not a full React Native `Text` drop-in, and layout props such as `numberOfLines`, `ellipsizeMode`, and `onTextLayout` are intentionally outside the stable MVP contract.

By default, playback is lifecycle-driven: animated tokens autoplay on mount, ordinary parent rerenders with the same text/recipe preserve in-flight progress, and text/effect/timeline/motion changes replay the affected token animation. Text changes are enter-only in the MVP: old text is not kept for exit animation, crossfade, or token diffing. Components also accept `controls` for event-driven playback and `progress`, a Reanimated `SharedValue<number>` from `0` to `1`, for raw externally controlled progress. `controls` uses the component recipe `.motion()` against the current text; `progress` is app-owned and makes changed text follow the current shared value instead of starting autoplay.

Skia, stable line reveal, rich text, and RN-rendered line-to-token mapping are deferred. Context/provider playback wiring and public playback refs are intentionally not part of the design; pass `controls` explicitly where a component should respond to playback commands.

## Scope & Roadmap

`text-motion` stays focused on split text motion: tokenization, layout-aware timing, effects, renderers, split-token playback, accessibility, and presets for titles, labels, onboarding copy, and product copy.

Features that depend on text tokens or text layout can be considered here, including typewriter, scramble, wipe, text-change transitions, and renderer-specific effects behind explicit capability boundaries. Precise line-aware reveal remains deferred until RN layout measurement and token-to-line mapping policies are reliable enough to document.

Features that solve a different problem are likely better served by separate package candidates. Number count-up, odometer, currency, percentage, timer, and delta animations are value-formatting problems rather than split-text layout problems. A separate value-motion package could share Motion Kit conventions without expanding the `text-motion` API surface.

Decision rule: add a feature to `text-motion` only when it improves text-specific production work without making the common recipe API harder to understand.

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
- event-driven playback controls for replay/reset/stop without remounting
- externally controlled raw progress for scroll, gesture, or synchronized text motion
- a lightweight core package without Skia as a required dependency

Wait for a later version if you need:

- playback APIs such as `pause`, `seek`, or `reverse`
- first-class scroll, gesture, or in-view drivers
- precise line reveal, masked reveal, or token-to-line mapping
- Skia effects such as blur, glow, shaders, masks, or glyph distortion
- rich nested text with links, selectable text, or full native `Text` layout parity
- heavy use across long paragraphs, virtualized lists, or dense UI without your own performance validation

Next focus: proving controls in real app flows, then deciding whether state-transition props, `pause`/`seek`/`reverse`, in-view helpers, scroll/gesture drivers, line-aware effects, or optional Skia renderers deserve first-class APIs.

## License

MIT
