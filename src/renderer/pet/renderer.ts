// Canvas pixel character renderer
// Draws a 32×32 ColorGrid to a canvas with configurable pixel size

import { ColorGrid } from '../shared/pixelMaps';

export interface FrameData {
  /** The 32x32 color grid to draw */
  grid: ColorGrid;
  /** Horizontal pixel offset */
  offsetX: number;
  /** Vertical pixel offset */
  offsetY: number;
}

export class CharacterRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public pixelSize: number;  // scale factor (e.g., 8 = 256px wide)
  private gridSize: number;  // 32
  private bgColor: string;
  private bgColorAlt: string;

  constructor(canvas: HTMLCanvasElement, pixelSize: number = 8) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;
    this.pixelSize = pixelSize;
    this.gridSize = 32;
    this.bgColor = '#16213e';
    this.bgColorAlt = '#1a1a3e';

    this.resize();
  }

  resize() {
    const size = this.gridSize * this.pixelSize;
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Set the pixel scale factor and resize the canvas */
  setScale(scale: number) {
    this.pixelSize = scale;
    this.resize();
  }

  /** Clear and draw background + character */
  draw(frame: FrameData) {
    const { grid, offsetX, offsetY } = frame;
    const px = this.pixelSize;
    const ctx = this.ctx;

    ctx.save();

    // Apply offsets
    ctx.translate(offsetX * px, offsetY * px);

    // Draw background checkerboard for transparency visibility
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const color = grid[y]?.[x];
        if (!color) {
          // Transparent pixel — show bg checker
          ctx.fillStyle = (x + y) % 2 === 0 ? this.bgColor : this.bgColorAlt;
          ctx.fillRect(x * px, y * px, px, px);
        }
      }
    }

    // Draw character pixels
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const color = row[x];
        if (!color) continue;

        // Main pixel
        ctx.fillStyle = color;
        ctx.fillRect(x * px, y * px, px, px);

        // Subtle top-left highlight for 3D pixel effect
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x * px, y * px, px, 0.5);
        ctx.fillRect(x * px, y * px, 0.5, px);

        // Subtle bottom-right shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x * px, y * px + px - 0.5, px, 0.5);
        ctx.fillRect(x * px + px - 0.5, y * px, 0.5, px);
      }
    }

    ctx.restore();
  }

  /** Draw a simple colored background (for non-transparent mode) */
  drawWithBackground(frame: FrameData, bgColor: string) {
    const px = this.pixelSize;
    const ctx = this.ctx;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.draw(frame);
  }

  /** Get canvas dimensions */
  getSize(): { width: number; height: number } {
    return {
      width: this.gridSize * this.pixelSize,
      height: this.gridSize * this.pixelSize,
    };
  }
}
