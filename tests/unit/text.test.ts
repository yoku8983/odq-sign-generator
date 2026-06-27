import { describe, it, expect, vi } from 'vitest';
import { fitFontSize, drawFittedText } from '$lib/text';

function createMockCtx(charWidth = 10) {
  let currentFont = '';

  const ctx = {
    get font() {
      return currentFont;
    },
    set font(value: string) {
      currentFont = value;
    },
    fillStyle: '',
    textAlign: '' as CanvasTextAlign,
    textBaseline: '' as CanvasTextBaseline,
    measureText: (text: string) => {
      const sizeMatch = currentFont.match(/^(\d+)px/);
      const fontSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 16;
      return { width: text.length * charWidth * (fontSize / 100) };
    },
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  };

  return ctx as unknown as CanvasRenderingContext2D;
}

describe('fitFontSize', () => {
  it('should return maxFontSize when text fits', () => {
    const ctx = createMockCtx(1);
    const result = fitFontSize(ctx, 'Hi', 'TestFont', 100, 999);
    expect(result).toBe(100);
  });

  it('should reduce font size when text is too wide', () => {
    const ctx = createMockCtx(10);
    const result = fitFontSize(ctx, 'Hello', 'TestFont', 100, 30);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);

    const sizeMatch = ctx.font.match(/^(\d+)px/);
    expect(sizeMatch).not.toBeNull();
    expect(parseInt(sizeMatch![1], 10)).toBe(result);
  });

  it('should converge to same result as linear search', () => {
    const ctx = createMockCtx(8);
    const text = 'TestText';
    const maxFontSize = 80;
    const maxWidth = 200;

    const binaryResult = fitFontSize(ctx, text, 'TestFont', maxFontSize, maxWidth);

    let linearResult = maxFontSize;
    ctx.font = `${linearResult}px "TestFont"`;
    while (ctx.measureText(text).width > maxWidth && linearResult > 1) {
      linearResult -= 1;
      ctx.font = `${linearResult}px "TestFont"`;
    }

    expect(binaryResult).toBe(linearResult);
  });

  it('should respect minFontSize', () => {
    const ctx = createMockCtx(100);
    const result = fitFontSize(ctx, 'VeryLongText', 'TestFont', 100, 1, 10);
    expect(result).toBe(10);
  });

  it('should leave ctx.font set to the best size', () => {
    const ctx = createMockCtx(10);
    const result = fitFontSize(ctx, 'Hello', 'TestFont', 50, 200);
    expect(ctx.font).toBe(`${result}px "TestFont"`);
  });

  it('should use unquoted font family when it contains comma', () => {
    const ctx = createMockCtx(1);
    fitFontSize(ctx, 'Hi', 'VialogLT, sans-serif', 100, 999);
    expect(ctx.font).toMatch(/^\d+px VialogLT, sans-serif$/);
  });
});

describe('drawFittedText', () => {
  it('should return 0 for empty text without drawing', () => {
    const ctx = createMockCtx();
    const result = drawFittedText(ctx, '', 100, 200, 50, 300, 'TestFont');
    expect(result).toBe(0);
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('should call save and restore for state isolation', () => {
    const ctx = createMockCtx();
    drawFittedText(ctx, 'Test', 100, 200, 50, 300, 'TestFont');
    expect(ctx.save).toHaveBeenCalledOnce();
    expect(ctx.restore).toHaveBeenCalledOnce();
  });

  it('should draw text at specified position', () => {
    const ctx = createMockCtx();
    drawFittedText(ctx, 'Test', 100, 200, 50, 300, 'TestFont');
    expect(ctx.fillText).toHaveBeenCalledWith('Test', 100, 200);
  });

  it('should return measured width', () => {
    const ctx = createMockCtx(10);
    const result = drawFittedText(ctx, 'Test', 100, 200, 50, 300, 'TestFont');
    expect(result).toBeGreaterThan(0);
  });

  it('should use default options (center, alphabetic, black)', () => {
    const ctx = createMockCtx();
    drawFittedText(ctx, 'Test', 100, 200, 50, 300, 'TestFont');
    expect(ctx.textAlign).toBe('center');
    expect(ctx.textBaseline).toBe('alphabetic');
    expect(ctx.fillStyle).toBe('#000000');
  });

  it('should apply custom options', () => {
    const ctx = createMockCtx();
    drawFittedText(ctx, 'Test', 100, 200, 50, 300, 'TestFont', {
      color: '#FF0000',
      align: 'left',
      baseline: 'middle',
    });
    expect(ctx.textAlign).toBe('left');
    expect(ctx.textBaseline).toBe('middle');
    expect(ctx.fillStyle).toBe('#FF0000');
  });
});
