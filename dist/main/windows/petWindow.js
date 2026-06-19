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
// Track the expected window dimensions so we can enforce them
// and prevent any unexpected size changes (e.g. during drag).
let expectedWidth = 0;
let expectedBaseHeight = 0; // height without chat bar
let chatPanelVisible = false;
function getExpectedHeight() {
    return expectedBaseHeight + (chatPanelVisible ? CHAT_BAR_HEIGHT : 0);
}
function enforceSize(win) {
    const w = getExpectedHeight();
    if (w <= 0)
        return; // not initialized yet
    const [cw, ch] = win.getSize();
    if (cw !== expectedWidth || ch !== w) {
        win.setSize(expectedWidth, w);
    }
}
// Exported for use in IPC handlers — enforces size after each window move
function enforcePetSize(win) {
    enforceSize(win);
}
function createPetWindow() {
    const scale = store_1.store.get('pixelScale');
    const rawPos = store_1.store.get('petPosition');
    const canvasSize = 32 * scale; // 32 grid * scale
    expectedWidth = canvasSize;
    expectedBaseHeight = canvasSize + 40; // 40px for speech bubble space
    // Clamp position to current screen bounds (defensive against disconnected monitors)
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
        const display = electron_1.screen.getDisplayNearestPoint({ x, y });
        const bounds = display.workArea;
        // Enforce correct window size (defensive against drag-growth bug)
        enforceSize(win);
        // Clamp if too far off-screen (keep at least 50px visible)
        const clampedX = Math.max(bounds.x - expectedWidth + 50, Math.min(bounds.x + bounds.width - 50, x));
        const clampedY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - 50, y));
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
function isChatPanelVisible() {
    return chatPanelVisible;
}
function setChatPanelVisible(win, visible) {
    if (chatPanelVisible === visible)
        return; // already in desired state
    chatPanelVisible = visible;
    // Use absolute target height instead of relative adjustment
    win.setSize(expectedWidth, getExpectedHeight());
}
/**
 * Update the expected base size (called when renderer loads image chars).
 * Preserves the current chat panel visibility state.
 */
function updateExpectedSize(width, height, win) {
    expectedWidth = width;
    expectedBaseHeight = height + 40; // 40px for speech bubble space
    win.setSize(expectedWidth, getExpectedHeight());
}
//# sourceMappingURL=petWindow.js.map