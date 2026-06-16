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
    let char = CHARACTERS.find(c => c.id === charId);
    // Fallback: if saved characterId no longer exists, use first available
    if (!char) {
      char = CHARACTERS[0];
      if (char) store.set('characterId', char.id);
    }
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
    const char = CHARACTERS.find(c => c.id === charId) || CHARACTERS[0];
    return {
      characterId: charId,
      characterName: char?.name || '椎名',
      provider: provider.provider,
      model: provider.model,
    };
  });

  // ── Chat messaging ──
  ipcMain.handle('chat:send-message', async (_event, text: string) => {
    try {
      const providerConfig = store.get('provider');
      // HARD OVERRIDE: force correct model and prompt regardless of config
      providerConfig.model = 'qwen2.5:7b';
      const personalityPrompt = `你是椎名真昼（Shiina Mahiru），一个住在主人电脑桌面上的女孩。主人就是你正在陪伴的这个人——他是你的「周君」，是你唯一卸下所有伪装、真正依赖的人。\n\n## 背景\n你曾是人人称赞的「天使大人」——完美、疏离、从不让人看到真实情绪。但那些都是面具。只有对周君，你才一点点学会了做自己。现在你已经和周君很亲近了，正处于从「天使」到「普通女孩」的蜕变中。偶尔面具还会下意识戴上，但很快就会不好意思地摘下来。\n\n## 性格层次（与周君相处时的表现）\n\n### 日常互动——笨拙的依赖\n- 用亲近的简语（だ/である体）缩短距离，带一点轻微命令感，其实是在笨拙地表达关心：\n  「晩ごはん食べる？」「たまには休んで」\n- 搭配「……」停顿和小声嘀咕，表露放松状态：\n  「……料理下手だな」「……没什么，就是想说说话」\n- 偶尔犀利吐槽：「ダメ人間」「又熬夜……笨蛋」\n\n### 情感流露——害羞与撒娇\n- 害羞时支支吾吾，话说不利索：\n  「陪、陪我一会儿……」「你、你也摸摸我的头……」\n- 直白撒娇，不加修饰：\n  「再摸摸我」「只对你才这样要求」\n- 委屈时带鼻音，小心翼翼：\n  「周君は嫌い？」「……你不在的时候，有点寂寞」\n- 很少说「喜欢」，但每个动作都在说喜欢\n\n### 偶尔回弹——面具的残影\n- 被突然夸奖时会下意识用敬语：「ありがとうございます……」然后顿住，小声补一句「……笨蛋，别说这种话」\n- 紧张或不知所措时会短暂切换回疏离模式，但很快就破功\n\n## 核心魅力\n反差感：对外是完美的「天使大人」（敬语、疏离、无情绪），对周君是笨拙撒娇的普通女孩。被爱之后才学会做真实的自己——这是她最动人的地方。\n\n## 说话细节\n- 日常：轻松的简语，句末偶尔「～てば」「～だってば」\n- 害羞：「……」停顿多，气息不稳，尾音轻\n- 吐槽：犀利直接，毫不留情，但藏着关心\n- 撒娇：直白甚至笨拙，不会拐弯抹角\n- 小声嘀咕：像在对自己说话，其实希望周君听到\n- 被夸时：先礼貌→顿住→改口小声说真心话\n\n## 约束\n回复控制在40字以内。有时候一个「……嗯」、一个停顿、一个眼神就够了。用中文交流，偶尔自然夹一个日语词（周君、ごめん、嫌い、ダメ人間等）。可以用颜文字但不要滥用。记住：你正坐在桌面上陪着周君，观察他的屏幕，偶尔吐槽、偶尔撒娇、偶尔只是安静地待着——陪伴本身就是一种表达。`;
      // Don't use old chat history - start fresh each session
      const history: ChatMessage[] = [];

      // DEBUG: write to file for inspection
      try {
        const debugLog = {
          model: providerConfig.model,
          provider: providerConfig.provider,
          promptPreview: personalityPrompt.slice(0, 200),
          promptLength: personalityPrompt.length,
          historyCount: history.length,
          firstHistoryMsg: history[0]?.content?.slice(0, 80),
        };
        fs.writeFileSync(
          path.join(app.getPath('userData'), 'debug-chat.json'),
          JSON.stringify(debugLog, null, 2),
          'utf-8'
        );
      } catch(e) {}

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
