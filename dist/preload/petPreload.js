"use strict";
// Preload script for the pet window
// Exposes safe IPC methods to the renderer via contextBridge
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Move the pet window by delta
    moveWindow: (dx, dy) => {
        electron_1.ipcRenderer.send('pet:move-window', { dx, dy });
    },
    savePosition: () => {
        electron_1.ipcRenderer.send('pet:save-position');
    },
    resizeWindow: (width, height) => {
        electron_1.ipcRenderer.send('pet:resize-window', { width, height });
    },
    // Toggle chat bar in pet window (resize)
    toggleChat: (show) => {
        electron_1.ipcRenderer.send('pet:toggle-chat', { show });
    },
    onSpeak: (callback) => {
        electron_1.ipcRenderer.on('pet:speak', (_event, text) => {
            callback(text);
        });
    },
    onSetAnimation: (callback) => {
        electron_1.ipcRenderer.on('pet:set-animation', (_event, state) => {
            callback(state);
        });
    },
    getSettings: () => {
        return electron_1.ipcRenderer.invoke('settings:get-pet');
    },
    // Chat API
    sendMessage: (text) => {
        return electron_1.ipcRenderer.invoke('chat:send-message', text);
    },
    onToggleChatFromTray: (callback) => {
        electron_1.ipcRenderer.on('pet:toggle-chat-from-tray', () => {
            callback();
        });
    },
});
//# sourceMappingURL=petPreload.js.map