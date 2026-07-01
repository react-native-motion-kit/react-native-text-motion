const ERROR_PREFIX = '@react-native-motion-kit/text-motion';

export function validateFiniteEffectNumber(value: number, label: string): number {
  if (Number.isFinite(value)) {
    return value;
  }

  throw new Error(`${ERROR_PREFIX} ${label} must be a finite number.`);
}
