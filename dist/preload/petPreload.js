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
    // Save current window position to store
    savePosition: () => {
        electron_1.ipcRenderer.send('pet:save-position');
    },
    // Resize pet window to fit image
    resizeWindow: (width, height) => {
        electron_1.ipcRenderer.send('pet:resize-window', { width, height });
    },
    // Open the chat window
    openChat: () => {
        electron_1.ipcRenderer.send('pet:open-chat');
    },
    // Listen for speak events (AI response ready)
    onSpeak: (callback) => {
        electron_1.ipcRenderer.on('pet:speak', (_event, text) => {
            callback(text);
        });
    },
    // Listen for animation change events
    onSetAnimation: (callback) => {
        electron_1.ipcRenderer.on('pet:set-animation', (_event, state) => {
            callback(state);
        });
    },
    // Get settings from main process
    getSettings: () => {
        return electron_1.ipcRenderer.invoke('settings:get-pet');
    },
});
//# sourceMappingURL=petPreload.js.map