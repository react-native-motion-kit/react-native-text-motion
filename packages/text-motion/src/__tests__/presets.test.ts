import {
  editorialRise,
  gentleEmphasis,
  softWave,
} from '@react-native-motion-kit/text-motion/presets';

import {
  readTextMotionEffectDescriptor,
  readTextMotionTimelineDescriptor,
} from '../recipe/descriptors';

describe('presets', () => {
  it('exports recipe factories from the presets subpath', () => {
    const editorialEffect = editorialRise().recipe().effects[0];
    const softWaveTimeline = softWave().recipe().timeline;

    expect(editorialEffect ? readTextMotionEffectDescriptor(editorialEffect).name : undefined).toBe(
      'rise+fade+scale',
    );
    expect(
      softWaveTimeline ? readTextMotionTimelineDescriptor(softWaveTimeline).name : undefined,
    ).toBe('wave');
    expect(gentleEmphasis().component()).toEqual(expect.any(Function));
  });
});
