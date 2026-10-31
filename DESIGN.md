# Design

## Source of truth

Status: Active. Updated: 2026-10-31. Scope: the inline documentation demos only.
Evidence: the user's supplied demo screenshot; `docs/components/MotionDemo.tsx`,
`docs/components/motion-demo.css`, `example/src/DocsDemo.tsx`, the Rspress theme,
and the existing English/Korean documentation. The user rejected the large navy
panel, mint emphasis, duplicate labels, and conspicuous decorative chrome.

## Brand

Quiet, precise, developer-facing documentation. Keep the existing Motion Kit
rabbit asset. Avoid gradients, promotional copy, bright status badges, pill-like
code labels, heavy cards, and extra fonts or icon packages.

## Product goals

Let readers compare text motion, replay it, inspect the actual recipe, and see
timeline progress independently of the Typewriter character count. Success means
the animated text is the focus and all existing controls remain easy to use.
Compare stagger directions with the displayed recipe following the selection.
Show native line remeasurement when a paragraph switches between 220 and 320
layout units, including a fixed halfway progress state. Library semantics,
documentation routes, and the site home page are outside scope.

## Personas and jobs

React Native developers reading an API page, comparing an effect, and copying its
source. They use desktop browsers and narrow mobile documentation layouts.

## Information architecture

One compact example: a single name and platform label, an animation stage, local
playback controls, then a thin toolbar for source disclosure and closing the live
preview. Source remains below its own example, with recipe/player selections.

## Design principles

- Show the demo name once; do not repeat it inside an embedded player.
- Use document surfaces and neutral controls so motion supplies the emphasis.
- Keep controls near the text and remove excess vertical space.
- Preserve an explicit React Native Web versus iOS recording distinction.
- Keep existing library behavior and source accuracy when adding comparisons.

## Visual language

Inherit Rspress text, surface, divider, and focus colors. Use matching neutral
light/dark palettes in the isolated RNW player. Use the system font and existing
code font, 24–26px medium-weight example text, 12–13px control text, 4/8px spacing,
a single thin border, 6px corners, and no shadow or gradient. Ordinary stages are
about 240px high; control/progress examples have room for their extra readouts.
Do not apply the design-search suggestions for oversized display typography,
large whitespace, page transitions, or new font downloads.

## Components

`MotionDemo` owns framing, platform information, theme synchronization, source
viewing, and preview lifecycle. `DocsDemo` owns the actual library rendering,
playback actions, and progress/count diagnostics. Reuse Rspress syntax highlighting
and copy controls. Keep palette values local to the preview implementation.
For stagger, `MotionDemo` owns a four-button direction group above the preview;
the selected recipe is shared by the iframe query and generated source. Selecting
a direction starts that recipe from the beginning. Native width reflow stays an
iOS recording with real Narrow/Wide and progress controls visible in the capture.

## Accessibility

Maintain keyboard-operable buttons, visible focus, descriptive source disclosure,
and contrast in both themes. Preserve reduced-motion behavior and the library's
accessible full-text label. Use at least 44px control hit areas where practical;
selected progress is indicated by both an outline and accessible state. No new
autoplay loops, decorative animation, or per-frame screen-reader announcements.

## Responsive behavior

At 375px, wrap control groups without horizontal page scrolling or clipped
readouts. Keep all Typewriter progress/count information visible. Wide layouts
stay within the document column rather than becoming a dashboard or hero section.
Check a narrow phone viewport and landscape, plus a desktop viewport.

## Interaction states

The initial state offers a neutral Run example button. Loading and source loading
remain legible. Replay/reset/stop/progress keep their existing meaning. Closing a
live preview unmounts it. Toggling source does not remount the animation. Theme
updates reach the iframe without resetting playback. Native recordings use English
sample text and matching light/dark captures with native video controls. Switching
appearance selects the corresponding recording.
Stagger selection is available before running the example and while viewing code.
Source disclosure and source tabs preserve the selection. Each embedded demo owns
its own direction state. Theme changes preserve that choice.
Before playback, show its poster and a neutral Play recording button; expose
native video controls after the user starts it.

## Content voice

Short functional English/Korean labels: Run example, Replay, Code, Close preview,
Timeline progress, Visible characters. Platform metadata is muted sentence case,
not a colored LIVE badge. Avoid repeated implementation explanations in toolbars.

## Implementation constraints

Use the current Rspress, Expo, React Native Web, and Reanimated setup. Add no
dependencies and change no `packages/text-motion/src` files. Keep source extraction
and the genuine iOS recording intact. Theme messages contain appearance data only
and the embedded app accepts messages only from its parent.

Implementation plan: retain the supplied screenshot as the visual baseline;
update the wrapper and player presentation independently; then run source checks,
typechecking, lint/format, and a production docs build. Verify replay/source/close,
Typewriter 0 → 25 → 50 → 0 (0/10 → 9/10 → 10/10 → 0/10), continuous playback,
English/Korean labels, light/dark appearance, and narrow-layout screenshots.

## Open questions

None blocking. Native recordings are identified as captures; this change does not
promise browser/native rendering equivalence.
