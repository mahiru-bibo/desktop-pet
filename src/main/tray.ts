// System tray icon and context menu

import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';

let tray: Tray | null = null;
let _observerEnabled = false;
let _onToggleObserver: (() => boolean) | null = null;

// Base64 tray icon
const TRAY_ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAMlJREFUWEftlrENwjAURc8fBaJg' +
  'BEZgBEZgBEZgBDo6OkZgBEZgBDpgBDpgBDpgBBo6CiQUJThxbMfYTqzo/9LX9/3vZyuABw4c4B+AjlLOAN4AvgB8Adq2XcUY' +
  'nwFsAJwBqGl6CwFSSlsAD0rpCcDGGFe7BQBQCoAFABtj3NVaF0rpI4AXANZaF2YIMQDaOl8AbgBQSmFKKTjnWgAKIYSU0kop' +
  'x5xzE93BdV0PDAaDJIAQYg5gDmARQhgjIAeQYzO/w/3fe/+ZfW8/gG8EAPh3HgD6KxiFAAAAAElFTkSuQmCC';

function buildMenu(petWindow: BrowserWindow, chatWindow: BrowserWindow): Menu {
  return Menu.buildFromTemplate([
    {
      label: '显示/隐藏宠物',
      click: () => {
        if (petWindow.isVisible()) petWindow.hide();
        else petWindow.show();
      },
    },
    {
      label: '打开聊天',
      click: () => {
        petWindow.webContents.send('pet:toggle-chat-from-tray');
      },
    },
    { type: 'separator' },
    {
      label: '观察屏幕',
      type: 'checkbox',
      checked: _observerEnabled,
      click: (menuItem) => {
        if (_onToggleObserver) {
          const enabled = _onToggleObserver();
          _observerEnabled = enabled;
          menuItem.checked = enabled;
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => { require('electron').app.exit(0); },
    },
  ]);
}

export function createTray(
  petWindow: BrowserWindow,
  chatWindow: BrowserWindow,
  onToggleObserver?: () => boolean,
): Tray {
  if (onToggleObserver) _onToggleObserver = onToggleObserver;

  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_B64}`);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Desktop Pet 🎀');

  const menu = buildMenu(petWindow, chatWindow);
  tray.setContextMenu(menu);

  tray.on('double-click', () => {
    petWindow.show();
    petWindow.focus();
  });

  return tray;
}

export function refreshTrayMenu(petWindow: BrowserWindow, chatWindow: BrowserWindow) {
  if (tray) {
    tray.setContextMenu(buildMenu(petWindow, chatWindow));
  }
}

export function setObserverEnabled(enabled: boolean) {
  _observerEnabled = enabled;
}
