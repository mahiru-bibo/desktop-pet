"use strict";
// Chat window — standard window for chatting with the pet
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
exports.createChatWindow = createChatWindow;
exports.getChatWindow = getChatWindow;
const electron_1 = require("electron");
const path = __importStar(require("path"));
let chatWindow = null;
function createChatWindow() {
    if (chatWindow && !chatWindow.isDestroyed()) {
        return chatWindow;
    }
    chatWindow = new electron_1.BrowserWindow({
        width: 420,
        height: 600,
        minWidth: 320,
        minHeight: 400,
        show: false,
        title: '💬 桌宠聊天',
        webPreferences: {
            preload: path.join(__dirname, '../../preload/chatPreload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    chatWindow.loadFile(path.join(__dirname, '../../renderer/chat/index.html'));
    chatWindow.on('close', (e) => {
        // Hide instead of close — keep chat history
        e.preventDefault();
        chatWindow?.hide();
    });
    chatWindow.on('closed', () => {
        chatWindow = null;
    });
    return chatWindow;
}
function getChatWindow() {
    if (chatWindow && !chatWindow.isDestroyed()) {
        return chatWindow;
    }
    return null;
}
//# sourceMappingURL=chatWindow.js.map