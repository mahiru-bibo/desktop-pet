"use strict";
// Ollama local model provider
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
class OllamaProvider {
    name = 'ollama';
    async sendMessage(messages, config) {
        const endpoint = config.endpoint || 'http://localhost:11434/api/chat';
        const model = config.model || 'llama3';
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
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama.js.map