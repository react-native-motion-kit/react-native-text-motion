import { registerRootComponent } from 'expo';

import App from './src/App';
import DocsDemo from './src/DocsDemo';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(process.env.EXPO_PUBLIC_TEXT_MOTION_DOCS === '1' ? DocsDemo : App);
