// Electron main process entry point

import { app } from 'electron';
import * as path from 'path';
import { store } from './store';
import { createPetWindow } from './windows/petWindow';
import { createChatWindow } from './windows/chatWindow';
import { createTray, refreshTrayMenu, setObserverEnabled } from './tray';
import { registerIpcHandlers, setPetWindow, setChatWindow, setObserver } from './ipc';
import { ScreenObserver } from './screenObserver';

// Use local userData directory to avoid Windows cache permission issues
// MUST be called before store.init() so store uses the correct path
app.setPath('userData', path.join(__dirname, '../../userData'));
store.init();

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

  // Create screen observer
  const observer = new ScreenObserver();
  observer.setPetWindow(petWin);
  setObserver(observer);

  // Register IPC handlers
  registerIpcHandlers();

  // System tray — pass observer toggle callback
  createTray(petWin, chatWin, () => {
    const enabled = observer.toggle();
    setObserverEnabled(enabled);
    return enabled;
  });

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
