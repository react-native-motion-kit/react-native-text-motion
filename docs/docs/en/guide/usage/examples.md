# Examples

These examples use the current public API. Run them in a React Native app after [installation](../getting-started/installation.md). The documentation site presents code; it does not execute these native examples in the browser.

## Start with a preset

Presets are recipe factories imported from the `/presets` subpath. Create the component once outside render.

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroTitle = editorialRise().component();

export function Hero() {
  return (
    <HeroTitle style={{ fontSize: 32, fontWeight: '700' }}>
      Design motion that feels native
    </HeroTitle>
  );
}
```

See [Presets](./presets.md) for `softWave()` and `gentleEmphasis()`.

## Word reveal with replay

```tsx
import { Button, View } from 'react-native';
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  useTextMotionControls,
  words,
} from '@react-native-motion-kit/text-motion';

const WordReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(fade().and(rise({ y: 10 })))
  .motion({ kind: 'timing', options: { duration: 360 } })
  .component();

export function ReplayExample() {
  const controls = useTextMotionControls();

  return (
    <View>
      <WordReveal controls={controls}>A little motion, word by word.</WordReveal>
      <Button title="Replay" onPress={controls.replay} />
    </View>
  );
}
```

`stagger(0.04)` sets starts 40ms apart; `duration: 360` controls each token's motion in milliseconds. Mount autoplay remains enabled with controls. See [Playback](./playback.md) for external progress and the full command set.

## Reveal rendered lines

Use native rendered lines when a title should wrap with the available width. Do not add a splitter to this recipe.

```tsx
import { View } from 'react-native';
import {
  defineTextMotion,
  lineReveal,
  overlayText,
  parentLabelPolicy,
  stagger,
} from '@react-native-motion-kit/text-motion';

const LineTitle = defineTextMotion()
  .layout(overlayText())
  .timeline(stagger(0.08))
  .effect(lineReveal({ y: 18 }))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();

export function RenderedLinesExample() {
  return (
    <View style={{ width: 280 }}>
      <LineTitle style={{ fontSize: 32, lineHeight: 40, fontWeight: '700' }}>
        Let the title follow the lines your layout actually renders
      </LineTitle>
    </View>
  );
}
```

`overlayText()` measures the paragraph after width, font, font scale, and shaping are applied. `lines()` only splits explicit newline characters. See [Renderers](../../api/renderers.md).

## Typewriter with fixed layout

```tsx
import { Button, View } from 'react-native';
import {
  defineTextMotion,
  graphemes,
  nativeText,
  parentLabelPolicy,
  stagger,
  typewriter,
  useTextMotionControls,
} from '@react-native-motion-kit/text-motion';

const TypewriterText = defineTextMotion()
  .split(graphemes())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(typewriter())
  .motion({ kind: 'timing', options: { duration: 0 } })
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();

export function Greeting() {
  const controls = useTextMotionControls();

  return (
    <View>
      <TypewriterText controls={controls}>Hello, 한글! 👩🏽‍💻</TypewriterText>
      <Button title="Replay" onPress={controls.replay} />
      <Button title="Reset" onPress={controls.reset} />
      <Button title="Stop" onPress={controls.stop} />
    </View>
  );
}
```

The complete phrase reserves its space from the start. Each visible token is revealed at its timeline start; spaces and hard newlines keep their space without taking a delay slot. `duration: 0` makes the per-token reveal instant. Typewriter requires `nativeText()` and does not provide a cursor, streaming, or exact single-`Text` wrapping.

For a different phrase that must type from the beginning, remount it with a new React `key`. Appending text is not a streaming API. See [Effects](../../api/effects.md) for composition and [Segmentation](./segmentation.md) for grapheme fallback limits.

## Run the repository example

From the repository root, use the pinned Node and pnpm versions in `.nvmrc` and `package.json`:

```sh
pnpm install
pnpm example start
# Or build and launch the native app:
pnpm example ios
pnpm example android
# Optional browser development:
pnpm example web
```

Native build commands require the platform's normal development tools. Browser rendering is useful for inspection but is not evidence of iOS or Android layout and performance.

The example groups demos under **Presets**, **Splitters**, **Effects**, **Timelines**, **Layout**, and **Playback**. Try **Line Reveal**, **Typewriter Controls**, **Controlled Progress**, and **Renderer Performance** to inspect the corresponding APIs. See [Performance](./performance.md) for how to record measurements.
