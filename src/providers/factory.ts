// Provider factory — creates the right ChatProvider from config

import { ChatProvider, ProviderConfig } from './types';
import { OpenAiProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';

export function createProvider(config: ProviderConfig): ChatProvider {
  switch (config.provider) {
    case 'openai':
    case 'generic-openai':
      return new OpenAiProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'ollama':
      return new OllamaProvider();
    default:
      // Default to OpenAI-compatible
      return new OpenAiProvider();
  }
}
