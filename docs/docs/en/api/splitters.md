# Splitters

Splitters choose source-text tokens for `nativeText()`. They return an opaque `TextMotionSplitter` handle used by `.split(...)`.

```tsx
import {
  custom,
  defineTextMotion,
  fade,
  graphemes,
  lines,
  nativeText,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';

const WordTitle = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(fade())
  .component();
```

`overlayText()` owns actual rendered-line measurement and cannot be combined with any splitter. See [Renderers](./renderers.md).

## `words()`

Takes no options. Produces word, spacing, and punctuation tokens using `Intl.Segmenter` when available, with an internal fallback otherwise. Whitespace preserves layout but does not consume a motion index; visible punctuation can consume one.

Words follow the runtime's segmentation rules. This is not a promise that every language separates words by spaces. The generated token metadata includes `isWordLike`.

## `graphemes()`

Takes no options. Produces grapheme-aware tokens for character-level motion. Prefer it over `text.split('')`, which can break surrogate pairs and combining sequences.

The fallback handles common emoji sequences and decomposed Hangul such as `한` without normalizing the source, but does not implement every Unicode grapheme rule. Some complex-script conjuncts can still split. See [Segmentation](../guide/usage/segmentation.md) before relying on exact locale boundaries.

## `lines()` — experimental

Takes no options. Splits at explicit `\n` boundaries and preserves newline text in the token's source range. It **does not** measure automatic wrapping caused by width, fonts, or font scaling.

```tsx
const AuthoredLines = defineTextMotion()
  .split(lines())
  .layout(nativeText())
  .effect(fade())
  .component();

export function Heading() {
  return <AuthoredLines>{'First line\nSecond line'}</AuthoredLines>;
}
```

Tokens have `metadata: { experimental: true, mapping: 'newline-only' }`. Use `overlayText()` and `lineReveal()` when you need the lines React Native actually rendered.

## `custom(split)`

```ts
type TextMotionCustomSplit = (
  input: string,
  context?: { locale?: string | string[] },
) => readonly TextMotionCustomSplitResult[];

type TextMotionCustomSplitResult = string | TextMotionCustomSplitToken;

type TextMotionCustomSplitToken = {
  text: string;
  sourceRange?: { start: number; end: number };
  metadata?: Record<string, unknown>;
};
```

Return strings or token objects. String results get inferred source ranges by searching forward from the previous token's end. Return explicit ranges when matching is ambiguous or metadata matters. Ranges use JavaScript string indices (UTF-16 code units), with an exclusive `end`.

```tsx
const phrases = custom((input) => {
  const separator = input.indexOf(' / ');
  if (separator < 0) return [input];

  return [
    { text: input.slice(0, separator), sourceRange: { start: 0, end: separator } },
    { text: ' / ', sourceRange: { start: separator, end: separator + 3 } },
    {
      text: input.slice(separator + 3),
      sourceRange: { start: separator + 3, end: input.length },
    },
  ];
});
```

Preserve all characters and spacing that should remain visible. A custom splitter does not repair or validate product-specific segmentation decisions. The optional context is part of the callback shape; recipe components currently call splitters without passing a locale, so there is no component `locale` prop.

## Token type

`TextMotionToken` is exported for typed integrations:

```ts
type TextMotionToken = {
  id: string;
  text: string;
  index: number;
  unit: 'grapheme' | 'word' | 'line' | 'custom';
  sourceRange: { start: number; end: number };
  metadata?: Record<string, unknown>;
};
```

A splitter handle does not expose a public `.split()` method or its internal descriptor. Pass the handle to the recipe builder instead.
