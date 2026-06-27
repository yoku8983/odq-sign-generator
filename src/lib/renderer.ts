import type { StationData, DisplayFlags } from './models';
import type { LayoutResolver } from './layout-resolver';
import { LAYOUT } from './layout';
import { drawFittedText } from './text';
import { drawNumberingBadge } from './shapes';

let bgImageCache: HTMLImageElement | null = null;

export function loadBackgroundImage(): Promise<HTMLImageElement> {
  if (bgImageCache) return Promise.resolve(bgImageCache);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      bgImageCache = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error('背景画像の読み込みに失敗しました'));
    img.src = '/assets/background.png';
  });
}

export function renderStationSign(
  ctx: CanvasRenderingContext2D,
  resolver: LayoutResolver,
  bgImage: HTMLImageElement,
  station: StationData,
  flags: DisplayFlags,
): void {
  const { w, h } = resolver;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(bgImage, 0, 0, w, h);

  const maxTextWidth = drawMainStationText(ctx, resolver, station);
  drawAdjacentStations(ctx, resolver, station);
  drawNumberings(ctx, resolver, station, flags, maxTextWidth);
}

function drawMainStationText(
  ctx: CanvasRenderingContext2D,
  resolver: LayoutResolver,
  station: StationData,
): number {
  const { mainStation, fonts, colors } = LAYOUT;

  const kanjiWidth = drawFittedText(
    ctx,
    station.name.kanji,
    resolver.x(mainStation.kanji.x),
    resolver.y(mainStation.kanji.y),
    resolver.fontSize(mainStation.kanji.fontSize),
    resolver.width(mainStation.kanji.maxWidth),
    fonts.japanese,
    { color: colors.text },
  );

  const romajiWidth = drawFittedText(
    ctx,
    station.name.romaji,
    resolver.x(mainStation.romaji.x),
    resolver.y(mainStation.romaji.y),
    resolver.fontSize(mainStation.romaji.fontSize),
    resolver.width(mainStation.romaji.maxWidth),
    fonts.romaji,
    { color: colors.text },
  );

  drawFittedText(
    ctx,
    station.name.hiragana,
    resolver.x(mainStation.hiragana.x),
    resolver.y(mainStation.hiragana.y),
    resolver.fontSize(mainStation.hiragana.fontSize),
    resolver.width(mainStation.hiragana.maxWidth),
    fonts.japanese,
    { color: colors.text },
  );

  return Math.max(kanjiWidth, romajiWidth);
}

function drawAdjacentStations(
  ctx: CanvasRenderingContext2D,
  resolver: LayoutResolver,
  station: StationData,
): void {
  const { adjacentStation: adj, fonts, colors } = LAYOUT;

  const prevKanjiWidth = drawFittedText(
    ctx,
    station.prev.kanji,
    resolver.x(adj.leftX),
    resolver.y(adj.y),
    resolver.fontSize(adj.kanji.fontSize),
    resolver.width(adj.kanji.maxWidth),
    fonts.japanese,
    { color: colors.text, align: 'left' },
  );

  drawFittedText(
    ctx,
    station.prev.romaji,
    resolver.x(adj.romajiOffsetX) + prevKanjiWidth + resolver.width(adj.romajiGap),
    resolver.y(adj.y),
    resolver.fontSize(adj.romaji.fontSize),
    resolver.width(adj.romaji.maxWidth),
    fonts.romajiWithFallback,
    { color: colors.text, align: 'left' },
  );

  const nextKanjiWidth = drawFittedText(
    ctx,
    station.next.kanji,
    resolver.x(adj.rightX),
    resolver.y(adj.y),
    resolver.fontSize(adj.kanji.fontSize),
    resolver.width(adj.kanji.maxWidth),
    fonts.japanese,
    { color: colors.text, align: 'right' },
  );

  drawFittedText(
    ctx,
    station.next.romaji,
    resolver.x(1 - adj.romajiOffsetX) - nextKanjiWidth - resolver.width(adj.romajiGap),
    resolver.y(adj.y),
    resolver.fontSize(adj.romaji.fontSize),
    resolver.width(adj.romaji.maxWidth),
    fonts.romajiWithFallback,
    { color: colors.text, align: 'right' },
  );
}

function drawNumberings(
  ctx: CanvasRenderingContext2D,
  resolver: LayoutResolver,
  station: StationData,
  flags: DisplayFlags,
  mainTextMaxWidth: number,
): void {
  const { currentNumbering: curr, nextNumbering: next, colors, fonts, twoLineText } = LAYOUT;

  if (
    !flags.hideCurrentNumbering &&
    station.currentNumbering &&
    (station.currentNumbering.symbol || station.currentNumbering.number)
  ) {
    const stationLeftX = resolver.x(0.5) - mainTextMaxWidth / 2;
    const rectX = stationLeftX - resolver.width(curr.margin) - resolver.width(curr.width);

    drawNumberingBadge(
      ctx,
      rectX,
      resolver.y(curr.y),
      resolver.width(curr.width),
      resolver.height(curr.height),
      resolver.width(curr.radius),
      colors.numberingBg,
      colors.numberingAccent,
      colors.numberingAccent,
      resolver.width(curr.lineWidth),
      station.currentNumbering.symbol,
      station.currentNumbering.number,
      resolver.fontSize(curr.fontSizeSymbol),
      resolver.fontSize(curr.fontSizeNumber),
      fonts.numbering,
      twoLineText.upperLineDivisor,
      twoLineText.lowerLineDivisor,
    );
  }

  if (
    !flags.hideNextNumbering &&
    station.nextNumbering &&
    (station.nextNumbering.symbol || station.nextNumbering.number)
  ) {
    drawNumberingBadge(
      ctx,
      resolver.x(1) - resolver.width(next.xOffset),
      resolver.y(next.y),
      resolver.width(next.width),
      resolver.height(next.height),
      resolver.width(next.radius),
      colors.numberingBg,
      colors.numberingAccent,
      colors.numberingAccent,
      resolver.width(next.lineWidth),
      station.nextNumbering.symbol,
      station.nextNumbering.number,
      resolver.fontSize(next.fontSizeSymbol),
      resolver.fontSize(next.fontSizeNumber),
      fonts.numbering,
      twoLineText.upperLineDivisor,
      twoLineText.lowerLineDivisor,
    );
  }
}
