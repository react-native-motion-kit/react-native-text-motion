import { describe, expect, it } from '@jest/globals';
import { multiply } from '@react-native-motion-kit/text-motion';

describe('multiply', () => {
  it('multiplies two numbers', () => {
    expect(multiply(3, 7)).toBe(21);
  });
});
