export type OverlayTextLineGeometry = {
  height: number;
  index: number;
  isStructuralBlank: boolean;
  motionIndex?: number;
  text: string;
  width: number;
  x: number;
  y: number;
};

export type OverlayTextMotionLine = OverlayTextLineGeometry & {
  motionIndex: number;
};

export type OverlayTextLayoutReady = {
  geometrySignature: string;
  kind: 'ready';
  lines: readonly OverlayTextLineGeometry[];
  motionCount: number;
  motionLines: readonly OverlayTextMotionLine[];
  playbackSignature: string;
  signature: string;
  topologySignature: string;
};

export type OverlayTextLayoutStatic = {
  kind: 'static';
  reason: 'empty-source';
};

export type OverlayTextLayoutFallback = {
  kind: 'fallback';
  reason:
    | 'malformed-payload'
    | 'missing-line-text'
    | 'non-finite-geometry'
    | 'non-positive-visible-height'
    | 'unordered-bands'
    | 'overlapping-bands'
    | 'missing-visible-lines';
};

export type OverlayTextLayoutResult =
  | OverlayTextLayoutFallback
  | OverlayTextLayoutReady
  | OverlayTextLayoutStatic;

export type OverlayTextLayoutChange = 'identical' | 'geometry' | 'topology';

type OverlayTextNativeLine = {
  height: unknown;
  text: unknown;
  width: unknown;
  x: unknown;
  y: unknown;
};

type OverlayTextLayoutDraft = {
  lines: readonly OverlayTextLineGeometry[];
  motionIndex: number;
};

const GEOMETRY_NOISE_STEP = 0.01;
const BAND_OVERLAP_TOLERANCE = 0.5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFallbackResult(
  value: OverlayTextLayoutDraft | OverlayTextLayoutFallback,
): value is OverlayTextLayoutFallback {
  return 'kind' in value;
}

function readPayloadRecord(payload: unknown): Record<string, unknown> | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  if ('lines' in payload) {
    return payload;
  }

  const nestedPayload = payload.nativeEvent;

  if (!isRecord(nestedPayload)) {
    return payload;
  }

  return 'lines' in nestedPayload ? nestedPayload : readPayloadRecord(nestedPayload);
}

function normalizeFloat(value: number): number {
  const normalized = Math.round(value / GEOMETRY_NOISE_STEP) * GEOMETRY_NOISE_STEP;

  return Object.is(normalized, -0) ? 0 : normalized;
}

function parseNativeLine(value: unknown): OverlayTextNativeLine | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    height: value.height,
    text: value.text,
    width: value.width,
    x: value.x,
    y: value.y,
  };
}

function parseNativeLines(
  values: readonly unknown[],
): readonly OverlayTextNativeLine[] | undefined {
  const lines = values.map(parseNativeLine);

  return lines.every((line): line is OverlayTextNativeLine => Boolean(line)) ? lines : undefined;
}

function readFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? normalizeFloat(value) : undefined;
}

function createGeometrySignature(lines: readonly OverlayTextLineGeometry[]): string {
  return JSON.stringify(lines.map((line) => [line.index, line.x, line.y, line.width, line.height]));
}

function createTopologySignature(lines: readonly OverlayTextLineGeometry[]): string {
  return JSON.stringify(lines.map((line) => [line.index, line.text, line.isStructuralBlank]));
}

function createReadyLayout(
  sourceText: string,
  lines: readonly OverlayTextLineGeometry[],
): OverlayTextLayoutReady {
  const motionLines = lines.filter(
    (line): line is OverlayTextMotionLine => typeof line.motionIndex === 'number',
  );
  const geometrySignature = createGeometrySignature(lines);
  const topologySignature = createTopologySignature(lines);
  const playbackSignature = JSON.stringify([sourceText, topologySignature]);

  return {
    geometrySignature,
    kind: 'ready',
    lines,
    motionCount: motionLines.length,
    motionLines,
    playbackSignature,
    signature: `${topologySignature}::${geometrySignature}`,
    topologySignature,
  };
}

function isMeaningfullyUnordered(
  previous: OverlayTextLineGeometry | undefined,
  current: OverlayTextLineGeometry,
): boolean {
  return Boolean(previous && current.y + BAND_OVERLAP_TOLERANCE < previous.y);
}

function isMeaningfullyOverlapping(
  previous: OverlayTextLineGeometry | undefined,
  current: OverlayTextLineGeometry,
): boolean {
  if (!previous) {
    return false;
  }

  return current.y < previous.y + previous.height - BAND_OVERLAP_TOLERANCE;
}

export function compareOverlayTextLayouts(
  previous: OverlayTextLayoutReady | undefined,
  next: OverlayTextLayoutReady,
): OverlayTextLayoutChange {
  if (!previous) {
    return 'topology';
  }

  if (previous.signature === next.signature) {
    return 'identical';
  }

  if (previous.topologySignature === next.topologySignature) {
    return 'geometry';
  }

  return 'topology';
}

export function createOverlayTextLayout(source: string, payload: unknown): OverlayTextLayoutResult {
  if (source.trim().length === 0) {
    return {
      kind: 'static',
      reason: 'empty-source',
    };
  }

  const payloadRecord = readPayloadRecord(payload);

  if (!payloadRecord || !Array.isArray(payloadRecord.lines)) {
    return {
      kind: 'fallback',
      reason: 'malformed-payload',
    };
  }

  const parsedLines = parseNativeLines(payloadRecord.lines);

  if (!parsedLines) {
    return {
      kind: 'fallback',
      reason: 'malformed-payload',
    };
  }

  const initial: OverlayTextLayoutDraft = {
    lines: [],
    motionIndex: 0,
  };
  const normalized = parsedLines.reduce<OverlayTextLayoutDraft | OverlayTextLayoutFallback>(
    (accumulator, line, index) => {
      if (isFallbackResult(accumulator)) {
        return accumulator;
      }

      if (typeof line.text !== 'string') {
        return {
          kind: 'fallback',
          reason: 'missing-line-text',
        };
      }

      const x = readFiniteNumber(line.x);
      const y = readFiniteNumber(line.y);
      const width = readFiniteNumber(line.width);
      const height = readFiniteNumber(line.height);

      if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        typeof width !== 'number' ||
        typeof height !== 'number'
      ) {
        return {
          kind: 'fallback',
          reason: 'non-finite-geometry',
        };
      }

      const isStructuralBlank = line.text.trim().length === 0;

      if (!isStructuralBlank && height <= 0) {
        return {
          kind: 'fallback',
          reason: 'non-positive-visible-height',
        };
      }

      const previous = accumulator.lines[accumulator.lines.length - 1];
      const current: OverlayTextLineGeometry = {
        height,
        index,
        isStructuralBlank,
        motionIndex: isStructuralBlank ? undefined : accumulator.motionIndex,
        text: line.text,
        width,
        x,
        y,
      };

      if (isMeaningfullyUnordered(previous, current)) {
        return {
          kind: 'fallback',
          reason: 'unordered-bands',
        };
      }

      if (isMeaningfullyOverlapping(previous, current)) {
        return {
          kind: 'fallback',
          reason: 'overlapping-bands',
        };
      }

      return {
        lines: [...accumulator.lines, current],
        motionIndex: isStructuralBlank ? accumulator.motionIndex : accumulator.motionIndex + 1,
      };
    },
    initial,
  );

  if (isFallbackResult(normalized)) {
    return normalized;
  }

  const ready = createReadyLayout(source, normalized.lines);

  if (ready.motionCount > 0) {
    return ready;
  }

  return {
    kind: 'fallback',
    reason: 'missing-visible-lines',
  };
}
