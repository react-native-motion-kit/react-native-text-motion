# Renderers

Choose a renderer with `.layout(...)` before calling `.component()`. Both factories return opaque handles, not React components.

| Renderer | Motion unit | Splitter | Supported effects |
| --- | --- | --- | --- |
| `nativeText()` | Source word, grapheme, authored line, or custom token | Optional | `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`, `typewriter` |
| `overlayText()` | Actual React Native rendered line | Not allowed | `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`, `lineReveal` |

## `nativeText(options?)`

```ts
type NativeTextRendererOptions = {
  testIDPrefix?: string;
};
```

The stable default choice for short titles, labels, onboarding text, and product copy. It renders animated tokens inside animated `View` containers with inner `Text` nodes so transforms are visible. Static tokens remain plain text nodes. Explicit newlines preserve authored line breaks without consuming motion timing slots.

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
  .layout(nativeText({ testIDPrefix: 'title-word' }))
  .timeline(stagger(0.04))
  .effect(fade().and(rise({ y: 12 })))
  .component();

export function Heading() {
  return <WordReveal style={{ fontSize: 32 }}>Make words move</WordReveal>;
}
```

`testIDPrefix` has no default. It creates generated token test IDs; an animated token's ID belongs to its animated container. The component's `testID` identifies the parent. Typography props such as `allowFontScaling` reach the inner text.

This renderer uses a wrapping token layout, so exact single-`Text` shaping, kerning, ligatures, and automatic line wrapping are not guaranteed. `textAlign` maps to token-row alignment; it does not turn the renderer into a full native paragraph implementation. Use `overlayText()` for actual rendered-line motion, and ordinary React Native `Text` for rich inline content or exact text-node behavior.

## `overlayText(options?)`

```ts
type OverlayTextRendererOptions = {
  testIDPrefix?: string;
};
```

Measures one native paragraph and animates masks for each actual rendered line. Use this when line breaks depend on available width, font, font scale, alignment, or language shaping. **Do not call `.split(...)`.** TypeScript and runtime checks reject that combination.

```tsx
import {
  defineTextMotion,
  lineReveal,
  overlayText,
  scale,
  stagger,
} from '@react-native-motion-kit/text-motion';
import { View } from 'react-native';

const HeroLines = defineTextMotion()
  .layout(overlayText({ testIDPrefix: 'hero-line' }))
  .timeline(stagger(0.08))
  .effect(lineReveal({ y: 18 }).and(scale({ from: 0.98 })))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

export function Hero() {
  return (
    <View style={{ width: 300 }}>
      <HeroLines style={{ fontSize: 32, lineHeight: 40 }}>
        A responsive title that reveals one rendered line at a time
      </HeroLines>
    </View>
  );
}
```

Give the paragraph a meaningful available width. Measurement is based on native text layout, not a guessed character count. Changes to text or layout inputs trigger measurement updates. If usable line mapping is unavailable, the renderer keeps readable source text instead of animating guessed line geometry. When system reduced motion is enabled, it renders the final source paragraph directly.

`testIDPrefix` has no default and prefixes generated overlay/line-mask IDs. `lineReveal()` moves the paragraph copy inside each mask while applying its opacity to the line frame. Other transform effects operate on the measured line frame, so a composed `scale()` or `pulse()` can grow around the line center without being clipped by the renderer's own reveal mask.

This is rendered-line motion, not word-in-line or character-in-line mapping. It does not expose `onTextLayout`, `numberOfLines`, text selection, or inline links as component props.

## Shared playback and accessibility

Both renderers support autoplay, explicit [controls](../guide/usage/playback.md), and app-owned `progress`. Never pass both `controls` and `progress`. The default accessibility policy exposes the complete phrase once and hides decorative nodes; a component-level `accessibilityLabel` overrides the spoken label.

Read [Component Props](./component-props.md), [Accessibility](../guide/usage/accessibility.md), and [Performance](../guide/usage/performance.md) before using many tokens or rows. Browser rendering is not evidence of iOS/Android layout or performance.

## Renderer types

The root exports `NativeTextRendererOptions`, `OverlayTextRendererOptions`, `TextMotionRenderer`, `TextMotionRendererCapability`, and `TextMotionRendererProps`. Renderer descriptors, implementation `Component` fields, and capability factories remain internal. A public renderer-extension SDK is outside the current API.
