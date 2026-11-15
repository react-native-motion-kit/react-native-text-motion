# @react-native-motion-kit/text-motion

## 0.1.0

### Minor Changes

- Initial public release with reusable text-motion recipes, presets, word and
  grapheme splitting, timeline composition, and Reanimated timing/spring motion.
- Add fixed-layout Typewriter reveals and measured native-line animation through
  `overlayText()` and `lineReveal()`.
- Support autoplay, explicit playback controls, app-owned progress, and accessible
  full-text labels with reduced-motion policies.

### Patch Changes

- Isolate each measured source line before reveal translation so fragments of
  adjacent lines cannot enter another line's mask.
