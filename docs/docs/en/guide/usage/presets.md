# Presets

Presets are recipe factories from `@react-native-motion-kit/text-motion/presets`. Each factory returns a builder with words, `nativeText()`, a timeline, and effects already selected. Call `.component()` to create a component, or customize the builder first.

```tsx
import {
  editorialRise,
  gentleEmphasis,
  softWave,
} from '@react-native-motion-kit/text-motion/presets';

const HeroTitle = editorialRise().component();
const ProductCopy = softWave().component();
const Label = gentleEmphasis().component();

export function ProductHeader() {
  return (
    <>
      <HeroTitle>Give your words a little motion</HeroTitle>
      <ProductCopy>Reusable animation for short product copy</ProductCopy>
      <Label>New</Label>
    </>
  );
}
```

## Built-in recipes

| Factory | Timeline | Effects |
| --- | --- | --- |
| `editorialRise()` | `stagger(0.032, { from: 'center' })` | `rise({ y: 14 })`, `fade()`, `scale({ from: 0.98 })` |
| `softWave()` | `wave({ amplitude: 0.06, wavelength: 5 })` | `fade()`, `rise({ y: 8 })` |
| `gentleEmphasis()` | `stagger(0.024)` | `pulse({ scale: 1.06 })`, `fade()` |

All three factories take no arguments. Their delay values use seconds. They do not select a custom `.motion()` or accessibility policy, so the renderer defaults apply unless you configure them.

`editorialRise()` suits titles that should unfold from the center. `softWave()` varies word start times for a softer rhythm. `gentleEmphasis()` briefly scales tokens near the midpoint and returns to the final scale; it does not loop.

## Customize a preset

```tsx
import {
  parentLabelPolicy,
  stagger,
} from '@react-native-motion-kit/text-motion';
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const base = editorialRise();

const StandardTitle = base.component();
const SlowerTitle = base
  .timeline(stagger(0.06, { from: 'start' }))
  .motion({ kind: 'timing', options: { duration: 500 } })
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();

export function Titles() {
  return (
    <>
      <StandardTitle>Centered by default</StandardTitle>
      <SlowerTitle>A slower entrance from the start</SlowerTitle>
    </>
  );
}
```

Builders are immutable, so the customized variation does not change `StandardTitle`. A later `.timeline(...)` replaces the preset timeline. A later `.effect(...)` adds to its effects instead of replacing them. Start with `defineTextMotion()` when you want a different effect set or a rendered-line recipe with `overlayText()`.

Presets use the same [component props](../../api/component-props.md) and [playback inputs](./playback.md) as custom recipes. Keep generated components outside render functions and pass text as a plain string child.
