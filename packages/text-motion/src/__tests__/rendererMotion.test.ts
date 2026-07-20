import {
  fade,
  lineReveal,
  pulse,
  rise,
  scale,
  shake,
  slide,
  stagger,
} from '@react-native-motion-kit/text-motion';

import { createTextMotionEffect } from '../effects/compose';
import { createTextMotionTimelineHandle } from '../recipe/descriptors';
import {
  clampTextMotionProgress,
  createTextMotionControlledTimelineSpan,
  createTextMotionDelaySecondsByItemIndex,
  createTextMotionItemMotion,
  createOverlayTextStyleTransformStatePair,
  createTextMotionStyleTransformStatePair,
  mapTextMotionControlledProgressToItemProgress,
  shouldRenderTextMotionFinalState,
} from '../renderers/rendererMotion';

describe('rendererMotion', () => {
  it('resolves composed built-in effect style states', () => {
    expect(
      createTextMotionStyleTransformStatePair([
        fade({ from: 0.2, to: 0.9 })
          .and(rise({ y: 10 }))
          .and(scale({ from: 0.5, to: 1.1 })),
        pulse({ scale: 1.08 }),
        slide({ x: 4, y: 6 }),
      ]),
    ).toEqual({
      initial: {
        opacity: 0.2,
        scale: 0.5,
        translateX: 4,
        translateY: 16,
      },
      pulseScale: 1.08,
      target: {
        opacity: 0.9,
        scale: 1.1,
        translateX: 0,
        translateY: 0,
      },
    });
  });

  it('keeps native/shared state unchanged while overlay uses private frame and reveal-content channels', () => {
    const effects = [
      fade({ from: 0.2, to: 0.9 })
        .and(rise({ y: 10 }))
        .and(scale({ from: 0.5, to: 1.1 })),
      pulse({ scale: 1.08 }),
      slide({ x: 4, y: 6 }),
    ];

    expect(createTextMotionStyleTransformStatePair(effects)).toEqual({
      initial: {
        opacity: 0.2,
        scale: 0.5,
        translateX: 4,
        translateY: 16,
      },
      pulseScale: 1.08,
      target: {
        opacity: 0.9,
        scale: 1.1,
        translateX: 0,
        translateY: 0,
      },
    });
    expect(createOverlayTextStyleTransformStatePair(effects)).toEqual({
      frame: {
        initial: {
          opacity: 0.2,
          scale: 0.5,
          translateX: 4,
          translateY: 16,
        },
        pulseScale: 1.08,
        target: {
          opacity: 0.9,
          scale: 1.1,
          translateX: 0,
          translateY: 0,
        },
      },
      revealContent: {
        initial: {
          opacity: 1,
          scale: 1,
          translateX: 0,
          translateY: 0,
        },
        pulseScale: 1,
        target: {
          opacity: 1,
          scale: 1,
          translateX: 0,
          translateY: 0,
        },
      },
    });
  });

  it('splits lineReveal opacity onto the overlay frame and relative y onto reveal content', () => {
    expect(
      createOverlayTextStyleTransformStatePair([lineReveal({ fromOpacity: 0.25, y: 18 })]),
    ).toEqual({
      frame: {
        initial: {
          opacity: 0.25,
          scale: 1,
          translateX: 0,
          translateY: 0,
        },
        pulseScale: 1,
        target: {
          opacity: 1,
          scale: 1,
          translateX: 0,
          translateY: 0,
        },
      },
      revealContent: {
        initial: {
          opacity: 1,
          scale: 1,
          translateX: 0,
          translateY: 18,
        },
        pulseScale: 1,
        target: {
          opacity: 1,
          scale: 1,
          translateX: 0,
          translateY: 0,
        },
      },
    });
  });

  it.each([
    ['fade', fade({ from: 0.4, to: 0.8 })],
    ['rise', rise({ y: 14 })],
    ['slide', slide({ x: 3, y: 5 })],
    ['shake', shake({ x: 7 })],
    ['scale', scale({ from: 1.4, to: 1 })],
    ['pulse', pulse({ scale: 1.12 })],
  ])('targets %s at the overlay frame only', (_name, effect) => {
    expect(createOverlayTextStyleTransformStatePair([effect]).revealContent).toEqual({
      initial: {
        opacity: 1,
        scale: 1,
        translateX: 0,
        translateY: 0,
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

  it('preserves composition order for overlay frame opacity while keeping lineReveal y private', () => {
    expect(
      createOverlayTextStyleTransformStatePair([
        lineReveal({ fromOpacity: 0.2, y: 10 })
          .and(scale({ from: 0.8 }))
          .and(pulse({ scale: 1.1 })),
      ]),
    ).toEqual({
      frame: {
        initial: {
          opacity: 0.2,
          scale: 0.8,
          translateX: 0,
          translateY: 0,
        },
        pulseScale: 1.1,
        target: {
          opacity: 1,
          scale: 1,
          translateX: 0,
          translateY: 0,
        },
      },
      revealContent: {
        initial: {
          opacity: 1,
          scale: 1,
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
      },
    });
    expect(
      createOverlayTextStyleTransformStatePair([
        lineReveal({ fromOpacity: 0.2 }).and(fade({ from: 0.4, to: 0.7 })),
      ]).frame.initial.opacity,
    ).toBe(0.4);
    expect(
      createOverlayTextStyleTransformStatePair([
        fade({ from: 0.4, to: 0.7 }).and(lineReveal({ fromOpacity: 0.2 })),
      ]).frame.initial.opacity,
    ).toBe(0.2);
    expect(
      createOverlayTextStyleTransformStatePair([
        fade({ from: 0.4, to: 0.7 }).and(lineReveal({ fromOpacity: 0.2 })),
      ]).frame.target.opacity,
    ).toBe(0.7);
  });

  it('rejects non-finite style-transform effect options', () => {
    const customFade = createTextMotionEffect('fade', { from: Number.NaN }, ['style-transform']);

    expect(() => createTextMotionStyleTransformStatePair([customFade])).toThrow(
      'effect option "from" must be a finite number',
    );
  });

  it('rejects effects outside the style-transform shared capability', () => {
    const customEffect = createTextMotionEffect('blur', {}, ['style-transform']);

    expect(() => createTextMotionStyleTransformStatePair([customEffect])).toThrow(
      'style-transform renderer does not implement the "blur" effect',
    );
  });

  it('plans finite timeline delays by item count', () => {
    expect(
      createTextMotionDelaySecondsByItemIndex(
        {
          effects: [],
          timeline: stagger(0.25),
        },
        3,
      ),
    ).toEqual([0, 0.25, 0.5]);
  });

  it('rejects invalid timeline delays and unsafe millisecond conversion', () => {
    const negativeDelay = createTextMotionTimelineHandle({
      kind: 'timeline',
      name: 'negative',
      delayFor: () => -0.1,
    });
    const overflowingDelay = Number.MAX_SAFE_INTEGER / 1000 + 1;

    expect(() =>
      createTextMotionDelaySecondsByItemIndex({ effects: [], timeline: negativeDelay }, 1),
    ).toThrow('timeline delay must be a finite number greater than or equal to 0');
    expect(() =>
      createTextMotionItemMotion(
        { effects: [] },
        createTextMotionStyleTransformStatePair([]),
        overflowingDelay,
      ),
    ).toThrow('timeline delay must convert to a safe integer millisecond value');
  });

  it('creates shared item motion from recipe style, delay, motion, and reduced-motion policy', () => {
    const styleState = createTextMotionStyleTransformStatePair([fade({ from: 0.25 })]);

    expect(
      createTextMotionItemMotion(
        {
          accessibility: {
            hideTokensFromAccessibility: true,
            kind: 'parent-label',
            parentLabel: true,
            reducedMotion: 'final-state',
          },
          effects: [],
          motion: { kind: 'timing', options: { duration: 420 } },
        },
        styleState,
        0.12,
      ),
    ).toEqual({
      delayMs: 120,
      initial: {
        opacity: 0.25,
        scale: 1,
        translateX: 0,
        translateY: 0,
      },
      motion: { kind: 'timing', options: { duration: 420 } },
      pulseScale: 1,
      reducedMotion: 'final-state',
      target: {
        opacity: 1,
        scale: 1,
        translateX: 0,
        translateY: 0,
      },
    });
  });

  it('keeps finite progress inside the normalized range', () => {
    expect(clampTextMotionProgress(0.4)).toBe(0.4);
  });

  it('clamps negative progress to the initial state', () => {
    expect(clampTextMotionProgress(-0.1)).toBe(0);
  });

  it('clamps overflowing progress to the final state', () => {
    expect(clampTextMotionProgress(1.4)).toBe(1);
  });

  it('treats non-finite progress as the initial state', () => {
    expect(clampTextMotionProgress(Number.NaN)).toBe(0);
    expect(clampTextMotionProgress(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampTextMotionProgress(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('uses one item span when no animated item delays exist', () => {
    expect(createTextMotionControlledTimelineSpan([])).toBe(1);
  });

  it('adds the fixed item span to the last item delay', () => {
    expect(createTextMotionControlledTimelineSpan([0, 0.25, 0.8])).toBe(1.8);
  });

  it('keeps item progress at zero before its delay starts', () => {
    expect(
      mapTextMotionControlledProgressToItemProgress({
        progress: 0.25,
        itemDelaySeconds: 0.75,
        totalTimelineSpan: 2,
      }),
    ).toBe(0);
  });

  it('returns partial item progress after the item delay starts', () => {
    expect(
      mapTextMotionControlledProgressToItemProgress({
        progress: 0.5,
        itemDelaySeconds: 0.25,
        totalTimelineSpan: 2,
      }),
    ).toBe(0.75);
  });

  it('keeps item progress at one after its span completes', () => {
    expect(
      mapTextMotionControlledProgressToItemProgress({
        progress: 1,
        itemDelaySeconds: 0.25,
        totalTimelineSpan: 2,
      }),
    ).toBe(1);
  });

  it('matches the existing staggered renderer mapping example', () => {
    const totalTimelineSpan = createTextMotionControlledTimelineSpan([0, 0.5, 1]);

    expect(
      mapTextMotionControlledProgressToItemProgress({
        progress: 0.5,
        itemDelaySeconds: 0,
        totalTimelineSpan,
      }),
    ).toBe(1);
    expect(
      mapTextMotionControlledProgressToItemProgress({
        progress: 0.5,
        itemDelaySeconds: 0.5,
        totalTimelineSpan,
      }),
    ).toBe(0.5);
    expect(
      mapTextMotionControlledProgressToItemProgress({
        progress: 0.5,
        itemDelaySeconds: 1,
        totalTimelineSpan,
      }),
    ).toBe(0);
  });

  it('renders final state only for final-state reduced motion policy', () => {
    expect(shouldRenderTextMotionFinalState(true, 'final-state')).toBe(true);
    expect(shouldRenderTextMotionFinalState(false, 'final-state')).toBe(false);
    expect(shouldRenderTextMotionFinalState(true, 'system')).toBe(false);
  });
});
