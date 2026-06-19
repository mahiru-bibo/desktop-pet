// Pixel character data and color palettes
// Extracted and adapted from pixel-character.html

export type ColorGrid = (string | null)[][];

// Color constants
export const COLORS: Record<string, string> = {
  B: '#1a1a1a',   // black/outline
  S: '#FFD5B8',   // skin
  K: '#F4C29A',   // skin shadow
  E: '#2c1810',   // eye dark
  W: '#ffffff',   // eye white
  M: '#e94560',   // mouth
  a: '#FF69B4',   // hair main (pink)
  b: '#E0559A',   // hair shadow (dark pink)
  c: '#FFB6D9',   // hair highlight (light pink)
  x: '#FFB5B5',   // blush
  r: '#e94560',   // red clothes
  d: '#b8364d',   // dark red
  w: '#f5f5f5',   // white clothes
  l: '#3b5998',   // blue clothes/hair
  n: '#8B4513',   // brown
  g: '#DAA520',   // gold
  p: '#9B59B6',   // purple
  G: '#2ECC71',   // green
};

// Parse a raw character map string into a ColorGrid
export function parseMap(raw: string): ColorGrid {
  return raw.trim().split('\n').map(row =>
    row.split('').map(c => {
      if (c === '.') return null;
      return COLORS[c] || null;
    })
  );
}

export interface CharacterDef {
  id: number;
  name: string;
  emoji: string;
  map?: ColorGrid;         // pixel chars only
  imagePath?: string;      // image chars: path relative to project root
  emotionImages?: Record<string, string>;  // emotion key → image path
  displayWidth?: number;   // image chars: target display width (default 200px)
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 0,
    name: '椎名真昼',
    emoji: '🌸',
    imagePath: 'assets/characters/shiina.png',
    displayWidth: 300,
    emotionImages: {
      '惊讶': 'assets/characters/惊讶.png',
      '晚安': 'assets/characters/晚安.png',
      '不理你了': 'assets/characters/不理你了.png',
      '害羞': 'assets/characters/害羞.png',
      '生气': 'assets/characters/生气.png',
      '疑惑': 'assets/characters/疑惑.png',
      '被捉弄': 'assets/characters/被捉弄.png',
    },
  },
];

// ── Animation variant maps ──
// Talk frames: different mouth shapes (only rows 16-18 change)
// Frame 0 = closed (base), Frame 1 = half-open, Frame 2 = open
// We generate these procedurally in animations.ts rather than storing full maps

// Walk frames: alternate legs (rows 25-31 differ)
// We generate these procedurally in animations.ts
