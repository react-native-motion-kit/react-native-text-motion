const ERROR_PREFIX = '@react-native-motion-kit/text-motion';

export function validateFiniteTimelineNumber(value: number, label: string): number {
  if (Number.isFinite(value)) {
    return value;
  }

  throw new Error(`${ERROR_PREFIX} ${label} must be a finite number.`);
}

export function validateNonNegativeTimelineNumber(value: number, label: string): number {
  const finiteValue = validateFiniteTimelineNumber(value, label);

  if (finiteValue >= 0) {
    return finiteValue;
  }

  throw new Error(`${ERROR_PREFIX} ${label} must be greater than or equal to 0.`);
}

export function validatePositiveTimelineNumber(value: number, label: string): number {
  const finiteValue = validateFiniteTimelineNumber(value, label);

  if (finiteValue > 0) {
    return finiteValue;
  }

  throw new Error(`${ERROR_PREFIX} ${label} must be greater than 0.`);
}
