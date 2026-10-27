# 레시피 API

공개 팩터리는 `@react-native-motion-kit/text-motion`에서 가져옵니다. 프리셋은 별도 경로인 `@react-native-motion-kit/text-motion/presets`에서 가져옵니다.

## `defineTextMotion()`

레시피 빌더를 만듭니다. 각 설정 메서드는 새 빌더를 반환하므로, 기본 레시피를 재사용해도 앞서 만든 레시피는 바뀌지 않습니다.

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
  .timeline(stagger(0.04));

const FadeTitle = base.effect(fade()).component();
const RisingTitle = base.effect(fade().and(rise({ y: 12 }))).component();

export function Heading() {
  return <RisingTitle>텍스트를 위한 모션</RisingTitle>;
}
```

일반적인 리렌더에서 React 컴포넌트의 정체성이 유지되도록, 레시피 컴포넌트는 렌더 함수 밖에서 만드세요.

## 빌더 메서드

| 메서드 | 입력 | 동작 |
| --- | --- | --- |
| `.split(splitter)` | [분할기](./splitters.md) | 원문을 토큰으로 나눕니다. `overlayText()`에서는 생략합니다. |
| `.layout(renderer)` | [렌더러](./renderers.md) | 텍스트 배치·렌더링 방식을 선택합니다. `.component()` 전에 필요합니다. |
| `.timeline(timeline)` | [타임라인](./timelines.md) | 보이는 모션 단위별 시작 지연을 정합니다. |
| `.effect(effect)` | 호환되는 [효과](./effects.md) | 효과를 추가합니다. 여러 번 호출하면 효과가 누적됩니다. |
| `.motion(config)` | `TextMotionMotionConfig` | 자동 재생과 controls 기반 재생을 설정합니다. |
| `.accessibility(policy)` | `TextMotionAccessibilityPolicy` | 부모 레이블과 모션 줄이기 동작을 설정합니다. |
| `.recipe()` | 없음 | 설정 스냅샷을 반환합니다. 렌더러 선택 전에도 호출할 수 있습니다. |
| `.component()` | 없음 | [텍스트 모션 props](./component-props.md)를 받는 React 컴포넌트를 만듭니다. |

`.split()`, `.layout()`, `.timeline()`, `.motion()`, `.accessibility()`를 다시 호출하면 새 레시피에서 해당 설정이 교체됩니다. TypeScript가 렌더러 기능을 검사할 수 있도록 렌더러를 먼저 선택한 뒤 효과를 추가하세요. 렌더링된 줄을 사용하는 레시피에는 `.split(...)`을 지정할 수 없으며, 런타임에서도 이 조합을 거부합니다.

`nativeText()`에서 분할기를 생략하면 문자열 전체가 하나의 토큰이 됩니다. 타임라인이 없으면 모든 애니메이션 단위가 함께 시작합니다. 효과가 없으면 시각 스타일이 바뀌지 않습니다.

## `.motion(config)`

```tsx
.motion({ kind: 'timing', options: { duration: 420 } })
.motion({ kind: 'spring', options: { damping: 14, stiffness: 160 } })
```

`TextMotionMotionConfig`는 `kind`로 구분하는 유니온입니다.

```ts
type TextMotionMotionConfig =
  | { kind: 'timing'; options?: TextMotionTimingOptions }
  | { kind: 'spring'; options?: TextMotionSpringOptions };
```

`TextMotionTimingOptions`는 Reanimated의 `WithTimingConfig`, `TextMotionSpringOptions`는 `WithSpringConfig`를 따르며, 두 타입 모두 `reduceMotion`을 제외합니다. 모션 줄이기는 `.accessibility(...)`에서 설정합니다. 나머지 지원 옵션은 설치된 Reanimated 버전에 따릅니다. 숫자 모션 옵션은 유한한 값이어야 합니다.

내부 애니메이션의 기본값은 **300ms timing**입니다. 타임라인 입력은 **초**, `duration`은 **밀리초** 단위입니다. `easing`처럼 함수인 옵션은 참조로 비교하므로, 리렌더에서 재생을 유지하려면 같은 함수를 재사용하세요.

컴포넌트에 외부 `progress` 공유 값을 넘기면 내부 자동 재생을 사용하지 않고 해당 인스턴스의 `.motion()` 설정을 무시합니다. [재생 제어](../guide/usage/playback.md)를 참고하세요.

## `.accessibility(parentLabelPolicy(options))`

```tsx
import { parentLabelPolicy } from '@react-native-motion-kit/text-motion';

const policy = parentLabelPolicy({ reducedMotion: 'final-state' });
```

`ParentLabelPolicyOptions`의 옵션은 `reducedMotion?: 'system' | 'final-state'` 하나이며, 기본값은 `'system'`입니다. 반환되는 정책은 전체 문장을 부모 접근성 레이블로 노출하고 장식용 토큰 노드를 숨깁니다. 두 렌더러 모두 정책을 생략하면 `parentLabelPolicy()`를 사용합니다. 렌더러별 동작과 권장 사용법은 [접근성](../guide/usage/accessibility.md)을 참고하세요.

## 공개 핸들과 타입

`TextMotionSplitter`, `TextMotionRenderer`, `TextMotionTimeline`, `TextMotionEffect`는 공개 팩터리가 반환하는 불투명 핸들입니다. 빌더에 전달하고, 효과는 `.and(...)`로 합성하세요. 내부 `kind`, `name`, `options`, `delayFor`, `Component`, 기능 배열은 지원하는 조회·확장 API가 아닙니다.

루트에서는 `TextMotionRendererCapability`, `TextMotionRendererProps`, `TextMotionToken` 타입도 내보냅니다. 타입을 공개했다고 해서 내부 팩터리 함수까지 공개하는 것은 아닙니다. 사용자 정의 효과·렌더러 팩터리, descriptor 조회 함수, capability 팩터리는 현재 루트 API에 포함되지 않습니다.
