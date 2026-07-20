import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const checkedDeclarationFiles = [
  'lib/typescript/src/effects/lineReveal.d.ts',
  'lib/typescript/src/recipe/recipe.d.ts',
  'lib/typescript/src/renderers/index.d.ts',
  'lib/typescript/src/renderers/overlayText.d.ts',
  'lib/typescript/src/types/renderer.d.ts',
];
const publicOwnershipDeclarationFiles = [
  'lib/typescript/src/recipe/recipe.d.ts',
  'lib/typescript/src/renderers/overlayText.d.ts',
];
const rootDeclarationFiles = [
  'lib/typescript/src/index.d.ts',
  'lib/typescript/src/recipe/index.d.ts',
];

const forbiddenPatterns = [
  /\bTextMotionOwnsLayoutRenderer\b/,
  /\bTextMotionSplittableRenderer\b/,
  /\bLINE_MASK_CAPABILITY\b/,
  /\bTextMotionOverlayStyleTransformStatePair\b/,
  /\bcreateOverlayTextStyleTransformStatePair\b/,
  /\brevealContent\b/,
];
const forbiddenPublicOwnershipPatterns = [/\bsplitter\?\s*:\s*never\b/];
const forbiddenRootPatterns = [/\bTextMotionSplitRenderableRecipeBuilder\b/];
const requiredPresetPatterns = [
  /import type \{ TextMotionSplitRenderableRecipeBuilder \} from '\.\.\/recipe\/recipe\.js';/,
  /type NativeTextPresetBuilder = TextMotionSplitRenderableRecipeBuilder<'native-text' \| 'style-transform'>;/,
  /export declare function editorialRise\(\): NativeTextPresetBuilder;/,
  /export declare function softWave\(\): NativeTextPresetBuilder;/,
  /export declare function gentleEmphasis\(\): NativeTextPresetBuilder;/,
];

function createPatternFailures(files, patterns) {
  return files.flatMap((file) => {
    const declaration = readFileSync(join(process.cwd(), file), 'utf8');

    return patterns.flatMap((pattern) => {
      if (!pattern.test(declaration)) {
        return [];
      }

      return `${file}: ${pattern.source}`;
    });
  });
}

const failures = [
  ...createPatternFailures(checkedDeclarationFiles, forbiddenPatterns),
  ...createPatternFailures(publicOwnershipDeclarationFiles, forbiddenPublicOwnershipPatterns),
  ...createPatternFailures(rootDeclarationFiles, forbiddenRootPatterns),
];

const presetDeclaration = readFileSync(
  join(process.cwd(), 'lib/typescript/src/presets/index.d.ts'),
  'utf8',
);

const missingPresetPatterns = requiredPresetPatterns.flatMap((pattern) => {
  if (pattern.test(presetDeclaration)) {
    return [];
  }

  return `lib/typescript/src/presets/index.d.ts missing: ${pattern.source}`;
});

failures.push(...missingPresetPatterns);

if (failures.length === 0) {
  console.log('Declaration surface check passed.');
  process.exit(0);
}

console.error('Declaration surface check failed. Forbidden internal names were emitted:');
failures.forEach((failure) => {
  console.error(`- ${failure}`);
});
process.exit(1);
