import assert from 'node:assert/strict';
import test from 'node:test';

import { validatePackedPackage, validateRelease } from './release.mjs';

function fixture() {
  return {
    manifest: {
      name: '@react-native-motion-kit/text-motion',
      version: '1.2.3',
      publishConfig: { registry: 'https://registry.npmjs.org/', access: 'public' },
      exports: {
        '.': {
          source: './src/index.tsx',
          types: './lib/typescript/src/index.d.ts',
          default: './lib/module/index.js',
        },
        './presets': {
          types: './lib/typescript/src/presets/index.d.ts',
          default: './lib/module/presets/index.js',
        },
        './package.json': './package.json',
      },
      peerDependencies: { react: '>=18.0.0' },
    },
    files: [
      'package.json',
      'README.md',
      'CHANGELOG.md',
      'LICENSE',
      'src/index.tsx',
      'lib/module/index.js',
      'lib/module/presets/index.js',
      'lib/typescript/src/index.d.ts',
      'lib/typescript/src/presets/index.d.ts',
    ],
    expectedVersion: '1.2.3',
  };
}

test('stable metadata produces the scoped npm tarball filename and latest tag', () => {
  assert.deepEqual(validateRelease({ manifest: fixture().manifest }), {
    version: '1.2.3',
    distTag: 'latest',
    filename: 'react-native-motion-kit-text-motion-1.2.3.tgz',
  });
});

test('prereleases are isolated on next, including numeric and hyphenated identifiers', () => {
  for (const version of ['1.2.3-rc.1', '0.0.1-0', '1.0.0-alpha-beta.2']) {
    const { manifest } = fixture();
    manifest.version = version;
    assert.equal(validateRelease({ manifest, expectedVersion: version }).distTag, 'next');
  }
});

test('requires an explicit version confirmation to exactly match the package', () => {
  assert.doesNotThrow(() =>
    validateRelease({ manifest: fixture().manifest, expectedVersion: '1.2.3' }),
  );
  for (const expectedVersion of ['v1.2.3', '1.2.4', '1.2.3-next.0', '']) {
    assert.throws(
      () => validateRelease({ manifest: fixture().manifest, expectedVersion }),
      /Release version confirmation/,
    );
  }
});

test('rejects malformed or non-normalized package versions', () => {
  for (const version of [
    'v1.2.3',
    '01.2.3',
    '1.2',
    '1.2.3-01',
    '1.2.3-rc.01',
    '1.2.3+',
    '1.2.3+build',
    '1.2.3-',
  ]) {
    const { manifest } = fixture();
    manifest.version = version;
    assert.throws(() => validateRelease({ manifest }), /normalized SemVer/);
  }
});

test('metadata and packed audits reject wrong package identity and publish visibility', () => {
  for (const mutate of [
    (manifest) => {
      manifest.name = '@other/package';
    },
    (manifest) => {
      manifest.private = true;
    },
    (manifest) => {
      manifest.publishConfig.access = 'restricted';
    },
    (manifest) => {
      delete manifest.publishConfig.access;
    },
    (manifest) => {
      manifest.publishConfig.registry = 'https://registry.example.com/';
    },
    (manifest) => {
      delete manifest.publishConfig;
    },
  ]) {
    const packed = fixture();
    mutate(packed.manifest);
    assert.throws(() => validateRelease({ manifest: packed.manifest }));
    assert.throws(() => validatePackedPackage(packed));
  }
});

test('accepts a complete public package and rejects a stale packed version', () => {
  assert.doesNotThrow(() => validatePackedPackage(fixture()));
  assert.throws(
    () => validatePackedPackage({ ...fixture(), expectedVersion: '1.2.4' }),
    /Packed version/,
  );
});

test('requires documentation, license, built JavaScript and declarations even if exports omit them', () => {
  for (const file of fixture().files.filter((name) => name !== 'src/index.tsx')) {
    const packed = fixture();
    packed.files = packed.files.filter((name) => name !== file);
    assert.throws(() => validatePackedPackage(packed), /Missing packed file/);
  }
  const packed = fixture();
  delete packed.manifest.exports['.'].types;
  packed.files = packed.files.filter((file) => file !== 'lib/typescript/src/index.d.ts');
  assert.throws(() => validatePackedPackage(packed), /Missing packed file/);
});

test('rejects leaked development directories at any depth', () => {
  for (const file of [
    'src/__tests__/split.test.ts',
    'src/__fixtures__/input.ts',
    'src/__mocks__/react.ts',
    'node_modules/react/index.js',
    'docs/index.html',
    'example/App.tsx',
    '.github/workflows/release.yml',
  ]) {
    assert.throws(
      () => validatePackedPackage({ ...fixture(), files: [...fixture().files, file] }),
      /Forbidden packed path/,
    );
  }
});

test('rejects unresolved workspace protocols in every dependency field', () => {
  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const spec of ['catalog:', 'catalog:react', 'workspace:*', 'workspace:^1.0.0']) {
      const packed = fixture();
      packed.manifest[field] = { react: spec };
      assert.throws(() => validatePackedPackage(packed), /Unresolved dependency spec/);
    }
  }
});

test('requires public export entries and checks recursively nested export targets', () => {
  for (const entry of ['.', './presets', './package.json']) {
    const packed = fixture();
    delete packed.manifest.exports[entry];
    assert.throws(() => validatePackedPackage(packed), /Missing export/);
  }
  const packed = fixture();
  packed.manifest.exports['.'].development = { import: ['./missing.js', './src/index.tsx'] };
  assert.throws(() => validatePackedPackage(packed), /Missing packed file: missing.js/);
});

test('rejects export targets outside the package and unsafe packed paths', () => {
  for (const target of ['https://example.com/index.js', '../index.js', './lib/../../index.js']) {
    const packed = fixture();
    packed.manifest.exports['.'].default = target;
    assert.throws(() => validatePackedPackage(packed), /local package path/);
  }
  for (const file of ['../README.md', '/README.md']) {
    assert.throws(
      () => validatePackedPackage({ ...fixture(), files: [...fixture().files, file] }),
      /Invalid packed path/,
    );
  }
});
