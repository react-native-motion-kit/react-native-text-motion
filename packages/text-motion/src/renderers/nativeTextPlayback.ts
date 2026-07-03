import type { TextMotionMotionConfig } from '../types/recipe';

export type NativeTextStyleState = {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
};

export type NativeTextTokenMotion = {
  delaySeconds: number;
  delayMs: number;
  initial: NativeTextStyleState;
  target: NativeTextStyleState;
  motion?: TextMotionMotionConfig;
  pulseScale: number;
  reducedMotion: 'final-state' | 'system';
  totalTimelineSpan: number;
};

type NativeTextMotionOptionSnapshotValue =
  | null
  | string
  | number
  | boolean
  | symbol
  | ((...args: never[]) => unknown)
  | readonly NativeTextMotionOptionSnapshotValue[]
  | { readonly [key: string]: NativeTextMotionOptionSnapshotValue };

type NativeTextMotionOptionsSnapshot = Readonly<
  Record<string, NativeTextMotionOptionSnapshotValue>
>;

type NativeTextMotionSnapshot = {
  kind: TextMotionMotionConfig['kind'];
  options?: NativeTextMotionOptionsSnapshot;
};

export type NativeTextPlaybackRun = NativeTextTokenMotion & {
  motionSnapshot?: NativeTextMotionSnapshot;
  renderFinalState: boolean;
  text: string;
};

function isNativeTextMotionOptionRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createMotionOptionSnapshotValue(value: unknown): NativeTextMotionOptionSnapshotValue {
  // Reanimated config objects are compared structurally; function-valued options stay reference-sensitive.
  if (Array.isArray(value)) {
    return value.map(createMotionOptionSnapshotValue);
  }

  if (isNativeTextMotionOptionRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        createMotionOptionSnapshotValue(nestedValue),
      ]),
    );
  }

  return value as NativeTextMotionOptionSnapshotValue;
}

function createMotionOptionsSnapshot(
  options: TextMotionMotionConfig['options'],
): NativeTextMotionOptionsSnapshot | undefined {
  if (!options) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [key, createMotionOptionSnapshotValue(value)]),
  );
}

function createMotionSnapshot(
  motion: TextMotionMotionConfig | undefined,
): NativeTextMotionSnapshot | undefined {
  if (!motion) {
    return undefined;
  }

  return {
    kind: motion.kind,
    options: createMotionOptionsSnapshot(motion.options),
  };
}

export function createNativeTextPlaybackRun(
  tokenMotion: NativeTextTokenMotion,
  renderFinalState: boolean,
  text: string,
): NativeTextPlaybackRun {
  return {
    ...tokenMotion,
    motionSnapshot: createMotionSnapshot(tokenMotion.motion),
    renderFinalState,
    text,
  };
}

function areNativeTextStyleStatesEqual(
  left: NativeTextStyleState,
  right: NativeTextStyleState,
): boolean {
  return (
    Object.is(left.opacity, right.opacity) &&
    Object.is(left.scale, right.scale) &&
    Object.is(left.translateX, right.translateX) &&
    Object.is(left.translateY, right.translateY)
  );
}

function areMotionOptionsSnapshotsEqual(
  left: NativeTextMotionOptionsSnapshot | undefined,
  right: NativeTextMotionOptionsSnapshot | undefined,
): boolean {
  if (!left || !right) {
    return left === right;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      areMotionOptionSnapshotValuesEqual(left[key], right[key]),
  );
}

function areMotionOptionArraysEqual(
  left: readonly NativeTextMotionOptionSnapshotValue[],
  right: readonly NativeTextMotionOptionSnapshotValue[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => areMotionOptionSnapshotValuesEqual(value, right[index]));
}

function areMotionOptionRecordsEqual(
  left: { readonly [key: string]: NativeTextMotionOptionSnapshotValue },
  right: { readonly [key: string]: NativeTextMotionOptionSnapshotValue },
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(right, key) &&
      areMotionOptionSnapshotValuesEqual(left[key], right[key]),
  );
}

function areMotionOptionSnapshotValuesEqual(
  left: NativeTextMotionOptionSnapshotValue | undefined,
  right: NativeTextMotionOptionSnapshotValue | undefined,
): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return areMotionOptionArraysEqual(left, right);
  }

  if (isNativeTextMotionOptionRecord(left) && isNativeTextMotionOptionRecord(right)) {
    return areMotionOptionRecordsEqual(left, right);
  }

  return false;
}

function areMotionSnapshotsEqual(
  left: NativeTextMotionSnapshot | undefined,
  right: NativeTextMotionSnapshot | undefined,
): boolean {
  if (!left || !right) {
    return left === right;
  }

  return left.kind === right.kind && areMotionOptionsSnapshotsEqual(left.options, right.options);
}

export function areNativeTextPlaybackRunsEqual(
  left: NativeTextPlaybackRun | undefined,
  right: NativeTextPlaybackRun,
): boolean {
  if (!left) {
    return false;
  }

  return (
    Object.is(left.delayMs, right.delayMs) &&
    Object.is(left.pulseScale, right.pulseScale) &&
    left.reducedMotion === right.reducedMotion &&
    left.renderFinalState === right.renderFinalState &&
    left.text === right.text &&
    areNativeTextStyleStatesEqual(left.initial, right.initial) &&
    areNativeTextStyleStatesEqual(left.target, right.target) &&
    areMotionSnapshotsEqual(left.motionSnapshot, right.motionSnapshot)
  );
}
