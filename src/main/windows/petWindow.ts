// Pet overlay window — frameless, transparent, always-on-top

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { store } from '../store';

export function createPetWindow(): BrowserWindow {
  const scale = store.get('pixelScale');
  const pos = store.get('petPosition');
  const canvasSize = 32 * scale; // 32 grid * scale

  const win = new BrowserWindow({
    width: canvasSize,
    height: canvasSize + 40, // extra 40px for speech bubble space
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/petPreload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Ensure window stays within screen bounds
  win.on('moved', () => {
    const [x, y] = win.getPosition();
    const display = screen.getDisplayNearestPoint({ x, y });
    const bounds = display.workArea;

    // Clamp if too far off-screen (keep at least 50px visible)
    const clampedX = Math.max(bounds.x - win.getBounds().width + 50,
      Math.min(bounds.x + bounds.width - 50, x));
    const clampedY = Math.max(bounds.y,
      Math.min(bounds.y + bounds.height - 50, y));

    if (clampedX !== x || clampedY !== y) {
      win.setPosition(clampedX, clampedY);
    }
  });

  // Load the pet renderer
  win.loadFile(path.join(__dirname, '../../renderer/pet/index.html'));

  // Prevent title from showing
  win.setTitle('Desktop Pet');

  return win;
}

const CHAT_BAR_HEIGHT = 48;

export function setChatPanelVisible(win: BrowserWindow, visible: boolean) {
  const bounds = win.getBounds();
  if (visible) {
    win.setSize(bounds.width, bounds.height + CHAT_BAR_HEIGHT);
  } else {
    win.setSize(bounds.width, bounds.height - CHAT_BAR_HEIGHT);
  }
}
