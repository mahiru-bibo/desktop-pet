// Pet window entry point
// Handles: drag-to-move, click-to-chat, animation loop, IPC events

import { CharacterRenderer, FrameData } from './renderer';
import { AnimationController, AnimationState } from './animations';
import { SpeechBubble } from './speechBubble';

// ── Electron API (from preload) ──
declare global {
  interface Window {
    electronAPI: {
      moveWindow: (dx: number, dy: number) => void;
      openChat: () => void;
      onSpeak: (callback: (text: string) => void) => void;
      onSetAnimation: (callback: (state: string) => void) => void;
      savePosition: () => void;
      getSettings: () => Promise<{
        characterId: number;
        pixelScale: number;
        bubbleDuration: number;
      }>;
    };
  }
}

// ── App ──
class PetApp {
  private renderer!: CharacterRenderer;
  private animCtrl!: AnimationController;
  private bubble!: SpeechBubble;
  private canvas!: HTMLCanvasElement;
  private container!: HTMLElement;

  // Drag
  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasMoved = false;
  private readonly DRAG_THRESHOLD = 3;

  // Animation
  private lastTime = 0;
  private rafId = 0;

  async init() {
    this.container = document.getElementById('pet-container')!;
    this.canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;
    if (!this.canvas || !this.container) throw new Error('Missing DOM elements');

    // Load settings
    let characterId = 0;
    let pixelScale = 8;
    let bubbleDuration = 8000;

    try {
      const settings = await window.electronAPI.getSettings();
      characterId = settings.characterId ?? 0;
      pixelScale = settings.pixelScale ?? 8;
      bubbleDuration = settings.bubbleDuration ?? 8000;
    } catch (_) {
      // Use defaults if IPC not yet available
    }

    // Setup renderer
    this.renderer = new CharacterRenderer(this.canvas, pixelScale);

    // Setup animation controller
    this.animCtrl = new AnimationController(characterId);

    // Setup speech bubble
    this.bubble = new SpeechBubble(bubbleDuration);
    this.bubble.mount(this.container);

    // Listen for speak events from main process
    window.electronAPI.onSpeak((text: string) => {
      this.animCtrl.setState('talk');
      this.bubble.show(text);
    });

    // Listen for animation changes
    window.electronAPI.onSetAnimation((state: string) => {
      this.animCtrl.setState(state as AnimationState);
    });

    // Setup input handlers
    this.setupDrag();
    this.setupClick();

    // Size the window to fit the canvas
    this.resizeWindow();

    // Start animation loop
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private resizeWindow() {
    const { width, height } = this.renderer.getSize();
    // Add extra space for speech bubble at top
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.container.style.width = width + 'px';
    this.container.style.height = (height + 40) + 'px'; // 40px for bubble space
  }

  // ── Drag ──

  private setupDrag() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.hasMoved = false;
      this.dragStartX = e.screenX;
      this.dragStartY = e.screenY;
      this.animCtrl.notifyInteraction();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const dx = e.screenX - this.dragStartX;
      const dy = e.screenY - this.dragStartY;

      if (Math.abs(dx) > this.DRAG_THRESHOLD || Math.abs(dy) > this.DRAG_THRESHOLD) {
        this.hasMoved = true;
      }

      if (this.hasMoved) {
        window.electronAPI.moveWindow(dx, dy);
        this.dragStartX = e.screenX;
        this.dragStartY = e.screenY;
        this.animCtrl.setState('walk');
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.dragging) {
        this.dragging = false;
        if (this.hasMoved) {
          this.animCtrl.setState('idle');
          window.electronAPI.savePosition();
        }
      }
    });
  }

  // ── Click ──

  private setupClick() {
    this.canvas.addEventListener('mouseup', () => {
      if (!this.hasMoved) {
        // It's a click, not a drag
        window.electronAPI.openChat();
      }
    });
  }

  // ── Animation Loop ──

  private loop = (time: number) => {
    const dt = time - this.lastTime;
    this.lastTime = time;

    // Cap delta to avoid spiral on tab-switch
    const clampedDt = Math.min(dt, 100);

    const frameData = this.animCtrl.tick(clampedDt);
    this.renderer.draw(frameData);

    this.rafId = requestAnimationFrame(this.loop);
  };
}

// ── Boot ──
const app = new PetApp();
app.init().catch(console.error);
