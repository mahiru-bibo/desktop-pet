// Ollama local model provider

import { ChatProvider, Message, ProviderConfig } from './types';

export class OllamaProvider implements ChatProvider {
  name = 'ollama';

  async sendMessage(messages: Message[], config: ProviderConfig): Promise<string> {
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

    const data = await response.json() as any;

    const content = data.message?.content;
    if (!content) {
      throw new Error('No content in Ollama response');
    }

    return content;
  }

  async visionMessage(imageBase64: string, mimeType: string, prompt: string, config: ProviderConfig): Promise<string> {
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

      const data = await response.json() as any;
      console.log('[Ollama] Vision response data keys:', Object.keys(data));
      const content = data.message?.content;
      if (!content) throw new Error('No content in Ollama vision response');
      console.log('[Ollama] Vision response:', content.slice(0, 100));
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
}
