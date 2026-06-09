// Canvas pixel character renderer — plain JS

function CharacterRenderer(canvas, pixelSize) {
  pixelSize = pixelSize || 8;
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.pixelSize = pixelSize;
  this.gridSize = 32;
  this.bgColor = '#16213e';
  this.bgColorAlt = '#1a1a3e';
  this.resize();
}

CharacterRenderer.prototype.resize = function() {
  var size = this.gridSize * this.pixelSize;
  this.canvas.width = size;
  this.canvas.height = size;
  this.ctx.imageSmoothingEnabled = false;
};

CharacterRenderer.prototype.draw = function(frame) {
  var grid = frame.grid, px = this.pixelSize;
  var ox = frame.offsetX || 0, oy = frame.offsetY || 0;
  var ctx = this.ctx, gs = this.gridSize;
  var bg = this.bgColor, bgAlt = this.bgColorAlt;

  ctx.save();
  ctx.translate(ox * px, oy * px);

  for (var y = 0; y < gs; y++) {
    for (var x = 0; x < gs; x++) {
      var color = grid[y] ? grid[y][x] : null;
      if (!color) {
        ctx.fillStyle = (x + y) % 2 === 0 ? bg : bgAlt;
        ctx.fillRect(x * px, y * px, px, px);
      }
    }
  }

  for (var y = 0; y < grid.length; y++) {
    var row = grid[y];
    if (!row) continue;
    for (var x = 0; x < row.length; x++) {
      var color = row[x];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * px, y * px, px, px);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(x * px, y * px, px, 0.5);
      ctx.fillRect(x * px, y * px, 0.5, px);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x * px, y * px + px - 0.5, px, 0.5);
      ctx.fillRect(x * px + px - 0.5, y * px, 0.5, px);
    }
  }
  ctx.restore();
};

CharacterRenderer.prototype.getSize = function() {
  var size = this.gridSize * this.pixelSize;
  return { width: size, height: size };
};
