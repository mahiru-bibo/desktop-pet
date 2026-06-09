"use strict";
// Provider factory — creates the right ChatProvider from config
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvider = createProvider;
const openai_1 = require("./openai");
const anthropic_1 = require("./anthropic");
const ollama_1 = require("./ollama");
function createProvider(config) {
    switch (config.provider) {
        case 'openai':
        case 'generic-openai':
            return new openai_1.OpenAiProvider();
        case 'anthropic':
            return new anthropic_1.AnthropicProvider();
        case 'ollama':
            return new ollama_1.OllamaProvider();
        default:
            // Default to OpenAI-compatible
            return new openai_1.OpenAiProvider();
    }
}
//# sourceMappingURL=factory.js.map