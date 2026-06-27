import { describe, it, expect, vi } from 'vitest';
import { drawRoundedRect, drawNumberingBadge } from '$lib/shapes';

function createMockCtx() {
  const calls: Array<{ method: string; args: unknown[] }> = [];

  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '' as CanvasTextAlign,
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: () => calls.push({ method: 'beginPath', args: [] }),
    moveTo: (...args: number[]) => calls.push({ method: 'moveTo', args }),
    lineTo: (...args: number[]) => calls.push({ method: 'lineTo', args }),
    quadraticCurveTo: (...args: number[]) =>
      calls.push({ method: 'quadraticCurveTo', args }),
    closePath: () => calls.push({ method: 'closePath', args: [] }),
    fill: () => calls.push({ method: 'fill', args: [] }),
    stroke: () => calls.push({ method: 'stroke', args: [] }),
    fillText: vi.fn(),
    _calls: calls,
  };

  return ctx as unknown as CanvasRenderingContext2D & {
    _calls: typeof calls;
  };
}

describe('drawRoundedRect', () => {
  it('should draw a rounded rectangle path', () => {
    const ctx = createMockCtx();

    drawRoundedRect(ctx, 10, 20, 100, 80, 15, '#FFFFFF', '#0000FF', 3);

    const methods = ctx._calls.map((c) => c.method);
    expect(methods).toEqual([
      'beginPath',
      'moveTo',
      'lineTo',
      'quadraticCurveTo',
      'lineTo',
      'quadraticCurveTo',
      'lineTo',
      'quadraticCurveTo',
      'lineTo',
      'quadraticCurveTo',
      'closePath',
      'fill',
      'stroke',
    ]);
  });

  it('should set correct fill and stroke styles', () => {
    const ctx = createMockCtx();

    drawRoundedRect(ctx, 0, 0, 50, 50, 10, '#FFF', '#00F', 2);

    expect(ctx.fillStyle).toBe('#FFF');
    expect(ctx.strokeStyle).toBe('#00F');
    expect(ctx.lineWidth).toBe(2);
  });

  it('should call save and restore', () => {
    const ctx = createMockCtx();
    drawRoundedRect(ctx, 0, 0, 50, 50, 10, '#FFF', '#00F', 2);
    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.restore).toHaveBeenCalledOnce();
  });
});

describe('drawNumberingBadge', () => {
  it('should draw rounded rect and two lines of text', () => {
    const ctx = createMockCtx();

    drawNumberingBadge(
      ctx,
      100,
      50,
      110,
      110,
      50,
      '#FFFFFF',
      '#028CD4',
      '#028CD4',
      9,
      'OH',
      '47',
      35,
      54,
      'FrutigerBold',
      2.9,
      2.4,
    );

    expect(ctx.fillText).toHaveBeenCalledTimes(2);

    const [symbolCall, numberCall] = (
      ctx.fillText as ReturnType<typeof vi.fn>
    ).mock.calls;

    expect(symbolCall[0]).toBe('OH');
    expect(symbolCall[1]).toBeCloseTo(100 + 110 / 2); // x center
    expect(symbolCall[2]).toBeCloseTo(50 + 110 / 2.9); // y upper line

    expect(numberCall[0]).toBe('47');
    expect(numberCall[1]).toBeCloseTo(100 + 110 / 2); // x center
    expect(numberCall[2]).toBeCloseTo(50 + (2 * 110) / 2.4); // y lower line
  });

  it('should set text color and font', () => {
    const ctx = createMockCtx();

    drawNumberingBadge(
      ctx,
      0,
      0,
      80,
      80,
      37,
      '#FFF',
      '#028CD4',
      '#028CD4',
      6,
      'OE',
      '01',
      25,
      38,
      'FrutigerBold',
      2.9,
      2.4,
    );

    expect(ctx.fillStyle).toBe('#028CD4');
    expect(ctx.textAlign).toBe('center');
  });
});
