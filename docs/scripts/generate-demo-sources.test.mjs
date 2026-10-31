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
  assert.equal(Object.keys(result.recipes).length, 25);
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
