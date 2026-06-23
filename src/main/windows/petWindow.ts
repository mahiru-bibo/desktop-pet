// Pet overlay window — frameless, transparent, always-on-top

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { store } from '../store';

const CHAT_BAR_HEIGHT = 48;

let expectedWidth = 0;
let expectedBaseHeight = 0;
let chatPanelVisible = false;

function getExpectedHeight(): number {
  return expectedBaseHeight + (chatPanelVisible ? CHAT_BAR_HEIGHT : 0);
}

export function enforcePetSize(win: BrowserWindow) {
  const h = getExpectedHeight();
  if (h <= 0 || expectedWidth <= 0) return;
  const [cw, ch] = win.getSize();
  if (cw !== expectedWidth || ch !== h) {
    win.setSize(expectedWidth, h);
  }
}

export function createPetWindow(): BrowserWindow {
  const scale = store.get('pixelScale');
  const rawPos = store.get('petPosition');
  const canvasSize = 32 * scale;

  expectedWidth = canvasSize;
  expectedBaseHeight = canvasSize + 40;

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const pos = {
    x: Math.max(workArea.x - expectedWidth + 50, Math.min(workArea.x + workArea.width - 50, rawPos.x)),
    y: Math.max(workArea.y, Math.min(workArea.y + workArea.height - 50, rawPos.y)),
  };

  const win = new BrowserWindow({
    width: expectedWidth,
    height: getExpectedHeight(),
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    hasShadow: false,
    titleBarOverlay: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../../preload/petPreload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Forward renderer console to main process for debugging
  // MUST be registered before loadFile to catch early logs
  win.webContents.on('console-message', (_event, _level, message) => {
    console.log('[Renderer]', message);
  });

  win.loadFile(path.join(__dirname, '../../renderer/pet/index.html'));

  // Prevent the HTML document.title from setting the window title
  win.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  // Debounced size enforcement on move — prevents DWM title bar
  // from fighting with enforcePetSize during continuous drag.
  // Enforcement runs 150ms after the LAST move event.
  let moveEnforceTimer: ReturnType<typeof setTimeout> | null = null;
  win.on('moved', () => {
    const [x, y] = win.getPosition();
    store.set('petPosition', { x, y });

    // Debounce: only enforce size after moves settle
    if (moveEnforceTimer) clearTimeout(moveEnforceTimer);
    moveEnforceTimer = setTimeout(() => {
      enforcePetSize(win);
      moveEnforceTimer = null;
    }, 150);
  });

  // Debounced size enforcement on resize — prevents DWM from fighting
  // during drag. Uses the same timer as moved to coalesce events.
  win.on('resize', () => {
    if (moveEnforceTimer) clearTimeout(moveEnforceTimer);
    moveEnforceTimer = setTimeout(() => {
      enforcePetSize(win);
      moveEnforceTimer = null;
    }, 150);
  });

  // Also enforce size when window gains focus (DWM may resize).
  // Delay to avoid interfering with click detection in renderer.
  win.on('focus', () => {
    setTimeout(() => enforcePetSize(win), 200);
  });

  return win;
}

export function isChatPanelVisible(): boolean {
  return chatPanelVisible;
}

export function setChatPanelVisible(win: BrowserWindow, visible: boolean) {
  if (chatPanelVisible === visible) return;
  chatPanelVisible = visible;
  win.setSize(expectedWidth, getExpectedHeight());
}

export function updateExpectedSize(width: number, height: number, win: BrowserWindow) {
  expectedWidth = width;
  expectedBaseHeight = height + 40;
  win.setSize(expectedWidth, getExpectedHeight());
}
