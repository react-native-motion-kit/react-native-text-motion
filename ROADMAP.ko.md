# 프로젝트 맥락과 로드맵

README를 문서 진입점 위주로 정리하기 전의 [원문](https://github.com/react-native-motion-kit/react-native-text-motion/blob/d690830dc7aace04cc5d51439fcc70aded95e055/packages/text-motion/README.ko.md#scope--roadmap)에 있던 제품 방향과
설계 결정을 보존한 문서입니다. 구현된 범위, 현재 우선순위, 보류 후보와
의도적으로 제외한 설계를 구분합니다.

설치와 현재 API는 [배포 문서](https://react-native-text-motion.pages.dev/ko/)를 참고하세요.

## 현재 우선순위

다음 제품 초점은 line renderer performance와 platform behavior를 검증한 뒤, state-transition prop, `pause`/`seek`/`reverse`, screen focus helper, in-view helper, scroll/gesture driver, word-in-line effect, Skia renderer 후보를 first-class API로 올릴 가치가 있는지 판단하는 것입니다. Deferred에 적힌 항목은 release promise가 아닙니다. 동작, 예제, 테스트, 문서가 준비되었을 때만 stable API로 올리는 방향입니다.

## Renderer Performance Checkpoint

`nativeText()`는 title, label, onboarding copy, product copy처럼 사용자가 token motion을 실제로 볼 수 있는 UI text를 위한 기본 renderer입니다. 긴 문단이나 수백 개의 grapheme token을 비용 없이 처리하는 renderer로 설계한 것은 아닙니다.

Example app에는 실제 경계를 확인하기 위한 `Playback -> Renderer Performance` probe가 있습니다. Word, grapheme, shared-row, replay, progress 케이스를 포함합니다. React Native Perf Monitor, Flashlight, Xcode Instruments, Android Studio profiler처럼 FPS를 확인할 수 있는 도구와 함께 사용하세요.

결과를 기록할 때는 이 용어를 사용합니다.

- `measured`: 같은 case family를 iOS와 Android에서 모두 확인한 상태
- `provisional`: 한 플랫폼만 확인했거나 simulator/emulator/dev mode만 확인한 상태
- `unknown`: 아직 측정하지 않은 상태

판단 기준은 보수적으로 잡습니다. 일반적인 title, label, product copy workload가 부드럽다면 `nativeText()`를 default renderer로 유지하고, grapheme-heavy boundary는 문서 가이드로 남깁니다. 일반 workload도 끊긴다면 새 effect를 추가하기 전에 renderer optimization 계획을 먼저 세웁니다. Stress grapheme case만 실패한다면 default renderer가 틀렸다는 증거로 보지 않고 stress boundary로 문서화합니다.

## Stable MVP

- `defineTextMotion()`
- `graphemes()`, `words()`, `custom()`
- experimental newline-only `lines()`
- `nativeText()`, `overlayText()`
- `stagger()`, `sequence()`, `parallel()`, `wave()`
- `fade()`, `rise()`, `slide()`, `scale()`, `pulse()`, `shake()`, `lineReveal()`, `typewriter()`
- 명시적인 `controls` prop과 `useTextMotionControls()` 기반 play/replay/reset/stop
- external Reanimated shared value 기반 controlled `progress`
- hidden animated token node를 사용하는 parent-label accessibility policy
- `/presets` subpath recipe factories

Custom effect factory와 renderer capability factory는 MVP root API에서 의도적으로 export하지 않습니다. `nativeText()`는 위에 나열된 built-in native text effect만 구현합니다. 이 helper들은 stable renderer-extension SDK를 설계한 뒤 public API로 열 예정입니다.

## Deferred

다음 항목들은 MVP에서 stable export가 아닙니다.

- custom effect factory API
- renderer capability factory API
- `wipe`
- `scramble`
- Skia renderer 또는 Skia-only effects
- `pause`, `seek`, `reverse` 같은 추가 playback API
- first-class screen focus, in-view, scroll, gesture driver
- RN-rendered line-to-token mapping

Skia는 core package의 dependency가 아니라 future optional package boundary로 남겨둡니다.

context/provider playback wiring과 public component ref playback은 deferred feature가 아닙니다. ownership이 숨겨지고 remount/lifecycle 동작을 잘못 사용하기 쉬워서 이 패키지의 API 방향에서 의도적으로 제외합니다. 하나 이상의 text component가 event-driven playback command에 반응해야 한다면 `controls={controls}`를 명시적으로 전달하세요.

## Scope & Roadmap

Text Motion은 generic animation package가 아니라 split text motion engine입니다. 이 패키지에 기능을 넣을지 판단할 때 핵심 질문은 이것입니다.

```txt
이 기능이 split text에 필요한 일을 개선하는가? 예를 들면 text split, layout mapping, token timing, text effect, renderer capability, accessibility, token별 playback.
```

답이 yes라면 `@react-native-motion-kit/text-motion`에 들어올 후보가 될 수 있습니다.

Core text-motion 작업은 다음에 집중해야 합니다.

- splitter, token metadata, layout-aware text motion
- native text renderer의 신뢰성과 성능
- split token을 위한 timeline, effect, motion, controls, progress composition
- decorative token animation을 위한 accessibility behavior
- title, label, product copy motion을 빠르게 만들 수 있는 preset

Advanced text effect는 여전히 text token 또는 text layout에 의존할 때 고려할 수 있습니다.

- scramble, wipe, highlight sweep effect
- source range 정책이 안정된 뒤 다룰 수 있는 word-in-line effect와 RN-rendered line-to-token mapping
- old/new token set의 playback policy가 필요한 text-change transition

Renderer-specific effect는 renderer capability boundary 뒤에 둬야 합니다.

- blur, glow, shader text, mask, glyph distortion은 core native text renderer보다 optional Skia renderer package 후보에 가깝습니다.
- native renderer가 지원하지 못하는 renderer-specific option을 조용히 받아들이면 안 됩니다.

다른 문제를 푸는 기능은 별도 package가 더 적합할 가능성이 큽니다.

- number count-up, odometer, currency, percentage, timer, delta animation은 split-text layout 문제가 아니라 value formatting 문제입니다.
- generic `View` animation, scene animation, Lottie-style workflow는 이 패키지 밖의 영역입니다.
- 나중에 별도의 value-motion 계열 package가 필요해질 수 있지만, 그건 text-motion API surface를 넓히는 방식보다 별도 package로 두는 편이 안전합니다.

결정 기준은 보수적으로 잡습니다. 사용자의 text-specific production work를 개선하면서 common recipe API를 더 어렵게 만들지 않을 때만 이 패키지에 추가합니다. 그렇지 않다면 deferred, renderer-specific, 또는 별도 package로 둡니다.
