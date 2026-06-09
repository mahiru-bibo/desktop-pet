// Chat provider interface and shared types

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'generic-openai';
  apiKey: string;
  endpoint?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatProvider {
  name: string;
  sendMessage(messages: Message[], config: ProviderConfig): Promise<string>;
}
