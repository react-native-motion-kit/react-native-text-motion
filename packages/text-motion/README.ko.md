# React Native Text Motion

> [English](https://github.com/react-native-motion-kit/react-native-text-motion/blob/main/packages/text-motion/README.md) | 한국어

<div align="center">
  <img src="https://raw.githubusercontent.com/react-native-motion-kit/react-native-text-motion/main/docs/docs/public/logo.png" width="300" alt="React Native Motion Kit logo" />
</div>

## 소개

`@react-native-motion-kit/text-motion`은 Reanimated 기반의 React Native 텍스트 애니메이션 라이브러리입니다. 짧은 제목, 레이블, 온보딩 문구에 맞춰 텍스트 분할 방식, 렌더러, 타임라인, 효과를 조합하고 재사용 가능한 컴포넌트를 만듭니다.

### 주요 기능

- **조합 가능한 레시피** — 분할, 레이아웃, 타이밍, 효과를 TypeScript API로 구성합니다.
- **단어와 글자 애니메이션** — `nativeText()`로 단어나 그래핌을 움직이고 `typewriter()`로 한 글자씩 표시합니다.
- **실제 줄 기준 모션** — `overlayText()`와 `lineReveal()`로 React Native가 렌더링한 줄을 드러냅니다.
- **재생 제어** — 이벤트에서 play/replay/reset/stop을 실행하거나 외부 Reanimated shared value로 진행률을 제어합니다.
- **접근성** — 기본적으로 전체 문장을 하나의 레이블로 제공하고 장식용 토큰은 스크린 리더에서 숨깁니다. 모션 줄이기 설정도 반영합니다.
- **기본 프리셋** — 프리셋으로 시작하고 필요에 따라 레시피를 조정합니다.

## 빠르게 시작하기

### 문서

[한국어 문서](https://react-native-text-motion.pages.dev/ko/) · [설치](https://react-native-text-motion.pages.dev/ko/guide/getting-started/installation.html) · [빠른 시작](https://react-native-text-motion.pages.dev/ko/guide/getting-started/quick-start.html)

### 예제

- [예제 모음](https://react-native-text-motion.pages.dev/ko/guide/usage/examples.html) — 동작을 확인하고 예제 코드를 살펴봅니다.
- [Expo 예제 앱](https://github.com/react-native-motion-kit/react-native-text-motion/tree/main/example) — 레시피, 재생 제어, 네이티브 줄 애니메이션을 실행합니다.

### AI

[AI 도구와 함께 사용하기](https://react-native-text-motion.pages.dev/ko/guide/getting-started/ai.html)에서 문서 활용 방법을 확인하세요.

- [llms.txt](https://react-native-text-motion.pages.dev/ko/llms.txt) — 문서 제목과 링크를 담은 색인입니다.
- [llms-full.txt](https://react-native-text-motion.pages.dev/ko/llms-full.txt) — 전체 문서를 하나의 텍스트 파일로 제공합니다.
- [영문 색인](https://react-native-text-motion.pages.dev/llms.txt) · [영문 전체 문서](https://react-native-text-motion.pages.dev/llms-full.txt)

### 설치

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

peer dependency 최소 버전은 Reanimated `4.0.0`, Worklets `0.5.0`입니다. 이 최소값만으로 네이티브 의존성의 호환성이 보장되지는 않습니다. [설치 가이드](https://react-native-text-motion.pages.dev/ko/guide/getting-started/installation.html)와 [Reanimated 공식 설정 안내](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)에 따라 앱의 React Native 또는 Expo 버전에 맞게 설정하세요. Reanimated 4는 New Architecture가 필요합니다.

### 기본 사용법

프리셋에서 컴포넌트를 만들고 애니메이션을 적용할 텍스트를 전달하세요.

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

// 재사용할 컴포넌트는 렌더 함수 밖에서 만드세요.
const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

직접 레시피를 조합할 수도 있습니다. `stagger()`의 시간 단위는 초이며, `.component()`를 호출하기 전에 `.layout(...)`으로 렌더러를 선택해야 합니다.

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
  .timeline(stagger(0.04))
  .effect(fade().and(rise({ y: 12 })))
  .component();
```

자세한 내용은 [레시피 API](https://react-native-text-motion.pages.dev/ko/api/recipe.html), [렌더러](https://react-native-text-motion.pages.dev/ko/api/renderers.html), [재생 제어](https://react-native-text-motion.pages.dev/ko/guide/usage/playback.html)를 참고하세요. `controls`와 외부 `progress`는 함께 사용할 수 없습니다.

## 사용 범위

짧은 UI 텍스트를 위한 라이브러리이며 네이티브 `Text`의 모든 기능을 대체하지 않습니다. `nativeText()`는 소스 토큰을, `overlayText()`는 실제 렌더링된 줄을 애니메이션 단위로 사용합니다. `overlayText()`에는 `.split(...)`을 추가하지 마세요. `lines()`는 명시적인 `\n`만 분리합니다.

긴 문단이나 많은 애니메이션 행은 대상 기기에서 측정하세요. 브라우저 예제는 네이티브 성능 측정 자료가 아닙니다. [성능 안내](https://react-native-text-motion.pages.dev/ko/guide/usage/performance.html)와 [접근성 안내](https://react-native-text-motion.pages.dev/ko/guide/usage/accessibility.html)를 참고하세요.

## 프로젝트 방향

우선순위와 기능 아이디어는 [프로젝트 방향·로드맵 Discussion](https://github.com/react-native-motion-kit/react-native-text-motion/discussions/10)에서 논의합니다.

라이브러리 확장 전 현재 우선순위와 설계 범위는 [프로젝트 맥락과 로드맵](https://github.com/react-native-motion-kit/react-native-text-motion/blob/main/ROADMAP.ko.md)을 참고하세요.

## 개발 참여

[기여 가이드와 개발 환경](https://github.com/react-native-motion-kit/react-native-text-motion/blob/main/CONTRIBUTING.md)

## License

[MIT](./LICENSE)
