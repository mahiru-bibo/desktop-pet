// Pet overlay window — frameless, transparent, always-on-top

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { store } from '../store';

const CHAT_BAR_HEIGHT = 48;

// Track the expected window dimensions so we can enforce them
// and prevent any unexpected size changes (e.g. during drag).
let expectedWidth = 0;
let expectedBaseHeight = 0;  // height without chat bar
let chatPanelVisible = false;

function getExpectedHeight(): number {
  return expectedBaseHeight + (chatPanelVisible ? CHAT_BAR_HEIGHT : 0);
}

function enforceSize(win: BrowserWindow) {
  const w = getExpectedHeight();
  if (w <= 0) return; // not initialized yet
  const [cw, ch] = win.getSize();
  if (cw !== expectedWidth || ch !== w) {
    win.setSize(expectedWidth, w);
  }
}

// Exported for use in IPC handlers — enforces size after each window move
export function enforcePetSize(win: BrowserWindow) {
  enforceSize(win);
}

export function createPetWindow(): BrowserWindow {
  const scale = store.get('pixelScale');
  const pos = store.get('petPosition');
  const canvasSize = 32 * scale; // 32 grid * scale

  expectedWidth = canvasSize;
  expectedBaseHeight = canvasSize + 40; // 40px for speech bubble space

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
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/petPreload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Enforce window size on every move — prevents the window from
  // growing unexpectedly during drag operations
  win.on('moved', () => {
    const [x, y] = win.getPosition();
    const display = screen.getDisplayNearestPoint({ x, y });
    const bounds = display.workArea;

    // Enforce correct window size (defensive against drag-growth bug)
    enforceSize(win);

    // Clamp if too far off-screen (keep at least 50px visible)
    const clampedX = Math.max(bounds.x - expectedWidth + 50,
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

export function isChatPanelVisible(): boolean {
  return chatPanelVisible;
}

export function setChatPanelVisible(win: BrowserWindow, visible: boolean) {
  if (chatPanelVisible === visible) return; // already in desired state
  chatPanelVisible = visible;

  // Use absolute target height instead of relative adjustment
  win.setSize(expectedWidth, getExpectedHeight());
}

/**
 * Update the expected base size (called when renderer loads image chars).
 * Preserves the current chat panel visibility state.
 */
export function updateExpectedSize(width: number, height: number, win: BrowserWindow) {
  expectedWidth = width;
  expectedBaseHeight = height + 40; // 40px for speech bubble space
  win.setSize(expectedWidth, getExpectedHeight());
}
