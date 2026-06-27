function buildFontString(size: number, fontFamily: string): string {
  if (fontFamily.includes(',')) {
    return `${size}px ${fontFamily}`;
  }
  return `${size}px "${fontFamily}"`;
}

export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  maxFontSize: number,
  maxWidth: number,
  minFontSize = 1,
): number {
  let low = minFontSize;
  let high = maxFontSize;
  let best = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    ctx.font = buildFontString(mid, fontFamily);
    const measured = ctx.measureText(text).width;

    if (measured <= maxWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  ctx.font = buildFontString(best, fontFamily);
  return best;
}

export function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxFontSize: number,
  maxWidth: number,
  fontFamily: string,
  options?: {
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  },
): number {
  if (!text) return 0;

  ctx.save();

  fitFontSize(ctx, text, fontFamily, maxFontSize, maxWidth);
  ctx.textAlign = options?.align ?? 'center';
  ctx.textBaseline = options?.baseline ?? 'alphabetic';
  ctx.fillStyle = options?.color ?? '#000000';
  ctx.fillText(text, x, y);
  const measuredWidth = ctx.measureText(text).width;

  ctx.restore();
  return measuredWidth;
}
