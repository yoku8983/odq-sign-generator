import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadFonts } from '$lib/fonts';

describe('loadFonts', () => {
  let mockLoad: ReturnType<typeof vi.fn>;
  let addedFaces: Array<{ family: string }>;

  beforeEach(() => {
    mockLoad = vi.fn().mockResolvedValue(undefined);
    addedFaces = [];

    vi.stubGlobal('FontFace', class {
      family: string;
      constructor(family: string, _source: string) {
        this.family = family;
      }
      load = mockLoad;
    });

    vi.stubGlobal('document', {
      fonts: {
        add: (face: { family: string }) => addedFaces.push(face),
        ready: Promise.resolve(),
      },
    });
  });

  it('should create and load three font faces', async () => {
    await loadFonts();

    expect(addedFaces).toHaveLength(3);
    expect(addedFaces.map((f) => f.family)).toEqual([
      'Mplus2c',
      'VialogLT',
      'FrutigerBold',
    ]);
    expect(mockLoad).toHaveBeenCalledTimes(3);
  });
});
