# Installation

Text Motion uses React Native Reanimated and React Native Worklets. Set up compatible versions of these dependencies in your app before rendering animated text.

## Requirements

The package declares these peer dependency minimums:

| Dependency | Declared range |
| --- | --- |
| `react` | `>=18.0.0` |
| `react-native` | `>=0.76.0` |
| `react-native-reanimated` | `>=4.0.0` |
| `react-native-worklets` | `>=0.5.0` |

These ranges are not a compatibility matrix. Choose a React Native, Reanimated, and Worklets combination supported by the [Reanimated compatibility table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/). Reanimated 4 requires the React Native New Architecture.

## Install the packages

For an existing React Native app:

```sh
pnpm add @react-native-motion-kit/text-motion react-native-reanimated react-native-worklets
```

With npm or Yarn, use the equivalent `npm install` or `yarn add` command.

For an Expo app, let Expo choose the Reanimated and Worklets versions for your SDK:

```sh
npx expo install react-native-reanimated react-native-worklets
pnpm add @react-native-motion-kit/text-motion
```

Check that your SDK's selected versions satisfy the peer ranges above. Follow the [Expo Reanimated guide](https://docs.expo.dev/versions/latest/sdk/reanimated/) for the setup required by your SDK and build type.

## Configure Worklets

Follow the official [Reanimated getting-started guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) and [Worklets getting-started guide](https://docs.swmansion.com/react-native-worklets/docs/fundamentals/getting-started/) for your environment.

In a bare React Native app using Babel, add the Worklets plugin as the **last** plugin in the existing configuration:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

Preserve any other presets and plugins your app needs. Expo's Babel preset may configure this for your SDK; use the SDK-specific setup rather than adding a duplicate plugin.

After adding native dependencies, install iOS pods through your app's existing CocoaPods workflow and rebuild the native app. Restart Metro with its cache reset if the Babel configuration changed. Text Motion itself does not require an additional Babel plugin, provider, or native configuration.

## Import from the public entrypoints

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

Built-in primitives come from the package root. The three presets come from `/presets`. Do not import internal renderer or descriptor files.

Continue to the [quick start](./quick-start.mdx).
