import { describe, it, expect } from 'vitest';
import { LAYOUT } from '$lib/layout';

describe('LAYOUT constant', () => {
  it('should be frozen', () => {
    expect(Object.isFrozen(LAYOUT)).toBe(true);
  });

  it('should have correct aspect ratio', () => {
    expect(LAYOUT.aspectRatio).toBeCloseTo(378 / 1213, 10);
  });
});

describe('LAYOUT.fonts', () => {
  it('should define all font families', () => {
    expect(LAYOUT.fonts.japanese).toBe('Mplus2c');
    expect(LAYOUT.fonts.romaji).toBe('VialogLT');
    expect(LAYOUT.fonts.romajiWithFallback).toBe('VialogLT, sans-serif');
    expect(LAYOUT.fonts.numbering).toBe('FrutigerBold');
  });
});

describe('LAYOUT.colors', () => {
  it('should define correct hex colors', () => {
    expect(LAYOUT.colors.text).toBe('#000000');
    expect(LAYOUT.colors.numberingAccent).toBe('#028CD4');
    expect(LAYOUT.colors.numberingBg).toBe('#FFFFFF');
  });
});

describe('LAYOUT.mainStation', () => {
  it('should have centered x positions', () => {
    expect(LAYOUT.mainStation.kanji.x).toBe(0.5);
    expect(LAYOUT.mainStation.romaji.x).toBe(0.5);
    expect(LAYOUT.mainStation.hiragana.x).toBe(0.5);
  });

  it('should have normalized y positions in range 0-1', () => {
    for (const key of ['kanji', 'romaji', 'hiragana'] as const) {
      expect(LAYOUT.mainStation[key].y).toBeGreaterThan(0);
      expect(LAYOUT.mainStation[key].y).toBeLessThan(1);
    }
  });

  it('should have correct specific values', () => {
    expect(LAYOUT.mainStation.kanji.y).toBeCloseTo(115 / 373, 10);
    expect(LAYOUT.mainStation.kanji.fontSize).toBeCloseTo(100 / 1200, 10);
    expect(LAYOUT.mainStation.kanji.maxWidth).toBeCloseTo(750 / 1200, 10);
  });

  it('should order y positions: kanji < romaji < hiragana', () => {
    expect(LAYOUT.mainStation.kanji.y).toBeLessThan(LAYOUT.mainStation.romaji.y);
    expect(LAYOUT.mainStation.romaji.y).toBeLessThan(LAYOUT.mainStation.hiragana.y);
  });
});

describe('LAYOUT.adjacentStation', () => {
  it('should have symmetric left/right positions', () => {
    expect(LAYOUT.adjacentStation.leftX).toBeCloseTo(1 / 40, 10);
    expect(LAYOUT.adjacentStation.rightX).toBeCloseTo(1 - 1 / 40, 10);
    expect(LAYOUT.adjacentStation.leftX + LAYOUT.adjacentStation.rightX).toBeCloseTo(1, 10);
  });

  it('should have positive font sizes and max widths', () => {
    expect(LAYOUT.adjacentStation.kanji.fontSize).toBeGreaterThan(0);
    expect(LAYOUT.adjacentStation.kanji.maxWidth).toBeGreaterThan(0);
    expect(LAYOUT.adjacentStation.romaji.fontSize).toBeGreaterThan(0);
    expect(LAYOUT.adjacentStation.romaji.maxWidth).toBeGreaterThan(0);
  });
});

describe('LAYOUT.currentNumbering', () => {
  it('should have positive dimensions', () => {
    expect(LAYOUT.currentNumbering.width).toBeGreaterThan(0);
    expect(LAYOUT.currentNumbering.height).toBeGreaterThan(0);
    expect(LAYOUT.currentNumbering.radius).toBeGreaterThan(0);
    expect(LAYOUT.currentNumbering.lineWidth).toBeGreaterThan(0);
  });
});

describe('LAYOUT.nextNumbering', () => {
  it('should be smaller than current numbering', () => {
    expect(LAYOUT.nextNumbering.width).toBeLessThan(LAYOUT.currentNumbering.width);
    expect(LAYOUT.nextNumbering.height).toBeLessThan(LAYOUT.currentNumbering.height);
  });
});

describe('LAYOUT normalized values', () => {
  it('all main station font sizes should be in 0-1 range', () => {
    for (const key of ['kanji', 'romaji', 'hiragana'] as const) {
      expect(LAYOUT.mainStation[key].fontSize).toBeGreaterThan(0);
      expect(LAYOUT.mainStation[key].fontSize).toBeLessThan(1);
    }
  });

  it('numbering font sizes should be in 0-1 range', () => {
    expect(LAYOUT.currentNumbering.fontSizeSymbol).toBeGreaterThan(0);
    expect(LAYOUT.currentNumbering.fontSizeSymbol).toBeLessThan(1);
    expect(LAYOUT.currentNumbering.fontSizeNumber).toBeGreaterThan(0);
    expect(LAYOUT.currentNumbering.fontSizeNumber).toBeLessThan(1);
  });
});
