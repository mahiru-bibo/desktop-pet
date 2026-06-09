// Chat window — standard window for chatting with the pet

import { BrowserWindow } from 'electron';
import * as path from 'path';

let chatWindow: BrowserWindow | null = null;

export function createChatWindow(): BrowserWindow {
  if (chatWindow && !chatWindow.isDestroyed()) {
    return chatWindow;
  }

  chatWindow = new BrowserWindow({
    width: 420,
    height: 600,
    minWidth: 320,
    minHeight: 400,
    show: false,
    title: '💬 桌宠聊天',
    webPreferences: {
      preload: path.join(__dirname, '../../preload/chatPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  chatWindow.loadFile(path.join(__dirname, '../../renderer/chat/index.html'));

  chatWindow.on('close', (e) => {
    // Hide instead of close — keep chat history
    e.preventDefault();
    chatWindow?.hide();
  });

  chatWindow.on('closed', () => {
    chatWindow = null;
  });

  return chatWindow;
}

export function getChatWindow(): BrowserWindow | null {
  if (chatWindow && !chatWindow.isDestroyed()) {
    return chatWindow;
  }
  return null;
}
