import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageName = '@react-native-motion-kit/text-motion';
const registry = 'https://registry.npmjs.org/';
const versionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/;

function validateManifest(manifest) {
  if (manifest.name !== packageName) {
    throw new Error(`Expected package name ${packageName}.`);
  }
  if (manifest.private) {
    throw new Error('Release package must not be private.');
  }
  if (typeof manifest.version !== 'string' || !versionPattern.test(manifest.version)) {
    throw new Error('Package version must be normalized SemVer without build metadata.');
  }
  if (
    manifest.publishConfig?.registry !== registry ||
    manifest.publishConfig?.access !== 'public'
  ) {
    throw new Error(`publishConfig must use registry ${registry} and public access.`);
  }
}

export function validateRelease({ manifest, expectedVersion = manifest.version }) {
  validateManifest(manifest);
  const { version } = manifest;
  if (expectedVersion !== version) {
    throw new Error(`Release version confirmation must exactly match ${version}.`);
  }
  return {
    version,
    distTag: version.includes('-') ? 'next' : 'latest',
    filename: `react-native-motion-kit-text-motion-${version}.tgz`,
  };
}

function exportTargets(value) {
  if (typeof value === 'string') {
    return [value];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(exportTargets);
  }
  return [];
}

export function validatePackedPackage({ manifest, files, expectedVersion }) {
  validateManifest(manifest);
  if (manifest.version !== expectedVersion) {
    throw new Error(`Packed version must match release version ${expectedVersion}.`);
  }

  const packedFiles = new Set(files);
  for (const file of packedFiles) {
    const segments = file.split('/');
    if (file.startsWith('/') || segments.includes('..')) {
      throw new Error(`Invalid packed path: ${file}`);
    }
    if (
      segments.some((segment) =>
        [
          '__tests__',
          '__fixtures__',
          '__mocks__',
          'node_modules',
          'docs',
          'example',
          '.github',
        ].includes(segment),
      )
    ) {
      throw new Error(`Forbidden packed path: ${file}`);
    }
  }

  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
      if (typeof spec === 'string' && /(?:catalog|workspace):/.test(spec)) {
        throw new Error(`Unresolved dependency spec in ${field}.${name}: ${spec}`);
      }
    }
  }

  const requiredFiles = [
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'lib/module/index.js',
    'lib/module/presets/index.js',
    'lib/typescript/src/index.d.ts',
    'lib/typescript/src/presets/index.d.ts',
  ];
  for (const entry of ['.', './presets', './package.json']) {
    if (!exportTargets(manifest.exports?.[entry]).length) {
      throw new Error(`Missing export: ${entry}`);
    }
  }
  for (const target of exportTargets(manifest.exports)) {
    if (
      !target.startsWith('./') ||
      target
        .slice(2)
        .split('/')
        .some((part) => part === '..' || part === '.')
    ) {
      throw new Error(`Export target must be a local package path: ${target}`);
    }
    requiredFiles.push(target.slice(2));
  }
  for (const file of requiredFiles) {
    if (!packedFiles.has(file)) {
      throw new Error(`Missing packed file: ${file}`);
    }
  }
}

function main() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  if (process.argv[2] === 'metadata') {
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'packages/text-motion/package.json'), 'utf8'),
    );
    const { version, distTag, filename } = validateRelease({
      manifest,
      expectedVersion: process.env.RELEASE_VERSION || undefined,
    });
    const nodeVersion = readFileSync(resolve(root, '.nvmrc'), 'utf8').trim();
    console.log(`Release ${version}: ${distTag}, ${filename}, Node ${nodeVersion}`);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `version=${version}\ndist-tag=${distTag}\nfilename=${filename}\nnode-version=${nodeVersion}\n`,
      );
    }
    return;
  }
  if (process.argv[2] === 'audit') {
    const tarball = process.argv[3];
    const expectedVersion = process.env.RELEASE_VERSION;
    if (!tarball || !expectedVersion) {
      throw new Error('audit requires a tarball path and RELEASE_VERSION.');
    }
    const names = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' }).trim().split('\n');
    if (names.some((name) => !name.startsWith('package/'))) {
      throw new Error('Tarball entries must be under package/.');
    }
    const manifest = JSON.parse(
      execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8' }),
    );
    const files = names
      .filter((name) => !name.endsWith('/'))
      .map((name) => name.slice('package/'.length));
    validatePackedPackage({ manifest, files, expectedVersion });
    console.log(`Audited ${manifest.name}@${manifest.version}: ${files.length} packed files.`);
    return;
  }
  throw new Error('Usage: node .github/scripts/release.mjs metadata | audit <tarball>');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
