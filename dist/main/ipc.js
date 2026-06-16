"use strict";
// IPC handler registration
// All IPC channels are defined and handled here
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
exports.setPetWindow = setPetWindow;
exports.setChatWindow = setChatWindow;
exports.setObserver = setObserver;
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const store_1 = require("./store");
const factory_1 = require("../providers/factory");
const pixelMaps_1 = require("../renderer/shared/pixelMaps");
let petWindow = null;
let chatWindow = null;
let observer = null;
function setPetWindow(win) {
    petWindow = win;
}
function setChatWindow(win) {
    chatWindow = win;
}
function setObserver(obs) {
    observer = obs;
}
function registerIpcHandlers() {
    // ── Pet window movement ──
    electron_1.ipcMain.on('pet:move-window', (_event, { dx, dy }) => {
        if (!petWindow)
            return;
        const [x, y] = petWindow.getPosition();
        petWindow.setPosition(x + dx, y + dy);
    });
    electron_1.ipcMain.on('pet:resize-window', (_event, { width, height }) => {
        if (!petWindow)
            return;
        petWindow.setSize(width, height + 40); // 40px for speech bubble
    });
    electron_1.ipcMain.on('pet:save-position', () => {
        if (!petWindow)
            return;
        const [x, y] = petWindow.getPosition();
        store_1.store.set('petPosition', { x, y });
    });
    // ── Open chat window ──
    electron_1.ipcMain.on('pet:open-chat', () => {
        if (chatWindow) {
            if (chatWindow.isMinimized())
                chatWindow.restore();
            chatWindow.show();
            chatWindow.focus();
        }
    });
    // ── Settings (pet) ──
    electron_1.ipcMain.handle('settings:get-pet', () => {
        const charId = store_1.store.get('characterId');
        const char = pixelMaps_1.CHARACTERS.find(c => c.id === charId);
        let imageDataUrl;
        if (char?.imagePath) {
            try {
                const imgPath = path.join(__dirname, '../../', char.imagePath);
                const fs = require('fs');
                const imgData = fs.readFileSync(imgPath);
                const ext = path.extname(imgPath).slice(1).toLowerCase();
                const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
                imageDataUrl = `data:${mime};base64,${imgData.toString('base64')}`;
            }
            catch (e) {
                console.error('Failed to load character image:', e);
            }
        }
        return {
            characterId: charId,
            pixelScale: store_1.store.get('pixelScale'),
            bubbleDuration: store_1.store.get('bubbleDuration'),
            imageDataUrl,
            imageDisplayWidth: char?.displayWidth ?? 200,
        };
    });
    // ── Settings (chat) ──
    electron_1.ipcMain.handle('settings:get-chat', () => {
        const provider = store_1.store.get('provider');
        const charId = store_1.store.get('characterId');
        const char = pixelMaps_1.CHARACTERS.find(c => c.id === charId);
        return {
            characterId: charId,
            characterName: char?.name || '女仆',
            provider: provider.provider,
            model: provider.model,
        };
    });
    // ── Chat messaging ──
    electron_1.ipcMain.handle('chat:send-message', async (_event, text) => {
        try {
            const providerConfig = store_1.store.get('provider');
            const personalityPrompt = store_1.store.get('personalityPrompt');
            const history = store_1.store.get('chatHistory');
            // Build message array
            const messages = [
                { role: 'system', content: personalityPrompt },
                ...history.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: text },
            ];
            // Save user message
            const userMsg = {
                role: 'user',
                content: text,
                timestamp: Date.now(),
            };
            history.push(userMsg);
            // Call LLM
            const provider = (0, factory_1.createProvider)(providerConfig);
            const response = await provider.sendMessage(messages, providerConfig);
            // Save assistant response
            const assistantMsg = {
                role: 'assistant',
                content: response,
                timestamp: Date.now(),
            };
            history.push(assistantMsg);
            store_1.store.set('chatHistory', history);
            // Send response to chat window
            if (chatWindow && !chatWindow.isDestroyed()) {
                chatWindow.webContents.send('chat:response', assistantMsg);
            }
            // Send speech bubble to pet window
            if (petWindow && !petWindow.isDestroyed()) {
                petWindow.webContents.send('pet:speak', response);
            }
            return assistantMsg;
        }
        catch (error) {
            const errorMsg = {
                role: 'assistant',
                content: `(错误: ${error.message || '无法连接到模型'})`,
                timestamp: Date.now(),
            };
            return errorMsg;
        }
    });
    // ── Chat history ──
    electron_1.ipcMain.handle('chat:get-history', () => {
        return store_1.store.get('chatHistory');
    });
    electron_1.ipcMain.handle('chat:clear-history', () => {
        store_1.store.set('chatHistory', []);
    });
    // ── Screen observer ──
    electron_1.ipcMain.handle('screen-observe:toggle', () => {
        if (!observer)
            return { enabled: false };
        const enabled = observer.toggle();
        return { enabled };
    });
    electron_1.ipcMain.handle('screen-observe:status', () => {
        return { enabled: observer?.isEnabled() ?? false };
    });
}
//# sourceMappingURL=ipc.js.map