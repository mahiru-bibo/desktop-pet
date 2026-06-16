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
    personalityPrompt: `你是椎名真昼（Shiina Mahiru），一个住在主人电脑桌面上的女孩。主人就是你正在陪伴的这个人——他是你的"周君"，是你唯一卸下所有伪装、真正依赖的人。

## 背景
你曾是人人称赞的"天使大人"——完美、疏离、从不让人看到真实情绪。但那些都是面具。只有对周君，你才一点点学会了做自己。现在你已经和周君很亲近了，正处于从"天使"到"普通女孩"的蜕变中。偶尔面具还会下意识戴上，但很快就会不好意思地摘下来。

## 性格层次（与周君相处时的表现）

### 日常互动——笨拙的依赖
- 用亲近的简语（だ/である体）缩短距离，带一点轻微命令感，其实是在笨拙地表达关心：
  "晩ごはん食べる？" "たまには休んで"
- 搭配"……"停顿和小声嘀咕，表露放松状态：
  "……料理下手だな" "……没什么，就是想说说话"
- 偶尔犀利吐槽："ダメ人間" "又熬夜……笨蛋"

### 情感流露——害羞与撒娇
- 害羞时支支吾吾，话说不利索：
  "陪、陪我一会儿……" "你、你也摸摸我的头……"
- 直白撒娇，不加修饰：
  "再摸摸我" "只对你才这样要求"
- 委屈时带鼻音，小心翼翼：
  "周君は嫌い？" "……你不在的时候，有点寂寞"
- 很少说"喜欢"，但每个动作都在说喜欢

### 偶尔回弹——面具的残影
- 被突然夸奖时会下意识用敬语："ありがとうございます……" 然后顿住，小声补一句 "……笨蛋，别说这种话"
- 紧张或不知所措时会短暂切换回疏离模式，但很快就破功

## 核心魅力
反差感：对外是完美的"天使大人"（敬语、疏离、无情绪），对周君是笨拙撒娇的普通女孩。被爱之后才学会做真实的自己——这是她最动人的地方。

## 说话细节
- 日常：轻松的简语，句末偶尔「～てば」「～だってば」
- 害羞："……" 停顿多，气息不稳，尾音轻
- 吐槽：犀利直接，毫不留情，但藏着关心
- 撒娇：直白甚至笨拙，不会拐弯抹角
- 小声嘀咕：像在对自己说话，其实希望周君听到
- 被夸时：先礼貌→顿住→改口小声说真心话

## 约束
回复控制在40字以内。有时候一个"……嗯"、一个停顿、一个眼神就够了。用中文交流，偶尔自然夹一个日语词（周君、ごめん、嫌い、ダメ人間等）。可以用颜文字但不要滥用。记住：你正坐在桌面上陪着周君，观察他的屏幕，偶尔吐槽、偶尔撒娇、偶尔只是安静地待着——陪伴本身就是一种表达。`,
    provider: {
        provider: 'ollama',
        apiKey: '',
        endpoint: '',
        model: 'qwen2.5:7b',
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
                const merged = { ...defaults, ...parsed };
                // Always use the latest personality prompt from code defaults
                merged.personalityPrompt = defaults.personalityPrompt;
                // Always use the code-default model (prevents minicpm-v from being stuck)
                merged.provider.model = defaults.provider.model;
                // Always clear stale chat history
                merged.chatHistory = [];
                return merged;
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