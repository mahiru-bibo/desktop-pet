// Canvas pixel character renderer
// Draws a 32×32 ColorGrid to a canvas with configurable pixel size

import { ColorGrid } from '../shared/pixelMaps';

export interface FrameData {
  /** The 32x32 color grid to draw (undefined for image-based characters) */
  grid?: ColorGrid;
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

  // Image character support
  private image: HTMLImageElement | null = null;
  private imageDisplayWidth: number = 200;
  private isImageMode: boolean = false;

  // Multi-emotion image support
  private emotionImages: Map<string, HTMLImageElement> = new Map();
  private currentEmotion: string = '';  // '' = default/idle image

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
    if (this.isImageMode) {
      this.resizeForImage();
      return;
    }
    const size = this.gridSize * this.pixelSize;
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx.imageSmoothingEnabled = false;
  }

  private resizeForImage() {
    if (!this.image) return;
    const aspect = this.image.height / this.image.width;
    this.canvas.width = this.imageDisplayWidth;
    this.canvas.height = Math.round(this.imageDisplayWidth * aspect);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.canvas.style.imageRendering = 'auto';
  }

  /** Set the pixel scale factor and resize the canvas */
  setScale(scale: number) {
    this.pixelSize = scale;
    this.resize();
  }

  /** Load an image for image-based characters */
  async loadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.isImageMode = true;
        this.resizeForImage();
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /** Load idle image + all emotion images in parallel */
  async loadImages(idleSrc: string, emotions: Record<string, string>): Promise<void> {
    await this.loadImage(idleSrc);
    if (!emotions || Object.keys(emotions).length === 0) return;
    await Promise.all(
      Object.entries(emotions).map(([emotion, src]) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.emotionImages.set(emotion, img);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load emotion image: ${emotion}`);
            resolve(); // don't fail on missing images
          };
          img.src = src;
        });
      })
    );
  }

  /** Switch displayed image by emotion key. Pass '' to revert to default. */
  setEmotion(emotion: string) {
    if (!emotion || emotion === 'idle') {
      this.currentEmotion = '';
      return;
    }
    if (this.emotionImages.has(emotion)) {
      this.currentEmotion = emotion;
    }
  }

  /** Set target display width for image characters */
  setImageDisplayWidth(w: number) {
    this.imageDisplayWidth = w;
    if (this.isImageMode) {
      this.resizeForImage();
    }
  }

  /** Check if currently in image rendering mode */
  get isInImageMode(): boolean {
    return this.isImageMode;
  }

  /** Clear and draw background + character */
  draw(frame: FrameData) {
    if (this.isImageMode && this.image) {
      this.drawImageFrame(frame);
      return;
    }
    this.drawPixelFrame(frame);
  }

  /** Draw image-based character with offset animation */
  private drawImageFrame(frame: FrameData) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Pick the active image: emotion override or default
    const img = (this.currentEmotion && this.emotionImages.get(this.currentEmotion)) || this.image;

    ctx.save();
    // Apply animation offsets
    ctx.translate(frame.offsetX, frame.offsetY);
    if (img) ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  /** Draw pixel grid character (original logic) */
  private drawPixelFrame(frame: FrameData) {
    const { grid, offsetX, offsetY } = frame;
    if (!grid) return;
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
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }
}
