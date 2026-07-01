import { fade, pulse, rise, scale } from '../effects';
import { defineTextMotion } from '../recipe';
import { nativeText } from '../renderers';
import { words } from '../split';
import { stagger, wave } from '../timeline';

/** Editorial title reveal with centered stagger, rise, fade, and subtle scale. */
export function editorialRise() {
  return defineTextMotion()
    .split(words())
    .layout(nativeText())
    .timeline(stagger(0.032, { from: 'center' }))
    .effect(
      rise({ y: 14 })
        .and(fade())
        .and(scale({ from: 0.98 })),
    );
}

/** Soft wave reveal for friendly product copy. */
export function softWave() {
  return defineTextMotion()
    .split(words())
    .layout(nativeText())
    .timeline(wave({ amplitude: 0.06, wavelength: 5 }))
    .effect(fade().and(rise({ y: 8 })));
}

/** Gentle emphasis preset for small labels and inline highlight copy. */
export function gentleEmphasis() {
  return defineTextMotion()
    .split(words())
    .layout(nativeText())
    .timeline(stagger(0.024))
    .effect(pulse({ scale: 1.06 }).and(fade()));
}
