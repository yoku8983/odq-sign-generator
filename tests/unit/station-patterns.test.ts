import { describe, it, expect } from 'vitest';
import { STATION_PATTERNS } from '$lib/station-patterns';

describe('STATION_PATTERNS', () => {
  it('should contain exactly 70 entries', () => {
    expect(STATION_PATTERNS).toHaveLength(70);
  });

  it('should have 47 OH, 16 OE, 7 OT stations', () => {
    const counts = { OH: 0, OE: 0, OT: 0 };
    for (const p of STATION_PATTERNS) {
      counts[p.line as keyof typeof counts]++;
    }
    expect(counts.OH).toBe(47);
    expect(counts.OE).toBe(16);
    expect(counts.OT).toBe(7);
  });

  it('should have unique labels', () => {
    const labels = STATION_PATTERNS.map(p => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('should have label matching name.kanji for all entries', () => {
    for (const p of STATION_PATTERNS) {
      expect(p.label).toBe(p.name.kanji);
    }
  });

  it('should have line matching currentNumbering.symbol for all entries', () => {
    for (const p of STATION_PATTERNS) {
      expect(p.line).toBe(p.currentNumbering!.symbol);
    }
  });

  it('should have non-null numbering for all entries', () => {
    for (const p of STATION_PATTERNS) {
      expect(p.currentNumbering).not.toBeNull();
      expect(p.nextNumbering).not.toBeNull();
    }
  });

  it('should have 2-digit station numbers with leading zeros', () => {
    for (const p of STATION_PATTERNS) {
      expect(p.currentNumbering!.number).toMatch(/^\d{2}$/);
      expect(p.nextNumbering!.number).toMatch(/^\d{2}$/);
    }
  });

  it('should have only valid line symbols', () => {
    const validLines = new Set(['OH', 'OE', 'OT']);
    for (const p of STATION_PATTERNS) {
      expect(validLines.has(p.line)).toBe(true);
    }
  });

  it('should have non-empty name fields for all entries', () => {
    for (const p of STATION_PATTERNS) {
      expect(p.name.kanji.length).toBeGreaterThan(0);
      expect(p.name.hiragana.length).toBeGreaterThan(0);
      expect(p.name.romaji.length).toBeGreaterThan(0);
    }
  });
});

describe('Terminal stations', () => {
  it('Shinjuku (first OH) should have empty prev', () => {
    const shinjuku = STATION_PATTERNS.find(p => p.label === '新宿');
    expect(shinjuku).toBeDefined();
    expect(shinjuku!.prev.kanji).toBe('');
    expect(shinjuku!.prev.romaji).toBe('');
    expect(shinjuku!.line).toBe('OH');
    expect(shinjuku!.currentNumbering!.number).toBe('01');
  });

  it('Katase-Enoshima (OE terminal) should have empty prev', () => {
    const katase = STATION_PATTERNS.find(p => p.label === '片瀬江ノ島');
    expect(katase).toBeDefined();
    expect(katase!.prev.kanji).toBe('');
    expect(katase!.prev.romaji).toBe('');
    expect(katase!.line).toBe('OE');
  });

  it('Karakida (OT terminal) should have empty prev', () => {
    const karakida = STATION_PATTERNS.find(p => p.label === '唐木田');
    expect(karakida).toBeDefined();
    expect(karakida!.prev.kanji).toBe('');
    expect(karakida!.prev.romaji).toBe('');
    expect(karakida!.line).toBe('OT');
  });

  it('should have exactly 3 terminal stations with empty prev', () => {
    const terminals = STATION_PATTERNS.filter(p => p.prev.kanji === '');
    expect(terminals).toHaveLength(3);
  });
});

describe('First and last entries', () => {
  it('first entry should be Shinjuku', () => {
    expect(STATION_PATTERNS[0].label).toBe('新宿');
    expect(STATION_PATTERNS[0].name.romaji).toBe('Shinjuku');
  });

  it('last entry should be Karakida', () => {
    const last = STATION_PATTERNS[STATION_PATTERNS.length - 1];
    expect(last.label).toBe('唐木田');
    expect(last.name.romaji).toBe('Karakida');
  });
});
