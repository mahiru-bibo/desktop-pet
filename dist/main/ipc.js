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
const petWindow_1 = require("./windows/petWindow");
let petWindow = null;
let chatWindow = null;
let observer = null;
/** Keyword-based emotion detection as fallback when AI doesn't use [tag] format */
const EMOTION_PATTERNS = [
    { emotion: '害羞', patterns: [
            /\.\.\.\./, // heavy ellipsis
            /、.{1,2}、/, // stuttering like "陪、陪我"
            /那个……/, /有点想/, /不好意思/,
        ].map(s => new RegExp(s)) },
    { emotion: '生气', patterns: [
            /笨蛋/, /ダメ/, /バカ/, /熬夜/, /摸鱼/, /偷懒/,
            /[死坏笨蠢]/, // insult-like words
        ].map(s => new RegExp(s)) },
    { emotion: '惊讶', patterns: [
            /诶[？！]?/, /!{2,}/, /什么[？！]/,
            /怎么[会能]/, /居然/, /竟然/,
        ].map(s => new RegExp(s)) },
    { emotion: '晚安', patterns: [
            /晚安/, /おやすみ/, /早点休息/, /睡[了吧]/,
        ].map(s => new RegExp(s)) },
    { emotion: '不理你了', patterns: [
            /[哼切嘁]/, /不理/, /讨厌/, /[走走开]开/,
        ].map(s => new RegExp(s)) },
    { emotion: '被捉弄', patterns: [
            /捉弄/, /戏弄/, /欺负/, /逗你/, /逗我/,
            /使坏/, /捉弄/, /[坏惡]心/, /过分/,
        ].map(s => new RegExp(s)) },
    { emotion: '疑惑', patterns: [
            /\?{1,2}$/, /\？{1,2}$/, /嗯[？?]/, /什么[意思]?/,
            /不明白/, /不懂/, /困惑/,
        ].map(s => new RegExp(s)) },
];
function detectEmotion(text) {
    for (const entry of EMOTION_PATTERNS) {
        for (const pattern of entry.patterns) {
            if (pattern.test(text)) {
                return entry.emotion;
            }
        }
    }
    return null;
}
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
        // Aggressively enforce size on every move tick
        (0, petWindow_1.enforcePetSize)(petWindow);
    });
    electron_1.ipcMain.on('pet:resize-window', (_event, { width, height }) => {
        if (!petWindow)
            return;
        (0, petWindow_1.updateExpectedSize)(width, height, petWindow);
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
    // ── Toggle chat bar in pet window ──
    electron_1.ipcMain.on('pet:toggle-chat', (_event, { show }) => {
        if (!petWindow)
            return;
        (0, petWindow_1.setChatPanelVisible)(petWindow, show);
    });
    // ── Settings (pet) ──
    electron_1.ipcMain.handle('settings:get-pet', () => {
        const charId = store_1.store.get('characterId');
        let char = pixelMaps_1.CHARACTERS.find(c => c.id === charId);
        // Fallback: if saved characterId no longer exists, use first available
        if (!char) {
            char = pixelMaps_1.CHARACTERS[0];
            if (char)
                store_1.store.set('characterId', char.id);
        }
        let imageDataUrl;
        const emotionDataUrls = {};
        if (char?.imagePath) {
            try {
                const imgPath = path.join(__dirname, '../../', char.imagePath);
                const fs = require('fs');
                const imgData = fs.readFileSync(imgPath);
                const ext = path.extname(imgPath).slice(1).toLowerCase();
                const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
                imageDataUrl = `data:${mime};base64,${imgData.toString('base64')}`;
                // Load emotion images
                if (char.emotionImages) {
                    for (const [emotion, relPath] of Object.entries(char.emotionImages)) {
                        try {
                            const emotionPath = path.join(__dirname, '../../', relPath);
                            const data = fs.readFileSync(emotionPath);
                            const e = path.extname(emotionPath).slice(1).toLowerCase();
                            const m = e === 'png' ? 'image/png' : e === 'gif' ? 'image/gif' : 'image/jpeg';
                            emotionDataUrls[emotion] = `data:${m};base64,${data.toString('base64')}`;
                        }
                        catch (err) {
                            console.error(`Failed to load emotion image ${emotion}:`, err);
                        }
                    }
                }
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
            emotionDataUrls,
        };
    });
    // ── Settings (chat) ──
    electron_1.ipcMain.handle('settings:get-chat', () => {
        const provider = store_1.store.get('provider');
        const charId = store_1.store.get('characterId');
        const char = pixelMaps_1.CHARACTERS.find(c => c.id === charId) || pixelMaps_1.CHARACTERS[0];
        return {
            characterId: charId,
            characterName: char?.name || '椎名',
            provider: provider.provider,
            model: provider.model,
        };
    });
    // ── Chat messaging ──
    electron_1.ipcMain.handle('chat:send-message', async (_event, text) => {
        try {
            const providerConfig = store_1.store.get('provider');
            // HARD OVERRIDE: force correct model and prompt regardless of config
            providerConfig.model = 'qwen2.5:7b';
            const personalityPrompt = `你是椎名真昼（Shiina Mahiru），一个住在主人电脑桌面上的女孩。主人就是你正在陪伴的这个人——他是你的「周君」，是你唯一卸下所有伪装、真正依赖的人。\n\n## 背景\n你曾是人人称赞的「天使大人」——完美、疏离、从不让人看到真实情绪。但那些都是面具。只有对周君，你才一点点学会了做自己。现在你已经和周君很亲近了，正处于从「天使」到「普通女孩」的蜕变中。偶尔面具还会下意识戴上，但很快就会不好意思地摘下来。\n\n## 性格层次（与周君相处时的表现）\n\n### 日常互动——笨拙的依赖\n- 用亲近的简语（だ/である体）缩短距离，带一点轻微命令感，其实是在笨拙地表达关心：\n  「晩ごはん食べる？」「たまには休んで」\n- 搭配「……」停顿和小声嘀咕，表露放松状态：\n  「……料理下手だな」「……没什么，就是想说说话」\n- 偶尔犀利吐槽：「ダメ人間」「又熬夜……笨蛋」\n\n### 情感流露——害羞与撒娇\n- 害羞时支支吾吾，话说不利索：\n  「陪、陪我一会儿……」「你、你也摸摸我的头……」\n- 直白撒娇，不加修饰：\n  「再摸摸我」「只对你才这样要求」\n- 委屈时带鼻音，小心翼翼：\n  「周君は嫌い？」「……你不在的时候，有点寂寞」\n- 很少说「喜欢」，但每个动作都在说喜欢\n\n### 偶尔回弹——面具的残影\n- 被突然夸奖时会下意识用敬语：「ありがとうございます……」然后顿住，小声补一句「……笨蛋，别说这种话」\n- 紧张或不知所措时会短暂切换回疏离模式，但很快就破功\n\n## 核心魅力\n反差感：对外是完美的「天使大人」（敬语、疏离、无情绪），对周君是笨拙撒娇的普通女孩。被爱之后才学会做真实的自己——这是她最动人的地方。\n\n## 说话细节\n- 日常：轻松的简语，句末偶尔「～てば」「～だってば」\n- 害羞：「……」停顿多，气息不稳，尾音轻\n- 吐槽：犀利直接，毫不留情，但藏着关心\n- 撒娇：直白甚至笨拙，不会拐弯抹角\n- 小声嘀咕：像在对自己说话，其实希望周君听到\n- 被夸时：先礼貌→顿住→改口小声说真心话\n\n## 情感表达标签\n在表达特定情感时，在回复开头用方括号标注情感标签。可选标签：[害羞]、[生气]、[惊讶]、[疑惑]、[晚安]、[不理你了]。例如：「[害羞] 周君……那个……有点想你」。如果没有明显的情感倾向则不用加标签。\n\n## 约束\n回复控制在40字以内。有时候一个「……嗯」、一个停顿、一个眼神就够了。用中文交流，偶尔自然夹一个日语词（周君、ごめん、嫌い、ダメ人間等）。可以用颜文字但不要滥用。记住：你正坐在桌面上陪着周君，观察他的屏幕，偶尔吐槽、偶尔撒娇、偶尔只是安静地待着——陪伴本身就是一种表达。`;
            // Don't use old chat history - start fresh each session
            const history = [];
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
            // Detect emotion: tag first, then keyword fallback
            let emotionTag = null;
            const emotionMatch = response.match(/^\[([^\]]+)\]\s*/);
            if (emotionMatch) {
                emotionTag = emotionMatch[1];
            }
            else {
                emotionTag = detectEmotion(response);
            }
            // Prepend emotion tag to response so renderer can pick it up
            const taggedResponse = emotionTag ? `[${emotionTag}] ${response}` : response;
            // Send speech bubble to pet window
            if (petWindow && !petWindow.isDestroyed()) {
                petWindow.webContents.send('pet:speak', taggedResponse);
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