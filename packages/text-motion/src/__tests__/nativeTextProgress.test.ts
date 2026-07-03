import {
  clampNativeTextProgress,
  createNativeTextControlledTimelineSpan,
  mapNativeTextControlledProgressToTokenProgress,
} from '../renderers/nativeTextProgress';

describe('nativeTextProgress', () => {
  it('keeps finite progress inside the normalized range', () => {
    expect(clampNativeTextProgress(0.4)).toBe(0.4);
  });

  it('clamps negative progress to the initial state', () => {
    expect(clampNativeTextProgress(-0.1)).toBe(0);
  });

  it('clamps overflowing progress to the final state', () => {
    expect(clampNativeTextProgress(1.4)).toBe(1);
  });

  it('treats non-finite progress as the initial state', () => {
    expect(clampNativeTextProgress(Number.NaN)).toBe(0);
    expect(clampNativeTextProgress(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampNativeTextProgress(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it('uses one token span when no animated token delays exist', () => {
    expect(createNativeTextControlledTimelineSpan([])).toBe(1);
  });

  it('adds the fixed token span to the last token delay', () => {
    expect(createNativeTextControlledTimelineSpan([0, 0.25, 0.8])).toBe(1.8);
  });

  it('keeps token progress at zero before its delay starts', () => {
    expect(
      mapNativeTextControlledProgressToTokenProgress({
        progress: 0.25,
        tokenDelaySeconds: 0.75,
        totalTimelineSpan: 2,
      }),
    ).toBe(0);
  });

  it('returns partial token progress after the token delay starts', () => {
    expect(
      mapNativeTextControlledProgressToTokenProgress({
        progress: 0.5,
        tokenDelaySeconds: 0.25,
        totalTimelineSpan: 2,
      }),
    ).toBe(0.75);
  });

  it('keeps token progress at one after its span completes', () => {
    expect(
      mapNativeTextControlledProgressToTokenProgress({
        progress: 1,
        tokenDelaySeconds: 0.25,
        totalTimelineSpan: 2,
      }),
    ).toBe(1);
  });

  it('matches the existing staggered renderer mapping example', () => {
    const totalTimelineSpan = createNativeTextControlledTimelineSpan([0, 0.5, 1]);

    expect(
      mapNativeTextControlledProgressToTokenProgress({
        progress: 0.5,
        tokenDelaySeconds: 0,
        totalTimelineSpan,
      }),
    ).toBe(1);
    expect(
      mapNativeTextControlledProgressToTokenProgress({
        progress: 0.5,
        tokenDelaySeconds: 0.5,
        totalTimelineSpan,
      }),
    ).toBe(0.5);
    expect(
      mapNativeTextControlledProgressToTokenProgress({
        progress: 0.5,
        tokenDelaySeconds: 1,
        totalTimelineSpan,
      }),
    ).toBe(0);
  });
});
