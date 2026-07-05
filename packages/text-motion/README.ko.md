# @react-native-motion-kit/text-motion

React Native에서 고성능 split text animation을 만들기 위한 라이브러리입니다. Reanimated 기반으로 동작하고, 나중에 다른 renderer를 붙일 수 있도록 설계되어 있습니다.

English documentation: [README.md](./README.md)

`text-motion`은 짧은 제목, 라벨, 온보딩 문구, 제품 설명 문구처럼 token 단위 motion이 필요한 UI 텍스트를 위한 패키지입니다.

이 패키지는 아래처럼 prop을 많이 받는 단일 wrapper가 아닙니다.

```tsx
<AnimatedText text="Hello" animation="fadeIn" delay={100} />
```

대신 text splitting 전략, token renderer, timeline, effect를 조합해서 재사용 가능한 animated text component를 만들 수 있게 합니다.

```txt
split -> layout(renderer) -> timeline -> effect -> motion/accessibility -> component
```

빠르게 쓰고 싶으면 preset을 사용하면 되고, 세부 동작을 잡고 싶으면 텍스트를 어떻게 쪼갤지, token을 어떻게 렌더링할지, 각 visible token이 언제 시작할지, 어떤 motion을 적용할지를 직접 조합하면 됩니다.

TypeScript에서는 `.layout(...)`으로 renderer를 선택한 뒤에만 `.component()`를 호출할 수 있습니다. 아직 renderer를 정하지 않은 recipe를 확인하거나 전달해야 한다면 `.recipe()`는 layout 전에도 사용할 수 있습니다.

## 설치

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

MVP의 peer dependency minimum은 다음과 같습니다.

- `react-native-reanimated`: `>=4.0.0`
- `react-native-worklets`: `>=0.5.0`

앱에서는 Reanimated와 Worklets의 공식 설정을 따라야 합니다. Reanimated 4의 New Architecture 요구사항도 함께 확인해야 합니다.

## 빠른 시작

좋은 기본값이 필요하면 preset을 사용할 수 있습니다.

```tsx
import { editorialRise } from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();

export function HeroTitle() {
  return <HeroReveal>Design motion that feels native</HeroReveal>;
}
```

`editorialRise()`는 recipe factory입니다. 내부적으로 문장을 단어 단위로 나누고, `nativeText()`로 렌더링하며, 가운데 근처에서 시작하는 stagger와 `rise`, `fade`, 약한 `scale`을 조합합니다.

## 직접 recipe 만들기

세부 동작을 직접 제어하고 싶으면 recipe를 만들면 됩니다.

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  scale,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';

const ProductHeadline = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.032, { from: 'center' }))
  .effect(rise({ y: 14 }).and(fade()).and(scale({ from: 0.98 })))
  .motion({ kind: 'timing', options: { duration: 320 } })
  .component();

export function Header() {
  return <ProductHeadline>Design motion that feels native</ProductHeadline>;
}
```

`0.032`는 초 단위입니다. 선택한 origin 기준으로 visible token마다 32ms씩 시작 시간이 달라집니다. `duration`은 각 token이 자기 delay 이후 움직이는 시간입니다.

### Motion Options

`.motion()`은 작은 discriminated config를 받습니다.

```tsx
.motion({ kind: 'timing', options: { duration: 320 } });
.motion({ kind: 'spring', options: { damping: 14, stiffness: 160 } });
```

`timing` options는 Reanimated `withTiming` config를 따르고, `spring` options는 Reanimated `withSpring` config를 따릅니다. `reduceMotion`은 여기서 받지 않습니다. text-motion에서는 reduced-motion 동작을 accessibility policy에서 제어합니다.

Custom `easing`처럼 function-valued option은 animation을 유지할지 다시 실행할지 판단할 때 reference로 비교합니다. Parent rerender에서도 progress를 유지하려면 같은 function reference를 재사용하거나 hoist하세요. 새 function을 만들면 motion config가 바뀐 것으로 보고 replay됩니다.

`.motion()`은 text-motion이 소유하는 playback에 적용됩니다. 기본 mount autoplay와 `controls` command에서 사용됩니다. Component에 raw `progress`를 넘기면 앱이 playback을 소유하므로 해당 instance에는 `.motion()`이 적용되지 않습니다.

## Presets

Preset은 string 이름이 아니라 조합 가능한 recipe factory입니다.

```tsx
import {
  editorialRise,
  gentleEmphasis,
  softWave,
} from '@react-native-motion-kit/text-motion/presets';

const HeroReveal = editorialRise().component();
const ProductCopy = softWave().component();
const LabelEmphasis = gentleEmphasis().component();
```

- `editorialRise()` - 큰 제목용 reveal입니다. 가운데 근처에서 시작해서 양옆으로 퍼집니다.
- `softWave()` - 제품 문구에 어울리는 reveal입니다. sine wave 기반 delay를 사용합니다.
- `gentleEmphasis()` - 작은 라벨용 강조 preset입니다. fade와 midpoint pulse를 사용합니다.

## Splitters

Splitter는 token의 단위를 결정합니다.

Splitter factory는 입력을 타입으로 검증하지만, 반환되는 splitter는 opaque handle입니다. `defineTextMotion().split(...)`에 전달해서 사용하면 되고, `kind`나 내부 `split` 함수 같은 descriptor field는 root 사용자 API에 포함하지 않습니다.

### Words

```tsx
const WordReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.034))
  .effect(fade().and(rise({ y: 10 })))
  .component();
```

`words()`는 spacing을 보존하기 위해 공백 token도 만듭니다. 하지만 공백은 timeline delay slot을 소비하지 않습니다. `"Words move as groups"`에서는 visible word만 motion index `0, 1, 2, 3`으로 계산됩니다.

### Graphemes

```tsx
const GlyphReveal = defineTextMotion()
  .split(graphemes())
  .layout(nativeText())
  .timeline(stagger(0.014, { from: 'center' }))
  .effect(fade().and(scale({ from: 0.86 })))
  .component();
```

`graphemes()`는 사용자가 글자 하나처럼 인식하는 단위로 motion을 적용합니다. `text.split('')`보다 accent, 한글, emoji sequence, CJK, RTL 샘플에 더 안전합니다.

### Lines

```tsx
const LineReveal = defineTextMotion()
  .split(lines())
  .layout(nativeText())
  .timeline(stagger(0.12))
  .effect(slide({ y: 16 }).and(fade()))
  .component();
```

`lines()`는 experimental 기능이며 newline-only splitter입니다. 명시적인 `\n` 기준으로만 나눕니다. React Native가 화면에서 자동 줄바꿈한 실제 줄을 측정하지는 않습니다.

### Custom

```tsx
const CustomReveal = defineTextMotion()
  .split(custom((input) => input.match(/\S+|\s+/g) ?? []))
  .layout(nativeText())
  .timeline(stagger(0.028, { from: 'edges' }))
  .effect(rise({ y: 8 }).and(fade()))
  .component();
```

`custom()`은 제품에 맞는 token boundary가 필요할 때 사용합니다. 예를 들면 hashtag, mention, 가격, 문장부호 그룹, 도메인 특화 용어를 직접 나눌 수 있습니다. custom splitter는 string이나 token object를 반환할 수 있습니다.

```tsx
custom((input) => [
  {
    text: input,
    metadata: { kind: 'headline' },
    sourceRange: { start: 0, end: input.length },
  },
]);
```

Custom splitter가 string만 반환하면 `text-motion`은 원문에서 왼쪽부터 순서대로 각 token의 위치를 찾습니다. `input.match(...)`처럼 원문 순서 그대로 나누는 대부분의 splitter는 이 방식으로 충분합니다.

splitter가 token 순서를 바꾸거나, 같은 text를 의도적으로 반복하거나, 원문에서의 정확한 위치가 중요하다면 string 대신 `sourceRange`가 포함된 token object를 반환하세요.

## Timelines

Timeline은 token별 시작 delay를 초 단위로 계산합니다.

```tsx
stagger(0.04);
stagger(0.04, { from: 'center' });
stagger(0.04, { from: 'end' });
stagger(0.04, { from: 'edges' });
wave({ amplitude: 0.06, wavelength: 5 });
sequence(stagger(0.02), wave({ amplitude: 0.04, wavelength: 4 }));
parallel(stagger(0.08), wave({ amplitude: 0.05, wavelength: 3 }));
```

- `stagger(step)` - 선택한 origin에서 고정 간격 delay를 만듭니다.
- `wave()` - token index에 따라 sine wave delay를 만듭니다.
- `sequence()` - 여러 timeline delay를 더합니다.
- `parallel()` - 여러 timeline 중 가장 빠른 delay를 사용합니다.

Timeline factory는 입력 options를 타입으로 검증하지만, 반환되는 timeline은 opaque handle입니다. `.timeline(...)`에 전달해서 사용하면 되고, `delayFor`, `name`, `options` 같은 descriptor field는 root 사용자 API에 포함하지 않습니다.

Timeline 숫자 입력은 finite number여야 합니다. `stagger()`의 step은 0 이상, `wave()`의 amplitude는 0 이상이어야 하며, `wave()`의 wavelength는 0보다 커야 합니다.

## Effects

Effect는 각 token이 어떻게 움직이는지 정의합니다.

```tsx
fade();
rise({ y: 14 });
slide({ x: -12, y: 8 });
scale({ from: 0.92, to: 1 });
pulse({ scale: 1.08 });
shake({ x: 6 });
```

Effect는 `.and(...)`로 조합할 수 있습니다.

```tsx
rise({ y: 14 }).and(fade()).and(scale({ from: 0.98 }));
```

`pulse()`는 midpoint emphasis effect입니다. 애니메이션 중간에 token이 커졌다가 최종 scale로 돌아옵니다. 텍스트가 다른 크기에서 시작하거나 끝나야 한다면 `scale()`을 사용하세요.

Effect factory는 입력 options를 타입으로 검증하지만, 반환되는 effect는 opaque handle입니다. Effect는 `.and(...)`로 조합하면 되고, `name`, `options`, `requiredCapabilities` 같은 descriptor field는 root 사용자 API에서 숨깁니다.

Built-in effect의 숫자 입력은 finite number여야 합니다. `rise({ y })`, `slide({ x, y })`, `shake({ x })`처럼 방향을 의미하는 offset option은 음수도 허용합니다.

## Native Renderer Contract

`nativeText()`는 stable MVP renderer입니다. React Native에서 `rise()`, `slide()`, `scale()`, `pulse()` 같은 transform effect가 실제로 보이도록 wrapping `View`와 animated `Text` token을 사용합니다.

`nativeText()`는 `.layout(...)`에 전달하는 opaque renderer handle을 반환합니다. `kind`, `capabilities`, 구현 `Component` 같은 descriptor field는 root 사용자 API에서 숨깁니다.

이 renderer는 React Native `Text`의 완전한 drop-in 대체품이 아닙니다. 정확한 platform text layout보다 token별 transform의 신뢰성을 우선합니다. RN line-to-token mapping은 deferred 상태입니다.

`nativeText()`로 만든 component는 의도적으로 좁은 prop surface만 지원합니다.

- `style`
- `testID`
- `nativeID`
- `allowFontScaling`
- `maxFontSizeMultiplier`
- `controls`
- `progress`
- `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, `accessibilityState`, `accessibilityValue`, `accessibilityActions`, `accessibilityLanguage`, `onAccessibilityAction`

단일 native text node가 필요한 layout/interaction prop은 stable MVP 계약에 포함되지 않습니다. 예: `numberOfLines`, `ellipsizeMode`, `lineBreakMode`, `onTextLayout`, `selectable`, text `onPress`.

테스트에서 token별 `testID`가 필요하면 `nativeText({ testIDPrefix: 'word' })`를 사용하세요.

```tsx
const TestableReveal = defineTextMotion()
  .split(words())
  .layout(nativeText({ testIDPrefix: 'word' }))
  .effect(fade())
  .component();
```

## Playback Lifecycle

기본 playback은 자동 lifecycle 기반입니다.

- 처음 mount되면 animated visible token은 initial style에서 target style로 자동 실행됩니다.
- 같은 text와 같은 recipe로 parent rerender가 일어나면 진행 중인 progress를 유지합니다.
- text가 바뀌면 token shape가 같아도 해당 token animation은 다시 실행됩니다.
- effect, timeline, motion config가 바뀌면 affected animated token은 reset되고 변경된 입력으로 다시 autoplay됩니다.
- whitespace/static token은 layout text를 보존하지만 animation하지 않고 motion index를 소비하지 않습니다.
- `parentLabelPolicy({ reducedMotion: 'final-state' })`는 reduced-motion 사용자에게 initial animated state를 깜빡이지 않고 final style을 유지합니다.

MVP의 text change는 enter-only입니다. 이전 text를 남겨서 exit animation, crossfade, token diff를 만들지는 않습니다. Component에 `controls`가 있으면 이후 command는 현재 렌더링된 text를 대상으로 동작합니다. Component에 `progress`가 있으면 앱이 소유한 shared value가 새 text의 시각 상태를 결정합니다. 예를 들어 `progress.value`가 `0.5`일 때 새 문장이 렌더링되면 autoplay를 시작하지 않고 그에 맞는 중간 상태로 보입니다.

Example app은 animation을 반복 확인하기 쉽도록 demo player를 remount할 수 있습니다. 이건 demo UI 동작이지, 앱에서 권장하는 public API 패턴은 아닙니다.

### Playback Controls

외부 이벤트가 text motion component에게 play, replay, reset, stop을 지시해야 한다면 `controls`를 사용하세요.

자주 쓰이는 예시는 이런 경우입니다.

- 버튼을 누른 뒤 headline이 reveal되어야 할 때
- onboarding copy가 현재 step에 맞춰 진행되어야 할 때
- screen focus를 받을 때 title을 다시 보여주고 싶을 때
- form field가 valid가 된 뒤 label이 나타나야 할 때
- hero title과 subtitle을 한 번에 replay하고 싶을 때

이런 경우 앱은 이벤트를 소유하고, text component는 실행 방식을 소유합니다. Component는 자기 recipe, timeline, effect, `.motion()` 설정으로 playback을 실행합니다.

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  useTextMotionControls,
  words,
} from '@react-native-motion-kit/text-motion';
import { Button } from 'react-native';

const ReplayableReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.04))
  .effect(rise({ y: 12 }).and(fade()))
  .motion({ kind: 'timing', options: { duration: 420 } })
  .component();

export function Headline() {
  const controls = useTextMotionControls();

  return (
    <>
      <ReplayableReveal controls={controls}>
        Replay without remounting
      </ReplayableReveal>

      <Button title="Replay" onPress={controls.replay} />
      <Button title="Reset" onPress={controls.reset} />
    </>
  );
}
```

`controls`는 progress value가 아니라 command channel입니다.

- `play()`는 현재 progress에서 final state로 이동합니다.
- `replay()`는 initial state로 돌아간 뒤 timeline delay와 `.motion()`으로 다시 실행합니다.
- `reset()`은 진행 중인 playback을 취소하고 initial state로 돌아갑니다.
- `stop()`은 진행 중인 playback을 취소하고 현재 보이는 progress를 유지합니다.

하나의 controls object를 여러 text motion component에 넘길 수 있습니다. 이 경우 command는 연결된 모든 component에 broadcast되고, 각 component는 자기 recipe로 command를 실행합니다.

`controls`와 `progress`는 함께 사용할 수 없습니다. 버튼, screen focus처럼 불연속 이벤트에는 `controls`를 사용하고, scroll/gesture처럼 연속 값에 따라 움직여야 하면 `progress`를 사용하세요.

Text Motion은 playback을 위한 context/provider API나 public component ref API를 제공하지 않습니다. 연결 관계가 JSX에서 보이도록 `controls={controls}`로 명시적으로 전달하세요.

성능 관점에서 `controls`는 짧은 UI 텍스트에 맞춰 설계되어 있습니다. Title, label, 짧은 product sentence라면 playback work가 작고 예측 가능합니다. 긴 문단, 많은 row, 글자 단위로 쪼개는 grapheme split 텍스트에 쓰려면 example의 stress case를 확인하고 target device에서 먼저 측정하세요.

큰 workload가 중요해지면 renderer 내부 구현은 바뀔 수 있습니다. 그래서 example stress case는 controls 구현 방식에 대한 public promise가 아니라 profiling aid로 보는 편이 안전합니다.

### Raw Progress

Text motion이 앱이 이미 소유한 raw value를 따라가야 한다면 `progress`를 사용하세요.

자주 쓰이는 예시는 이런 경우입니다.

- scroll 또는 gesture shared value에 맞춰 text가 따라와야 할 때
- 여러 UI 요소가 같은 shared progress value를 기준으로 함께 움직여야 할 때
- 앱에서 직접 구성한 Reanimated sequence가 문장 전체를 `0`에서 `1`로 밀어야 할 때

이런 경우에는 text component가 언제 시작할지 또는 어떤 curve로 움직일지 결정하지 않습니다. 앱이 Reanimated shared value를 소유하고 text component에는 그 값을 넘깁니다.

```tsx
import {
  defineTextMotion,
  fade,
  nativeText,
  rise,
  stagger,
  words,
} from '@react-native-motion-kit/text-motion';
import { Button } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

const ProgressReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .timeline(stagger(0.08))
  .effect(rise({ y: 12 }).and(fade()))
  .component();

export function Headline() {
  const progress = useSharedValue(0);

  return (
    <>
      <ProgressReveal progress={progress}>
        Progress drives the whole reveal
      </ProgressReveal>

      <Button
        title="Play"
        onPress={() => {
          progress.value = withTiming(1, { duration: 720 });
        }}
      />
    </>
  );
}
```

`progress`는 전체 text motion의 normalized progress입니다.

- `0`은 initial token style을 렌더링합니다.
- `1`은 모든 animated token을 final style로 렌더링합니다.
- `0..1` 밖의 값은 clamp됩니다.
- finite number가 아닌 값은 `0`처럼 처리합니다.

`progress`는 단어 하나의 progress가 아니라 문장 전체의 progress라고 보면 됩니다. 예를 들어 `stagger(0.08)`을 쓰면 첫 번째 단어는 이미 끝났는데 뒤쪽 단어는 아직 따라오는 중일 수 있습니다. Renderer는 global shared value를 visible token별 local progress로 바꾸기 때문에 `stagger()`, `wave()`, `sequence()`, `parallel()`의 timing shape가 controlled mode에서도 유지됩니다. 공백은 계속 렌더링되지만 motion index를 소비하지 않습니다.

`progress`가 있으면 앱이 playback을 소유하고 `.motion()`은 내부 autoplay를 시작하지 않습니다. Playback curve는 shared value를 업데이트하는 곳에서 정합니다.

```tsx
progress.value = withTiming(1, { duration: 720 });
progress.value = withSpring(1);
progress.value = 0;
```

이 rendered component에 `progress`를 넘기면 해당 instance에서는 `.motion()`이 적용되지 않습니다. Autoplay 또는 controls-driven version으로도 쓸 때만 `.motion()`을 추가하세요.

중요한 제한도 있습니다. Controlled mode는 현재 whole-text progress mapping 안에서 fixed token timeline span `1.0`을 사용합니다. 실제로는 timeline delay가 각 token이 언제 시작할지 만들고, `withTiming` 또는 `withSpring`이 전체 문장이 `0`에서 `1`까지 얼마나 빠르게 움직일지를 정합니다. 나중에 controlled mode에서 token별 span 또는 duration 제어가 필요해진다면 `.motion()` duration을 몰래 빌려오는 방식이 아니라 별도 API로 설계하는 편이 안전합니다.

`pause`, `seek`, `reverse`, screen focus helper, in-view helper, scroll/gesture driver는 아직 deferred입니다.

## 접근성

기본 renderer는 parent accessible label을 만들고 animated token node를 장식용으로 숨깁니다. 그래서 screen reader는 token 하나씩이 아니라 문장을 한 번만 읽습니다.

```tsx
import { parentLabelPolicy } from '@react-native-motion-kit/text-motion';

const ReducedReveal = defineTextMotion()
  .split(words())
  .layout(nativeText())
  .effect(rise().and(fade()))
  .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }))
  .component();
```

## React Native Text Segmentation

React Native/Hermes 환경에서는 `Intl.Segmenter`가 항상 보장되지 않습니다. 내장 splitter는 먼저 런타임의 `Intl.Segmenter`를 감지해서 사용하고, 없으면 작은 내부 tokenizer로 fallback합니다. 그래서 앱 시작 시 animation이 crash하지 않습니다.

이 fallback은 UI motion의 안정성을 위한 것이지, full ICU 수준의 locale segmentation을 목표로 하지 않습니다. 정확한 locale-aware word boundary가 필요한 앱, 특히 복잡한 word breaking이 필요한 script를 다루는 앱은 app entrypoint에서 `@formatjs/intl-segmenter` 같은 polyfill을 로드하거나 제품에 맞는 `custom()` splitter를 사용해야 합니다.

## Stable MVP

- `defineTextMotion()`
- `graphemes()`, `words()`, `custom()`
- experimental newline-only `lines()`
- `nativeText()`
- `stagger()`, `sequence()`, `parallel()`, `wave()`
- `fade()`, `rise()`, `slide()`, `scale()`, `pulse()`, `shake()`
- 명시적인 `controls` prop과 `useTextMotionControls()` 기반 play/replay/reset/stop
- external Reanimated shared value 기반 controlled `progress`
- hidden animated token node를 사용하는 parent-label accessibility policy
- `/presets` subpath recipe factories

Custom effect factory와 renderer capability factory는 MVP root API에서 의도적으로 export하지 않습니다. `nativeText()`는 위에 나열된 built-in native text effect만 구현합니다. 이 helper들은 stable renderer-extension SDK를 설계한 뒤 public API로 열 예정입니다.

## Deferred

다음 항목들은 MVP에서 stable export가 아닙니다.

- custom effect factory API
- renderer capability factory API
- `lineReveal`
- `wipe`
- `typewriter`
- `scramble`
- stable `overlayText`
- Skia renderer 또는 Skia-only effects
- `pause`, `seek`, `reverse` 같은 추가 playback API
- first-class screen focus, in-view, scroll, gesture driver
- RN-rendered line-to-token mapping

Skia는 core package의 dependency가 아니라 future optional package boundary로 남겨둡니다.

context/provider playback wiring과 public component ref playback은 deferred feature가 아닙니다. ownership이 숨겨지고 remount/lifecycle 동작을 잘못 사용하기 쉬워서 이 패키지의 API 방향에서 의도적으로 제외합니다. 하나 이상의 text component가 event-driven playback command에 반응해야 한다면 `controls={controls}`를 명시적으로 전달하세요.

## Scope & Roadmap

Text Motion은 generic animation package가 아니라 split text motion engine입니다. 이 패키지에 기능을 넣을지 판단할 때 핵심 질문은 이것입니다.

```txt
이 기능이 split text에 필요한 일을 개선하는가? 예를 들면 text split, layout mapping, token timing, text effect, renderer capability, accessibility, token별 playback.
```

답이 yes라면 `@react-native-motion-kit/text-motion`에 들어올 후보가 될 수 있습니다.

Core text-motion 작업은 다음에 집중해야 합니다.

- splitter, token metadata, layout-aware text motion
- native text renderer의 신뢰성과 성능
- split token을 위한 timeline, effect, motion, controls, progress composition
- decorative token animation을 위한 accessibility behavior
- title, label, product copy motion을 빠르게 만들 수 있는 preset

Advanced text effect는 여전히 text token 또는 text layout에 의존할 때 고려할 수 있습니다.

- typewriter, scramble, wipe, highlight sweep effect
- RN layout 측정과 token-to-line mapping 정책이 안정된 뒤 다룰 수 있는 신뢰 가능한 line-aware reveal
- old/new token set의 playback policy가 필요한 text-change transition

Renderer-specific effect는 renderer capability boundary 뒤에 둬야 합니다.

- blur, glow, shader text, mask, glyph distortion은 core native text renderer보다 optional Skia renderer package 후보에 가깝습니다.
- native renderer가 지원하지 못하는 renderer-specific option을 조용히 받아들이면 안 됩니다.

다른 문제를 푸는 기능은 별도 package가 더 적합할 가능성이 큽니다.

- number count-up, odometer, currency, percentage, timer, delta animation은 split-text layout 문제가 아니라 value formatting 문제입니다.
- generic `View` animation, scene animation, Lottie-style workflow는 이 패키지 밖의 영역입니다.
- 나중에 별도의 value-motion 계열 package가 필요해질 수 있지만, 그건 text-motion API surface를 넓히는 방식보다 별도 package로 두는 편이 안전합니다.

결정 기준은 보수적으로 잡습니다. 사용자의 text-specific production work를 개선하면서 common recipe API를 더 어렵게 만들지 않을 때만 이 패키지에 추가합니다. 그렇지 않다면 deferred, renderer-specific, 또는 별도 package로 둡니다.

## 지금 사용해도 될까?

이 패키지는 MVP에서 의도적으로 작게 시작합니다. layout 전체를 지배하기보다, 짧고 중요한 UI 텍스트에 split motion을 더하는 경우에 가장 잘 맞습니다.

지금 쓰기 좋은 경우:

- hero title, section title, 짧은 label, onboarding copy, product description
- `fade`, `rise`, `slide`, `scale`, `pulse`, `shake`를 조합한 word/grapheme entrance motion
- preset이나 `defineTextMotion()`으로 재사용 가능한 recipe component를 만들고 싶은 경우
- component를 remount하지 않고 replay/reset/stop을 실행해야 하는 경우
- external Reanimated shared value로 text motion progress를 직접 제어해야 하는 경우
- 이미 Reanimated 4를 사용하고 Worklets 설정을 따를 수 있는 앱
- 전체 문장은 한 번만 읽히고, animated token은 장식처럼 처리되어야 하는 accessible text motion

다음 기능이 핵심이라면 이후 버전을 기다리는 편이 좋습니다.

- `pause`, `seek`, `reverse` 같은 추가 playback API
- scroll progress, gesture progress, viewport/in-view trigger를 first-class driver로 쓰는 기능
- 정확한 line-level animation, clipping, masking, token별 line measurement
- blur, glow, shader, mask, glyph distortion 같은 Skia-only visual effect
- rich nested text, inline link, selectable text, native `Text`와 완전히 같은 동작
- target app에서 성능 측정 없이 긴 문단이나 많은 animated row에 적용하는 경우

다음 제품 초점은 실제 앱에서 controls API를 검증한 뒤, state-transition prop, `pause`/`seek`/`reverse`, screen focus helper, in-view helper, scroll/gesture driver를 first-class API로 올릴 가치가 있는지 판단하는 것입니다. Deferred에 적힌 항목은 release promise가 아닙니다. 동작, 예제, 테스트, 문서가 준비되었을 때만 stable API로 올리는 방향입니다.

## 개발

```sh
corepack pnpm install
corepack pnpm run typecheck
corepack pnpm run test
corepack pnpm run build
```

## License

MIT
