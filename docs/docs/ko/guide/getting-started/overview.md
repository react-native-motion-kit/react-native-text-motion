# 소개

`@react-native-motion-kit/text-motion`은 React Native에서 재사용할 수 있는 텍스트 애니메이션 컴포넌트를 만듭니다. 텍스트 분할, 렌더링, 타이밍, 효과, 접근성을 레시피로 조합한 뒤 컴포넌트로 렌더링합니다.

```txt
split → layout(renderer) → timeline → effect → motion/accessibility → component
```

이 문서는 현재 `0.1.0`의 공개 API를 설명합니다.

## 시작 방법 선택하기

일반적인 제목, 라벨, 제품 설명 애니메이션은 [프리셋](../usage/presets.mdx)으로 시작하세요. 애니메이션 단위, 타이밍, 효과를 직접 선택하려면 [커스텀 레시피](../usage/recipes.mdx)를 만드세요.

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroTitle = editorialRise().component();

export function Hero() {
  return <HeroTitle>자연스럽게 움직이는 텍스트</HeroTitle>;
}
```

컴포넌트의 자식에는 일반 문자열을 전달합니다. 부모가 다시 렌더링되어도 같은 컴포넌트 타입을 사용하도록 React 렌더 함수 밖에서 정의하세요.

## 만들 수 있는 기능

| 목적 | 공개 API |
| --- | --- |
| 단어나 사용자가 인식하는 글자 단위로 움직이기 | `words()` 또는 `graphemes()`와 `nativeText()` |
| React Native가 실제로 줄바꿈한 줄을 드러내기 | `.split(...)` 없이 `overlayText()`와 `lineReveal()` |
| 완성된 문장의 공간을 유지하며 한 글자씩 드러내기 | `graphemes()`, `nativeText()`, `typewriter()` |
| 버튼이나 앱 이벤트에 맞춰 다시 재생하기 | `useTextMotionControls()`와 `controls` prop |
| 스크롤, 제스처, 앱이 관리하는 애니메이션 따라가기 | Reanimated shared value를 `progress`로 전달 |
| 스크린 리더가 문장을 읽을 수 있게 유지하기 | 부모 레이블을 사용하고 장식용 토큰 노드는 접근성 트리에서 숨기기 |

`controls`는 재생 명령을 보내고, `progress`는 현재 시각적 상태를 전달합니다. 한 인스턴스에서는 둘 중 하나만 사용할 수 있습니다.

## 범위와 제약

짧은 제목, 헤딩, 라벨, 온보딩 문구, 제품 설명을 대상으로 합니다. 긴 문단, 많은 행, 글자 수가 많은 grapheme 애니메이션은 도입 전에 대상 기기에서 성능을 측정하세요.

`nativeText()`는 움직이는 토큰을 컨테이너로 감싸므로 하나의 네이티브 `Text`가 제공하는 모든 동작을 재현하지 않습니다. 중첩된 리치 텍스트, 인라인 링크, 텍스트 선택, 텍스트 `onPress`는 컴포넌트 계약에 포함되지 않습니다. `lines()`는 명시적인 `\n`만 분할합니다. 자동 줄바꿈에는 `overlayText()`를 사용하세요.

현재 공개 API에는 커스텀 효과 팩토리, 렌더러 확장 SDK, Skia 효과, `pause`/`seek`/`reverse`, 스크롤·제스처·화면 포커스·in-view 전용 드라이버가 없습니다. 앱 이벤트는 `controls`로 연결하고 연속적인 shared value는 `progress`로 연결할 수 있습니다. 텍스트 변경은 새 텍스트의 등장만 처리합니다. 퇴장 애니메이션을 위해 이전 텍스트를 유지하거나 스트리밍 텍스트 API를 제공하지 않습니다.

[설치](./installation.md)를 마친 뒤 [빠른 시작](./quick-start.mdx)에서 첫 컴포넌트를 만들어 보세요.
