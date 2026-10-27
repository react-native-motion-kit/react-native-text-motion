# Accessibility

Text Motion treats animated token nodes as decoration. By default, the parent exposes the complete phrase as one accessible label and the individual animated nodes are hidden from accessibility tools. A screen reader should read the phrase once, rather than announcing each word or character.

## Parent-label policy

`parentLabelPolicy(options?)` configures this behavior for a recipe. Its only option is `reducedMotion`.

| Option | Default | Meaning |
| --- | --- | --- |
| `reducedMotion` | `'system'` | Uses Reanimated's system reduced-motion behavior for internal animations. |
| `reducedMotion: 'final-state'` | Opt-in | When system reduced motion is enabled, renders the final visual state immediately. |

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
      Motion that keeps the message readable
    </AccessibleTitle>
  );
}
```

`'final-state'` does not disable motion for everyone. It skips to the final state when the device's reduced-motion setting is enabled. That visual state also takes priority over controls and external progress, so a Typewriter phrase remains fully readable even when the app's shared value is still `0`.

With `nativeText()` and the default `'system'` policy, an external `progress` value remains app-owned. Configure its animation curve to respect the user's preference, or choose `'final-state'` when the rendered text must immediately show the complete result.

`overlayText()` has an additional renderer-level fallback: whenever system reduced motion is enabled, it renders the original final paragraph instead of animated line overlays. This applies with either policy and with external progress, and does not change the app's shared value.

Do not pass `reduceMotion` to `.motion()` options. Text Motion exposes reduced-motion behavior through `.accessibility(...)` instead.

## Labels and text props

The string child supplies the default accessible label. An explicit `accessibilityLabel` can describe text whose visual wording is abbreviated. Supported accessibility props also include `accessibilityHint`, `accessibilityRole`, `accessibilityState`, `accessibilityValue`, `accessibilityActions`, `accessibilityLanguage`, and `onAccessibilityAction`.

`allowFontScaling` and `maxFontSizeMultiplier` are supported. Verify larger font scales and narrow widths in your app, especially for rendered-line motion. See [Component props](../../api/component-props.md) for the complete prop contract and [Renderers](../../api/renderers.md) for layout differences.

## Check in your app

- Read the phrase using VoiceOver and TalkBack; confirm that decorative words and characters are not announced separately.
- Enable reduced motion and check the initial frame, replay, reset, and externally controlled states.
- Check your supported font scales, languages, widths, and contrast in the surrounding UI.
- Keep essential information readable independently of the decorative motion. Typewriter does not emit per-character announcements.
