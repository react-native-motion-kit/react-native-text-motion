import type { TextMotionSourceRange, TextMotionToken, TextMotionTokenUnit } from '../types';

type CreateTokenInput<Unit extends TextMotionTokenUnit> = {
  index: number;
  metadata?: Record<string, unknown>;
  sourceRange: TextMotionSourceRange;
  text: string;
  unit: Unit;
};

export function createTextMotionToken<Unit extends TextMotionTokenUnit>({
  index,
  metadata,
  sourceRange,
  text,
  unit,
}: CreateTokenInput<Unit>): TextMotionToken<Unit> {
  return {
    id: `${unit}-${index}-${sourceRange.start}-${sourceRange.end}`,
    index,
    metadata,
    sourceRange,
    text,
    unit,
  };
}
