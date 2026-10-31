import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const locales = ['en', 'ko'];
const demos = JSON.parse(readFileSync(new URL('../demos.json', import.meta.url), 'utf8'));
const demoSources = JSON.parse(
  readFileSync(new URL('../.cache/demo-sources.json', import.meta.url), 'utf8'),
);
const demoCounts = { en: {}, ko: {} };

assert.deepEqual(
  Object.keys(demoSources.recipes).toSorted(),
  Object.keys(demos).toSorted(),
  'Every demo must have matching source code.',
);
assert.equal(
  demoSources.player,
  readFileSync(new URL('../../example/src/DocsDemo.tsx', import.meta.url), 'utf8'),
  'Player source must match the actual preview app.',
);

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : [target];
  });
}

function pageNames(locale) {
  const directory = path.join(root, locale);
  return filesIn(directory)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => path.relative(directory, file))
    .toSorted();
}

function checkLink(file, value) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) {
    return;
  }

  const target = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!target) {
    return;
  }

  let resolved;
  if (target.startsWith('/')) {
    const asset = path.join(root, 'public', target.slice(1));
    if (existsSync(asset) && statSync(asset).isFile()) {
      return;
    }
    const localized = target.startsWith('/ko/') ? target.slice(4) : target.slice(1);
    resolved = path.join(root, target.startsWith('/ko/') ? 'ko' : 'en', localized);
  } else {
    resolved = path.resolve(path.dirname(file), target);
  }

  resolved = resolved.replace(/\.html$/, '.md');
  const candidates = [
    resolved,
    resolved.replace(/\.md$/, '.mdx'),
    `${resolved}.md`,
    `${resolved}.mdx`,
    path.join(resolved, 'index.md'),
  ];
  assert(
    candidates.some((candidate) => existsSync(candidate) && statSync(candidate).isFile()),
    `Broken local link in ${path.relative(root, file)}: ${value}`,
  );
}

assert.deepEqual(
  pageNames('en'),
  pageNames('ko'),
  'English and Korean pages must have matching paths.',
);

for (const locale of locales) {
  for (const file of filesIn(path.join(root, locale))) {
    if (/\.mdx?$/.test(file)) {
      const content = readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```/gm, '');
      for (const match of content.matchAll(/<MotionDemo\s+id="([^"]+)"\s*\/>/g)) {
        assert(Object.hasOwn(demos, match[1]), `Unknown demo in ${file}: ${match[1]}`);
        demoCounts[locale][match[1]] = (demoCounts[locale][match[1]] ?? 0) + 1;
      }
      for (const match of content.matchAll(/^import .* from ['"]([^'"]+)['"]/gm)) {
        const component = path.resolve(path.dirname(file), match[1]);
        assert(
          existsSync(component) || existsSync(`${component}.tsx`),
          `Missing MDX import in ${file}: ${match[1]}`,
        );
      }
      for (const match of content.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
        checkLink(file, match[1]);
      }
      for (const match of content.matchAll(/^\s*(?:link|src):\s*(\/\S+)/gm)) {
        checkLink(file, match[1]);
      }
    } else if (path.basename(file) === '_nav.json') {
      for (const item of JSON.parse(readFileSync(file, 'utf8'))) {
        // Rspress prefixes navigation links with the current non-default locale.
        const link =
          locale !== 'en' && item.link.startsWith('/') ? `/${locale}${item.link}` : item.link;
        checkLink(file, link);
      }
    } else if (path.basename(file) === '_meta.json') {
      for (const item of JSON.parse(readFileSync(file, 'utf8'))) {
        const name = typeof item === 'string' ? item : item.name;
        if (typeof item === 'object' && item.type === 'dir') {
          assert(
            existsSync(path.join(path.dirname(file), name)),
            `Missing sidebar directory: ${name}`,
          );
        } else {
          checkLink(file, `${name}.md`);
        }
      }
    }
  }
}

assert.deepEqual(demoCounts.en, demoCounts.ko, 'Demo placement must match between languages.');
for (const id of Object.keys(demos)) {
  assert(demoCounts.en[id] > 0, `Missing demonstration: ${id}`);
}
for (const asset of [
  'line-reveal.mp4',
  'line-reveal.jpg',
  'line-reveal-light.mp4',
  'line-reveal-light.jpg',
  'line-reveal.en.vtt',
  'line-reveal.ko.vtt',
]) {
  const file = path.join(root, 'public/media', asset);
  assert(existsSync(file) && statSync(file).size > 0, `Missing native demo asset: ${asset}`);
}

const exportsFile = fileURLToPath(
  new URL('../../packages/text-motion/src/index.tsx', import.meta.url),
);
const valueExports = [
  ...readFileSync(exportsFile, 'utf8').matchAll(/export \{([^}]+)\} from/g),
].flatMap((match) => match[1].split(',').map((name) => name.trim()));
const presetsFile = fileURLToPath(
  new URL('../../packages/text-motion/src/presets/index.ts', import.meta.url),
);
const presetExports = [
  ...readFileSync(presetsFile, 'utf8').matchAll(/export function (\w+)\(/g),
].map((match) => match[1]);
for (const locale of locales) {
  const content = pageNames(locale)
    .map((name) => readFileSync(path.join(root, locale, name), 'utf8'))
    .join('\n');
  for (const name of [...valueExports, ...presetExports]) {
    assert(
      content.includes(`\`${name}\``) || content.includes(`${name}(`),
      `Undocumented ${locale} API: ${name}`,
    );
  }
}

process.stdout.write(
  `Checked ${pageNames('en').length} pages per language: parity, local links, navigation, public API coverage, and ${Object.keys(demos).length} demos.\n`,
);
