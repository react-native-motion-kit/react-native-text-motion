import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const locales = ['en', 'ko'];

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
  `Checked ${pageNames('en').length} pages per language: parity, local links, navigation, and public API coverage.\n`,
);
