export const NATIVE_TEXT_CONTROLLED_TOKEN_TIMELINE_SPAN = 1;

type NativeTextControlledProgressInput = {
  progress: number;
  tokenDelaySeconds: number;
  totalTimelineSpan: number;
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
