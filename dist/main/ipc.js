"use strict";
// IPC handler registration
// All IPC channels are defined and handled here
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPetWindow = setPetWindow;
exports.setChatWindow = setChatWindow;
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const store_1 = require("./store");
const factory_1 = require("../providers/factory");
let petWindow = null;
let chatWindow = null;
function setPetWindow(win) {
    petWindow = win;
}
function setChatWindow(win) {
    chatWindow = win;
}
function registerIpcHandlers() {
    // ── Pet window movement ──
    electron_1.ipcMain.on('pet:move-window', (_event, { dx, dy }) => {
        if (!petWindow)
            return;
        const [x, y] = petWindow.getPosition();
        petWindow.setPosition(x + dx, y + dy);
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
        return {
            characterId: store_1.store.get('characterId'),
            pixelScale: store_1.store.get('pixelScale'),
            bubbleDuration: store_1.store.get('bubbleDuration'),
        };
    });
    // ── Settings (chat) ──
    electron_1.ipcMain.handle('settings:get-chat', () => {
        const provider = store_1.store.get('provider');
        return {
            characterId: store_1.store.get('characterId'),
            characterName: ['女仆', '剑士', '魔法师', '猫娘'][store_1.store.get('characterId')] || '女仆',
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
}
//# sourceMappingURL=ipc.js.map