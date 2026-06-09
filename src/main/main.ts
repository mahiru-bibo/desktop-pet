// Electron main process entry point

import { app } from 'electron';
import { createPetWindow } from './windows/petWindow';
import { createChatWindow } from './windows/chatWindow';
import { createTray } from './tray';
import { registerIpcHandlers, setPetWindow, setChatWindow } from './ipc';

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on('second-instance', () => {
  // Focus existing instance's windows
});

app.whenReady().then(() => {
  // Create windows
  const petWin = createPetWindow();
  const chatWin = createChatWindow();

  // Register windows in IPC
  setPetWindow(petWin);
  setChatWindow(chatWin);

  // Register IPC handlers
  registerIpcHandlers();

  // System tray
  createTray(petWin, chatWin);

  // On Windows, clicking dock icon doesn't exist, but handle window-all-closed
  app.on('window-all-closed', () => {
    // Don't quit — tray keeps app alive
  });

  app.on('activate', () => {
    petWin.show();
  });

  console.log('Desktop Pet started! 🎀');
});

app.on('before-quit', () => {
  // Cleanup if needed
});
