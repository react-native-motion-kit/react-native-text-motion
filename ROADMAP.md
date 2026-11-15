# Project context and roadmap

This document preserves the scope and product decisions from the [original README](https://github.com/react-native-motion-kit/react-native-text-motion/blob/d690830dc7aace04cc5d51439fcc70aded95e055/packages/text-motion/README.md#scope--roadmap)
before the documentation entry-point cleanup. It separates implemented scope,
current priorities, deferred candidates, and deliberate design exclusions.

For installation and current API details, use the [published documentation](https://react-native-text-motion.pages.dev/).

## Ongoing discussion

Share feature proposals, priority feedback and design trade-offs in the [project direction and roadmap discussion](https://github.com/react-native-motion-kit/react-native-text-motion/discussions/10). This file records the versioned project context and agreed boundaries.

## Current priority

The next product focus is verifying line renderer performance and platform behavior, then deciding whether state-transition props, `pause`/`seek`/`reverse`, screen focus helpers, in-view helpers, scroll/gesture drivers, word-in-line effects, or Skia renderer candidates deserve first-class APIs. Items listed under Deferred are not release promises. They should move into the stable API only when the behavior, examples, tests, and documentation are ready.

## Renderer Performance Checkpoint

`nativeText()` is the default renderer for high-value UI text: titles, labels, onboarding copy, product copy, and short strings where token motion is easy to see. It is not designed to make long paragraphs or hundreds of grapheme tokens free.

The example app has a `Playback -> Renderer Performance` probe for checking the practical boundary. It includes word, grapheme, shared-row, replay, and progress cases. Use it with a real FPS source such as React Native Perf Monitor, Flashlight, Xcode Instruments, or Android Studio profiler.

Use these terms when recording results:

- `measured`: the same case family has iOS and Android evidence.
- `provisional`: only one platform, simulator-only, emulator-only, or dev-mode-only evidence exists.
- `unknown`: the case family was not measured.

The decision rule is intentionally conservative. If normal title, label, and product-copy workloads are smooth, keep `nativeText()` as the default renderer and document any grapheme-heavy boundary as guidance. If normal workloads jank, open a renderer optimization plan before adding more effects. If only stress grapheme cases fail, document the stress boundary instead of treating that as proof that the default renderer is wrong.

## Stable MVP

- `defineTextMotion()`
- `graphemes()`, `words()`, `custom()`
- experimental newline-only `lines()`
- `nativeText()`, `overlayText()`
- `stagger()`, `sequence()`, `parallel()`, `wave()`
- `fade()`, `rise()`, `slide()`, `scale()`, `pulse()`, `shake()`, `lineReveal()`, `typewriter()`
- `useTextMotionControls()` with explicit `controls` prop for event-driven play/replay/reset/stop
- controlled `progress` via external Reanimated shared values
- parent-label accessibility policy with hidden animated token nodes
- `/presets` subpath recipe factories

Custom effect factories and renderer capability factories are intentionally not exported from the root MVP API. `nativeText()` only implements the built-in native text effects listed above. A stable renderer-extension SDK will be designed before those helpers become public.

## Deferred

These are intentionally not stable exports in the MVP:

- custom effect factory API
- renderer capability factory API
- `wipe`
- `scramble`
- Skia renderer or Skia-only effects
- playback APIs such as `pause`, `seek`, or `reverse`
- first-class screen focus, in-view, scroll, or gesture drivers
- RN-rendered line-to-token mapping

Skia remains an optional future package boundary, not a dependency of this core package.

Context/provider playback wiring and public component ref playback are not deferred features. They are intentionally outside this package's API shape because they hide ownership and make remount/lifecycle behavior easier to misuse. Use explicit `controls={controls}` wiring when one or more text components should respond to event-driven playback commands.

## Scope & Roadmap

Text Motion is a split text motion engine, not a generic animation package. The core question for this package is:

```txt
Does this feature improve something specific to split text: splitting, layout mapping, token timing, text effects, renderer capability, accessibility, or token-level playback?
```

If the answer is yes, it may belong in `@react-native-motion-kit/text-motion`.

Core text-motion work should stay focused on:

- splitters, token metadata, and layout-aware text motion
- native text renderer reliability and performance
- timeline, effect, motion, controls, and progress composition for split tokens
- accessibility behavior for decorative token animation
- presets that help users ship common title, label, and product-copy motion faster

Advanced text effects can be considered when they still depend on text tokens or text layout:

- scramble, wipe, and highlight sweep effects
- word-in-line effects and RN-rendered line-to-token mapping when source range policies are stable enough to document
- text-change transitions where old and new token sets need a clear playback policy

Renderer-specific effects should stay behind renderer capability boundaries:

- blur, glow, shader text, masks, and glyph distortion are better candidates for an optional Skia renderer package than the core native text renderer
- native-only effects should not silently accept renderer-specific options they cannot support

Out-of-scope features are likely better served by separate package candidates when they solve a different problem:

- number count-up, odometer, currency, percentage, timer, and delta animations are value-formatting problems, not split-text layout problems
- generic `View` animation, scene animation, and Lottie-style workflows belong outside this package
- a separate value-motion package could share the Motion Kit philosophy without expanding the text-motion API surface

The decision rule is intentionally conservative: add a feature here only when it improves text-specific production work without making the common recipe API harder to understand. Otherwise, keep it deferred, renderer-specific, or a separate package.
