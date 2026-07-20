import {
  compareOverlayTextLayouts,
  createOverlayTextLayout,
  type OverlayTextLayoutReady,
} from '../renderers/overlayTextLayout';

function expectReady(result: ReturnType<typeof createOverlayTextLayout>): OverlayTextLayoutReady {
  if (result.kind !== 'ready') {
    throw new Error(`Expected ready layout, received ${result.kind}.`);
  }

  return result;
}

describe('overlayTextLayout', () => {
  it('normalizes valid native line geometry and assigns continuous motion indices', () => {
    const layout = expectReady(
      createOverlayTextLayout('one\n\ntwo', {
        lines: [
          { height: 18.004, text: 'one', width: 48.002, x: 0.001, y: -0.001 },
          { height: 18, text: '', width: 0, x: 0, y: 18.0001 },
          { height: 18, text: 'two', width: 42, x: 6, y: 36 },
        ],
      }),
    );

    expect(layout.lines).toEqual([
      expect.objectContaining({ isStructuralBlank: false, motionIndex: 0, text: 'one', y: 0 }),
      expect.objectContaining({ isStructuralBlank: true, motionIndex: undefined, text: '' }),
      expect.objectContaining({ isStructuralBlank: false, motionIndex: 1, text: 'two' }),
    ]);
    expect(layout.motionLines.map((line) => line.motionIndex)).toEqual([0, 1]);
    expect(layout.motionCount).toBe(2);
  });

  it('returns static final source for empty or whitespace-only source', () => {
    expect(createOverlayTextLayout(' \n ', { lines: [] })).toEqual({
      kind: 'static',
      reason: 'empty-source',
    });
  });

  it('does not throw for malformed or unsupported geometry', () => {
    expect(createOverlayTextLayout('text', {})).toEqual({
      kind: 'fallback',
      reason: 'malformed-payload',
    });
    expect(
      createOverlayTextLayout('text', { lines: [{ height: 12, width: 20, x: 0, y: 0 }] }),
    ).toEqual({
      kind: 'fallback',
      reason: 'missing-line-text',
    });
    expect(
      createOverlayTextLayout('text', {
        lines: [{ height: 0, text: 'text', width: 20, x: 0, y: 0 }],
      }),
    ).toEqual({
      kind: 'fallback',
      reason: 'non-positive-visible-height',
    });
    expect(
      createOverlayTextLayout('text', {
        lines: [{ height: 12, text: 'text', width: 20, x: 0, y: Number.NaN }],
      }),
    ).toEqual({
      kind: 'fallback',
      reason: 'non-finite-geometry',
    });
  });

  it('rejects meaningful unordered and overlapping bands', () => {
    expect(
      createOverlayTextLayout('one two', {
        lines: [
          { height: 12, text: 'one', width: 20, x: 0, y: 20 },
          { height: 12, text: 'two', width: 20, x: 0, y: 10 },
        ],
      }),
    ).toEqual({ kind: 'fallback', reason: 'unordered-bands' });
    expect(
      createOverlayTextLayout('one two', {
        lines: [
          { height: 12, text: 'one', width: 20, x: 0, y: 0 },
          { height: 12, text: 'two', width: 20, x: 0, y: 8 },
        ],
      }),
    ).toEqual({ kind: 'fallback', reason: 'overlapping-bands' });
  });

  it('separates identical, geometry-only, and topology changes', () => {
    const base = expectReady(
      createOverlayTextLayout('one two', {
        lines: [
          { height: 12.001, text: 'one', width: 20, x: 0, y: 0 },
          { height: 12, text: 'two', width: 20, x: 0, y: 12 },
        ],
      }),
    );
    const identicalNoise = expectReady(
      createOverlayTextLayout('one two', {
        lines: [
          { height: 12.002, text: 'one', width: 20, x: 0, y: 0.002 },
          { height: 12, text: 'two', width: 20, x: 0, y: 12 },
        ],
      }),
    );
    const geometry = expectReady(
      createOverlayTextLayout('one two', {
        lines: [
          { height: 12, text: 'one', width: 20, x: 0, y: 0 },
          { height: 12, text: 'two', width: 20, x: 0, y: 12.75 },
        ],
      }),
    );
    const topology = expectReady(
      createOverlayTextLayout('one two three', {
        lines: [
          { height: 12, text: 'one', width: 20, x: 0, y: 0 },
          { height: 12, text: 'two three', width: 40, x: 0, y: 12 },
        ],
      }),
    );

    expect(compareOverlayTextLayouts(base, identicalNoise)).toBe('identical');
    expect(compareOverlayTextLayouts(base, geometry)).toBe('geometry');
    expect(compareOverlayTextLayouts(base, topology)).toBe('topology');
  });

  it('keeps topology signatures distinct when line text contains signature delimiters', () => {
    const oneLine = expectReady(
      createOverlayTextLayout('a:visible|1:b', {
        lines: [{ height: 12, text: 'a:visible|1:b', width: 80, x: 0, y: 0 }],
      }),
    );
    const twoLines = expectReady(
      createOverlayTextLayout('a\nb', {
        lines: [
          { height: 12, text: 'a', width: 20, x: 0, y: 0 },
          { height: 12, text: 'b', width: 20, x: 0, y: 12 },
        ],
      }),
    );

    expect(oneLine.topologySignature).not.toBe(twoLines.topologySignature);
    expect(compareOverlayTextLayouts(oneLine, twoLines)).toBe('topology');
  });
});
