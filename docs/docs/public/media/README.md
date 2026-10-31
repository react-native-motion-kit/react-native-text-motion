# Native line reveal recording

`line-reveal.mp4` and `line-reveal-light.mp4` show the actual `overlayText()` +
`lineReveal()` recipe from `example/src/docsDemoRecipes.ts`, rendered on an iPhone
17 simulator with iOS 26.2. Both use the English text “Every rendered line / finds
its own rhythm.” The documentation selects the recording and poster matching its
current theme. The clips demonstrate the API, not device performance.

The source was served from this workspace through Expo Metro. The recording uses
the current React Native 0.85.3, Reanimated 4.3.1, and Worklets 0.8.3 example setup.
The captures use the current neutral preview palette and medium-weight text.
They are cropped to the text area, encoded as H.264, and have no audio. Each
poster is a frame extracted from its recording. No animation was recreated with
CSS. The original clips were refreshed on 2026-10-31.

The current captures include the line-isolation correction from commit
`a0188e9`, submitted separately in [PR #5](https://github.com/react-native-motion-kit/react-native-text-motion/pull/5).
The recording refresh belongs to the documentation PR; the renderer patch and
regression tests remain isolated in that library PR.

To capture a fresh version after changing the recipe, launch the repository's
native example with these environment variables:

```sh
EXPO_PUBLIC_TEXT_MOTION_DOCS=1 \
EXPO_PUBLIC_TEXT_MOTION_DEMO_ID=line-reveal \
EXPO_PUBLIC_TEXT_MOTION_CAPTURE=1 \
EXPO_PUBLIC_TEXT_MOTION_CAPTURE_THEME=dark \
pnpm -C example start
```

Use an isolated simulator, record with `xcrun simctl io <udid> recordVideo`, and
stop recording with Ctrl-C. Capture mode replays every three seconds; normal
documentation previews do not loop. Keep the caption tracks and poster aligned
with the replacement recording.

Repeat with `EXPO_PUBLIC_TEXT_MOTION_CAPTURE_THEME=light` for the light recording.
Capture mode defaults to English; ordinary browser previews still follow their
`lang` query parameter.
