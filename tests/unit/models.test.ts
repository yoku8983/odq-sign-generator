import { describe, it, expect } from 'vitest';
import type {
  StationData,
  StationNumbering,
  DisplayFlags,
  StationPatternEntry,
  RenderOptions,
} from '$lib/models';

describe('StationNumbering', () => {
  it('should accept valid numbering with leading zeros', () => {
    const numbering: StationNumbering = { symbol: 'OH', number: '01' };
    expect(numbering.symbol).toBe('OH');
    expect(numbering.number).toBe('01');
  });

  it('should accept all line symbols', () => {
    const lines: StationNumbering[] = [
      { symbol: 'OH', number: '47' },
      { symbol: 'OE', number: '16' },
      { symbol: 'OT', number: '07' },
    ];
    expect(lines).toHaveLength(3);
  });
});

describe('StationData', () => {
  it('should accept complete station data with numbering', () => {
    const station: StationData = {
      name: { kanji: '新宿', hiragana: 'しんじゅく', romaji: 'Shinjuku' },
      prev: { kanji: '', romaji: '' },
      next: { kanji: '南新宿', romaji: 'Minami-Shinjuku' },
      currentNumbering: { symbol: 'OH', number: '01' },
      nextNumbering: { symbol: 'OH', number: '02' },
    };
    expect(station.name.kanji).toBe('新宿');
    expect(station.prev.kanji).toBe('');
  });

  it('should accept null numbering', () => {
    const station: StationData = {
      name: { kanji: 'テスト', hiragana: 'てすと', romaji: 'Test' },
      prev: { kanji: '', romaji: '' },
      next: { kanji: '', romaji: '' },
      currentNumbering: null,
      nextNumbering: null,
    };
    expect(station.currentNumbering).toBeNull();
    expect(station.nextNumbering).toBeNull();
  });
});

describe('DisplayFlags', () => {
  it('should accept boolean flags', () => {
    const flags: DisplayFlags = {
      hideCurrentNumbering: false,
      hideNextNumbering: false,
    };
    expect(flags.hideCurrentNumbering).toBe(false);
    expect(flags.hideNextNumbering).toBe(false);
  });
});

describe('StationPatternEntry', () => {
  it('should extend StationData with label and line', () => {
    const entry: StationPatternEntry = {
      label: '新宿',
      line: 'OH',
      name: { kanji: '新宿', hiragana: 'しんじゅく', romaji: 'Shinjuku' },
      prev: { kanji: '', romaji: '' },
      next: { kanji: '南新宿', romaji: 'Minami-Shinjuku' },
      currentNumbering: { symbol: 'OH', number: '01' },
      nextNumbering: { symbol: 'OH', number: '02' },
    };
    expect(entry.label).toBe('新宿');
    expect(entry.line).toBe('OH');
    expect(entry.name.kanji).toBe(entry.label);
  });
});

describe('RenderOptions', () => {
  it('should accept render configuration', () => {
    const opts: RenderOptions = {
      displayWidth: 1200,
      pixelRatio: 2,
      exportPixelRatio: 3,
    };
    expect(opts.displayWidth).toBe(1200);
    expect(opts.pixelRatio).toBe(2);
    expect(opts.exportPixelRatio).toBe(3);
  });
});
