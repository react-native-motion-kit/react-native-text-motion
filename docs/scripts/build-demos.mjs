import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const exampleRoot = fileURLToPath(new URL('../../example/', import.meta.url));
const outputDirectory = fileURLToPath(new URL('../docs/public/demos/', import.meta.url));

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'expo',
    'export',
    '--platform',
    'web',
    '--output-dir',
    outputDirectory,
    '--max-workers',
    '2',
  ],
  {
    cwd: exampleRoot,
    env: {
      ...process.env,
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      EXPO_PUBLIC_TEXT_MOTION_DOCS: '1',
      EXPO_PUBLIC_TEXT_MOTION_CAPTURE: '0',
      EXPO_PUBLIC_TEXT_MOTION_DEMO_ID: '',
      TEXT_MOTION_DOCS_WEB_EXPORT: '1',
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
