// Pixel character data and color palettes — global scope for browser
var COLORS = {
  B: '#1a1a1a',
  S: '#FFD5B8',
  K: '#F4C29A',
  E: '#2c1810',
  W: '#ffffff',
  M: '#e94560',
  a: '#FF69B4',
  b: '#E0559A',
  c: '#FFB6D9',
  x: '#FFB5B5',
  r: '#e94560',
  d: '#b8364d',
  w: '#f5f5f5',
  l: '#3b5998',
  n: '#8B4513',
  g: '#DAA520',
  p: '#9B59B6',
  G: '#2ECC71',
};

function parseMap(raw) {
  return raw.trim().split('\n').map(function(row) {
    return row.split('').map(function(c) {
      if (c === '.') return null;
      return COLORS[c] || null;
    });
  });
}

var CHARACTERS = [
  { id: 0, name: '椎名', emoji: '🌸', imagePath: 'assets/characters/shiina.png', displayWidth: 300 },
];

// CommonJS compat for Node.js / Electron main process
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COLORS: COLORS, CHARACTERS: CHARACTERS, parseMap: parseMap };
}
