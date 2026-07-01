import {
  defineTextMotion,
  fade,
  parentLabelPolicy,
  rise,
  type TextMotionMotionConfig,
  type TextMotionRenderer,
} from '@react-native-motion-kit/text-motion';

import {
  createTextMotionRendererHandle,
  readTextMotionEffectDescriptor,
} from '../recipe/descriptors';

const testRenderer: TextMotionRenderer<'native-text'> = createTextMotionRendererHandle({
  kind: 'test-native-text',
  capabilities: ['native-text'],
  Component: () => null,
});

type UnsafeComponentBuilder = {
  component(): (props: { children: string }) => unknown;
};

describe('defineTextMotion', () => {
  it('creates immutable recipe builders', () => {
    const base = defineTextMotion().layout(testRenderer);
    const withEffect = base.effect(fade());

    expect(base.recipe().effects).toHaveLength(0);
    expect(withEffect.recipe().effects).toHaveLength(1);
  });

  it('composes effects in order and returns a component', () => {
    const builder = defineTextMotion()
      .layout(testRenderer)
      .effect(fade().and(rise({ y: 12 })));

    const recipe = builder.recipe();
    const Component = builder.component();
    const effect = recipe.effects[0];

    expect(effect ? readTextMotionEffectDescriptor(effect).name : undefined).toBe('fade+rise');
    expect(
      effect ? readTextMotionEffectDescriptor(effect).requiredCapabilities : undefined,
    ).toEqual(['native-text']);
    expect(typeof Component).toBe('function');
  });

  it('throws when a recipe component has no renderer', () => {
    const Component = (defineTextMotion() as unknown as UnsafeComponentBuilder).component();

    expect(() => Component({ children: 'Missing renderer' })).toThrow('requires a renderer');
  });

  it('throws when a recipe component receives non-string children', () => {
    const Component = defineTextMotion().layout(testRenderer).component() as (props: {
      children: unknown;
    }) => unknown;

    expect(() => Component({ children: 42 })).toThrow('expects a string child');
  });

  it('rejects non-finite numeric motion options before storing the recipe', () => {
    expect(() =>
      defineTextMotion().motion({
        kind: 'timing',
        options: { duration: Number.NaN },
      }),
    ).toThrow('timing motion option "options.duration" must be a finite number');

    expect(() =>
      defineTextMotion().motion({
        kind: 'spring',
        options: { damping: Number.POSITIVE_INFINITY },
      }),
    ).toThrow('spring motion option "options.damping" must be a finite number');
  });

  it('rejects unknown runtime motion kinds', () => {
    const invalidMotion = { kind: 'timng' } as unknown as TextMotionMotionConfig;

    expect(() => defineTextMotion().motion(invalidMotion)).toThrow(
      'motion kind must be "timing" or "spring"',
    );
  });

  it('clones accepted motion options before storing the recipe', () => {
    const options = { duration: 280 };
    const recipe = defineTextMotion().motion({ kind: 'timing', options }).recipe();

    expect(recipe.motion?.options).toEqual(options);
    expect(recipe.motion?.options).not.toBe(options);
  });

  it('keeps recipe result mutations out of builder state', () => {
    const builder = defineTextMotion()
      .motion({ kind: 'timing', options: { duration: 280 } })
      .accessibility(parentLabelPolicy({ reducedMotion: 'final-state' }));
    const firstRecipe = builder.recipe();

    if (firstRecipe.motion?.kind !== 'timing' || !firstRecipe.motion.options) {
      throw new Error('Expected timing motion options in test setup.');
    }

    if (!firstRecipe.accessibility) {
      throw new Error('Expected accessibility policy in test setup.');
    }

    firstRecipe.motion.options.duration = Number.NaN;
    firstRecipe.accessibility.reducedMotion = 'system';

    const nextRecipe = builder.recipe();

    expect(nextRecipe.motion).toEqual({
      kind: 'timing',
      options: { duration: 280 },
    });
    expect(nextRecipe.motion?.options).not.toBe(firstRecipe.motion.options);
    expect(nextRecipe.accessibility?.reducedMotion).toBe('final-state');
    expect(nextRecipe.accessibility).not.toBe(firstRecipe.accessibility);
  });
});
