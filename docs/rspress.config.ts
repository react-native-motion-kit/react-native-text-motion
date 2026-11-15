import { defineConfig } from '@rspress/core';
import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';
import { fileURLToPath } from 'node:url';

const docsRoot = fileURLToPath(new URL('./docs', import.meta.url));

export default defineConfig({
  root: docsRoot,
  lang: 'en',
  locales: [
    { lang: 'en', label: 'English' },
    { lang: 'ko', label: '한국어' },
  ],
  title: 'React Native Text Motion',
  description: 'Composable text motion for React Native, powered by Reanimated.',
  icon: '/logo.png',
  logo: '/logo.png',
  logoText: 'Text Motion',
  llms: true,
  ssg: true,
  markdown: {
    showLineNumbers: true,
    defaultWrapCode: false,
    shiki: {
      transformers: [transformerNotationDiff(), transformerNotationHighlight()],
    },
  },
  themeConfig: {
    lastUpdated: true,
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/react-native-motion-kit/react-native-text-motion',
      },
      {
        icon: 'npm',
        mode: 'link',
        content: 'https://www.npmjs.com/package/@react-native-motion-kit/text-motion',
      },
    ],
    editLink: {
      docRepoBaseUrl:
        'https://github.com/react-native-motion-kit/react-native-text-motion/tree/main/docs/docs',
    },
  },
});
