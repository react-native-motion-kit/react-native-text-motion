import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = fileURLToPath(new URL('../docs/', import.meta.url));
const output = fileURLToPath(new URL('../doc_build/', import.meta.url));
const origin = 'https://react-native-text-motion.pages.dev';

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : [target];
  });
}

function headTags(file) {
  const html = readFileSync(file, 'utf8').split('</head>')[0];
  return [...html.matchAll(/<(html|meta|link)\b([^>]*)>/g)].map(([, tag, attributes]) => ({
    tag,
    ...Object.fromEntries(
      [...attributes.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
    ),
  }));
}

function oneTag(tags, tag, attribute, value, file) {
  const matches = tags.filter((item) => item.tag === tag && item[attribute] === value);
  assert.equal(matches.length, 1, `${file}: expected exactly one ${tag}[${attribute}="${value}"]`);
  return matches[0];
}

const canonicalUrls = [];
for (const locale of ['en', 'ko']) {
  const descriptions = new Set();
  for (const source of filesIn(path.join(docsRoot, locale)).filter((file) =>
    /\.mdx?$/.test(file),
  )) {
    const relative = path.relative(path.join(docsRoot, locale), source).replaceAll(path.sep, '/');
    const route = `/${relative.replace(/\.mdx?$/, '').replace(/(?:^|\/)index$/, '/')}`.replaceAll(
      '//',
      '/',
    );
    const prefix = locale === 'en' ? '' : '/ko';
    const canonical = `${origin}${prefix}${route}`;
    const file = path.join(output, prefix, relative.replace(/\.mdx?$/, '.html'));
    const tags = headTags(file);

    assert.equal(oneTag(tags, 'html', 'lang', locale, file).lang, locale);
    assert.equal(oneTag(tags, 'link', 'rel', 'canonical', file).href, canonical);
    assert.equal(oneTag(tags, 'meta', 'property', 'og:url', file).content, canonical);
    assert.equal(oneTag(tags, 'meta', 'property', 'og:image', file).content, `${origin}/logo.png`);
    assert.equal(oneTag(tags, 'meta', 'name', 'twitter:card', file).content, 'summary');

    const titles = [...readFileSync(file, 'utf8').matchAll(/<title>([^<]+)<\/title>/g)];
    assert.equal(titles.length, 1, `${file}: duplicate or missing title`);
    assert(titles[0][1].includes('React Native Text Motion'), `${file}: missing site title`);
    assert.equal(oneTag(tags, 'meta', 'property', 'og:title', file).content, titles[0][1]);

    const description = oneTag(tags, 'meta', 'name', 'description', file).content;
    assert(description.length >= 50 && description.length <= 160, `${file}: description length`);
    assert.equal(/[가-힣]/.test(description), locale === 'ko', `${file}: description language`);
    assert(!descriptions.has(description), `${file}: repeated page description`);
    descriptions.add(description);
    assert.equal(oneTag(tags, 'meta', 'property', 'og:description', file).content, description);

    const alternates = tags.filter((item) => item.tag === 'link' && item.rel === 'alternate');
    assert.equal(alternates.length, 2, `${file}: duplicate or missing hreflang links`);
    for (const lang of ['en', 'ko']) {
      assert.equal(
        oneTag(alternates, 'link', 'hreflang', lang, file).href,
        `${origin}${lang === 'en' ? '' : '/ko'}${route}`,
      );
    }
    canonicalUrls.push(canonical);
  }
}

const sitemap = readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Duplicate sitemap URLs');
assert.deepEqual(
  sitemapUrls.toSorted(),
  canonicalUrls.toSorted(),
  'Sitemap must match document canonicals',
);
assert(
  sitemapUrls.every((url) => !url.endsWith('.html')),
  'Sitemap must use clean URLs',
);

const notFound = headTags(path.join(output, '404.html'));
assert.equal(oneTag(notFound, 'meta', 'name', 'robots', '404.html').content, 'noindex');
assert(
  !notFound.some((tag) => tag.rel === 'canonical' || tag.rel === 'alternate'),
  '404 must not advertise document URLs',
);

const robots = readFileSync(path.join(output, 'robots.txt'), 'utf8');
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt must advertise the sitemap');
assert(robots.includes('Disallow: /demos/'), 'The standalone demo app is not documentation');
assert(existsSync(path.join(output, 'logo.png')), 'Missing social preview image');
for (const prefix of ['', 'ko/']) {
  for (const file of ['llms.txt', 'llms-full.txt']) {
    assert(
      readFileSync(path.join(output, prefix, file), 'utf8').trim(),
      `Missing ${prefix}${file}`,
    );
  }
}

process.stdout.write(
  `Checked SEO for ${canonicalUrls.length} pages: descriptions, canonicals, hreflang, social metadata, sitemap, robots, and AI files.\n`,
);
