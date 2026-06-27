import type { StationData, StationPatternEntry, DisplayFlags } from './models';

export function createEmptyStation(): StationData {
  return {
    name: { kanji: '', hiragana: '', romaji: '' },
    prev: { kanji: '', romaji: '' },
    next: { kanji: '', romaji: '' },
    currentNumbering: { symbol: '', number: '' },
    nextNumbering: { symbol: '', number: '' },
  };
}

export const station: StationData = $state(createEmptyStation());

export const flags: DisplayFlags = $state({
  hideCurrentNumbering: false,
  hideNextNumbering: false,
});

let _canvasRef: HTMLCanvasElement | null = $state(null);

export function getCanvasRef(): HTMLCanvasElement | null {
  return _canvasRef;
}

export function setCanvasRef(el: HTMLCanvasElement | null): void {
  _canvasRef = el;
}

export function resetStation(): void {
  station.name.kanji = '';
  station.name.hiragana = '';
  station.name.romaji = '';
  station.prev.kanji = '';
  station.prev.romaji = '';
  station.next.kanji = '';
  station.next.romaji = '';
  station.currentNumbering = { symbol: '', number: '' };
  station.nextNumbering = { symbol: '', number: '' };
  flags.hideCurrentNumbering = false;
  flags.hideNextNumbering = false;
}

export function applyPattern(pattern: StationPatternEntry): void {
  station.name.kanji = pattern.name.kanji;
  station.name.hiragana = pattern.name.hiragana;
  station.name.romaji = pattern.name.romaji;
  station.prev.kanji = pattern.prev.kanji;
  station.prev.romaji = pattern.prev.romaji;
  station.next.kanji = pattern.next.kanji;
  station.next.romaji = pattern.next.romaji;
  station.currentNumbering = pattern.currentNumbering
    ? { ...pattern.currentNumbering }
    : { symbol: '', number: '' };
  station.nextNumbering = pattern.nextNumbering
    ? { ...pattern.nextNumbering }
    : { symbol: '', number: '' };
}
