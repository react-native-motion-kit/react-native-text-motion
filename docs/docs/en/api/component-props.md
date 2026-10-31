# Component Props

Calling a recipe's `.component()` returns a `TextMotionComponent`. Its props are `TextMotionComponentProps`, shared by both built-in renderers.

## Text and styling

| Prop | Type | Behavior |
| --- | --- | --- |
| `children` | `string` | Required plain text. Nested elements, arrays, and rich text are not supported. |
| `style` | `StyleProp<TextStyle>` | Text styling. `nativeText()` applies it to token text; `overlayText()` uses it for the measured paragraph. |
| `testID` | `string` | Identifies the parent container. |
| `nativeID` | `string` | Passed to the parent container. |
| `allowFontScaling` | React Native `TextProps['allowFontScaling']` | Forwarded to text rendering. |
| `maxFontSizeMultiplier` | React Native `TextProps['maxFontSizeMultiplier']` | Forwarded to text rendering. |

The component requires a string at runtime as well as in TypeScript. To include authored newlines, use a string expression such as `{'First line\nSecond line'}`. Use a surrounding `View` for external layout constraints instead of assuming all `Text` or `View` props are forwarded.

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
        Make room for readable motion
      </Title>
    </View>
  );
}
```

## Playback

| Prop | Type | Behavior |
| --- | --- | --- |
| `controls` | `TextMotionControls` | Event-driven `play`, `replay`, `reset`, and `stop`; internal playback uses the recipe's `.motion()` config. |
| `progress` | Reanimated `SharedValue<number>` | App-owned whole-text progress; internal autoplay and `.motion()` do not drive that instance. |

**`controls` and `progress` are mutually exclusive.** TypeScript rejects the combination and both renderers also throw at runtime. With neither prop, animated content autoplays on mount.

`progress` is normalized: `0` is initial and `1` is final. Finite values outside that range are clamped, and non-finite values are treated as `0`. Timeline delays map it to per-unit progress, so it is not a visible-character percentage. See [Playback](../guide/usage/playback.mdx) for complete controls and progress examples.

## Accessibility

The supported accessibility props are:

- `accessibilityLabel`
- `accessibilityHint`
- `accessibilityRole`
- `accessibilityState`
- `accessibilityValue`
- `accessibilityActions`
- `accessibilityLanguage`
- `onAccessibilityAction`

The default parent label is the complete original string; `accessibilityLabel` overrides it. The policy owns whether the parent is accessible and whether decorative nodes are hidden. Configure it through `.accessibility(parentLabelPolicy(...))`, rather than passing an `accessible` prop. See [Accessibility](../guide/usage/accessibility.md).

## Lifecycle

Ordinary parent rerenders with the same text and recipe preserve in-flight playback. Text changes are enter-only: old content is not retained for an exit, crossfade, or token diff. In controls mode, later commands target the current text. In external-progress mode, the current shared value determines the new text's state.

Changes to effect, timeline, or motion configuration can reset affected animations. Keep recipe components and function-valued motion options stable when playback should survive parent rerenders.

## Deliberately narrow surface

These components are not full React Native `Text` replacements. Props such as `numberOfLines`, `ellipsizeMode`, `lineBreakMode`, `onTextLayout`, `selectable`, text `onPress`, and nested styled text are outside the current contract. Put interaction or external layout on an appropriate surrounding component.

`TextMotionComponent`, `TextMotionComponentProps`, `TextMotionComponentTextProps`, and `TextMotionComponentAccessibilityProps` are exported from the root for typed application code. Controls use `useTextMotionControls()` and the exported `TextMotionControls` type; there is no public component-ref or context/provider playback API.
