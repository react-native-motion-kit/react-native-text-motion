# 레시피

`defineTextMotion()`은 불변 빌더를 만듭니다. 각 체인 메서드는 새로운 빌더를 반환하므로 기본 레시피를 공유하면서 원본을 바꾸지 않고 여러 변형을 만들 수 있습니다.

## 컴포넌트 만들기

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';

const base = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(fade());

const SoftTitle = base
  .motion({ kind: 'timing', options: { duration: 360 } })
  .component();

const RisingTitle = base
  .effect(rise({ y: 12 }))
  .motion({ kind: 'spring', options: { damping: 16, stiffness: 140 } })
  .component();

export function Titles() {
  return (
    <>
      <SoftTitle>부드럽게 등장해요</SoftTitle>
      <RisingTitle>움직임을 조금 더해요</RisingTitle>
    </>
  );
}
```

생성한 컴포넌트는 모듈 최상위에서 정의하세요. 렌더 중 `.component()`를 호출하면 매번 새로운 컴포넌트 타입이 생겨 재마운트와 의도하지 않은 자동 재생이 발생할 수 있습니다.

## 각 단계가 결정하는 것

| 단계 | 역할 |
| --- | --- |
| `.split(...)` | `nativeText()`가 사용할 원문 토큰 경계 |
| `.layout(...)` | 렌더러와 지원하는 애니메이션 단위·효과 |
| `.timeline(...)` | 초 단위의 토큰별 시작 지연 |
| `.effect(...)` | 효과 추가. 여러 번 호출하면 누적됨 |
| `.motion(...)` | 내부 자동 재생과 controls 명령에 사용할 timing 또는 spring |
| `.accessibility(...)` | 부모 레이블, 장식용 토큰, 동작 줄이기 정책 |
| `.component()` | 문자열 자식을 받는 React 컴포넌트 생성 |
| `.recipe()` | 컴포넌트를 만들지 않고 레시피 설정 스냅샷 확인 |

`.split()`, `.layout()`, `.timeline()`, `.motion()`, `.accessibility()`를 다시 호출하면 새 빌더에서 해당 설정을 교체합니다. `.effect()`는 기존 효과에 추가합니다. `.recipe()`는 layout을 선택하기 전에도 사용할 수 있습니다. 반환값은 설정 스냅샷으로 취급하고, 컴포넌트를 갱신하려고 직접 수정하지 마세요.

## 렌더러 먼저 선택하기

TypeScript에서는 `.layout(...)`으로 렌더러를 선택한 뒤에만 `.component()`를 사용할 수 있습니다. `.effect(...)`보다 먼저 렌더러를 선택하면 타입이 지원 가능한 효과를 안내합니다.

`nativeText()`에서는 splitter를 명시해 단어, grapheme, 커스텀 토큰, 직접 작성한 줄바꿈 단위를 선택합니다. splitter를 생략하면 전체 입력이 하나의 원문 토큰이 됩니다. 기본 동작은 단어 분할이 아닙니다.

`overlayText()`는 측정한 네이티브 줄을 애니메이션 단위로 사용합니다. 줄을 움직이려는 경우에도 `.split(...)`을 추가하지 마세요. 타입 시스템이 호환되지 않는 체인을 막고, 런타임 검사도 같은 조합을 거부합니다.

## 호환되는 효과 조합하기

`.effect(fade().and(rise()))`와 `.effect(fade()).effect(rise())` 모두 fade와 rise를 추가합니다. 기본 효과인 `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`는 두 렌더러에서 사용할 수 있습니다. `typewriter()`는 `nativeText()`를, `lineReveal()`은 `overlayText()`를 요구합니다.

splitter, timeline, effect, renderer는 내부 구조를 숨긴 공개 핸들입니다. 내부 descriptor에 접근하는 대신 빌더에 전달하세요. 패키지 루트 API는 커스텀 효과 팩토리나 렌더러 확장 SDK를 내보내지 않습니다.

## 재생 방식 설정하기

```tsx
import { defineTextMotion, fade, nativeText } from '@react-native-motion-kit/text-motion';

const TimedText = defineTextMotion()
  .layout(nativeText())
  .effect(fade())
  .motion({ kind: 'timing', options: { duration: 400 } })
  .component();

const SpringText = defineTextMotion()
  .layout(nativeText())
  .effect(fade())
  .motion({ kind: 'spring', options: { damping: 16, stiffness: 140 } })
  .component();

export function Message() {
  return (
    <>
      <TimedText>문장 전체가 함께 나타나요</TimedText>
      <SpringText>같은 단위를 스프링으로 움직여요</SpringText>
    </>
  );
}
```

motion 옵션은 Reanimated의 해당 timing 또는 spring 설정을 따릅니다. 단, `reduceMotion`은 접근성 정책에서 설정합니다. 타임라인 지연의 단위는 초이고 timing의 `duration`은 밀리초입니다. easing처럼 함수인 옵션은 참조로 비교합니다. 다시 렌더링할 때 재생을 유지하려면 같은 함수 참조를 재사용하세요.

인스턴스에 `progress`를 전달하면 앱이 재생을 담당하고 해당 인스턴스의 `.motion()`은 적용되지 않습니다. 레시피가 재생을 담당하면서 개별 명령을 받게 하려면 `controls`를 사용하세요. [재생 제어](./playback.md)와 [레시피 API](../../api/recipe.md)를 참고하세요.
