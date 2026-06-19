// Preload script for the pet window
// Exposes safe IPC methods to the renderer via contextBridge

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Move the pet window by delta
  moveWindow: (dx: number, dy: number) => {
    ipcRenderer.send('pet:move-window', { dx, dy });
  },

  savePosition: () => {
    ipcRenderer.send('pet:save-position');
  },

  resizeWindow: (width: number, height: number) => {
    ipcRenderer.send('pet:resize-window', { width, height });
  },

  // Toggle chat bar in pet window (resize)
  toggleChat: (show: boolean) => {
    ipcRenderer.send('pet:toggle-chat', { show });
  },

  onSpeak: (callback: (text: string) => void) => {
    ipcRenderer.on('pet:speak', (_event, text: string) => {
      callback(text);
    });
  },

  onSetAnimation: (callback: (state: string) => void) => {
    ipcRenderer.on('pet:set-animation', (_event, state: string) => {
      callback(state);
    });
  },

  getSettings: (): Promise<{
    characterId: number;
    pixelScale: number;
    bubbleDuration: number;
    imageDataUrl?: string;
    imageDisplayWidth?: number;
    emotionDataUrls?: Record<string, string>;
  }> => {
    return ipcRenderer.invoke('settings:get-pet');
  },

  // Chat API
  sendMessage: (text: string): Promise<any> => {
    return ipcRenderer.invoke('chat:send-message', text);
  },

  onToggleChatFromTray: (callback: () => void) => {
    ipcRenderer.on('pet:toggle-chat-from-tray', () => {
      callback();
    });
  },
});
