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

var maidRaw = "................................\n................................\n.............aaaaaaa.............\n...........aaaaaaaaaaa...........\n..........aaaaaaaaaaaaa..........\n.........aaaaaaaaaaaaaaa.........\n........aaaaaaSSSaaaaaa..........\n.......aaaaaaSSSSSaaaaaa.........\n......aaaaaaaSSSSSaaaaaaa........\n......aaaaaaSESWSSaaaaaa.........\n.....aaaaaSSEEWWSSSaaaaa.........\n.....aaaaaSSEEWSSSSaaaaa.........\n.....aaaaaSSSEEESSSaaaaa.........\n.....aaaaaaSSSEESSSaaaaa.........\n......aaaaaSSSSSSSaaaaaa.........\n......aaaaaaSxxxSaaaaaa..........\n.......aaaaaSxMxSaaaaaa..........\n.......aaaawwwwwwwwwwaaa.........\n........aawwwwwwwwwwwwaa.........\n........wwwwwwwwwwwwwww..........\n........wwwwwwwwwwwwwww..........\n........wwwwwwwwwwwwwww..........\n........wwwwddwwwwddwww..........\n........wwwwddwwwwddwww..........\n.........wwwwddddddwww...........\n.........wwwwwwwwwwwww...........\n..........wwwwwwwwwww............\n...........ddddddddd.............\n..........ddddddddddd............\n.........ddddddddddddd...........\n........ddddddddddddddd..........\n................................";

var swordRaw = "................................\n................................\n............blllllllb............\n...........blllllllllb...........\n..........blllllllllllb..........\n.........bllllllSSSllllb.........\n........blllllSSSSSlllllb........\n.......bllllllSSSSSlllllb........\n......bllllllSESWSSllllb.........\n......blllllSSEEWWSSllllb........\n.....blllllSSEEWSSSllllb.........\n.....blllllSSSEEESSllllb.........\n.....bllllllSSSEESlllllb.........\n......blllllSSSSSSlllllb.........\n.......bllllSxxxSSllllb..........\n........blllSxMxSllllb...........\n.........blllGGGGlllb............\n..........blGGGGGGGlb............\n..........bGGGGGGGGGb............\n..........bGnGnnGnGGb............\n..........bGnGnnGnGGb............\n..........bGGGGGGGGGb............\n..........bGGGGGGGGGb............\n..........bGGGggGGGGb............\n...........bGGggGGGb.............\n...........bGGGGGGGb.............\n............bbrrrbb..............\n............bbrrrbb..............\n............bbrrrbb..............\n............bbrrrbb..............\n.............bbbbbb..............\n................................";

var mageRaw = "................................\n................................\n.........pppppppppppp............\n........pppppppppppppp...........\n.......ppppppppppppppp...........\n......pppppppSSSpppppp...........\n......ppppppSSSSSpppppp..........\n.....ppppppSSSSSppppppp..........\n.....pppppSESWSSpppppp...........\n....pppppSSEEWWSSppppp...........\n....pppppSSEEWSSSppppp...........\n....pppppSSSEEESpppppp...........\n....ppppppSSSEESpppppp...........\n.....pppppSSSSSSpppppp...........\n.....ppppppSxxxSpppppp...........\n......pppppSxMxSppppp............\n.......pppprrrrrppp..............\n.......ppprrrrrrrrppp............\n.......pprrrrrrrrrrpp............\n.......prpprrrrrrpprp............\n.......prpprrrrrrpprp............\n.......prppprrrrppprp............\n.......prrpprrrrpprrp............\n........rrrprrrrprrr.............\n........rrrrrrrrrrrr.............\n.........rrrrrrrrrr..............\n.........dddddddddd..............\n........dddddddddddd.............\n........dddd..ddddd..............\n........dd.....ddd...............\n........dd....ddd................\n................................";

var catRaw = "................................\n................................\n........a..aaaaaaaaaa..a........\n.......aa.aaaaaaaaaaaa.aa.......\n.......aaaaaaaaaaaaaaaaaa.......\n.......aaaaaaaaaaaaaaaaaa.......\n......aaaaaaSSSSSaaaaaaa........\n......aaaaaaSSSSSaaaaaaa........\n.....aaaaaaaSSSSSaaaaaaa........\n.....aaaaaaSESWSSaaaaaaa........\n....aaaaaaSSEEWWSSaaaaaa........\n....aaaaaaSSEEWSSSaaaaaa........\n....aaaaaaSSSEEESSaaaaaa........\n....aaaaaaaSSSEESaaaaaaa........\n.....aaaaaSSSSSSSaaaaaa.........\n.....aaaaaaSxxxSaaaaaaa.........\n......aaaaaSxMxSaaaaaa..........\n.......aaaaarrrraaaaa...........\n.......aaaarrrrrrraaaa..........\n.......aaarrrrrrrrraaa..........\n........arrrrrrrrrrra...........\n........arrrrrrrrrrra...........\n........arrBBrrBBrra............\n........arrrrrrrrrra............\n........arrrrrrrrrra............\n.........arrrrrrrra.............\n.........aarrrrrrraa............\n.........ddddddddddd............\n........ddddddddddddd...........\n.......ddddddddddddddd..........\n.......dddd...ddddd.............\n................................";

var CHARACTERS = [
  { id: 0, name: '女仆', emoji: '🎀', map: parseMap(maidRaw) },
  { id: 1, name: '剑士', emoji: '⚔️', map: parseMap(swordRaw) },
  { id: 2, name: '魔法师', emoji: '🧙', map: parseMap(mageRaw) },
  { id: 3, name: '猫娘', emoji: '😺', map: parseMap(catRaw) },
  { id: 4, name: '椎名', emoji: '🌸', imagePath: 'assets/characters/shiiina.jpg', displayWidth: 300 },
];

// CommonJS compat for Node.js / Electron main process
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COLORS: COLORS, CHARACTERS: CHARACTERS, parseMap: parseMap };
}
