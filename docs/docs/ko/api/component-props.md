# 컴포넌트 Props

레시피의 `.component()`는 `TextMotionComponent`를 반환합니다. 두 기본 렌더러는 `TextMotionComponentProps`를 공통으로 사용합니다.

## 텍스트·스타일

| Prop | 타입 | 동작 |
| --- | --- | --- |
| `children` | `string` | 필수 일반 문자열. 중첩 요소·배열·서식 있는 텍스트는 지원하지 않습니다. |
| `style` | `StyleProp<TextStyle>` | 텍스트 스타일. `nativeText()`는 토큰 텍스트에, `overlayText()`는 측정할 문단에 적용합니다. |
| `testID` | `string` | 부모 컨테이너를 식별합니다. |
| `nativeID` | `string` | 부모 컨테이너에 전달합니다. |
| `allowFontScaling` | React Native `TextProps['allowFontScaling']` | 텍스트 렌더링에 전달합니다. |
| `maxFontSizeMultiplier` | React Native `TextProps['maxFontSizeMultiplier']` | 텍스트 렌더링에 전달합니다. |

TypeScript뿐 아니라 런타임에서도 문자열을 요구합니다. 명시적 줄바꿈은 `{'첫 번째 줄\n두 번째 줄'}` 같은 문자열 표현식으로 전달하세요. 모든 `Text`·`View` props가 전달된다고 가정하지 말고, 바깥 배치 제약은 감싸는 `View`에 지정하세요.

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  words,
} from '@react-native-motion-kit/text-motion';
import { View } from 'react-native';

const Title = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .effect(fade())
  .component();

export function Heading() {
  return (
    <View style={{ maxWidth: 320 }}>
      <Title
        testID="heading"
        allowFontScaling
        maxFontSizeMultiplier={1.5}
        style={{ fontSize: 28, lineHeight: 36, color: '#234' }}
      >
        읽기 좋은 모션을 위한 공간
      </Title>
    </View>
  );
}
```

## 재생

| Prop | 타입 | 동작 |
| --- | --- | --- |
| `controls` | `TextMotionControls` | 이벤트로 `play`, `replay`, `reset`, `stop`을 실행합니다. 내부 재생은 레시피의 `.motion()` 설정을 사용합니다. |
| `progress` | Reanimated `SharedValue<number>` | 앱이 소유한 전체 텍스트 진행률입니다. 해당 인스턴스는 내부 자동 재생과 `.motion()`으로 움직이지 않습니다. |

**`controls`와 `progress`는 함께 사용할 수 없습니다.** TypeScript에서 조합을 거부하고 두 렌더러 모두 런타임에서도 오류를 던집니다. 둘 다 없으면 애니메이션 콘텐츠는 마운트 시 자동 재생합니다.

`progress`는 정규화된 값으로 `0`은 초기 상태, `1`은 최종 상태입니다. 범위를 벗어난 유한한 값은 보정하고, 유한하지 않은 값은 `0`으로 처리합니다. 타임라인 지연으로 단위별 진행률에 매핑하므로 표시된 문자 비율이 아닙니다. 전체 controls·progress 예제는 [재생 제어](../guide/usage/playback.mdx)를 참고하세요.

## 접근성

지원하는 접근성 props는 다음과 같습니다.

- `accessibilityLabel`
- `accessibilityHint`
- `accessibilityRole`
- `accessibilityState`
- `accessibilityValue`
- `accessibilityActions`
- `accessibilityLanguage`
- `onAccessibilityAction`

기본 부모 레이블은 원문 전체이며, `accessibilityLabel`로 덮어쓸 수 있습니다. 부모의 접근 가능 여부와 장식용 노드 숨김은 정책에서 정합니다. `accessible` prop을 넘기는 대신 `.accessibility(parentLabelPolicy(...))`로 설정하세요. [접근성](../guide/usage/accessibility.md)을 참고하세요.

## 생명주기

텍스트와 레시피가 같으면 일반적인 부모 리렌더에서 진행 중인 재생을 유지합니다. 텍스트 변경은 진입만 처리하며, 이전 텍스트를 종료 애니메이션·크로스페이드·토큰 비교를 위해 남겨 두지 않습니다. controls 모드에서 이후 명령은 현재 텍스트에 적용됩니다. 외부 progress 모드에서는 현재 공유 값이 새 텍스트의 상태를 결정합니다.

효과·타임라인·모션 설정이 달라지면 해당 애니메이션이 초기화될 수 있습니다. 부모 리렌더에서 재생을 유지하려면 레시피 컴포넌트와 함수 형태의 모션 옵션 참조를 안정적으로 유지하세요.

## 제한된 prop 범위

이 컴포넌트는 React Native `Text` 전체를 대체하지 않습니다. `numberOfLines`, `ellipsizeMode`, `lineBreakMode`, `onTextLayout`, `selectable`, 텍스트 `onPress`, 중첩된 서식 텍스트는 현재 계약에 포함되지 않습니다. 상호작용과 외부 배치는 적절한 바깥 컴포넌트에 지정하세요.

앱에서 타입을 사용할 수 있도록 루트에서 `TextMotionComponent`, `TextMotionComponentProps`, `TextMotionComponentTextProps`, `TextMotionComponentAccessibilityProps`를 내보냅니다. controls는 `useTextMotionControls()`와 공개 `TextMotionControls` 타입을 사용합니다. 공개 컴포넌트 ref나 context/provider 재생 API는 없습니다.
