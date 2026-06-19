"use strict";
// Electron main process entry point
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const store_1 = require("./store");
const petWindow_1 = require("./windows/petWindow");
const chatWindow_1 = require("./windows/chatWindow");
const tray_1 = require("./tray");
const ipc_1 = require("./ipc");
const screenObserver_1 = require("./screenObserver");
// Use local userData directory to avoid Windows cache permission issues
// MUST be called before store.init() so store uses the correct path
electron_1.app.setPath('userData', path.join(__dirname, '../../userData'));
store_1.store.init();
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