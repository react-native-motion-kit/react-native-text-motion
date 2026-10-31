import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

import { generateDemoSources } from './generate-demo-sources.mjs';

const recipesSource = readFileSync(
  new URL('../../example/src/docsDemoRecipes.ts', import.meta.url),
  'utf8',
);
const playerSource = readFileSync(
  new URL('../../example/src/DocsDemo.tsx', import.meta.url),
  'utf8',
);
const catalog = JSON.parse(readFileSync(new URL('../demos.json', import.meta.url), 'utf8'));

test('extracts every current demo with its exact shared dependencies and player source', () => {
  const result = generateDemoSources({ recipesSource, playerSource, catalog });
  assert.deepEqual(Object.keys(result.recipes), Object.keys(catalog));
  assert.equal(Object.keys(result.recipes).length, Object.keys(catalog).length);
  assert.equal(result.player, playerSource);
  assert.match(result.recipes.fade, /const accessibility = parentLabelPolicy/);
  assert.match(result.recipes.fade, /const base = defineTextMotion/);
  assert.match(result.recipes.fade, /duration: 520/);
  assert.match(result.recipes.fade, /const phrase =/);
  assert.match(result.recipes.fade, /base\.effect\(fade\(\)\)\.component\(\)/);
  assert.doesNotMatch(result.recipes.fade, /\bpulse\b|\btypewriter\b|\bReveal\b/);
  assert.match(result.recipes.words, /const Reveal = base\.effect/);
  assert.match(result.recipes.words, /Component: Reveal/);
  assert.equal(result.recipes.typewriter, result.recipes['typewriter-progress']);
  assert.match(result.recipes.typewriter, /\.effect\(typewriter\(\)\)/);
  assert.doesNotMatch(result.recipes.typewriter, /typewriterDemo|const base/);
  assert.match(result.recipes['line-reveal'], /\.layout\(overlayText\(\)\)/);
  assert.match(result.recipes['line-reveal'], /duration: 650/);
  assert.doesNotMatch(result.recipes['line-reveal'], /nativeText|const base/);

  for (const [id, recipe] of Object.entries(result.recipes)) {
    const diagnostics = ts.transpileModule(recipe, {
      fileName: `${id}.ts`,
      compilerOptions: { target: ts.ScriptTarget.Latest },
      reportDiagnostics: true,
    }).diagnostics;
    assert.deepEqual(diagnostics, [], `Invalid generated TypeScript for ${id}`);
  }
});

test('extracts current stagger directions without unrelated variant constructors', () => {
  const result = generateDemoSources({ recipesSource, playerSource, catalog });
  const directions = ['start', 'center', 'end', 'edges'];
  assert.deepEqual(Object.keys(result.variants), ['stagger']);
  assert.deepEqual(Object.keys(result.variants.stagger), directions);
  assert.equal(result.variants.stagger.start, result.recipes.stagger);
  for (const direction of directions) {
    const source = result.variants.stagger[direction];
    assert.ok(
      source.includes(
        `Component: staggerBase.timeline(stagger(0.14, { from: '${direction}' })).component()`,
      ),
    );
    assert.match(source, /const staggerBase = defineTextMotion\(\)/);
    assert.doesNotMatch(source, /const stagger(?:Start|Center|End|Edges)\b|docsDemoVariants/);
    for (const other of directions.filter((value) => value !== direction)) {
      assert.ok(!source.includes(`from: '${other}'`));
      assert.notEqual(source, result.variants.stagger[other]);
    }
    assert.deepEqual(
      ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.Latest },
        reportDiagnostics: true,
      }).diagnostics,
      [],
    );
  }
});

test('extracts width reflow with natural wrapping text and both configured widths', () => {
  const result = generateDemoSources({ recipesSource, playerSource, catalog });
  const source = result.recipes['width-reflow'];
  assert.match(source, /widths: \{ narrow: 220, wide: 320 \}/);
  assert.match(
    source,
    /Every rendered line finds its own rhythm when the available width changes\./,
  );
  assert.match(source, /\.layout\(overlayText\(\)\)/);
  assert.match(source, /\.effect\(lineReveal\(\{ y: 24 \}\)\)/);
  assert.doesNotMatch(source, /\\n/);
});

test('reflects source parameter and shared player edits without hand-maintained snippets', () => {
  const updatedPlayer = `${playerSource}\n// Source freshness marker\n`;
  const result = generateDemoSources({
    recipesSource: recipesSource.replace('duration: 520', 'duration: 777'),
    playerSource: updatedPlayer,
    catalog,
  });
  assert.match(result.recipes.fade, /duration: 777/);
  assert.match(result.recipes.words, /duration: 777/);
  assert.doesNotMatch(result.recipes.fade, /duration: 520/);
  assert.match(result.recipes['line-reveal'], /duration: 650/);
  assert.equal(result.player, updatedPlayer);
});

test('uses bound references rather than property names or shadowed callback identifiers', () => {
  const source = `
import { custom, fade } from '@react-native-motion-kit/text-motion';
const input = 'unrelated outer value';
const docsDemoRecipes = {
  sample: { Component: custom((input) => [input]), text: { fade: 'property only' } },
};`;
  const result = generateDemoSources({
    recipesSource: source,
    playerSource: '',
    catalog: { sample: {} },
  });
  assert.match(result.recipes.sample, /import \{ custom \}/);
  assert.doesNotMatch(result.recipes.sample, /import \{ custom, fade/);
  assert.doesNotMatch(result.recipes.sample, /unrelated outer value/);
  assert.match(result.recipes.sample, /custom\(\(input\) => \[input\]\)/);
});

test('fails when registry IDs drift from the documented catalog', () => {
  assert.throws(
    () => generateDemoSources({ recipesSource, playerSource, catalog: { missing: {} } }),
    /identical IDs/,
  );
});

test('fails on ambiguous registries and invalid syntax instead of showing invented code', () => {
  assert.throws(
    () =>
      generateDemoSources({
        recipesSource: 'const docsDemoRecipes = { ...other };',
        playerSource: '',
        catalog: {},
      }),
    /explicit named properties/,
  );
  assert.throws(
    () =>
      generateDemoSources({
        recipesSource: 'const docsDemoRecipes = {',
        playerSource: '',
        catalog: {},
      }),
    /expected/,
  );
});

const variantSource = `
import { defineTextMotion, stagger } from '@react-native-motion-kit/text-motion';
const base = defineTextMotion({ duration: 520 });
const startDelay = 30;
const centerDelay = 45;
const Start = base.stagger(stagger({ from: 'start', delay: startDelay })).component();
const Center = base.stagger(stagger({ from: 'center', delay: centerDelay })).component();
const End = base.stagger(stagger({ from: 'end', delay: 60 })).component();
const Edges = base.stagger(stagger({ from: 'edges', delay: 75 })).component();
const startRecipe = { Component: Start, text: 'Start' };
const startAlias = startRecipe;
const docsDemoRecipes = { stagger: startAlias };
export const docsDemoVariants = {
  stagger: {
    start: startAlias,
    center: { Component: Center, text: 'Center' },
    end: { Component: End, text: 'End' },
    edges: { Component: Edges, text: 'Edges' },
  },
};`;

function extractVariants(source = variantSource) {
  return generateDemoSources({ recipesSource: source, playerSource: '', catalog: { stagger: {} } });
}

test('extracts each variant with its exact dependency closure and no other directions', () => {
  const result = extractVariants();
  assert.deepEqual(Object.keys(result.variants), ['stagger']);
  assert.deepEqual(Object.keys(result.variants.stagger), ['start', 'center', 'end', 'edges']);
  assert.equal(result.variants.stagger.start, result.recipes.stagger);
  for (const [option, source] of Object.entries(result.variants.stagger)) {
    assert.match(source, /const base = defineTextMotion\(\{ duration: 520 \}\)/);
    assert.ok(source.includes(`from: '${option}'`));
    for (const other of ['start', 'center', 'end', 'edges'].filter((name) => name !== option)) {
      assert.ok(!source.includes(`from: '${other}'`));
    }
    assert.doesNotMatch(source, /docsDemoVariants|docsDemoRecipes/);
    assert.deepEqual(
      ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.Latest },
        reportDiagnostics: true,
      }).diagnostics,
      [],
    );
  }
  assert.match(result.variants.stagger.start, /const startDelay = 30/);
  assert.doesNotMatch(result.variants.stagger.start, /centerDelay|const Center/);
});

test('propagates variant parameter edits only to the corresponding extracted closure', () => {
  const before = extractVariants();
  const after = extractVariants(variantSource.replace('centerDelay = 45', 'centerDelay = 123'));
  assert.match(after.variants.stagger.center, /const centerDelay = 123/);
  assert.notEqual(after.variants.stagger.center, before.variants.stagger.center);
  for (const option of ['start', 'end', 'edges']) {
    assert.equal(after.variants.stagger[option], before.variants.stagger[option]);
  }
  assert.equal(after.recipes.stagger, before.recipes.stagger);
});

test('returns an empty variants object when the optional registry is absent', () => {
  const result = extractVariants("const docsDemoRecipes = { stagger: { text: 'Example' } };");
  assert.deepEqual(result.variants, {});
});

test('rejects ambiguous variant registries, unknown IDs and implicit option properties', () => {
  const base = "const docsDemoRecipes = { stagger: { text: 'Example' } };\n";
  const invalid = [
    ['const docsDemoVariants = {};', /top-level exported const/],
    ['export let docsDemoVariants = {};', /top-level exported const/],
    [
      'export const docsDemoVariants = {}; export const docsDemoVariants = {};',
      /top-level exported const/,
    ],
    ['export const docsDemoVariants = { missing: {} };', /Unknown variant demo ID: missing/],
    ['export const docsDemoVariants = { stagger: {}, stagger: {} };', /Duplicate variant ID/],
    ['export const docsDemoVariants = { ...other };', /explicit named properties/],
    [
      'export const docsDemoVariants = { stagger: { start: {}, start: {} } };',
      /Duplicate variant option ID/,
    ],
    ['export const docsDemoVariants = { stagger: { ...other } };', /explicit named properties/],
    [
      'const start = {}; export const docsDemoVariants = { stagger: { start } };',
      /explicit named properties/,
    ],
    [
      "export const docsDemoVariants = { stagger: { ['start']: {} } };",
      /explicit named properties/,
    ],
    [
      'export const docsDemoVariants = { stagger: { start: makeRecipe() } };',
      /object literals or top-level object aliases/,
    ],
    [
      'const a = b; const b = a; export const docsDemoVariants = { stagger: { start: a } };',
      /object literals or top-level object aliases/,
    ],
  ];
  for (const [registry, error] of invalid) {
    assert.throws(() => extractVariants(base + registry), error, registry);
  }
});
