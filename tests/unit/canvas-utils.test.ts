import { describe, it, expect, vi } from 'vitest';
import {
  setupHiDPICanvas,
  canvasToBlob,
  downloadBlob,
  shareImage,
} from '$lib/canvas-utils';
import { LayoutResolver } from '$lib/layout-resolver';

function createMockCanvas() {
  const scaleSpy = vi.fn();
  const setTransformSpy = vi.fn();

  const canvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    getContext: () => ({
      scale: scaleSpy,
      setTransform: setTransformSpy,
    }),
    toBlob: vi.fn(),
  };

  return { canvas, scaleSpy, setTransformSpy };
}

describe('setupHiDPICanvas', () => {
  it('should set canvas dimensions with pixel ratio', () => {
    const { canvas, scaleSpy, setTransformSpy } = createMockCanvas();

    const resolver = setupHiDPICanvas(
      canvas as unknown as HTMLCanvasElement,
      600,
      200,
      2,
    );

    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(400);
    expect(canvas.style.width).toBe('600px');
    expect(canvas.style.height).toBe('200px');
    expect(setTransformSpy).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(scaleSpy).toHaveBeenCalledWith(2, 2);
    expect(resolver).toBeInstanceOf(LayoutResolver);
    expect(resolver.w).toBe(600);
    expect(resolver.h).toBe(200);
  });

  it('should floor pixel dimensions', () => {
    const { canvas } = createMockCanvas();

    setupHiDPICanvas(canvas as unknown as HTMLCanvasElement, 601, 201, 1.5);

    expect(canvas.width).toBe(901);
    expect(canvas.height).toBe(301);
  });
});

describe('canvasToBlob', () => {
  it('should resolve with blob from toBlob callback', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    const canvas = {
      toBlob: (cb: (blob: Blob | null) => void, type: string) => {
        expect(type).toBe('image/png');
        cb(mockBlob);
      },
    };

    const result = await canvasToBlob(canvas as unknown as HTMLCanvasElement);
    expect(result).toBe(mockBlob);
  });

  it('should reject when toBlob returns null', async () => {
    const canvas = {
      toBlob: (cb: (blob: Blob | null) => void) => cb(null),
    };

    await expect(
      canvasToBlob(canvas as unknown as HTMLCanvasElement),
    ).rejects.toThrow('Canvas toBlob failed');
  });
});

describe('downloadBlob', () => {
  it('should create a download link and click it', () => {
    const clickSpy = vi.fn();
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:test-url');
    const revokeObjectURLSpy = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    const mockLink = { href: '', download: '', click: clickSpy };
    vi.stubGlobal('document', {
      createElement: () => mockLink,
    });

    const blob = new Blob(['test']);
    downloadBlob(blob, 'test.png');

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(mockLink.href).toBe('blob:test-url');
    expect(mockLink.download).toBe('test.png');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');
  });

  it('should use default filename', () => {
    const mockLink = { href: '', download: '', click: vi.fn() };
    vi.stubGlobal('document', {
      createElement: () => mockLink,
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:url'),
      revokeObjectURL: vi.fn(),
    });

    downloadBlob(new Blob(['test']));
    expect(mockLink.download).toBe('station-sign.png');
  });
});

describe('shareImage', () => {
  it('should call navigator.share with a File', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share: shareSpy });

    const blob = new Blob(['test'], { type: 'image/png' });
    await shareImage(blob, 'my-sign.png');

    expect(shareSpy).toHaveBeenCalledOnce();
    const shareData = shareSpy.mock.calls[0][0];
    expect(shareData.files).toHaveLength(1);
    expect(shareData.files[0]).toBeInstanceOf(File);
    expect(shareData.files[0].name).toBe('my-sign.png');
    expect(shareData.files[0].type).toBe('image/png');
    expect(shareData.title).toBe('小田急駅名標ジェネレーター');
    expect(shareData.text).toBe('小田急駅名標ジェネレーターで作成しました');
  });

  it('should use default filename', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share: shareSpy });

    await shareImage(new Blob(['test']));

    const shareData = shareSpy.mock.calls[0][0];
    expect(shareData.files[0].name).toBe('station-sign.png');
  });

  it('should propagate errors from navigator.share', async () => {
    const shareSpy = vi
      .fn()
      .mockRejectedValue(new DOMException('Canceled', 'AbortError'));
    vi.stubGlobal('navigator', { share: shareSpy });

    await expect(shareImage(new Blob(['test']))).rejects.toThrow('Canceled');
  });
});
