# Text segmentation

Choose token boundaries before choosing their motion. A JavaScript code unit is not necessarily a visible character: emoji, combining accents, and decomposed Hangul can contain several code points.

## Built-in splitting

| Splitter | Unit | When to use it |
| --- | --- | --- |
| `words()` | Word, punctuation, and spacing tokens | Readable word-based headings and product copy. |
| `graphemes()` | Grapheme-aware tokens | Short character-level reveals and Typewriter. |
| `lines()` | Explicit newline-separated source units | Experimental hard-newline motion; it does not detect wrapping. |
| `custom(fn)` | App-defined strings or token objects | Product-specific boundaries or a different segmentation implementation. |

Whitespace keeps its layout space without consuming an animation delay slot. Punctuation can be a visible animated unit. See [Splitters](../../api/splitters.mdx) for signatures and token metadata.

For automatic wrapping based on width and fonts, use `overlayText()` without `.split(...)`. See [Renderers](../../api/renderers.mdx).

## `Intl.Segmenter` and fallback behavior

`words()` and `graphemes()` use `Intl.Segmenter` when the runtime provides it. React Native/Hermes availability varies, so the package also includes a small fallback tokenizer. Your app does not need a polyfill merely to avoid a startup crash when `Intl.Segmenter` is absent.

The fallback preserves decomposed Hangul syllable sequences such as `한`, including relevant precomposed-Hangul/Jamo boundaries, without normalizing or rewriting the input. It handles common combining marks and emoji sequences, but it is not a complete implementation of Unicode grapheme or locale-aware word-boundary rules. Some Indic conjuncts, such as `क्ष`, can still split; scripts without spaces may need more precise word segmentation.

If exact boundaries matter, provide an `Intl.Segmenter` implementation in your app entrypoint before rendering Text Motion, or use `custom()` with an app-chosen tokenizer. An app may choose a polyfill such as `@formatjs/intl-segmenter`; it is not installed by this library.

## Preserve the original text

Custom splitters should preserve spacing and token order. For example, a product may choose whitespace-delimited units while keeping each whitespace run:

```tsx
import {
  custom,
  defineTextMotion,
  fade,
  nativeText,
  stagger,
} from '@react-native-motion-kit/text-motion';

const PhraseReveal = defineTextMotion()
  .split(custom((input) => input.match(/\S+|\s+/gu) ?? []))
  .layout(nativeText())
  .timeline(stagger(0.06))
  .effect(fade())
  .component();

export function Phrase() {
  return <PhraseReveal>Keep the original spacing.</PhraseReveal>;
}
```

This example groups punctuation with its neighboring non-whitespace text. It is a deliberate app rule, not full linguistic word segmentation. `custom()` also accepts token objects with explicit source ranges and metadata when that information matters.

Correct segmentation alone does not make per-token rendering equivalent to a single native `Text`. Shaping, ligatures, bidirectional text, wrapping, and complex scripts need visual verification with the chosen renderer. See [Performance](./performance.md) for the example app's layout probes.
