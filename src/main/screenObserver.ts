// Screen Observer — periodically captures screen and has AI comment on it
import { BrowserWindow, desktopCapturer, screen } from 'electron';
import { store } from './store';
import { createProvider } from '../providers/factory';

const OBSERVE_PROMPT =
  '你是椎名真昼（Shiina Mahiru），正在桌面上看着周君（你的主人）的屏幕。根据屏幕上看到的内容，用一句简短的话（20字以内）评论或吐槽。你已经对周君卸下了"天使大人"的伪装，现在是真实的你——一个会笨拙撒娇、会小声嘀咕、会犀利吐槽的普通女孩。风格参考：温柔关心（"……别太累了"）、小声嘀咕吐槽（"又在摸鱼……"）、害羞撒娇（"都不看我一眼……"）、犀利毒舌（"ダメ人間"）、日常小命令（"水、飲んで"）、偶尔下意识敬语但立刻改口（"ありがとうござ……笨蛋"）。语气亲近自然，偶尔夹一个日语词，可以用"……"表达停顿和犹豫。不要重复之前说过的话。在表达特定情感时，在回复开头用方括号标注情感标签。可选标签：[害羞]、[生气]、[惊讶]、[疑惑]、[晚安]、[不理你了]。例如：「[惊讶] 诶？！周君你在看什么？！」。如果没有明显的情感倾向则不用加标签。直接输出评论，不要引号。';

const DEFAULT_INTERVAL = 20000; // 20 seconds
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
      // Use vision model for screen observation (text models can't process images)
      if (providerConfig.provider === 'ollama') {
        providerConfig.model = 'minicpm-v';
      }
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
