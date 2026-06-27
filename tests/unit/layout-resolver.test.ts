import { describe, it, expect } from 'vitest';
import { LayoutResolver } from '$lib/layout-resolver';

describe('LayoutResolver', () => {
  const resolver = new LayoutResolver(1200, 373);

  it('should store dimensions', () => {
    expect(resolver.w).toBe(1200);
    expect(resolver.h).toBe(373);
  });

  describe('x()', () => {
    it('should multiply ratio by width', () => {
      expect(resolver.x(0.5)).toBe(600);
      expect(resolver.x(0)).toBe(0);
      expect(resolver.x(1)).toBe(1200);
    });
  });

  describe('y()', () => {
    it('should multiply ratio by height', () => {
      expect(resolver.y(0.5)).toBe(186.5);
      expect(resolver.y(0)).toBe(0);
      expect(resolver.y(1)).toBe(373);
    });
  });

  describe('fontSize()', () => {
    it('should multiply ratio by width', () => {
      expect(resolver.fontSize(100 / 1200)).toBeCloseTo(100, 10);
    });
  });

  describe('width()', () => {
    it('should multiply ratio by width', () => {
      expect(resolver.width(750 / 1200)).toBeCloseTo(750, 10);
    });
  });

  describe('height()', () => {
    it('should multiply ratio by height', () => {
      expect(resolver.height(110 / 373)).toBeCloseTo(110, 10);
    });
  });

  it('should produce original pixel values with 1200x373 canvas', () => {
    expect(resolver.x(0.5)).toBe(600);
    expect(resolver.y(115 / 373)).toBeCloseTo(115, 10);
    expect(resolver.fontSize(100 / 1200)).toBeCloseTo(100, 10);
  });

  it('should scale proportionally for 2x dimensions', () => {
    const r2x = new LayoutResolver(2400, 746);
    expect(r2x.x(0.5)).toBe(1200);
    expect(r2x.fontSize(100 / 1200)).toBeCloseTo(200, 10);
    expect(r2x.y(115 / 373)).toBeCloseTo(230, 10);
  });

  it('should handle zero dimensions', () => {
    const zero = new LayoutResolver(0, 0);
    expect(zero.x(0.5)).toBe(0);
    expect(zero.y(0.5)).toBe(0);
  });
});
