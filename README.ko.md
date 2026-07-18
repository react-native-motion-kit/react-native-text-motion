# @react-native-motion-kit/text-motion

React Native에서 고성능 split text animation을 만들기 위한 라이브러리입니다. Reanimated 기반으로 동작하고, 확장 가능한 renderer boundary를 염두에 두고 있습니다.

English documentation: [README.md](./README.md)

Package documentation: [packages/text-motion/README.ko.md](./packages/text-motion/README.ko.md)

이 저장소는 `@react-native-motion-kit/text-motion` 패키지와 Expo example app을 포함하는 pnpm workspace입니다.

## Package

`text-motion`은 `<AnimatedText animation="fadeIn" />`처럼 prop 하나로 preset을 고르는 wrapper가 아닙니다. 텍스트를 어떻게 나눌지, 보이는 token이 언제 시작할지, 어떤 effect를 적용할지를 조합해서 재사용 가능한 animated text component를 만드는 패키지입니다.

이 패키지는 그 흐름을 recipe pipeline으로 제공합니다.

```txt
split -> layout(renderer) -> timeline -> effect -> motion/accessibility -> component
```

빠르게 쓰고 싶으면 preset을 사용하면 되고, tokenization, timing, effect, accessibility, renderer 선택을 직접 잡고 싶으면 recipe를 조합하면 됩니다.

Preset을 사용한 빠른 예시:

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

직접 recipe를 조합하는 예시:

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
  .layout(nativeText())
  .timeline(stagger(0.034))
  .effect(fade().and(rise({ y: 10 })))
  .component();
```

Playback controls는 button, screen focus, onboarding step처럼 어떤 이벤트가 text motion component에게 play, replay, reset, stop을 지시해야 할 때 유용합니다. 이 경우 앱은 이벤트를 소유하고, text component는 recipe의 `.motion()` 설정으로 playback을 실행합니다.

기본 controls 예시:

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  useTextMotionControls,
  words,
} from '@react-native-motion-kit/text-motion';
import { Button } from 'react-native';

const ReplayableReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(fade().and(rise({ y: 12 })))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

export function Headline() {
  const controls = useTextMotionControls();

  return (
    <>
      <ReplayableReveal controls={controls}>
        Replay without remounting
      </ReplayableReveal>
      <Button title="Replay" onPress={controls.replay} />
    </>
  );
}
```

`controls`는 progress value가 아니라 command channel입니다. Button, screen focus, onboarding step, example replay control, title/subtitle 동시 replay에 사용하세요.

성능 관점에서 `controls`는 title, label, product copy 같은 짧은 UI text에 맞춰져 있습니다. 긴 문단, grapheme split copy, 많은 row를 한 번에 움직이려면 target app에서 먼저 측정하세요.

Controlled progress는 text motion이 component 내부 autoplay가 아니라 외부 raw value를 따라가야 할 때 유용합니다. 예를 들어 scroll position, gesture progress, 또는 다른 Reanimated shared value에 맞춰 문장이 움직여야 한다면 앱이 정확한 progress를 소유하고 text component는 현재 상태만 렌더링합니다.

기본 controlled progress 예시:

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';
import { Button } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

const ControlledReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.08))
  .effect(fade().and(rise({ y: 12 })))
  .component();

export function Headline() {
  const progress = useSharedValue(0);

  return (
    <>
      <ControlledReveal progress={progress}>
        Progress drives the whole reveal
      </ControlledReveal>
      <Button title="Play" onPress={() => (progress.value = withTiming(1))} />
    </>
  );
}
```

`progress`는 전체 text motion에 대한 normalized progress입니다. `0`은 initial state, `1`은 final state입니다. Timeline delay는 이 global value를 각 token의 local progress로 변환하므로 `stagger()`나 `wave()`의 timing shape가 유지됩니다. 그래서 headline이 card scroll 위치에 맞춰 reveal되거나, gesture를 따라가거나, 여러 UI 요소가 하나의 shared value를 기준으로 함께 움직이는 케이스에 쓸 수 있습니다.

`progress`가 제공되면 `.motion()`은 내부 autoplay를 실행하지 않습니다. 대신 shared value를 업데이트하는 곳에서 playback 느낌을 정하면 됩니다. 예를 들어 `progress.value = withTiming(1, { duration: 720 })` 또는 `progress.value = withSpring(1)`처럼 직접 움직입니다. `controls`와 `progress`는 함께 사용할 수 없습니다.

## Stable MVP Scope

- recipe API: `defineTextMotion().split().layout().timeline().effect().component()`
- splitters: `graphemes`, `words`, `custom`, experimental newline-only `lines`
- renderer: `nativeText`
- timelines: `stagger`, `sequence`, `parallel`, `wave`
- effects: `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`
- presets subpath: `@react-native-motion-kit/text-motion/presets`
- event-driven play/replay/reset/stop을 위한 명시적인 playback `controls`
- external Reanimated shared value 기반 controlled progress
- accessibility default: parent label plus hidden decorative token nodes

`nativeText()`는 title, label, onboarding copy, 짧은 product copy를 위한 transform-first token renderer입니다. Animated token은 React Native 플랫폼에서 transform이 안정적으로 보이도록 animated `View` container와 내부 `Text`로 렌더링됩니다. Static token은 그대로 plain `Text`로 렌더링됩니다. 그래서 `nativeText()`는 split text motion에는 적합하지만 React Native `Text`의 완전한 drop-in 대체품은 아닙니다. `numberOfLines`, `ellipsizeMode`, `onTextLayout` 같은 layout prop은 stable MVP 계약 밖에 있습니다.

`nativeText({ testIDPrefix })`를 사용하면 generated token `testID`는 animated token container를 가리킵니다. `allowFontScaling`, `maxFontSizeMultiplier`처럼 text rendering에 영향을 주는 prop은 내부 `Text`로 전달됩니다. 이 내용은 테스트와 compatibility를 위한 안내이지, token을 직접 스타일링하기 위한 확장 API가 아닙니다. 매우 긴 문장을 grapheme 단위로 애니메이션하면 native view가 많이 생기므로, 별도 performance checkpoint 전까지는 stress case로 봐야 합니다.

Example app에는 이 checkpoint를 위한 `Playback -> Renderer Performance` 케이스가 있습니다. Target device에서 어떤 workload를 normal, caution, stress로 볼지 판단할 때 사용하세요. 같은 case family를 iOS와 Android에서 모두 확인했을 때만 `measured`라고 부르고, 한 플랫폼만 확인했거나 simulator/emulator/dev mode만 확인했다면 `provisional`로 남깁니다. 아직 확인하지 않은 케이스는 `unknown`입니다.

직접 입력한 hard line break는 지원합니다. 예를 들어
`"First line\nSecond line"`은 `nativeText()`에서 줄바꿈이 보존되어 렌더링되고,
newline 자체는 motion index를 소비하지 않습니다. RN이 화면 너비 때문에 자동
줄바꿈한 실제 줄을 token에 매핑하는 기능은 아직 deferred입니다.

기본 playback은 lifecycle 기반입니다. mount되면 animated token이 자동 실행되고, 같은 text/recipe로 parent rerender가 일어나면 진행 중인 progress를 유지하며, text/effect/timeline/motion이 바뀌면 affected token animation을 다시 실행합니다. MVP에서 text change는 enter-only입니다. 이전 text를 남겨 exit animation, crossfade, token diff를 만들지는 않습니다. Component는 event-driven playback을 위한 `controls`와, raw external control을 위한 `progress`도 받습니다. `controls`는 현재 text에 대해 component recipe의 `.motion()`을 사용하고, `progress`는 앱이 소유하는 Reanimated `SharedValue<number>`가 변경된 text도 현재 shared value에 맞춰 제어합니다.

Skia, stable line reveal, rich text, RN-rendered line-to-token mapping은 deferred 상태입니다. Context/provider playback wiring과 public playback ref는 의도적으로 이 디자인에 포함하지 않습니다. Playback command에 반응해야 하는 component에는 `controls`를 명시적으로 전달하세요.

## Scope & Roadmap

`text-motion`은 split text motion에 집중합니다. 즉 tokenization, layout-aware timing, effect, renderer, split token playback, accessibility, 그리고 title, label, onboarding copy, product copy를 위한 preset이 핵심입니다.

Text token 또는 text layout에 의존하는 기능은 이 패키지에서 고려할 수 있습니다. 예를 들면 typewriter, scramble, wipe, text-change transition, 그리고 명시적인 capability boundary 뒤에 있는 renderer-specific effect가 있습니다. 정확한 line-aware reveal은 실제 RN layout 측정과 token-to-line mapping 정책이 필요하므로 deferred로 둡니다.

다른 문제를 푸는 기능은 별도 package가 더 적합할 가능성이 큽니다. Number count-up, odometer, currency, percentage, timer, delta animation은 split-text layout 문제가 아니라 value formatting 문제입니다. 나중에 별도의 value-motion 계열 package가 Motion Kit convention을 공유할 수 있지만, 그 때문에 `text-motion` API surface를 넓히지는 않습니다.

결정 기준은 단순합니다. Text-specific production work를 개선하면서 common recipe API를 더 어렵게 만들지 않을 때만 `text-motion`에 추가합니다.

## 설치

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

MVP의 peer dependency minimum은 `react-native-reanimated@>=4.0.0`, `react-native-worklets@>=0.5.0`입니다. 앱에서는 Reanimated의 New Architecture 및 Worklets 설정을 따라야 합니다.

## Workspace

```txt
react-native-text-motion/
  example/
  packages/
    text-motion/
```

## 개발

```sh
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run build
corepack pnpm run example:build
```

관련 문서:

- [Package README](./packages/text-motion/README.md)
- [Package Korean README](./packages/text-motion/README.ko.md)

## 지금 사용해도 될까?

다음 경우라면 지금 이 패키지를 써볼 만합니다.

- title, label, onboarding copy, product copy처럼 짧은 React Native 텍스트에 entrance motion을 넣고 싶을 때
- Reanimated 기반 word-level 또는 grapheme-level reveal effect가 필요할 때
- 일회성 animation prop보다 재사용 가능한 motion recipe를 만들고 싶을 때
- screen reader가 split token을 하나씩 읽지 않고 문장을 한 번만 읽어야 할 때
- button, screen focus, onboarding step에서 remount 없이 replay/reset/stop을 실행하고 싶을 때
- scroll, gesture, 또는 여러 UI 요소가 공유하는 Reanimated value로 text motion progress를 직접 제어하고 싶을 때
- Skia를 필수 dependency로 넣지 않는 가벼운 core package가 필요할 때

다음이 필요하다면 이후 버전을 기다리는 편이 좋습니다.

- `pause`, `seek`, `reverse` 같은 추가 playback API
- first-class scroll, gesture, in-view driver
- 정확한 line reveal, masked reveal, token-to-line mapping
- blur, glow, shader, mask, glyph distortion 같은 Skia effect
- link, selectable text, rich nested text, 완전한 native `Text` layout parity
- 긴 문장, virtualized list, dense UI에서 자체 성능 검증 없이 많이 쓰는 경우

다음 초점은 실제 앱에서 controls API를 검증한 뒤, state-transition prop, `pause`/`seek`/`reverse`, screen focus helper, in-view helper, scroll/gesture driver를 first-class API로 올릴 가치가 있는지 판단하는 것입니다. Line-aware effect와 optional Skia renderer는 native renderer, layout 동작, 성능 기준이 더 검증된 뒤 다룹니다.

## License

MIT
