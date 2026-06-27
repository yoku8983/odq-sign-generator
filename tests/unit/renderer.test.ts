import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderStationSign } from '$lib/renderer';
import { LayoutResolver } from '$lib/layout-resolver';
import type { StationData, DisplayFlags } from '$lib/models';

function createMockCtx() {
  let currentFont = '';
  const fillTextCalls: Array<{ text: string; x: number; y: number }> = [];

  const ctx = {
    get font() {
      return currentFont;
    },
    set font(value: string) {
      currentFont = value;
    },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    textAlign: '' as CanvasTextAlign,
    textBaseline: '' as CanvasTextBaseline,
    measureText: (text: string) => {
      const sizeMatch = currentFont.match(/^(\d+)px/);
      const fontSize = sizeMatch ? parseInt(sizeMatch[1], 10) : 16;
      return { width: text.length * 8 * (fontSize / 100) };
    },
    fillText: vi.fn(
      (text: string, x: number, y: number) =>
        fillTextCalls.push({ text, x, y }),
    ),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    _fillTextCalls: fillTextCalls,
  };

  return ctx as unknown as CanvasRenderingContext2D & {
    _fillTextCalls: typeof fillTextCalls;
  };
}

function createTestStation(): StationData {
  return {
    name: { kanji: '新宿', hiragana: 'しんじゅく', romaji: 'Shinjuku' },
    prev: { kanji: '', romaji: '' },
    next: { kanji: '南新宿', romaji: 'Minami-Shinjuku' },
    currentNumbering: { symbol: 'OH', number: '01' },
    nextNumbering: { symbol: 'OH', number: '02' },
  };
}

describe('renderStationSign', () => {
  let ctx: ReturnType<typeof createMockCtx>;
  let resolver: LayoutResolver;
  let bgImage: HTMLImageElement;
  let station: StationData;
  let flags: DisplayFlags;

  beforeEach(() => {
    ctx = createMockCtx();
    resolver = new LayoutResolver(1200, 373);
    bgImage = { width: 1213, height: 378 } as HTMLImageElement;
    station = createTestStation();
    flags = { hideCurrentNumbering: false, hideNextNumbering: false };
  });

  it('should clear canvas and draw background first', () => {
    renderStationSign(ctx, resolver, bgImage, station, flags);

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1200, 373);
    expect(ctx.drawImage).toHaveBeenCalledWith(bgImage, 0, 0, 1200, 373);
  });

  it('should draw main station text', () => {
    renderStationSign(ctx, resolver, bgImage, station, flags);

    const texts = ctx._fillTextCalls.map((c) => c.text);
    expect(texts).toContain('新宿');
    expect(texts).toContain('しんじゅく');
    expect(texts).toContain('Shinjuku');
  });

  it('should draw adjacent station text', () => {
    renderStationSign(ctx, resolver, bgImage, station, flags);

    const texts = ctx._fillTextCalls.map((c) => c.text);
    expect(texts).toContain('南新宿');
    expect(texts).toContain('Minami-Shinjuku');
  });

  it('should draw numbering badges', () => {
    renderStationSign(ctx, resolver, bgImage, station, flags);

    const texts = ctx._fillTextCalls.map((c) => c.text);
    expect(texts).toContain('OH');
    expect(texts).toContain('01');
    expect(texts).toContain('02');
  });

  it('should not draw current numbering when hidden', () => {
    flags.hideCurrentNumbering = true;
    renderStationSign(ctx, resolver, bgImage, station, flags);

    const texts = ctx._fillTextCalls.map((c) => c.text);
    expect(texts).not.toContain('01');
    expect(texts).toContain('02');
  });

  it('should not draw next numbering when hidden', () => {
    flags.hideNextNumbering = true;
    renderStationSign(ctx, resolver, bgImage, station, flags);

    const texts = ctx._fillTextCalls.map((c) => c.text);
    expect(texts).toContain('01');
    expect(texts).not.toContain('02');
  });

  it('should not draw numbering when numbering is null', () => {
    station.currentNumbering = null;
    station.nextNumbering = null;
    renderStationSign(ctx, resolver, bgImage, station, flags);

    const texts = ctx._fillTextCalls.map((c) => c.text);
    expect(texts).not.toContain('OH');
    expect(texts).not.toContain('01');
    expect(texts).not.toContain('02');
  });

  it('should not draw empty adjacent station text', () => {
    station.prev = { kanji: '', romaji: '' };
    station.next = { kanji: '', romaji: '' };
    renderStationSign(ctx, resolver, bgImage, station, flags);

    const texts = ctx._fillTextCalls.map((c) => c.text);
    expect(texts).not.toContain('南新宿');
    expect(texts).not.toContain('Minami-Shinjuku');
  });
});
