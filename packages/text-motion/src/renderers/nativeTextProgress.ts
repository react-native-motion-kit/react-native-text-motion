export const NATIVE_TEXT_CONTROLLED_TOKEN_TIMELINE_SPAN = 1;

export type NativeTextControlledProgressPlan = {
  tokenDelaySeconds: number;
  totalTimelineSpan: number;
};

type NativeTextControlledProgressInput = NativeTextControlledProgressPlan & {
  progress: number;
};

export function clampNativeTextProgress(progress: number): number {
  'worklet';

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

export function createNativeTextControlledTimelineSpan(
  delaySecondsByMotionIndex: readonly number[],
): number {
  const maxDelaySeconds = delaySecondsByMotionIndex.reduce(
    (maxDelay, delaySeconds) => Math.max(maxDelay, delaySeconds),
    0,
  );

  return maxDelaySeconds + NATIVE_TEXT_CONTROLLED_TOKEN_TIMELINE_SPAN;
}

export function mapNativeTextControlledProgressToTokenProgress({
  progress,
  tokenDelaySeconds,
  totalTimelineSpan,
}: NativeTextControlledProgressInput): number {
  'worklet';

  const virtualTime = clampNativeTextProgress(progress) * totalTimelineSpan;
  const tokenProgress =
    (virtualTime - tokenDelaySeconds) / NATIVE_TEXT_CONTROLLED_TOKEN_TIMELINE_SPAN;

  return clampNativeTextProgress(tokenProgress);
}
