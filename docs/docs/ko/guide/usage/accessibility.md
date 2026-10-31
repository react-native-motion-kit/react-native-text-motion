# 접근성

Text Motion은 애니메이션 토큰 노드를 장식 요소로 취급합니다. 기본적으로 부모는 문장 전체를 하나의 접근성 레이블로 제공하고, 개별 애니메이션 노드는 접근성 도구에서 숨깁니다. 화면 읽기 도구는 각 단어나 글자를 따로 읽는 대신 문장 전체를 한 번 읽습니다.

## 부모 레이블 정책

`parentLabelPolicy(options?)`로 레시피의 접근성 동작을 설정합니다. 옵션은 `reducedMotion` 하나입니다.

| 옵션 | 기본값 | 의미 |
| --- | --- | --- |
| `reducedMotion` | `'system'` | 내부 애니메이션에 Reanimated의 시스템 모션 감소 동작을 적용합니다. |
| `reducedMotion: 'final-state'` | 명시적으로 선택 | 시스템 모션 감소가 켜져 있으면 즉시 최종 화면 상태를 표시합니다. |

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  parentLabelPolicy,
  rise,
  words,
} from '@react-native-motion-kit/text-motion';

const AccessibleTitle = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .effect(fade().and(rise({ y: 10 })))
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();

export function Title() {
  return (
    <AccessibleTitle accessibilityRole="header">
      메시지를 읽기 쉽게 유지하는 모션
    </AccessibleTitle>
  );
}
```

`'final-state'`는 모든 사용자에게 모션을 비활성화하는 옵션이 아닙니다. 기기의 모션 감소 설정이 켜져 있을 때 최종 상태를 표시합니다. 이 표시 상태는 controls와 외부 progress보다 우선하므로, 앱의 공유값이 아직 `0`이어도 Typewriter 문장 전체가 읽을 수 있는 상태로 유지됩니다.

`nativeText()`의 기본 `'system'` 정책에서는 외부 `progress`를 앱이 계속 제어합니다. 값을 갱신하는 애니메이션도 사용자 설정을 존중하도록 구성하거나, 텍스트의 완성된 결과를 즉시 표시해야 한다면 `'final-state'`를 선택하세요.

`overlayText()`에는 별도의 렌더러 폴백도 있습니다. 시스템 모션 감소가 켜져 있으면 애니메이션 줄 오버레이 대신 원본 문단의 최종 상태를 표시합니다. 두 정책과 외부 progress 모두에 적용되며 앱의 공유값 자체는 바꾸지 않습니다.

`.motion()` 옵션에 `reduceMotion`을 전달하지 마세요. Text Motion의 모션 감소 동작은 `.accessibility(...)`로 설정합니다.

## 레이블과 텍스트 props

문자열 자식이 기본 접근성 레이블이 됩니다. 화면의 문구가 축약돼 있다면 `accessibilityLabel`로 설명을 지정할 수 있습니다. `accessibilityHint`, `accessibilityRole`, `accessibilityState`, `accessibilityValue`, `accessibilityActions`, `accessibilityLanguage`, `onAccessibilityAction`도 지원합니다.

`allowFontScaling`과 `maxFontSizeMultiplier`를 지원합니다. 특히 실제 렌더링된 줄을 움직일 때는 큰 글꼴 배율과 좁은 너비를 앱에서 확인하세요. 전체 prop 계약은 [컴포넌트 props](../../api/component-props.md), 레이아웃 차이는 [렌더러](../../api/renderers.mdx)를 참고하세요.

## 앱에서 확인할 항목

- VoiceOver와 TalkBack으로 문장을 읽고, 장식용 단어와 문자가 개별적으로 읽히지 않는지 확인하세요.
- 모션 감소를 켜고 첫 프레임, 다시 재생, 초기화, 외부 진행률 상태를 확인하세요.
- 지원하는 글꼴 배율, 언어, 너비와 주변 UI의 대비를 확인하세요.
- 장식용 모션과 관계없이 핵심 정보가 읽혀야 합니다. Typewriter는 글자마다 별도의 안내를 보내지 않습니다.
