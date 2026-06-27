export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  bgColor: string,
  borderColor: string,
  lineWidth: number,
): void {
  ctx.save();

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.restore();
}

export function drawNumberingBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  bgColor: string,
  borderColor: string,
  textColor: string,
  lineWidth: number,
  symbol: string,
  number: string,
  fontSizeSymbol: number,
  fontSizeNumber: number,
  fontFamily: string,
  upperLineDivisor: number,
  lowerLineDivisor: number,
): void {
  drawRoundedRect(ctx, x, y, width, height, radius, bgColor, borderColor, lineWidth);

  ctx.save();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';

  ctx.font = `${fontSizeSymbol}px ${fontFamily}`;
  ctx.fillText(symbol, x + width / 2, y + height / upperLineDivisor);

  ctx.font = `${fontSizeNumber}px ${fontFamily}`;
  ctx.fillText(number, x + width / 2, y + (2 * height) / lowerLineDivisor);

  ctx.restore();
}
