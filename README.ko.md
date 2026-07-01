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

## Stable MVP Scope

- recipe API: `defineTextMotion().split().layout().timeline().effect().component()`
- splitters: `graphemes`, `words`, `custom`, experimental newline-only `lines`
- renderer: `nativeText`
- timelines: `stagger`, `sequence`, `parallel`, `wave`
- effects: `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`
- presets subpath: `@react-native-motion-kit/text-motion/presets`
- accessibility default: parent label plus hidden decorative token nodes

`nativeText()`는 transform-first token renderer입니다. React Native에서 transform effect가 실제로 보이도록 wrapping `View`와 animated `Text` token을 사용합니다. React Native `Text`의 완전한 drop-in 대체품은 아니며, `numberOfLines`, `ellipsizeMode`, `onTextLayout` 같은 layout prop은 stable MVP 계약 밖에 있습니다.

Skia, stable line reveal, controller playback, rich text, RN-rendered line-to-token mapping은 deferred 상태입니다.

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
- Skia를 필수 dependency로 넣지 않는 가벼운 core package가 필요할 때

다음이 필요하다면 이후 버전을 기다리는 편이 좋습니다.

- `play`, `pause`, `seek`, `reset`, `reverse` 같은 stable playback control
- scroll-driven, gesture-driven, in-view text motion
- 정확한 line reveal, masked reveal, token-to-line mapping
- blur, glow, shader, mask, glyph distortion 같은 Skia effect
- link, selectable text, rich nested text, 완전한 native `Text` layout parity
- 긴 문장, virtualized list, dense UI에서 자체 성능 검증 없이 많이 쓰는 경우

다음 초점은 motion driver와 playback control입니다. 먼저 replay/reset/play 동작을 명시적으로 만들고, 이후 Reanimated shared value 기반 controlled progress를 지원하는 방향입니다. line-aware effect와 optional Skia renderer는 native renderer, layout 동작, 성능 기준이 더 검증된 뒤 다룹니다.

## License

MIT
