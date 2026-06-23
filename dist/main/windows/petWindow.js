"use strict";
// Pet overlay window — frameless, transparent, always-on-top
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
exports.enforcePetSize = enforcePetSize;
exports.createPetWindow = createPetWindow;
exports.isChatPanelVisible = isChatPanelVisible;
exports.setChatPanelVisible = setChatPanelVisible;
exports.updateExpectedSize = updateExpectedSize;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const store_1 = require("../store");
const CHAT_BAR_HEIGHT = 48;
let expectedWidth = 0;
let expectedBaseHeight = 0;
let chatPanelVisible = false;
function getExpectedHeight() {
    return expectedBaseHeight + (chatPanelVisible ? CHAT_BAR_HEIGHT : 0);
}
function enforcePetSize(win) {
    const h = getExpectedHeight();
    if (h <= 0 || expectedWidth <= 0)
        return;
    const [cw, ch] = win.getSize();
    if (cw !== expectedWidth || ch !== h) {
        win.setSize(expectedWidth, h);
    }
}
function createPetWindow() {
    const scale = store_1.store.get('pixelScale');
    const rawPos = store_1.store.get('petPosition');
    const canvasSize = 32 * scale;
    expectedWidth = canvasSize;
    expectedBaseHeight = canvasSize + 40;
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;
    const pos = {
        x: Math.max(workArea.x - expectedWidth + 50, Math.min(workArea.x + workArea.width - 50, rawPos.x)),
        y: Math.max(workArea.y, Math.min(workArea.y + workArea.height - 50, rawPos.y)),
    };
    const win = new electron_1.BrowserWindow({
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
    let moveEnforceTimer = null;
    win.on('moved', () => {
        const [x, y] = win.getPosition();
        store_1.store.set('petPosition', { x, y });
        // Debounce: only enforce size after moves settle
        if (moveEnforceTimer)
            clearTimeout(moveEnforceTimer);
        moveEnforceTimer = setTimeout(() => {
            enforcePetSize(win);
            moveEnforceTimer = null;
        }, 150);
    });
    // Debounced size enforcement on resize — prevents DWM from fighting
    // during drag. Uses the same timer as moved to coalesce events.
    win.on('resize', () => {
        if (moveEnforceTimer)
            clearTimeout(moveEnforceTimer);
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
function isChatPanelVisible() {
    return chatPanelVisible;
}
function setChatPanelVisible(win, visible) {
    if (chatPanelVisible === visible)
        return;
    chatPanelVisible = visible;
    win.setSize(expectedWidth, getExpectedHeight());
}
function updateExpectedSize(width, height, win) {
    expectedWidth = width;
    expectedBaseHeight = height + 40;
    win.setSize(expectedWidth, getExpectedHeight());
}
//# sourceMappingURL=petWindow.js.map