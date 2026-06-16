// Chat window entry point
// Handles: sending messages, displaying message list, loading history

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// Injected by chatPreload.ts via contextBridge
interface ChatElectronAPI {
  sendMessage: (text: string) => Promise<ChatMessage>;
  getHistory: () => Promise<ChatMessage[]>;
  clearHistory: () => Promise<void>;
  getSettings: () => Promise<{
    characterId: number;
    characterName: string;
    provider: string;
    model: string;
  }>;
  onResponse: (callback: (msg: ChatMessage) => void) => void;
}

declare const electronAPI: ChatElectronAPI;

class ChatApp {
  private messageList!: HTMLElement;
  private input!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;
  private headerName!: HTMLElement;
  private headerEmoji!: HTMLElement;

  async init() {
    this.messageList = document.getElementById('message-list')!;
    this.input = document.getElementById('chat-input') as HTMLInputElement;
    this.sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    this.headerName = document.getElementById('char-name')!;
    this.headerEmoji = document.getElementById('char-emoji')!;

    // Load settings for header
    try {
      const settings = await electronAPI.getSettings();
      this.headerEmoji.textContent = '🌸';
      this.headerName.textContent = `${settings.characterName} · ${settings.model}`;
    } catch (_) {
      // defaults
    }

    // Listen for incoming messages
    electronAPI.onResponse((msg: ChatMessage) => {
      if (msg.role === 'assistant') {
        this.addMessage(msg);
        this.sendBtn.disabled = false;
        this.input.disabled = false;
        this.input.focus();
      }
    });

    // Send button
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Clear button
    const clearBtn = document.getElementById('clear-btn')!;
    clearBtn.addEventListener('click', async () => {
      await electronAPI.clearHistory();
      this.messageList.innerHTML = '';
      this.showWelcome();
    });

    // Load history
    await this.loadHistory();

    // Focus input
    this.input.focus();
  }

  private async loadHistory() {
    try {
      const history = await electronAPI.getHistory();
      if (!history || history.length === 0) {
        this.showWelcome();
        return;
      }
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          this.addMessage(msg);
        }
      }
    } catch (_) {
      this.showWelcome();
    }
  }

  private async sendMessage() {
    const text = this.input.value.trim();
    if (!text) return;

    // Add user message to UI
    this.addMessage({ role: 'user', content: text, timestamp: Date.now() });
    this.input.value = '';
    this.sendBtn.disabled = true;
    this.input.disabled = true;

    // Show typing indicator
    const typingEl = this.addTypingIndicator();

    try {
      const response = await electronAPI.sendMessage(text);
      // Remove typing indicator
      typingEl?.remove();
      // Response will come through onResponse callback
    } catch (error: any) {
      typingEl?.remove();
      this.addMessage({
        role: 'assistant',
        content: `发送失败: ${error.message || '未知错误'}`,
        timestamp: Date.now(),
      });
      this.sendBtn.disabled = false;
      this.input.disabled = false;
      this.input.focus();
    }
  }

  private addMessage(msg: ChatMessage) {
    const el = document.createElement('div');
    el.className = `message ${msg.role}`;

    let html = '';

    if (msg.role === 'assistant') {
      html += `<div class="role-label">🐾 宠物</div>`;
    }

    html += `<div>${this.escapeHtml(msg.content)}</div>`;

    if (msg.timestamp) {
      const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      html += `<div class="time">${time}</div>`;
    }

    el.innerHTML = html;
    this.messageList.appendChild(el);
    this.scrollToBottom();
  }

  private addTypingIndicator(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'message assistant';
    el.innerHTML = '<div class="role-label">🐾 宠物</div><div>正在思考...</div>';
    this.messageList.appendChild(el);
    this.scrollToBottom();
    return el;
  }

  private showWelcome() {
    const el = document.createElement('div');
    el.className = 'welcome';
    el.innerHTML = `
      👋 你好呀！<br>
      我是你的桌面宠物～<br>
      和我聊聊天吧！<br>
      <small style="color:#555">（需要先在设置中配置 API Key）</small>
    `;
    this.messageList.appendChild(el);
  }

  private scrollToBottom() {
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

const app = new ChatApp();
app.init().catch(console.error);
