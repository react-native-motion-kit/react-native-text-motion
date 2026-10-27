# Effects

Effects describe the visual change of each motion unit. Import them from `@react-native-motion-kit/text-motion` and pass a compatible effect to `.effect(...)` after selecting a renderer.

## Factories and defaults

Every option is optional; `typewriter()` takes no options. All numeric effect inputs must be finite. Directional offsets can be negative. Offsets use React Native layout units, opacity is a scalar, and scale values are multipliers.

| Factory | Options and defaults | Behavior | Renderer |
| --- | --- | --- | --- |
| `fade(options?)` | `from: 0`, `to: 1` | Changes opacity from `from` to `to` | Both |
| `rise(options?)` | `y: 12` | Starts offset downward by `y`, then moves into place | Both |
| `slide(options?)` | `x: 0`, `y: 12` | Starts at an x/y offset, then moves into place | Both |
| `scale(options?)` | `from: 0.96`, `to: 1` | Changes the scale multiplier | Both |
| `pulse(options?)` | `scale: 1.04` | Peaks around the midpoint, then returns to the composed final scale | Both |
| `shake(options?)` | `x: 4` | Starts with a horizontal offset for a shake-like entrance | Both |
| `lineReveal(options?)` | `y: 16`, `fromOpacity: 0` | Reveals rendered lines through masks | `overlayText()` |
| `typewriter()` | None | Hides a token until its local progress becomes positive | `nativeText()` |

`shake()` is an entrance offset; it does not create a repeating oscillation. `pulse()` provides midpoint emphasis; use `scale()` when the starting or ending size should change.

The root exports `FadeOptions`, `RiseOptions`, `SlideOptions`, `ScaleOptions`, `PulseOptions`, `ShakeOptions`, and `LineRevealOptions`. Their properties match the table above.

## Compose with `.and(...)`

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

const HeroTitle = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(rise({ y: 14 }).and(fade()).and(scale({ from: 0.98 })))
  .component();

export function Heading() {
  return <HeroTitle>A little motion, a clear message</HeroTitle>;
}
```

`.and(...)` returns a composed `TextMotionEffect`. Repeated `.effect(...)` calls also append effects. Transform offsets accumulate and scale multipliers multiply; opacity-setting effects are applied in composition order. Prefer one clear opacity effect when combining recipes.

Effects require compatible renderer capabilities. `lineReveal()` cannot be used with `nativeText()`, and `typewriter()` cannot be used with `overlayText()`. TypeScript checks valid combinations; runtime checks also reject incompatible effects.

## `lineReveal()`

```tsx
import {
  defineTextMotion,
  lineReveal,
  overlayText,
  stagger,
} from '@react-native-motion-kit/text-motion';

const HeroLines = defineTextMotion()
  .layout(overlayText())
  .timeline(stagger(0.08))
  .effect(lineReveal({ y: 18, fromOpacity: 0 }))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();
```

Do not add a splitter. The renderer measures actual wrapped lines. The reveal offset moves the paragraph copy inside each mask, while opacity applies to the line frame. Composed `scale()` and `pulse()` transform the measured line frame. See [Renderers](./renderers.md) for layout and measurement behavior.

## `typewriter()`

Use this for fixed-layout character reveals. The splitter chooses the reveal unit, the timeline chooses its start, and `.motion()` chooses any subsequent movement.

```tsx
import {
  defineTextMotion,
  graphemes,
  nativeText,
  parentLabelPolicy,
  stagger,
  typewriter,
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
  return <TypewriterText>안녕 세계! 👩🏽‍💻</TypewriterText>;
}
```

The completed phrase's space and line breaks remain in place from the start. Visible graphemes get delay slots 40ms apart; whitespace and explicit newlines keep their layout without taking a slot. Punctuation takes a slot like other visible characters. The first character appears on the first playback update, and display timing follows device frames.

`duration: 0` makes each reveal instant in autoplay or controls mode. To move a character after it appears, use a nonzero duration and compose an effect such as `typewriter().and(rise({ y: 6 }))`. Composing `fade()` intentionally makes appearance gradual. The visibility gate works in either composition order; adding `typewriter()` twice does not add another clock.

Use [controls](../guide/usage/playback.md) for replay/reset/stop. `stop()` preserves the current state; a later `play()` does not promise exact continuation of the remaining typing schedule. To type a new phrase fully from its start, remount with a new React `key`. Appending text is not a streaming API.

With external `progress`, `0` hides the animated characters and `1` shows the final state. **Progress is timeline progress, not the percentage of characters shown.** For maximum delay `D` and a character's delay `d`, local progress is `clamp(progress × (D + 1) - d, 0, 1)`. A character becomes visible when this is greater than zero. Decreasing progress past its start hides it again. `.motion()` is ignored in external-progress mode.

This effect does not grow or delete the underlying string, provide a cursor, guarantee single-`Text` shaping, or implement streaming. Use it with short UI copy and measure larger workloads.

## Public scope

Effect handles expose `.and(...)`; internal `name`, `options`, and `requiredCapabilities` fields are not public. Custom effect factories, `wipe`, `scramble`, and Skia effects are outside the current API.
