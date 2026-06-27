import { LayoutResolver } from './layout-resolver';

export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
): LayoutResolver {
  canvas.width = Math.floor(cssWidth * pixelRatio);
  canvas.height = Math.floor(cssHeight * pixelRatio);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);

  return new LayoutResolver(cssWidth, cssHeight);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename = 'station-sign.png'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SHARE_URL = 'https://odq-stasigin-gen.net';

export async function shareImage(blob: Blob, filename = 'station-sign.png'): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });
  await navigator.share({
    files: [file],
    title: '小田急駅名標ジェネレーター',
    text: `自分だけの小田急の駅名標を作ってみた\u{1F683} ${SHARE_URL}`,
    url: SHARE_URL,
  });
}
