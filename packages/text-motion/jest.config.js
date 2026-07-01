const reactNativePackages = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'react-native-reanimated',
  'react-native-worklets',
  '@testing-library/react-native',
  'test-renderer',
];

const pnpmReactNativePackages = [
  '(jest-)?react-native',
  'react-native-reanimated',
  'react-native-worklets',
  'test-renderer',
];

module.exports = {
  moduleNameMapper: {
    '^@react-native-motion-kit/text-motion$': '<rootDir>/src/index.tsx',
    '^@react-native-motion-kit/text-motion/presets$': '<rootDir>/src/presets/index.ts',
  },
  modulePathIgnorePatterns: ['<rootDir>/../../example/node_modules', '<rootDir>/lib/'],
  preset: '@react-native/jest-preset',
  resolver: 'react-native-worklets/jest/resolver',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    `node_modules/(?!(${reactNativePackages.join('|')}|\\.pnpm)/)`,
    `node_modules/.pnpm/(?!(${pnpmReactNativePackages.join('|')})@|@react-native\\+|@react-native-community\\+|@testing-library\\+react-native@)`,
  ],
};
