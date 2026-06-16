// Anthropic Claude provider

import { ChatProvider, Message, ProviderConfig } from './types';

export class AnthropicProvider implements ChatProvider {
  name = 'anthropic';

  async sendMessage(messages: Message[], config: ProviderConfig): Promise<string> {
    const endpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';
    const model = config.model || 'claude-sonnet-4-20250514';

    // Anthropic uses a different API format: system param is separate, no 'system' role in messages array
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const body: any = {
      model,
      messages: chatMessages,
      max_tokens: config.maxTokens ?? 256,
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json() as any;

    const content = data.content?.[0]?.text;
    if (!content) {
      throw new Error('No content in Anthropic response');
    }

    return content;
  }

  async visionMessage(imageBase64: string, mimeType: string, prompt: string, config: ProviderConfig): Promise<string> {
    const endpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';
    const model = config.model || 'claude-sonnet-4-20250514';

    const body: any = {
      model,
      max_tokens: config.maxTokens ?? 256,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic vision error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text;
    if (!content) throw new Error('No content in Anthropic vision response');
    return content;
  }
}
