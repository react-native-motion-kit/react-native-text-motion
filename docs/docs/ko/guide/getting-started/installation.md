# 설치

Text Motion은 React Native Reanimated와 React Native Worklets를 사용합니다. 텍스트 애니메이션을 렌더링하기 전에 앱에서 서로 호환되는 버전으로 설정하세요.

## 요구 사항

패키지가 선언한 peer dependency 최소 버전은 다음과 같습니다.

| 의존성 | 선언된 범위 |
| --- | --- |
| `react` | `>=18.0.0` |
| `react-native` | `>=0.76.0` |
| `react-native-reanimated` | `>=4.0.0` |
| `react-native-worklets` | `>=0.5.0` |

이 범위가 모든 버전 조합의 호환성을 보장하지는 않습니다. [Reanimated 호환성 표](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)에서 지원하는 React Native, Reanimated, Worklets 조합을 선택하세요. Reanimated 4는 React Native New Architecture를 요구합니다.

## 패키지 설치

기존 React Native 앱에서는 다음과 같이 설치합니다.

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

npm이나 Yarn을 사용한다면 같은 패키지를 `npm install` 또는 `yarn add`로 설치하세요.

Expo 앱에서는 SDK에 맞는 Reanimated와 Worklets 버전을 Expo가 선택하도록 설치합니다.

```sh
npx expo install react-native-reanimated react-native-worklets
pnpm add @react-native-motion-kit/text-motion
```

SDK가 선택한 버전이 위의 peer dependency 범위를 만족하는지 확인하세요. SDK와 빌드 방식에 필요한 설정은 [Expo Reanimated 가이드](https://docs.expo.dev/versions/latest/sdk/reanimated/)를 따르세요.

## Worklets 설정

사용하는 환경에 맞춰 공식 [Reanimated 시작 가이드](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/)와 [Worklets 시작 가이드](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/getting-started/)를 따르세요.

Babel을 사용하는 bare React Native 앱에서는 기존 설정의 **마지막** 플러그인으로 Worklets 플러그인을 추가합니다.

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

앱에 필요한 다른 preset과 plugin은 유지하세요. Expo의 Babel preset이 해당 SDK에서 플러그인을 설정할 수 있으므로, 중복으로 추가하지 말고 SDK별 설정을 확인하세요.

네이티브 의존성을 추가한 뒤에는 앱에서 사용하는 CocoaPods 절차로 iOS pod를 설치하고 네이티브 앱을 다시 빌드하세요. Babel 설정을 바꿨다면 Metro 캐시를 초기화하고 다시 실행하세요. Text Motion 자체에는 별도 Babel 플러그인, provider, 네이티브 설정이 필요하지 않습니다.

## 공개 진입점에서 가져오기

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';
```

기본 구성 요소는 패키지 루트에서 가져옵니다. 세 가지 프리셋은 `/presets`에서 가져옵니다. 내부 렌더러나 descriptor 파일을 직접 가져오지 마세요.

[빠른 시작](./quick-start.md)으로 이어서 진행하세요.
