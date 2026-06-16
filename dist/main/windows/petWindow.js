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
exports.createPetWindow = createPetWindow;
exports.setChatPanelVisible = setChatPanelVisible;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const store_1 = require("../store");
function createPetWindow() {
    const scale = store_1.store.get('pixelScale');
    const pos = store_1.store.get('petPosition');
    const canvasSize = 32 * scale; // 32 grid * scale
    const win = new electron_1.BrowserWindow({
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
        const display = electron_1.screen.getDisplayNearestPoint({ x, y });
        const bounds = display.workArea;
        // Clamp if too far off-screen (keep at least 50px visible)
        const clampedX = Math.max(bounds.x - win.getBounds().width + 50, Math.min(bounds.x + bounds.width - 50, x));
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
const CHAT_BAR_HEIGHT = 48;
function setChatPanelVisible(win, visible) {
    const bounds = win.getBounds();
    if (visible) {
        win.setSize(bounds.width, bounds.height + CHAT_BAR_HEIGHT);
    }
    else {
        win.setSize(bounds.width, bounds.height - CHAT_BAR_HEIGHT);
    }
}
//# sourceMappingURL=petWindow.js.map