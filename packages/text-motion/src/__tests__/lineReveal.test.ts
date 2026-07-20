import {
  defineTextMotion,
  lineReveal,
  nativeText,
  overlayText,
  scale,
} from '@react-native-motion-kit/text-motion';
import { render } from '@testing-library/react-native';
import { createElement } from 'react';

import { readTextMotionEffectDescriptor } from '../recipe/descriptors';
import { createTextMotionStyleTransformStatePair } from '../renderers/rendererMotion';

describe('lineReveal', () => {
  it('creates a private line-mask style-transform effect descriptor', () => {
    const descriptor = readTextMotionEffectDescriptor(lineReveal({ fromOpacity: 0.4, y: -8 }));

    expect(descriptor).toMatchObject({
      name: 'lineReveal',
      options: { fromOpacity: 0.4, y: -8 },
      requiredCapabilities: ['line-mask', 'style-transform'],
    });
  });

  it('validates numeric options at the factory boundary', () => {
    expect(() => lineReveal({ y: Number.NaN })).toThrow('lineReveal y must be a finite number');
    expect(() => lineReveal({ fromOpacity: Number.POSITIVE_INFINITY })).toThrow(
      'lineReveal fromOpacity must be a finite number',
    );
  });

  it('composes with common style-transform effects deterministically', () => {
    expect(
      createTextMotionStyleTransformStatePair([
        lineReveal({ fromOpacity: 0.2, y: 10 }).and(scale({ from: 0.9 })),
      ]),
    ).toEqual({
      initial: {
        opacity: 0.2,
        scale: 0.9,
        translateX: 0,
        translateY: 10,
      },
      pulseScale: 1,
      target: {
        opacity: 1,
        scale: 1,
        translateX: 0,
        translateY: 0,
      },
    });
  });

  it('builds a rendered-line recipe without a public splitter', () => {
    const Component = defineTextMotion().layout(overlayText()).effect(lineReveal()).component();

    expect(typeof Component).toBe('function');
  });

  it('throws when unsafe JavaScript combines lineReveal with nativeText', async () => {
    const Broken = defineTextMotion()
      .layout(nativeText())
      .effect(lineReveal() as never)
      .component();

    await expect(render(createElement(Broken, undefined, 'Unsafe line reveal'))).rejects.toThrow(
      '@react-native-motion-kit/text-motion effect "lineReveal" requires capability "line-mask", but renderer "nativeText" does not provide it.',
    );
  });
});
