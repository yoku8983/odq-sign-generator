export interface TextElementPosition {
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly maxWidth: number;
}

export interface TextElementSize {
  readonly fontSize: number;
  readonly maxWidth: number;
}

export interface FontConfig {
  readonly japanese: string;
  readonly romaji: string;
  readonly romajiWithFallback: string;
  readonly numbering: string;
}

export interface ColorConfig {
  readonly text: string;
  readonly numberingAccent: string;
  readonly numberingBg: string;
}

export interface AdjacentStationLayout {
  readonly y: number;
  readonly leftX: number;
  readonly rightX: number;
  readonly romajiOffsetX: number;
  readonly romajiGap: number;
  readonly kanji: TextElementSize;
  readonly romaji: TextElementSize;
}

export interface CurrentNumberingLayout {
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly lineWidth: number;
  readonly margin: number;
  readonly fontSizeSymbol: number;
  readonly fontSizeNumber: number;
}

export interface NextNumberingLayout {
  readonly xOffset: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly lineWidth: number;
  readonly fontSizeSymbol: number;
  readonly fontSizeNumber: number;
}

export interface TwoLineTextLayout {
  readonly upperLineDivisor: number;
  readonly lowerLineDivisor: number;
}

export interface LayoutDefinition {
  readonly aspectRatio: number;
  readonly fonts: FontConfig;
  readonly colors: ColorConfig;
  readonly mainStation: {
    readonly kanji: TextElementPosition;
    readonly romaji: TextElementPosition;
    readonly hiragana: TextElementPosition;
  };
  readonly adjacentStation: AdjacentStationLayout;
  readonly currentNumbering: CurrentNumberingLayout;
  readonly nextNumbering: NextNumberingLayout;
  readonly twoLineText: TwoLineTextLayout;
}

export const LAYOUT: LayoutDefinition = Object.freeze({
  aspectRatio: 378 / 1213,

  fonts: {
    japanese: 'Mplus2c',
    romaji: 'VialogLT',
    romajiWithFallback: 'VialogLT, sans-serif',
    numbering: 'FrutigerBold',
  },

  colors: {
    text: '#000000',
    numberingAccent: '#028CD4',
    numberingBg: '#FFFFFF',
  },

  mainStation: {
    kanji:    { x: 0.5, y: 115 / 373, fontSize: 100 / 1200, maxWidth: 750 / 1200 },
    romaji:   { x: 0.5, y: 190 / 373, fontSize:  60 / 1200, maxWidth: 550 / 1200 },
    hiragana: { x: 0.5, y: 330 / 373, fontSize:  55 / 1200, maxWidth: 380 / 1200 },
  },

  adjacentStation: {
    y: 330 / 373,
    leftX: 1 / 40,
    rightX: 1 - 1 / 40,
    romajiOffsetX: 1 / 28,
    romajiGap: 12 / 1200,
    kanji:  { fontSize: 42 / 1200, maxWidth: 170 / 1200 },
    romaji: { fontSize: 23 / 1200, maxWidth: 170 / 1200 },
  },

  currentNumbering: {
    y: 70 / 373,
    width: 110 / 1200,
    height: 110 / 373,
    radius: 50 / 1200,
    lineWidth: 9 / 1200,
    margin: 35 / 1200,
    fontSizeSymbol: 35 / 1200,
    fontSizeNumber: 54 / 1200,
  },

  nextNumbering: {
    xOffset: 120 / 1200,
    y: 125 / 373,
    width: 80 / 1200,
    height: 80 / 373,
    radius: 37 / 1200,
    lineWidth: 6 / 1200,
    fontSizeSymbol: 25 / 1200,
    fontSizeNumber: 38 / 1200,
  },

  twoLineText: {
    upperLineDivisor: 2.9,
    lowerLineDivisor: 2.4,
  },
});
