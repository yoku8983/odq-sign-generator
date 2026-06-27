export class LayoutResolver {
  constructor(public readonly w: number, public readonly h: number) {}
  x(ratio: number): number { return ratio * this.w; }
  y(ratio: number): number { return ratio * this.h; }
  fontSize(ratio: number): number { return ratio * this.w; }
  width(ratio: number): number { return ratio * this.w; }
  height(ratio: number): number { return ratio * this.h; }
}
