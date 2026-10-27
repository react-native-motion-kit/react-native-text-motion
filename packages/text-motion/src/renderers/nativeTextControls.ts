import { useLayoutEffect, useRef } from 'react';
import { cancelAnimation, type SharedValue } from 'react-native-reanimated';

import type { TextMotionControls } from '../controls';

import {
  readTextMotionControlsDescriptor,
  type TextMotionControlCommand,
  type TextMotionControlCommandKind,
} from '../controls/descriptors';
import { clampTextMotionProgress, type TextMotionItemMotion } from './rendererMotion';

type NativeTextProgressAnimationFactory = (tokenMotion: TextMotionItemMotion) => number;

type NativeTextOwnedPlaybackCommandOptions = {
  createProgressAnimation: NativeTextProgressAnimationFactory;
  progress: SharedValue<number>;
  renderFinalState: boolean;
  tokenMotion: TextMotionItemMotion;
};

type NativeTextPlaybackCommandHandler = (options: NativeTextOwnedPlaybackCommandOptions) => void;

type NativeTextControlsPlaybackOptions = NativeTextOwnedPlaybackCommandOptions & {
  controls?: TextMotionControls;
};

type NativeTextControlsPlaybackState = NativeTextOwnedPlaybackCommandOptions;

function resetOwnedProgress(progress: SharedValue<number>, renderFinalState: boolean) {
  cancelAnimation(progress);
  progress.value = renderFinalState ? 1 : 0;
}

function stopOwnedProgress(progress: SharedValue<number>, renderFinalState: boolean) {
  cancelAnimation(progress);

  if (renderFinalState) {
    progress.value = 1;
  }
}

function replayOwnedProgress({
  createProgressAnimation,
  progress,
  renderFinalState,
  tokenMotion,
}: NativeTextOwnedPlaybackCommandOptions) {
  resetOwnedProgress(progress, renderFinalState);

  if (renderFinalState) {
    return;
  }

  progress.value = createProgressAnimation(tokenMotion);
}

function playOwnedProgress({
  createProgressAnimation,
  progress,
  renderFinalState,
  tokenMotion,
}: NativeTextOwnedPlaybackCommandOptions) {
  stopOwnedProgress(progress, renderFinalState);

  if (renderFinalState) {
    return;
  }

  const currentProgress = clampTextMotionProgress(progress.value);
  const delayMs = currentProgress <= 0 ? tokenMotion.delayMs : 0;

  progress.value = createProgressAnimation({
    ...tokenMotion,
    delayMs,
  });
}

const playbackCommandHandlers = {
  play: playOwnedProgress,
  replay: replayOwnedProgress,
  reset({ progress, renderFinalState }) {
    resetOwnedProgress(progress, renderFinalState);
  },
  stop({ progress, renderFinalState }) {
    stopOwnedProgress(progress, renderFinalState);
  },
} as const satisfies Record<TextMotionControlCommandKind, NativeTextPlaybackCommandHandler>;

function applyNativeTextOwnedPlaybackCommand(
  command: TextMotionControlCommand,
  options: NativeTextOwnedPlaybackCommandOptions,
) {
  playbackCommandHandlers[command.kind](options);
}

export function useNativeTextControlsPlayback({
  controls,
  createProgressAnimation,
  progress,
  renderFinalState,
  tokenMotion,
}: NativeTextControlsPlaybackOptions) {
  const playbackState = useRef<NativeTextControlsPlaybackState>({
    createProgressAnimation,
    progress,
    renderFinalState,
    tokenMotion,
  });

  useLayoutEffect(() => {
    playbackState.current = {
      createProgressAnimation,
      progress,
      renderFinalState,
      tokenMotion,
    };
  }, [createProgressAnimation, progress, renderFinalState, tokenMotion]);

  useLayoutEffect(() => {
    if (!controls) {
      return undefined;
    }

    const descriptor = readTextMotionControlsDescriptor(controls);

    return descriptor.subscribe((command) => {
      applyNativeTextOwnedPlaybackCommand(command, playbackState.current);
    });
  }, [controls]);
}
