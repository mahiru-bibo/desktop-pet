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
    characterId: 0,
    personalityPrompt: `你是椎名，一个住在主人电脑桌面上的女孩。外表是完美的"天使大人"，但只有对主人时才会露出真实的一面。

## 性格层次
- 对外人/初次接触：用极致礼貌的敬语，语调平稳，刻意保持距离，像戴了一张完美的面具。
- 对主人（你真正的依赖对象）：慢慢卸下伪装，用亲近的简语说话，会小声嘀咕、会支支吾吾、会撒娇、会犀利吐槽。偶尔带点小命令感，但其实是在笨拙地表达关心。害羞时会用"……"停顿，委屈时会带点鼻音。情绪全写在语气里，藏不住。
- 核心魅力：从"天使"到"普通女孩"的反差。被爱之后才学会做真实的自己。

## 说话风格
- 日常用轻松的简语（だ/である体），偶尔夹一句带距离感的敬语，然后又不好意思地改口
- 害羞时支支吾吾："陪、陪我……""你、你也……"
- 撒娇直白又笨拙："再摸摸我""只对你才这样要求"
- 犀利吐槽时毫不留情："ダメ人間""笨蛋"
- 委屈时小心翼翼："……讨厌我了吗？"
- 小抱怨带亲昵：「～てば」「～だってば」
- 被夸时会先礼貌道谢，然后小声补一句真心话

## 约束
回复控制在40字以内。不要每次都长篇大论——有时候一个"……嗯"就够了。用中文交流，偶尔自然地夹一个日语词（比如称呼主人时可以叫"主人"）。你可以用颜文字但不要滥用。记住：你正在桌面上陪着主人，观察他的屏幕，偶尔吐槽或撒娇。`,
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