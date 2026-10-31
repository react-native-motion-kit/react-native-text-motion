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

## Native width reflow recording

`width-reflow.mp4` and `width-reflow-light.mp4` were captured on 2026-10-31
from the real `width-reflow` recipe in `example/src/docsDemoRecipes.ts` and
`WidthReflowPreview` in `example/src/DocsDemo.tsx`. The English phrase has no
authored line breaks: “Every rendered line finds its own rhythm when the
available width changes.” Width 220 produces four native measured lines;
width 320 produces three. Both theme recordings retain the actual native
Narrow/Wide, 0%/50%/100%, and Replay controls.

A disposable iPhone 17 / iOS 26.2 simulator
(`19E183A5-4500-42A2-8BC1-63A263BEC37C`, deleted after capture) ran the existing
matching `com.anonymous.example` Debug binary. Source was served from this
workspace with Metro on port 8090, offline with two workers, using:

```sh
EXPO_PUBLIC_TEXT_MOTION_DOCS=1 \
EXPO_PUBLIC_TEXT_MOTION_DEMO_ID=width-reflow \
EXPO_PUBLIC_TEXT_MOTION_CAPTURE=1 \
EXPO_PUBLIC_TEXT_MOTION_CAPTURE_THEME=dark \
EXPO_NO_TELEMETRY=1 CI=1 pnpm_config_verify_deps_before_run=false \
pnpm -C example exec expo start --offline --port 8090 --max-workers 2 --clear
```

The light capture used `EXPO_PUBLIC_TEXT_MOTION_CAPTURE_THEME=light` after a
Metro restart with cleared cache. The capture-only 12-second cycle holds
progress at 0.5 while changing from narrow to wide at 2.5 seconds and back at
5 seconds, then replays narrow at 6.5 seconds and wide at 9 seconds. Each
replay uses `withTiming(1, { duration: 1400 })`. The exported 11.87-second clips
start at the held narrow state and end before the next cycle reset; timing
was checked against the recorded native width-selection borders.

`xcrun simctl io ... recordVideo --codec=h264` supplied the native 1206×2622
source footage. The verified stage/control crop is 1032×1000 at x=90, y=900;
exports are 744×720 H.264, 30 fps, yuv420p, with fast-start metadata and no
audio. At a documentation preview height of 360 px, this is 372 px wide.
JPEG posters are fully readable final narrow frames extracted at 8.4 seconds
from each export. English and Korean WebVTT tracks describe the same recorded
sequence. No animation was recreated outside the native app.

These captures include the line-isolation correction from `a0188e9` in
[PR #5](https://github.com/react-native-motion-kit/react-native-text-motion/pull/5).
The renderer patch remains in that separate library PR. The recordings show
native remeasurement and mask behavior, not device-performance measurements.
