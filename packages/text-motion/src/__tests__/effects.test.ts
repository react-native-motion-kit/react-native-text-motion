import * as textMotion from '@react-native-motion-kit/text-motion';
import { fade, pulse, rise, scale, shake, slide } from '@react-native-motion-kit/text-motion';

import { readTextMotionEffectDescriptor } from '../recipe/descriptors';

describe('effects', () => {
  const invalidEffectCases: readonly {
    createEffect: () => unknown;
    message: string;
  }[] = [
    {
      createEffect: () => fade({ from: Number.NaN }),
      message: 'fade from must be a finite number',
    },
    {
      createEffect: () => rise({ y: Number.POSITIVE_INFINITY }),
      message: 'rise y must be a finite number',
    },
    {
      createEffect: () => slide({ x: Number.NaN }),
      message: 'slide x must be a finite number',
    },
    {
      createEffect: () => scale({ to: Number.NEGATIVE_INFINITY }),
      message: 'scale to must be a finite number',
    },
    {
      createEffect: () => pulse({ scale: Number.NaN }),
      message: 'pulse scale must be a finite number',
    },
    {
      createEffect: () => shake({ x: Number.POSITIVE_INFINITY }),
      message: 'shake x must be a finite number',
    },
  ];

  it('uses native-text capability for stable effects', () => {
    const effects = [
      fade(),
      rise({ y: 8 }),
      slide({ x: 2, y: 4 }),
      scale({ from: 0.9 }),
      pulse({ scale: 1.02 }),
      shake({ x: 3 }),
    ];

    expect(
      effects.map((effect) => readTextMotionEffectDescriptor(effect).requiredCapabilities),
    ).toEqual([
      ['native-text'],
      ['native-text'],
      ['native-text'],
      ['native-text'],
      ['native-text'],
      ['native-text'],
    ]);
  });

  it('composes effects in order', () => {
    expect(readTextMotionEffectDescriptor(rise().and(fade()).and(scale())).name).toBe(
      'rise+fade+scale',
    );
  });

  it('keeps descriptor fields off the public runtime object', () => {
    expect(Object.keys(fade())).toEqual(['and']);
  });

  it('rejects non-finite numeric effect options before descriptor creation', () => {
    invalidEffectCases.forEach(({ createEffect, message }) => {
      expect(createEffect).toThrow(message);
    });
  });

  it('does not expose deferred stable APIs', () => {
    expect('lineReveal' in textMotion).toBe(false);
    expect('typewriter' in textMotion).toBe(false);
    expect('scramble' in textMotion).toBe(false);
    expect('wipe' in textMotion).toBe(false);
    expect('useTextMotionController' in textMotion).toBe(false);
    expect('skiaText' in textMotion).toBe(false);
  });
});
