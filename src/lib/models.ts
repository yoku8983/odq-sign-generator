export interface StationNumbering {
  symbol: string;
  number: string;
}

export interface StationData {
  name: { kanji: string; hiragana: string; romaji: string };
  prev: { kanji: string; romaji: string };
  next: { kanji: string; romaji: string };
  currentNumbering: StationNumbering | null;
  nextNumbering: StationNumbering | null;
}

export interface DisplayFlags {
  hideCurrentNumbering: boolean;
  hideNextNumbering: boolean;
}

export interface StationPatternEntry extends StationData {
  readonly label: string;
  readonly line: string;
}

export interface RenderOptions {
  displayWidth: number;
  pixelRatio: number;
  exportPixelRatio: number;
}
