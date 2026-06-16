// IPC handler registration
// All IPC channels are defined and handled here

import { ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import { store } from './store';
import { createProvider } from '../providers/factory';
import type { ChatMessage } from './store';
import { CHARACTERS } from '../renderer/shared/pixelMaps';
import { ScreenObserver } from './screenObserver';
import { setChatPanelVisible } from './windows/petWindow';

let petWindow: BrowserWindow | null = null;
let chatWindow: BrowserWindow | null = null;
let observer: ScreenObserver | null = null;

export function setPetWindow(win: BrowserWindow) {
  petWindow = win;
}

export function setChatWindow(win: BrowserWindow) {
  chatWindow = win;
}

export function setObserver(obs: ScreenObserver) {
  observer = obs;
}

export function registerIpcHandlers() {
  // ── Pet window movement ──
  ipcMain.on('pet:move-window', (_event, { dx, dy }: { dx: number; dy: number }) => {
    if (!petWindow) return;
    const [x, y] = petWindow.getPosition();
    petWindow.setPosition(x + dx, y + dy);
  });

  ipcMain.on('pet:resize-window', (_event, { width, height }: { width: number; height: number }) => {
    if (!petWindow) return;
    petWindow.setSize(width, height + 40); // 40px for speech bubble
  });

  ipcMain.on('pet:save-position', () => {
    if (!petWindow) return;
    const [x, y] = petWindow.getPosition();
    store.set('petPosition', { x, y });
  });

  // ── Open chat window ──
  ipcMain.on('pet:open-chat', () => {
    if (chatWindow) {
      if (chatWindow.isMinimized()) chatWindow.restore();
      chatWindow.show();
      chatWindow.focus();
    }
  });

  // ── Toggle chat bar in pet window ──
  ipcMain.on('pet:toggle-chat', (_event, { show }: { show: boolean }) => {
    if (!petWindow) return;
    setChatPanelVisible(petWindow, show);
  });

  // ── Settings (pet) ──
  ipcMain.handle('settings:get-pet', () => {
    const charId = store.get('characterId');
    const char = CHARACTERS.find(c => c.id === charId);
    let imageDataUrl: string | undefined;
    if (char?.imagePath) {
      try {
        const imgPath = path.join(__dirname, '../../', char.imagePath);
        const fs = require('fs');
        const imgData = fs.readFileSync(imgPath);
        const ext = path.extname(imgPath).slice(1).toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
        imageDataUrl = `data:${mime};base64,${imgData.toString('base64')}`;
      } catch (e) {
        console.error('Failed to load character image:', e);
      }
    }
    return {
      characterId: charId,
      pixelScale: store.get('pixelScale'),
      bubbleDuration: store.get('bubbleDuration'),
      imageDataUrl,
      imageDisplayWidth: char?.displayWidth ?? 200,
    };
  });

  // ── Settings (chat) ──
  ipcMain.handle('settings:get-chat', () => {
    const provider = store.get('provider');
    const charId = store.get('characterId');
    const char = CHARACTERS.find(c => c.id === charId);
    return {
      characterId: charId,
      characterName: char?.name || '女仆',
      provider: provider.provider,
      model: provider.model,
    };
  });

  // ── Chat messaging ──
  ipcMain.handle('chat:send-message', async (_event, text: string) => {
    try {
      const providerConfig = store.get('provider');
      const personalityPrompt = store.get('personalityPrompt');
      const history = store.get('chatHistory');

      // Build message array
      const messages = [
        { role: 'system' as const, content: personalityPrompt },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];

      // Save user message
      const userMsg: ChatMessage = {
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      history.push(userMsg);

      // Call LLM
      const provider = createProvider(providerConfig);
      const response = await provider.sendMessage(messages, providerConfig);

      // Save assistant response
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      history.push(assistantMsg);
      store.set('chatHistory', history);

      // Send response to chat window
      if (chatWindow && !chatWindow.isDestroyed()) {
        chatWindow.webContents.send('chat:response', assistantMsg);
      }

      // Send speech bubble to pet window
      if (petWindow && !petWindow.isDestroyed()) {
        petWindow.webContents.send('pet:speak', response);
      }

      return assistantMsg;
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: `(错误: ${error.message || '无法连接到模型'})`,
        timestamp: Date.now(),
      };
      return errorMsg;
    }
  });

  // ── Chat history ──
  ipcMain.handle('chat:get-history', () => {
    return store.get('chatHistory');
  });

  ipcMain.handle('chat:clear-history', () => {
    store.set('chatHistory', []);
  });

  // ── Screen observer ──
  ipcMain.handle('screen-observe:toggle', () => {
    if (!observer) return { enabled: false };
    const enabled = observer.toggle();
    return { enabled };
  });

  ipcMain.handle('screen-observe:status', () => {
    return { enabled: observer?.isEnabled() ?? false };
  });
}
