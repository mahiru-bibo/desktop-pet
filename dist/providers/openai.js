"use strict";
// OpenAI / OpenAI-compatible provider
// Works with: OpenAI, OpenRouter, Groq, local llama.cpp server, etc.
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiProvider = void 0;
class OpenAiProvider {
    name = 'openai';
    async sendMessage(messages, config) {
        const endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';
        const model = config.model || 'gpt-4o';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: config.temperature ?? 0.9,
                max_tokens: config.maxTokens ?? 256,
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenAI API error ${response.status}: ${text.slice(0, 200)}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('No content in OpenAI response');
        }
        return content;
    }
    async visionMessage(imageBase64, mimeType, prompt, config) {
        const endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';
        const model = config.model || 'gpt-4o';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [{
                        role: 'user',
                        content: [
                            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
                            { type: 'text', text: prompt },
                        ],
                    }],
                max_tokens: config.maxTokens ?? 256,
            }),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenAI vision error ${response.status}: ${text.slice(0, 200)}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content)
            throw new Error('No content in OpenAI vision response');
        return content;
    }
}
exports.OpenAiProvider = OpenAiProvider;
//# sourceMappingURL=openai.js.map