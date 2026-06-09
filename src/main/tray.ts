// System tray icon and context menu

import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import * as path from 'path';
import { getChatWindow } from './windows/chatWindow';

let tray: Tray | null = null;

export function createTray(petWindow: BrowserWindow, chatWindow: BrowserWindow): Tray {
  // Create a simple 16x16 tray icon programmatically (green pixel character face)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,' +
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAMlJREFUWEftlrENwjAURc8fBaJg' +
    'BEZgBEZgBEZgBDo6OkZgBEZgBDpgBDpgBDpgBBo6CiQUJThxbMfYTqzo/9LX9/3vZyuABw4c4B+AjlLOAN4AvgB8Adq2XcUY' +
    'nwFsAJwBqGl6CwFSSlsAD0rpCcDGGFe7BQBQCoAFABtj3NVaF0rpI4AXANZaF2YIMQDaOl8AbgBQSmFKKTjnWgAKIYSU0kop' +
    'x5xzE93BdV0PDAaDJIAQYg5gDmARQhgjIAeQYzO/w/3fe/+ZfW8/gG8EAPh3HgD6KxiFAAAAAElFTkSuQmCC'
  );

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Desktop Pet 🎀');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏宠物',
      click: () => {
        if (petWindow.isVisible()) {
          petWindow.hide();
        } else {
          petWindow.show();
        }
      },
    },
    {
      label: '打开聊天',
      click: () => {
        const cw = getChatWindow() || chatWindow;
        cw.show();
        cw.focus();
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        // Actually quit
        const { app } = require('electron');
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click tray icon to show pet
  tray.on('double-click', () => {
    petWindow.show();
    petWindow.focus();
  });

  return tray;
}
