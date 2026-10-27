import { createTextMotionEffect } from './compose';

/**
 * Reveal each native-text token when its local progress becomes positive.
 *
 * Keeps the final token layout in place. Combine with `graphemes()`, `stagger(seconds)`,
 * and `.motion({ kind: 'timing', options: { duration: 0 } })` for instant character reveals.
 * The splitter and timeline determine the reveal units and order; whitespace does not
 * consume a motion index. Other effects retain their own opacity and transforms.
 *
 * External `progress` follows the recipe timeline, not the fraction of visible characters.
 * Decreasing progress can hide tokens again. Requires `nativeText()`.
 */
export function typewriter() {
  return createTextMotionEffect('typewriter');
}
