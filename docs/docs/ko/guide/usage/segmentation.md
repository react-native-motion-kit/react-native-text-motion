# 문자 분할

모션을 정하기 전에 토큰 경계를 선택하세요. JavaScript의 코드 단위 하나가 화면의 문자 하나와 같지는 않습니다. 이모지, 결합 악센트, 분해된 한글은 여러 코드 포인트로 이루어질 수 있습니다.

## 기본 splitter

| Splitter | 단위 | 용도 |
| --- | --- | --- |
| `words()` | 단어, 문장부호, 공백 토큰 | 읽기 쉬운 단어 단위 제목과 제품 설명. |
| `graphemes()` | 문자소를 고려한 토큰 | 짧은 글자 단위 진입 효과와 Typewriter. |
| `lines()` | 명시적 줄바꿈으로 구분한 소스 단위 | 실험적인 줄바꿈 모션. 자동 줄바꿈은 감지하지 않습니다. |
| `custom(fn)` | 앱이 정의한 문자열 또는 토큰 객체 | 제품별 경계나 별도의 분할 구현. |

공백은 레이아웃 공간을 유지하면서 애니메이션 지연 슬롯을 소비하지 않습니다. 문장부호는 보이는 애니메이션 단위가 될 수 있습니다. 시그니처와 토큰 메타데이터는 [Splitters](../../api/splitters.mdx)를 참고하세요.

너비와 글꼴에 따른 자동 줄바꿈을 기준으로 움직이려면 `.split(...)` 없이 `overlayText()`를 사용하세요. [렌더러](../../api/renderers.mdx)를 참고하세요.

## `Intl.Segmenter`와 폴백

`words()`와 `graphemes()`는 런타임에 `Intl.Segmenter`가 있으면 사용합니다. React Native/Hermes 환경에 따라 제공 여부가 달라질 수 있어 작은 폴백 토크나이저도 포함합니다. `Intl.Segmenter`가 없을 때 앱 시작 오류를 피하기 위한 목적으로만 폴리필을 설치할 필요는 없습니다.

폴백은 `한` 같은 분해된 한글 음절과 관련된 완성형 한글·자모 경계를 처리하며 입력을 정규화하거나 다시 쓰지 않습니다. 일반적인 결합 문자와 이모지 시퀀스를 처리하지만, 모든 유니코드 문자소 규칙이나 언어별 단어 경계를 구현하지는 않습니다. `क्ष` 같은 일부 인도계 문자 결합은 여전히 나뉠 수 있고, 띄어쓰기가 없는 문자 체계는 더 정밀한 단어 분할이 필요할 수 있습니다.

정확한 경계가 중요하면 Text Motion을 렌더링하기 전에 앱 진입점에서 `Intl.Segmenter` 구현을 제공하거나, 앱이 선택한 토크나이저를 `custom()`에 연결하세요. 앱에서 `@formatjs/intl-segmenter` 같은 폴리필을 선택할 수 있지만 이 라이브러리가 설치해 주지는 않습니다.

## 원본 텍스트 보존

사용자 정의 splitter는 공백과 토큰 순서를 보존해야 합니다. 예를 들어 제품의 규칙에 따라 공백 기준으로 나누되 공백 묶음을 그대로 유지할 수 있습니다.

```tsx
import {
  custom,
  defineTextMotion,
  fade,
  nativeText,
  stagger,
} from '@react-native-motion-kit/text-motion';

const PhraseReveal = defineTextMotion()
  .split(custom((input) => input.match(/\S+|\s+/gu) ?? []))
  .layout(nativeText())
  .timeline(stagger(0.06))
  .effect(fade())
  .component();

export function Phrase() {
  return <PhraseReveal>원본의 공백을 유지합니다.</PhraseReveal>;
}
```

이 예제는 문장부호를 인접한 공백 없는 텍스트에 포함합니다. 앱이 정한 규칙이며 완전한 언어학적 단어 분할은 아닙니다. 소스 범위와 메타데이터가 중요하다면 `custom()`에서 이를 명시한 토큰 객체를 반환할 수도 있습니다.

분할이 정확하다고 해서 토큰별 렌더링이 단일 네이티브 `Text`와 같아지지는 않습니다. 글자 조형, 합자, 양방향 텍스트, 줄바꿈, 복잡한 문자 체계는 선택한 렌더러에서 직접 확인해야 합니다. 예제 앱의 레이아웃 프로브는 [성능](./performance.md)을 참고하세요.
