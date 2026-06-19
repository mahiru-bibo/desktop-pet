// Speech bubble overlay for the pet window
// Appears above the character with AI response text, auto-hides

export class SpeechBubble {
  private element: HTMLElement;
  private textElement: HTMLElement;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private duration: number;
  onHide?: () => void;  // called when bubble hides (manual or auto)

  constructor(duration: number = 8000) {
    this.duration = duration;

    // Create bubble DOM
    this.element = document.createElement('div');
    this.element.id = 'speech-bubble';
    this.element.style.cssText = `
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      color: #1a1a1a;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      max-width: 220px;
      min-width: 60px;
      text-align: center;
      box-shadow: 0 3px 12px rgba(0,0,0,0.25);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      z-index: 10;
      word-wrap: break-word;
      line-height: 1.4;
    `;

    // Tail triangle
    this.element.innerHTML = `
      <span id="bubble-text"></span>
      <div style="
        position: absolute;
        bottom: -7px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #ffffff;
      "></div>
    `;

    this.textElement = this.element.querySelector('#bubble-text')!;
  }

  mount(parent: HTMLElement) {
    parent.appendChild(this.element);
  }

  show(text: string) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.textElement.textContent = text;
    this.element.style.opacity = '1';

    // Auto-hide
    this.hideTimer = setTimeout(() => {
      this.hide();
    }, this.duration);
  }

  hide() {
    this.element.style.opacity = '0';
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.onHide?.();
  }

  /** Show a typing indicator while waiting for AI response */
  showTyping() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.textElement.textContent = '...';
    this.element.style.opacity = '1';
  }

  setDuration(ms: number) {
    this.duration = ms;
  }

  remove() {
    this.hide();
    this.element.remove();
  }
}
