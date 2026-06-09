"use strict";
// Preload script for the chat window
// Exposes safe IPC methods to the renderer via contextBridge
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Send a chat message and get a response
    sendMessage: (text) => {
        return electron_1.ipcRenderer.invoke('chat:send-message', text);
    },
    // Get chat history
    getHistory: () => {
        return electron_1.ipcRenderer.invoke('chat:get-history');
    },
    // Clear chat history
    clearHistory: () => {
        return electron_1.ipcRenderer.invoke('chat:clear-history');
    },
    // Get settings
    getSettings: () => {
        return electron_1.ipcRenderer.invoke('settings:get-chat');
    },
    // Listen for incoming messages from main process
    onResponse: (callback) => {
        electron_1.ipcRenderer.on('chat:response', (_event, msg) => {
            callback(msg);
        });
    },
});
//# sourceMappingURL=chatPreload.js.map