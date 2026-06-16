"use strict";
// Plain JSON file storage for persistent settings and chat history
// Replaces electron-store to avoid ESM/CJS compatibility issues
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
exports.store = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const defaults = {
    characterId: 4,
    personalityPrompt: '你是一只可爱的桌面宠物，一个像素动漫角色。你的性格活泼可爱，喜欢简短地聊天。回复要简洁（50字以内），语气要萌，偶尔用颜文字。你正在桌面上陪着主人。',
    provider: {
        provider: 'openai',
        apiKey: '',
        endpoint: '',
        model: 'gpt-4o',
        temperature: 0.9,
        maxTokens: 256,
    },
    chatHistory: [],
    petPosition: { x: 200, y: 200 },
    pixelScale: 8,
    bubbleDuration: 8000,
};
class JsonStore {
    data;
    filePath;
    constructor() {
        const userDataPath = electron_1.app.getPath('userData');
        this.filePath = path.join(userDataPath, 'desktop-pet-config.json');
        this.data = this.load();
    }
    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf-8');
                const parsed = JSON.parse(raw);
                return { ...defaults, ...parsed };
            }
        }
        catch (e) {
            console.error('Failed to load config:', e);
        }
        return { ...defaults };
    }
    save() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        }
        catch (e) {
            console.error('Failed to save config:', e);
        }
    }
    get(key) {
        return this.data[key];
    }
    set(key, value) {
        this.data[key] = value;
        this.save();
    }
    getAll() {
        return { ...this.data };
    }
}
exports.store = new JsonStore();
//# sourceMappingURL=store.js.map