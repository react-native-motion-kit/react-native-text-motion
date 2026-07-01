const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const textMotionPackageRoot = path.resolve(workspaceRoot, 'packages/text-motion');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  new RegExp(`${workspaceRoot}/node_modules/react/`),
  new RegExp(`${workspaceRoot}/node_modules/react-native/`),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  '@react-native-motion-kit/text-motion': textMotionPackageRoot,
  '@react-native-motion-kit/text-motion/presets': path.resolve(
    textMotionPackageRoot,
    'src/presets',
  ),
};

config.resolver.unstable_conditionNames = [
  ...(config.resolver.unstable_conditionNames ?? []),
  'react-native-motion-kit-text-motion-source',
];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
