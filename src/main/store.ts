// Plain JSON file storage for persistent settings and chat history
// Replaces electron-store to avoid ESM/CJS compatibility issues

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface ProviderConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'generic-openai';
  apiKey: string;
  endpoint?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface StoreSchema {
  characterId: number;
  personalityPrompt: string;
  provider: ProviderConfig;
  chatHistory: ChatMessage[];
  petPosition: { x: number; y: number };
  pixelScale: number;
  bubbleDuration: number;
}

const defaults: StoreSchema = {
  characterId: 0,
  personalityPrompt: '你是一只可爱的桌面宠物，一个像素动漫角色。你的性格活泼可爱，喜欢简短地聊天。回复要简洁（50字以内），语气要萌，偶尔用颜文字。你正在桌面上陪着主人。',
  provider: {
    provider: 'openai',
    apiKey: '',
    endpoint: '',
    model: 'gpt-4o',
    temperature: 0.9,
    maxTokens: 256,
  },
  chatHistory: [],
  petPosition: { x: 200, y: 200 },
  pixelScale: 8,
  bubbleDuration: 8000,
};

class JsonStore {
  private data: StoreSchema;
  private filePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.filePath = path.join(userDataPath, 'desktop-pet-config.json');
    this.data = this.load();
  }

  private load(): StoreSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
    return { ...defaults };
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }

  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return this.data[key];
  }

  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    this.data[key] = value;
    this.save();
  }

  getAll(): StoreSchema {
    return { ...this.data };
  }
}

export const store = new JsonStore();
