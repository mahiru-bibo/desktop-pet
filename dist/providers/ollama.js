"use strict";
// Ollama local model provider
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
exports.OllamaProvider = void 0;
const fs = __importStar(require("fs"));
class OllamaProvider {
    name = 'ollama';
    async sendMessage(messages, config) {
        const endpoint = config.endpoint || 'http://localhost:11434/api/chat';
        const model = config.model || 'llama3';
        // DEBUG: write to project dir
        try {
            fs.writeFileSync('C:/Users/bibob/desktop-pet/debug-ollama.json', JSON.stringify({
                model, endpoint,
                systemPreview: messages[0]?.content?.slice(0, 100),
                msgCount: messages.length,
            }, null, 2), 'utf-8');
        }
        catch (e) {
            console.error('DEBUG WRITE ERROR:', e);
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Ollama error ${response.status}: ${text.slice(0, 200)}`);
        }
        const data = await response.json();
        const content = data.message?.content;
        if (!content) {
            throw new Error('No content in Ollama response');
        }
        return content;
    }
    async visionMessage(imageBase64, mimeType, prompt, config) {
        const endpoint = config.endpoint || 'http://localhost:11434/api/chat';
        const model = config.model || 'llava';
        console.log('[Ollama] Sending vision request to', endpoint, 'model:', model, 'image size:', imageBase64.length);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: [{
                            role: 'user',
                            images: [imageBase64],
                            content: prompt,
                        }],
                    stream: false,
                }),
                signal: controller.signal,
            });
            console.log('[Ollama] Vision response status:', response.status);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Ollama vision error ${response.status}: ${text.slice(0, 200)}`);
            }
            const data = await response.json();
            console.log('[Ollama] Vision response data keys:', Object.keys(data));
            const content = data.message?.content;
            if (!content)
                throw new Error('No content in Ollama vision response');
            console.log('[Ollama] Vision response:', content.slice(0, 100));
            return content;
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.js.map