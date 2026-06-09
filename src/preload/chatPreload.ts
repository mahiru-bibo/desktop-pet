// Preload script for the chat window
// Exposes safe IPC methods to the renderer via contextBridge

import { contextBridge, ipcRenderer } from 'electron';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Send a chat message and get a response
  sendMessage: (text: string): Promise<ChatMessage> => {
    return ipcRenderer.invoke('chat:send-message', text);
  },

  // Get chat history
  getHistory: (): Promise<ChatMessage[]> => {
    return ipcRenderer.invoke('chat:get-history');
  },

  // Clear chat history
  clearHistory: (): Promise<void> => {
    return ipcRenderer.invoke('chat:clear-history');
  },

  // Get settings
  getSettings: (): Promise<{
    characterId: number;
    characterName: string;
    provider: string;
    model: string;
  }> => {
    return ipcRenderer.invoke('settings:get-chat');
  },

  // Listen for incoming messages from main process
  onResponse: (callback: (msg: ChatMessage) => void) => {
    ipcRenderer.on('chat:response', (_event, msg: ChatMessage) => {
      callback(msg);
    });
  },
});
