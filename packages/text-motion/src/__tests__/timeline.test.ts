import { parallel, sequence, stagger, wave } from '@react-native-motion-kit/text-motion';

import { readTextMotionTimelineDescriptor } from '../recipe/descriptors';

describe('timelines', () => {
  it('stagger produces deterministic start delays', () => {
    const timeline = readTextMotionTimelineDescriptor(stagger(0.1));

    expect(timeline.delayFor(0, 4)).toBe(0);
    expect(timeline.delayFor(3, 4)).toBeCloseTo(0.3);
  });

  it('stagger can originate from the center', () => {
    const timeline = readTextMotionTimelineDescriptor(stagger(0.2, { from: 'center' }));

    expect(timeline.delayFor(1, 3)).toBe(0);
    expect(timeline.delayFor(0, 3)).toBeCloseTo(0.2);
    expect(timeline.delayFor(2, 3)).toBeCloseTo(0.2);
  });

  it('sequence sums child delays', () => {
    const timeline = readTextMotionTimelineDescriptor(sequence(stagger(0.1), stagger(0.2)));

    expect(timeline.delayFor(2, 4)).toBeCloseTo(0.6);
  });

  it('parallel uses the earliest child delay', () => {
    const timeline = readTextMotionTimelineDescriptor(parallel(stagger(0.3), stagger(0.1)));

    expect(timeline.delayFor(2, 4)).toBeCloseTo(0.2);
  });

  it('wave is deterministic and bounded by amplitude', () => {
    const timeline = readTextMotionTimelineDescriptor(wave({ amplitude: 0.5, wavelength: 4 }));
    const delays = [0, 1, 2, 3].map((index) => timeline.delayFor(index, 4));

    expect(delays[0]).toBeCloseTo(0.25);
    expect(delays[1]).toBeCloseTo(0.5);
    expect(delays[2]).toBeCloseTo(0.25);
    expect(delays[3]).toBeCloseTo(0);
  });

  it('rejects invalid stagger numbers before delay calculation', () => {
    expect(() => stagger(Number.NaN)).toThrow('stagger step must be a finite number');
    expect(() => stagger(-0.1)).toThrow('stagger step must be greater than or equal to 0');
    expect(() => stagger(0.1, { from: Number.NaN })).toThrow(
      'stagger from must be a finite number',
    );
  });

  it('rejects invalid wave numbers before delay calculation', () => {
    expect(() => wave({ amplitude: Number.NaN })).toThrow('wave amplitude must be a finite number');
    expect(() => wave({ amplitude: -0.1 })).toThrow(
      'wave amplitude must be greater than or equal to 0',
    );
    expect(() => wave({ wavelength: 0 })).toThrow('wave wavelength must be greater than 0');
    expect(() => wave({ wavelength: Number.NaN })).toThrow(
      'wave wavelength must be a finite number',
    );
  });

  it('keeps descriptor fields off the public runtime object', () => {
    expect(Object.keys(stagger(0.1))).toEqual([]);
  });
});
