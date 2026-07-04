import { useRef } from 'react';

import type { textMotionControlsBrand } from './brand';

import { createTextMotionControlsHandle } from './descriptors';

/**
 * Command channel for event-driven text playback.
 *
 * Pass the returned controls object to a text motion component with
 * `controls={controls}`. The controls object emits playback commands; the component still owns
 * its recipe, timeline, effects, and `.motion()` transition.
 */
export type TextMotionControls = {
  readonly [textMotionControlsBrand]: true;
  /** Play the current text motion from its current progress toward the final state. */
  play(): void;
  /** Reset to the initial state and play again with the recipe timeline and `.motion()` config. */
  replay(): void;
  /** Stop any in-flight playback and return to the initial state. */
  reset(): void;
  /** Stop any in-flight playback while preserving the current visual progress. */
  stop(): void;
};

/**
 * Create a stable text motion command channel for event-driven playback.
 *
 * Use controls for button presses, screen focus, onboarding steps, and other discrete events.
 * Use the `progress` prop instead when text should follow a raw scroll, gesture, or synchronized
 * Reanimated shared value.
 */
export function useTextMotionControls(): TextMotionControls {
  const controls = useRef<TextMotionControls | undefined>(undefined);

  if (!controls.current) {
    controls.current = createTextMotionControlsHandle();
  }

  return controls.current;
}
