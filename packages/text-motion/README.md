# @react-native-motion-kit/text-motion

High-performance split text animations for React Native, powered by Reanimated and extensible renderers.

Korean documentation: [README.ko.md](./README.ko.md)

`text-motion` is built for short titles, labels, onboarding copy, product copy, and other UI text that benefits from token-level motion.

It is not a single prop-heavy wrapper like this:

```tsx
<AnimatedText text="Hello" animation="fadeIn" delay={100} />
```

Instead, it helps you create reusable animated text components by composing the text splitting strategy, token renderer, timeline, and effects:

```txt
split -> layout(renderer) -> timeline -> effect -> motion/accessibility -> component
```

Use a preset when you want a good default. Create a custom recipe when you need to decide how text is split, how tokens are rendered, when each visible token starts, and what each token does.

For TypeScript users, `.component()` is only available after a renderer is selected with `.layout(...)`. `.recipe()` can still be used before layout when you need to inspect or pass around an unfinished recipe.

## Installation

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

The MVP peer dependency minimums are:

- `react-native-reanimated`: `>=4.0.0`
- `react-native-worklets`: `>=0.5.0`

Follow the official Reanimated and Worklets setup for your app, including the New Architecture requirements of Reanimated 4.

## Quick Start

Use a preset when you want a good default with very little code:

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

`editorialRise()` is a recipe factory. Internally it splits the sentence into words, renders with `nativeText()`, starts near the center, and combines `rise`, `fade`, and subtle `scale`.

## Custom Recipe

Create a recipe when you want control:

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

const ProductHeadline = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.032, { from: 'center' }))
  .effect(rise({ y: 14 }).and(fade()).and(scale({ from: 0.98 })))
  .motion({ kind: 'timing', options: { duration: 320 } })
  .component();

export function Header() {
  return <ProductHeadline>Design motion that feels native</ProductHeadline>;
}
```

The `0.032` value is seconds. Each visible token starts 32ms after the previous timing slot from the selected origin. The `duration` controls how long each token animates after its own delay begins.

### Motion Options

`.motion()` accepts a small discriminated config:

```tsx
.motion({ kind: 'timing', options: { duration: 320 } });
.motion({ kind: 'spring', options: { damping: 14, stiffness: 160 } });
```

`timing` options follow Reanimated's `withTiming` config and `spring` options follow Reanimated's `withSpring` config. `reduceMotion` is intentionally not accepted there because text-motion controls reduced-motion behavior through the accessibility policy.

Function-valued options, such as a custom `easing`, are compared by reference when text-motion decides whether an in-flight animation should keep playing or replay. Hoist or reuse the same function reference when a parent rerender should preserve progress; creating a new function is treated as a motion config change.

`.motion()` configures playback owned by text-motion. It is used by mount autoplay and by `controls` commands. When a component receives raw `progress`, the app owns playback, so `.motion()` is not applied to that instance.

## Presets

Presets are composable recipe factories, not string names.

```tsx
import {
  editorialRise,
  gentleEmphasis,
  softWave,
} from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();
const ProductCopy = softWave().component();
const LabelEmphasis = gentleEmphasis().component();
```

- `editorialRise()` - title reveal that starts near the center and expands outward.
- `softWave()` - product-copy reveal with sine-wave token delays.
- `gentleEmphasis()` - small-label emphasis with fade and a midpoint pulse.

## Splitters

Splitters decide what a token is.

Splitter factories validate their inputs, but the returned splitter is an opaque handle. Pass it to `defineTextMotion().split(...)`; descriptor fields such as `kind` and the internal `split` function are intentionally not part of the root user API.

### Words

```tsx
const WordReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.034))
  .effect(fade().and(rise({ y: 10 })))
  .component();
```

`words()` preserves spacing tokens for rendering, but whitespace does not consume timeline delay slots. In `"Words move as groups"`, the visible words animate as indices `0, 1, 2, 3`.

### Graphemes

```tsx
const GlyphReveal = defineTextMotion()
  .split(graphemes())
  .layout(nativeText())
  .timeline(stagger(0.014, { from: 'center' }))
  .effect(fade().and(scale({ from: 0.86 })))
  .component();
```

`graphemes()` is character-level motion for user-perceived characters. It is safer than `text.split('')` for accents, Korean, emoji sequences, CJK, and RTL samples.

### Lines

```tsx
const LineReveal = defineTextMotion()
  .split(lines())
  .layout(nativeText())
  .timeline(stagger(0.12))
  .effect(slide({ y: 16 }).and(fade()))
  .component();
```

`lines()` is experimental and newline-only. It splits on explicit `\n` characters. It does not measure automatic React Native line wrapping.

### Custom

```tsx
const CustomReveal = defineTextMotion()
  .split(custom((input) => input.match(/\S+|\s+/g) ?? []))
  .layout(nativeText())
  .timeline(stagger(0.028, { from: 'edges' }))
  .effect(rise({ y: 8 }).and(fade()))
  .component();
```

Use `custom()` for product-specific token boundaries such as hashtags, mentions, prices, punctuation groups, or domain-specific terms. A custom splitter may return strings or token objects:

```tsx
custom((input) => [
  {
    text: input,
    metadata: { kind: 'headline' },
    sourceRange: { start: 0, end: input.length },
  },
]);
```

If your custom splitter returns plain strings, `text-motion` finds each token in the original text from left to right. This is enough for common splitters such as `input.match(...)`.

If your splitter returns tokens out of order, repeats the same text intentionally, or needs exact original positions, return token objects with `sourceRange` instead of plain strings.

## Timelines

Timelines calculate per-token start delays in seconds.

```tsx
stagger(0.04);
stagger(0.04, { from: 'center' });
stagger(0.04, { from: 'end' });
stagger(0.04, { from: 'edges' });
wave({ amplitude: 0.06, wavelength: 5 });
sequence(stagger(0.02), wave({ amplitude: 0.04, wavelength: 4 }));
parallel(stagger(0.08), wave({ amplitude: 0.05, wavelength: 3 }));
```

- `stagger(step)` - fixed delay step from an origin.
- `wave()` - sine-wave delay pattern across token indices.
- `sequence()` - adds multiple timeline delays together.
- `parallel()` - uses the earliest delay from multiple timelines.

Timeline factories validate their input options, but the returned timeline is an opaque handle. Pass it to `.timeline(...)`; descriptor fields such as `delayFor`, `name`, and `options` are intentionally not part of the root user API.

Numeric timeline inputs must be finite. `stagger()` accepts a non-negative step, `wave()` accepts a non-negative amplitude, and `wave()` requires `wavelength > 0`.

## Effects

Effects describe how each token moves.

```tsx
fade();
rise({ y: 14 });
slide({ x: -12, y: 8 });
scale({ from: 0.92, to: 1 });
pulse({ scale: 1.08 });
shake({ x: 6 });
```

Effects compose with `.and(...)`:

```tsx
rise({ y: 14 }).and(fade()).and(scale({ from: 0.98 }));
```

`pulse()` is a midpoint emphasis effect. It scales each token up near the middle of its animation and returns to the composed final scale. Use `scale()` when the text should start or end at a different size.

Effect factories validate their input options, but the returned effect is an opaque handle. Compose effects with `.and(...)`; descriptor fields such as `name`, `options`, and `requiredCapabilities` are intentionally hidden from the root user API.

Numeric built-in effect inputs must be finite numbers. Negative offsets are allowed where the option represents direction, such as `rise({ y })`, `slide({ x, y })`, and `shake({ x })`.

## Native Renderer Contract

`nativeText()` is the stable MVP renderer. It uses a wrapping `View` with animated `Text` tokens so transform effects such as `rise()`, `slide()`, `scale()`, and `pulse()` are visible in React Native.

`nativeText()` returns an opaque renderer handle for `.layout(...)`. Descriptor fields such as `kind`, `capabilities`, and the implementation `Component` are intentionally hidden from the root user API.

This is not a full React Native `Text` drop-in. It favors reliable per-token transforms over exact platform text layout. Full RN line-to-token mapping remains deferred.

Components created with `nativeText()` intentionally support a narrow prop surface:

- `style`
- `testID`
- `nativeID`
- `allowFontScaling`
- `maxFontSizeMultiplier`
- `controls`
- `progress`
- `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, `accessibilityState`, `accessibilityValue`, `accessibilityActions`, `accessibilityLanguage`, and `onAccessibilityAction`

Layout and interaction props that require a single native text node are not part of the stable MVP contract. This includes `numberOfLines`, `ellipsizeMode`, `lineBreakMode`, `onTextLayout`, `selectable`, and text `onPress` handlers.

Use `nativeText({ testIDPrefix: 'word' })` when tests need stable per-token `testID` values:

```tsx
const TestableReveal = defineTextMotion()
  .split(words())
  .layout(nativeText({ testIDPrefix: 'word' }))
  .effect(fade())
  .component();
```

## Playback Lifecycle

The default lifecycle is automatic and input-driven.

- Initial mount autoplays animated visible tokens from their initial style to their target style.
- Parent rerenders with the same text and same recipe preserve in-flight progress.
- Text changes replay the affected token animation, even when the token shape is the same.
- Effect, timeline, or motion config changes reset affected animated tokens and autoplay with the updated inputs.
- Whitespace/static tokens preserve layout text but do not animate or consume motion index.
- `parentLabelPolicy({ reducedMotion: 'final-state' })` keeps reduced-motion users at the final style without flashing through the initial animated state.

The example app may remount its demo player to make repeated inspection convenient. Treat that as demo UI behavior, not the recommended app API.

### Playback Controls

Use `controls` when an event should tell a text motion component to play, replay, reset, or stop.

Common examples:

- a headline reveals after the user taps a button
- onboarding copy advances with the current step
- a screen title replays when a screen receives focus
- a label appears only after a form field becomes valid
- a hero title and subtitle replay together from one control

In these cases, the app owns the event, but the text component still owns playback execution. The component uses its recipe, timeline, effects, and `.motion()` config.

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
  .effect(rise({ y: 12 }).and(fade()))
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
      <Button title="Reset" onPress={controls.reset} />
    </>
  );
}
```

`controls` is a command channel, not a progress value:

- `play()` moves from the current progress toward the final state.
- `replay()` resets to the initial state and plays again with timeline delays.
- `reset()` cancels playback and returns to the initial state.
- `stop()` cancels playback and keeps the current visual progress.

One controls object may be passed to multiple text motion components. Commands broadcast to every attached component, and each component executes the command with its own recipe.

`controls` and `progress` cannot be used together. Use `controls` for discrete events such as buttons and screen focus. Use `progress` when text should follow a continuous value.

Text Motion intentionally does not provide a context/provider playback API or a public component ref API. Pass controls explicitly with `controls={controls}` so the connection is visible in JSX.

Performance note: controls are designed for short UI text. For a title, label, or short product sentence, playback work should stay small and predictable. For long paragraphs, dense lists, or grapheme-split text with many characters, check the example stress case and measure on your target device before using it in production.

The renderer internals may change as larger workloads become important, so treat the example stress case as a profiling aid rather than a public promise about how controls are implemented.

### Raw Progress

Use `progress` when text motion should follow a raw value the app already owns.

Common examples:

- text follows a scroll or gesture shared value
- several UI elements need to move from the same shared progress value
- a custom Reanimated sequence should drive the phrase from `0` to `1`

In these cases, the text component should not decide when to start or how the value moves. The app owns a Reanimated shared value and passes it to the text component.

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

const ProgressReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.08))
  .effect(rise({ y: 12 }).and(fade()))
  .component();

export function Headline() {
  const progress = useSharedValue(0);

  return (
    <>
      <ProgressReveal progress={progress}>
        Progress drives the whole reveal
      </ProgressReveal>

      <Button
        title="Play"
        onPress={() => {
          progress.value = withTiming(1, { duration: 720 });
        }}
      />
    </>
  );
}
```

`progress` is normalized whole-text progress:

- `0` renders the initial token styles.
- `1` renders every animated token at its final style.
- Values outside `0..1` are clamped.
- Non-finite values are treated as `0`.

Think of `progress` as the progress of the whole phrase, not of one word. If you use `stagger(0.08)`, the first word can already be finished while the later words are still catching up. The renderer maps the global shared value to each visible token's local progress, so `stagger()`, `wave()`, `sequence()`, and `parallel()` keep their timing shape in controlled mode. Whitespace is still rendered but does not consume a motion index.

When `progress` is provided, the app owns playback and `.motion()` does not start internal autoplay. Choose the playback curve where you update the shared value:

```tsx
progress.value = withTiming(1, { duration: 720 });
progress.value = withSpring(1);
progress.value = 0;
```

If this rendered component receives `progress`, `.motion()` is not applied to that instance. Add `.motion()` only for autoplay or controls-driven versions of the same recipe.

Important limitation: controlled mode currently uses a fixed token timeline span of `1.0` inside the whole-text progress mapping. In practice that means timeline delays shape when each token starts, while your `withTiming` or `withSpring` call shapes how fast the entire phrase moves from `0` to `1`. If a future version needs per-token span or duration controls in controlled mode, that should be added as an explicit API instead of silently borrowing `.motion()` duration.

First-class `pause`, `seek`, `reverse`, screen focus, in-view, scroll, and gesture drivers remain deferred.

## Accessibility

The default renderer uses a parent accessible label and hides decorative animated token nodes, so screen readers read the phrase once instead of token by token.

```tsx
import { parentLabelPolicy } from '@react-native-motion-kit/text-motion';

const ReducedReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .effect(rise().and(fade()))
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();
```

## React Native Text Segmentation

React Native/Hermes does not guarantee `Intl.Segmenter` in every runtime. The built-in splitters detect it first and use it when available. When it is missing, `graphemes()` and `words()` fall back to a small internal tokenizer so animations do not crash at app startup.

The fallback is designed for resilient UI motion, not full ICU-level locale segmentation. Apps that need exact locale-aware word boundaries, especially for scripts with complex word breaking, should load an `Intl.Segmenter` polyfill such as `@formatjs/intl-segmenter` in the app entrypoint before rendering text motion components, or pass a `custom()` splitter for product-specific tokenization.

## Stable MVP

- `defineTextMotion()`
- `graphemes()`, `words()`, `custom()`
- experimental newline-only `lines()`
- `nativeText()`
- `stagger()`, `sequence()`, `parallel()`, `wave()`
- `fade()`, `rise()`, `slide()`, `scale()`, `pulse()`, `shake()`
- `useTextMotionControls()` with explicit `controls` prop for event-driven play/replay/reset/stop
- controlled `progress` via external Reanimated shared values
- parent-label accessibility policy with hidden animated token nodes
- `/presets` subpath recipe factories

Custom effect factories and renderer capability factories are intentionally not exported from the root MVP API. `nativeText()` only implements the built-in native text effects listed above. A stable renderer-extension SDK will be designed before those helpers become public.

## Deferred

These are intentionally not stable exports in the MVP:

- custom effect factory API
- renderer capability factory API
- `lineReveal`
- `wipe`
- `typewriter`
- `scramble`
- stable `overlayText`
- Skia renderer or Skia-only effects
- playback APIs such as `pause`, `seek`, or `reverse`
- first-class screen focus, in-view, scroll, or gesture drivers
- RN-rendered line-to-token mapping

Skia remains an optional future package boundary, not a dependency of this core package.

Context/provider playback wiring and public component ref playback are not deferred features. They are intentionally outside this package's API shape because they hide ownership and make remount/lifecycle behavior easier to misuse. Use explicit `controls={controls}` wiring when one or more text components should respond to event-driven playback commands.

## Should You Use It?

This package is intentionally small in the MVP. It is best suited for short, high-value UI text where split motion improves the experience without taking over layout.

Use it today for:

- hero titles, section titles, short labels, onboarding copy, and product descriptions
- word or grapheme entrance motion with `fade`, `rise`, `slide`, `scale`, `pulse`, or `shake`
- reusable recipe components created from presets or `defineTextMotion()`
- event-driven replay/reset/stop controls without remounting the component
- raw progress with an external Reanimated shared value
- apps that already use Reanimated 4 and can follow its Worklets setup
- accessible decorative text motion where the full phrase should remain readable once

Wait for a later version if your feature depends on:

- playback APIs such as `pause`, `seek`, or `reverse`
- scroll progress, gesture progress, or viewport/in-view triggers as first-class drivers
- exact line-level animation, clipping, masking, or per-token line measurement
- Skia-only visual effects such as blur, glow, shaders, masks, or glyph distortion
- rich nested text, inline links, selectable text, or exact native `Text` behavior
- long paragraphs or many animated rows without measuring performance in your target app

The next product focus is proving the controls API in real apps and then deciding whether state-transition props, `pause`/`seek`/`reverse`, screen focus helpers, in-view helpers, or scroll/gesture drivers deserve first-class APIs. Items listed under Deferred are not release promises. They should move into the stable API only when the behavior, examples, tests, and documentation are ready.

## Development

```sh
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run build
```

## License

MIT
