# 프리셋

프리셋은 `@react-native-motion-kit/text-motion/presets`에서 가져오는 레시피 팩토리입니다. 각 팩토리는 단어 분할, `nativeText()`, 타임라인, 효과를 미리 선택한 빌더를 반환합니다. `.component()`로 컴포넌트를 만들거나 빌더를 먼저 수정할 수 있습니다.

```tsx
import {
  editorialRise,
  gentleEmphasis,
  softWave,
} from '@react-native-motion-kit/text-motion/presets';

const HeroTitle = editorialRise().component();
const ProductCopy = softWave().component();
const Label = gentleEmphasis().component();

export function ProductHeader() {
  return (
    <>
      <HeroTitle>단어에 움직임을 더하세요</HeroTitle>
      <ProductCopy>짧은 제품 설명을 위한 재사용 가능한 애니메이션</ProductCopy>
      <Label>새 기능</Label>
    </>
  );
}
```

## 기본 레시피

| 팩토리 | 타임라인 | 효과 |
| --- | --- | --- |
| `editorialRise()` | `stagger(0.032, { from: 'center' })` | `rise({ y: 14 })`, `fade()`, `scale({ from: 0.98 })` |
| `softWave()` | `wave({ amplitude: 0.06, wavelength: 5 })` | `fade()`, `rise({ y: 8 })` |
| `gentleEmphasis()` | `stagger(0.024)` | `pulse({ scale: 1.06 })`, `fade()` |

세 팩토리는 모두 인수를 받지 않습니다. 지연 값의 단위는 초입니다. 별도의 `.motion()`이나 접근성 정책을 지정하지 않으므로 직접 설정하지 않으면 렌더러 기본값을 사용합니다.

`editorialRise()`는 중앙에서 펼쳐지는 제목에 어울립니다. `softWave()`는 단어의 시작 시간을 달리해 부드러운 리듬을 만듭니다. `gentleEmphasis()`는 애니메이션 중간 부근에서 토큰을 잠시 확대했다가 최종 크기로 돌아오며, 반복 재생하지 않습니다.

## 프리셋 수정하기

```tsx
import {
  parentLabelPolicy,
  stagger,
} from '@react-native-motion-kit/text-motion';
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const base = editorialRise();

const StandardTitle = base.component();
const SlowerTitle = base
  .timeline(stagger(0.06, { from: 'start' }))
  .motion({ kind: 'timing', options: { duration: 500 } })
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();

export function Titles() {
  return (
    <>
      <StandardTitle>기본은 중앙에서 시작해요</StandardTitle>
      <SlowerTitle>처음부터 천천히 나타나요</SlowerTitle>
    </>
  );
}
```

빌더는 불변이므로 수정한 변형이 `StandardTitle`을 바꾸지 않습니다. 뒤에서 호출한 `.timeline(...)`은 프리셋 타임라인을 교체합니다. `.effect(...)`는 기존 효과를 교체하지 않고 추가합니다. 효과 구성을 바꾸거나 `overlayText()`로 실제 줄 단위 레시피를 만들려면 `defineTextMotion()`에서 시작하세요.

프리셋도 커스텀 레시피와 같은 [컴포넌트 props](../../api/component-props.md)와 [재생 입력](./playback.md)을 사용합니다. 생성한 컴포넌트는 렌더 함수 밖에 정의하고 자식으로 일반 문자열을 전달하세요.
