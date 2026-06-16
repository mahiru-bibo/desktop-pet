"use strict";
// Electron main process entry point
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const petWindow_1 = require("./windows/petWindow");
const chatWindow_1 = require("./windows/chatWindow");
const tray_1 = require("./tray");
const ipc_1 = require("./ipc");
const screenObserver_1 = require("./screenObserver");
// Prevent multiple instances
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
electron_1.app.on('second-instance', () => {
    // Focus existing instance's windows
});
electron_1.app.whenReady().then(() => {
    // Create windows
    const petWin = (0, petWindow_1.createPetWindow)();
    const chatWin = (0, chatWindow_1.createChatWindow)();
    // Register windows in IPC
    (0, ipc_1.setPetWindow)(petWin);
    (0, ipc_1.setChatWindow)(chatWin);
    // Create screen observer
    const observer = new screenObserver_1.ScreenObserver();
    observer.setPetWindow(petWin);
    (0, ipc_1.setObserver)(observer);
    // Register IPC handlers
    (0, ipc_1.registerIpcHandlers)();
    // System tray — pass observer toggle callback
    (0, tray_1.createTray)(petWin, chatWin, () => {
        const enabled = observer.toggle();
        (0, tray_1.setObserverEnabled)(enabled);
        return enabled;
    });
    // On Windows, clicking dock icon doesn't exist, but handle window-all-closed
    electron_1.app.on('window-all-closed', () => {
        // Don't quit — tray keeps app alive
    });
    electron_1.app.on('activate', () => {
        petWin.show();
    });
    console.log('Desktop Pet started! 🎀');
});
electron_1.app.on('before-quit', () => {
    // Cleanup if needed
});
//# sourceMappingURL=main.js.map