# Performance

Text Motion is intended for short, high-value UI text: titles, labels, onboarding copy, and concise product copy. Performance depends on the number of animated units, effects, simultaneous components, device, and playback mode. This documentation does not promise an FPS target or a universal safe character count.

## Choose the unit deliberately

`nativeText()` uses an animated `View` container with an inner `Text` for each animated token. Static tokens remain plain text. This makes token transforms visible, but a grapheme split can create many more animated units than a word split.

- Prefer `words()` when whole-word motion communicates the intent.
- Use `graphemes()` or `typewriter()` for short character-level reveals and measure larger workloads.
- Keep recipe components outside render. Replay existing components with controls instead of repeatedly remounting them solely to restart motion.
- Test shared controls with the actual number of mounted rows: one command broadcasts to all attached components.
- Use `overlayText()` when the motion should follow rendered lines. It measures native text and renders clipped paragraph copies per line; fewer motion units alone do not establish that it will be faster for your layout.

See [Renderers](../../api/renderers.mdx) for the layout tradeoffs and [Playback](./playback.mdx) for command and progress ownership.

## Profile the example app

Run the repository example on the platform you want to measure. See [Examples](./examples.mdx) for commands.

Open **Playback → Renderer Performance**. The probe includes word and grapheme workloads, Typewriter, repeated replay, shared rows, and externally driven progress. **Playback → Controls Stress** provides additional command fan-out cases. **Layout → Line Reveal** and **Layout → Line Layout Probe** help inspect width, alignment, font-scale, hard-newline, and language behavior.

The case labels `normal`, `caution`, and `stress` describe probe workloads. They are not measured performance grades or supported token limits. Token/node estimates in the UI are diagnostics, not a public implementation contract.

Use a real FPS/profiling source such as React Native Perf Monitor, Xcode Instruments, Android Studio Profiler, or Flashlight. Record device and OS, platform, build mode, text/splitter, effect, number of components and motion units, playback mode, and visible jank alongside the measurement. Development and simulator results should be identified as such.

## Report evidence consistently

| Status | Required evidence |
| --- | --- |
| `measured` | The same case family has both iOS and Android evidence. |
| `provisional` | Only one platform was checked, or evidence is limited to simulator/emulator/development mode. |
| `unknown` | That case family has not been measured. |

This site does not claim that a workload has been measured unless platform evidence accompanies that result.

If normal title and label workloads are smooth, keep the default renderer and document the boundary for heavier text. If normal workloads jank, investigate renderer costs before adding more effects. A failing grapheme stress case alone does not prove that ordinary word-based headings need a different renderer.

## Validate layout as well as frames

`nativeText()` trades exact single-`Text` shaping and wrapping for per-token transforms. `overlayText()` follows native rendered lines but should still be checked with the fonts, scale, width, alignment, and scripts your app uses. Frame rate cannot establish correct wrapping, accessible reading order, or reduced-motion behavior. See [Segmentation](./segmentation.md) and [Accessibility](./accessibility.md).
