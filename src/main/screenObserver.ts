// Screen Observer — periodically captures screen and has AI comment on it
import { BrowserWindow, desktopCapturer, screen } from 'electron';
import { store } from './store';
import { createProvider } from '../providers/factory';

const OBSERVE_PROMPT =
  '你是一只可爱的桌面宠物，正在观察主人的屏幕。根据屏幕上看到的内容，用一句简短可爱的话（20字以内）评论或吐槽。语气要萌，可以加颜文字。不要重复之前说过的话。直接输出评论，不要引号。';

const DEFAULT_INTERVAL = 60000; // 60 seconds
const FIRST_OBSERVE_DELAY = 3000; // 3 seconds after toggle

export class ScreenObserver {
  private petWindow: BrowserWindow | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;
  private interval: number;
  private lastComments: string[] = []; // avoid repeats
  private running = false; // prevent concurrent observations

  constructor(interval: number = DEFAULT_INTERVAL) {
    this.interval = interval;
  }

  setPetWindow(win: BrowserWindow) {
    this.petWindow = win;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      // Check API key before starting (ollama doesn't need one)
      const providerConfig = store.get('provider');
      if (this.needsApiKey(providerConfig)) {
        console.log('[Observer] Cannot start — no API key configured');
        this.enabled = false;
        if (this.petWindow && !this.petWindow.isDestroyed()) {
          this.petWindow.webContents.send('pet:speak', '请先配置 API Key 再开启屏幕观察哦～(◕‿◕)');
        }
        return false;
      }
      console.log('[Observer] Started — first observation in', FIRST_OBSERVE_DELAY / 1000, 's');
      this.scheduleNext(FIRST_OBSERVE_DELAY);
    } else {
      console.log('[Observer] Stopped');
      this.cancelTimer();
      this.running = false;
    }
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private cancelTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(delay: number) {
    this.cancelTimer();
    this.timer = setTimeout(() => this.observe(), delay);
  }

  private async observe() {
    if (!this.enabled || !this.petWindow) return;
    if (this.running) {
      // Still processing previous observation — skip and retry later
      this.scheduleNext(this.interval);
      return;
    }

    this.running = true;
    try {
      const imageBase64 = await this.captureScreen();
      if (!imageBase64) {
        console.error('[Observer] Failed to capture screen');
        this.scheduleNext(this.interval);
        return;
      }

      const providerConfig = store.get('provider');
      if (this.needsApiKey(providerConfig)) {
        // No API key configured — stop observer and notify user
        console.log('[Observer] No API key configured — stopping observer');
        this.enabled = false;
        if (this.petWindow && !this.petWindow.isDestroyed()) {
          this.petWindow.webContents.send('pet:speak', '请先配置 API Key 再开启屏幕观察哦～(◕‿◕)');
        }
        return;
      }

      const provider = createProvider(providerConfig);
      if (!provider.visionMessage) {
        console.error('[Observer] Current provider does not support vision');
        this.scheduleNext(this.interval);
        return;
      }

      console.log('[Observer] Captured screen, sending to AI...');
      const comment = await provider.visionMessage(
        imageBase64,
        'image/jpeg',
        OBSERVE_PROMPT,
        providerConfig
      );

      // Clean and send to pet window
      const cleanComment = comment
        .replace(/^["'「『]|["'」』]$/g, '')
        .trim()
        .slice(0, 80); // cap length

      if (cleanComment && !this.petWindow.isDestroyed()) {
        // Show window if hidden so user can see the comment
        if (!this.petWindow.isVisible()) {
          console.log('[Observer] Pet window hidden, showing it for comment');
          this.petWindow.show();
        }
        this.petWindow.webContents.send('pet:speak', cleanComment);
        console.log('[Observer] Comment:', cleanComment);
      }

      // Schedule next
      this.scheduleNext(this.interval);
    } catch (error: any) {
      console.error('[Observer] Error:', error.message || error);
      this.scheduleNext(this.interval);
    } finally {
      this.running = false;
    }
  }

  private async captureScreen(): Promise<string | null> {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: Math.min(width, 1280), height: Math.min(height, 720) },
        fetchWindowIcons: false,
      });

      if (sources.length === 0) return null;

      // Use the primary screen source
      const source = sources[0];
      const image = source.thumbnail;
      if (!image) return null;

      // Convert to JPEG buffer then base64
      const jpegBuffer = image.toJPEG(70); // quality 70 for smaller size
      const base64 = jpegBuffer.toString('base64');
      console.log('[Observer] Screenshot:', jpegBuffer.length, 'bytes JPEG');
      return base64;
    } catch (error) {
      console.error('[Observer] Capture error:', error);
      return null;
    }
  }

  /** Check if the current provider requires an API key */
  private needsApiKey(config: { provider: string; apiKey: string }): boolean {
    return config.provider !== 'ollama' && !config.apiKey;
  }

  setInterval(ms: number) {
    this.interval = ms;
  }
}
