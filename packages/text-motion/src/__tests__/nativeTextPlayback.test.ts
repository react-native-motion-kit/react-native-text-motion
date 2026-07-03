import {
  areNativeTextPlaybackRunsEqual,
  createNativeTextPlaybackRun,
  type NativeTextStyleState,
  type NativeTextTokenMotion,
} from '../renderers/nativeTextPlayback';

const BASE_STYLE_STATE: NativeTextStyleState = {
  opacity: 1,
  scale: 1,
  translateX: 0,
  translateY: 0,
};
const FADED_STYLE_STATE: NativeTextStyleState = {
  opacity: 0,
  scale: 1,
  translateX: 0,
  translateY: 0,
};
const STABLE_EASING = (value: number) => value;
const OTHER_EASING = (value: number) => value;

function createTokenMotion(overrides: Partial<NativeTextTokenMotion> = {}): NativeTextTokenMotion {
  return {
    delayMs: 0,
    initial: BASE_STYLE_STATE,
    pulseScale: 1,
    reducedMotion: 'system',
    target: BASE_STYLE_STATE,
    ...overrides,
  };
}

function createPlaybackRun({
  renderFinalState = false,
  text = 'Hello motion',
  tokenMotion = createTokenMotion(),
}: {
  renderFinalState?: boolean;
  text?: string;
  tokenMotion?: NativeTextTokenMotion;
} = {}) {
  return createNativeTextPlaybackRun(tokenMotion, renderFinalState, text);
}

describe('nativeTextPlayback', () => {
  it('treats missing previous playback run as changed', () => {
    expect(areNativeTextPlaybackRunsEqual(undefined, createPlaybackRun())).toBe(false);
  });

  it('keeps equal playback runs stable across cloned nested spring options', () => {
    const left = createPlaybackRun({
      tokenMotion: createTokenMotion({
        motion: {
          kind: 'spring',
          options: { clamp: { max: 1, min: 0 }, dampingRatio: 1, duration: 400 },
        },
      }),
    });
    const right = createPlaybackRun({
      tokenMotion: createTokenMotion({
        motion: {
          kind: 'spring',
          options: { clamp: { max: 1, min: 0 }, dampingRatio: 1, duration: 400 },
        },
      }),
    });

    expect(areNativeTextPlaybackRunsEqual(left, right)).toBe(true);
  });

  it('detects changed text, timing duration, style state, and playback flags', () => {
    const base = createPlaybackRun({
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 400 } },
      }),
    });
    const changedText = createPlaybackRun({
      text: 'Updated motion',
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 400 } },
      }),
    });
    const changedDuration = createPlaybackRun({
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 800 } },
      }),
    });
    const changedStyle = createPlaybackRun({
      tokenMotion: createTokenMotion({
        initial: { ...FADED_STYLE_STATE, translateY: 12 },
        motion: { kind: 'timing', options: { duration: 400 } },
      }),
    });
    const changedTargetStyle = createPlaybackRun({
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 400 } },
        target: { ...BASE_STYLE_STATE, translateY: 4 },
      }),
    });
    const changedMotionKind = createPlaybackRun({
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'spring', options: { dampingRatio: 1, duration: 400 } },
      }),
    });
    const changedDelay = createPlaybackRun({
      tokenMotion: createTokenMotion({
        delayMs: 120,
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 400 } },
      }),
    });
    const changedPulseScale = createPlaybackRun({
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 400 } },
        pulseScale: 1.08,
      }),
    });
    const changedReducedMotion = createPlaybackRun({
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 400 } },
        reducedMotion: 'final-state',
      }),
    });
    const changedFinalState = createPlaybackRun({
      renderFinalState: true,
      tokenMotion: createTokenMotion({
        initial: FADED_STYLE_STATE,
        motion: { kind: 'timing', options: { duration: 400 } },
      }),
    });

    expect(areNativeTextPlaybackRunsEqual(base, changedText)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedDuration)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedStyle)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedTargetStyle)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedMotionKind)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedDelay)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedPulseScale)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedReducedMotion)).toBe(false);
    expect(areNativeTextPlaybackRunsEqual(base, changedFinalState)).toBe(false);
  });

  it('compares function-valued motion options by reference', () => {
    const base = createPlaybackRun({
      tokenMotion: createTokenMotion({
        motion: { kind: 'timing', options: { duration: 400, easing: STABLE_EASING } },
      }),
    });
    const sameReference = createPlaybackRun({
      tokenMotion: createTokenMotion({
        motion: { kind: 'timing', options: { duration: 400, easing: STABLE_EASING } },
      }),
    });
    const differentReference = createPlaybackRun({
      tokenMotion: createTokenMotion({
        motion: { kind: 'timing', options: { duration: 400, easing: OTHER_EASING } },
      }),
    });

    expect(areNativeTextPlaybackRunsEqual(base, sameReference)).toBe(true);
    expect(areNativeTextPlaybackRunsEqual(base, differentReference)).toBe(false);
  });
});
