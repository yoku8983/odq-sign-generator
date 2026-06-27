import { describe, it, expect } from 'vitest';
import { createEmptyStation, resetStation, applyPattern, station, flags } from '$lib/state.svelte';
import type { StationPatternEntry } from '$lib/models';

describe('createEmptyStation', () => {
  it('returns StationData with all empty strings', () => {
    const s = createEmptyStation();
    expect(s.name).toEqual({ kanji: '', hiragana: '', romaji: '' });
    expect(s.prev).toEqual({ kanji: '', romaji: '' });
    expect(s.next).toEqual({ kanji: '', romaji: '' });
    expect(s.currentNumbering).toEqual({ symbol: '', number: '' });
    expect(s.nextNumbering).toEqual({ symbol: '', number: '' });
  });

  it('returns a fresh object each call', () => {
    const a = createEmptyStation();
    const b = createEmptyStation();
    expect(a).not.toBe(b);
    expect(a.name).not.toBe(b.name);
  });
});

describe('resetStation', () => {
  it('clears all fields to empty', () => {
    station.name.kanji = '新宿';
    station.name.hiragana = 'しんじゅく';
    station.name.romaji = 'Shinjuku';
    station.prev.kanji = '南新宿';
    station.prev.romaji = 'Minami-Shinjuku';
    station.next.kanji = '代々木八幡';
    station.next.romaji = 'Yoyogi-Hachiman';
    station.currentNumbering = { symbol: 'OH', number: '01' };
    station.nextNumbering = { symbol: 'OH', number: '02' };
    flags.hideCurrentNumbering = true;
    flags.hideNextNumbering = true;

    resetStation();

    expect(station.name.kanji).toBe('');
    expect(station.name.hiragana).toBe('');
    expect(station.name.romaji).toBe('');
    expect(station.prev.kanji).toBe('');
    expect(station.prev.romaji).toBe('');
    expect(station.next.kanji).toBe('');
    expect(station.next.romaji).toBe('');
    expect(station.currentNumbering).toEqual({ symbol: '', number: '' });
    expect(station.nextNumbering).toEqual({ symbol: '', number: '' });
    expect(flags.hideCurrentNumbering).toBe(false);
    expect(flags.hideNextNumbering).toBe(false);
  });
});

describe('applyPattern', () => {
  const pattern: StationPatternEntry = {
    label: '新宿',
    line: 'OH',
    name: { kanji: '新宿', hiragana: 'しんじゅく', romaji: 'Shinjuku' },
    prev: { kanji: '', romaji: '' },
    next: { kanji: '南新宿', romaji: 'Minami-Shinjuku' },
    currentNumbering: { symbol: 'OH', number: '01' },
    nextNumbering: { symbol: 'OH', number: '02' },
  };

  it('copies all fields from pattern', () => {
    resetStation();
    applyPattern(pattern);

    expect(station.name.kanji).toBe('新宿');
    expect(station.name.hiragana).toBe('しんじゅく');
    expect(station.name.romaji).toBe('Shinjuku');
    expect(station.prev.kanji).toBe('');
    expect(station.prev.romaji).toBe('');
    expect(station.next.kanji).toBe('南新宿');
    expect(station.next.romaji).toBe('Minami-Shinjuku');
    expect(station.currentNumbering).toEqual({ symbol: 'OH', number: '01' });
    expect(station.nextNumbering).toEqual({ symbol: 'OH', number: '02' });
  });

  it('creates independent copies of numbering', () => {
    resetStation();
    applyPattern(pattern);

    station.currentNumbering!.symbol = 'OE';
    expect(pattern.currentNumbering!.symbol).toBe('OH');
  });

  it('handles null numbering in pattern', () => {
    const noNumbering: StationPatternEntry = {
      ...pattern,
      currentNumbering: null,
      nextNumbering: null,
    };
    applyPattern(noNumbering);

    expect(station.currentNumbering).toEqual({ symbol: '', number: '' });
    expect(station.nextNumbering).toEqual({ symbol: '', number: '' });
  });
});
