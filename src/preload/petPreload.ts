// Preload script for the pet window
// Exposes safe IPC methods to the renderer via contextBridge

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Move the pet window by delta
  moveWindow: (dx: number, dy: number) => {
    ipcRenderer.send('pet:move-window', { dx, dy });
  },

  // Save current window position to store
  savePosition: () => {
    ipcRenderer.send('pet:save-position');
  },

  // Open the chat window
  openChat: () => {
    ipcRenderer.send('pet:open-chat');
  },

  // Listen for speak events (AI response ready)
  onSpeak: (callback: (text: string) => void) => {
    ipcRenderer.on('pet:speak', (_event, text: string) => {
      callback(text);
    });
  },

  // Listen for animation change events
  onSetAnimation: (callback: (state: string) => void) => {
    ipcRenderer.on('pet:set-animation', (_event, state: string) => {
      callback(state);
    });
  },

  // Get settings from main process
  getSettings: (): Promise<{
    characterId: number;
    pixelScale: number;
    bubbleDuration: number;
  }> => {
    return ipcRenderer.invoke('settings:get-pet');
  },
});
