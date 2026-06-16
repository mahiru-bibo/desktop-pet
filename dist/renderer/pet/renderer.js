// Canvas pixel character renderer — plain JS (image mode support)

function CharacterRenderer(canvas, pixelSize) {
  pixelSize = pixelSize || 8;
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.pixelSize = pixelSize;
  this.gridSize = 32;
  this.bgColor = '#16213e';
  this.bgColorAlt = '#1a1a3e';
  // Image character support
  this.image = null;
  this.imageDisplayWidth = 200;
  this.isImageMode = false;
  this.resize();
}

CharacterRenderer.prototype.resize = function() {
  if (this.isImageMode && this.image) {
    this._resizeForImage();
    return;
  }
  var size = this.gridSize * this.pixelSize;
  this.canvas.width = size;
  this.canvas.height = size;
  this.ctx.imageSmoothingEnabled = false;
};

CharacterRenderer.prototype._resizeForImage = function() {
  if (!this.image) return;
  var aspect = this.image.height / this.image.width;
  this.canvas.width = this.imageDisplayWidth;
  this.canvas.height = Math.round(this.imageDisplayWidth * aspect);
  this.ctx.imageSmoothingEnabled = true;
  this.ctx.imageSmoothingQuality = 'high';
  // Apply CSS for sharp rendering during downscale
  this.canvas.style.imageRendering = 'auto';
};

CharacterRenderer.prototype.loadImage = function(src) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() {
      self.image = img;
      self.isImageMode = true;
      self._resizeForImage();
      resolve();
    };
    img.onerror = function() { reject(new Error('Failed to load image: ' + src)); };
    img.src = src;
  });
};

CharacterRenderer.prototype.setImageDisplayWidth = function(w) {
  this.imageDisplayWidth = w;
  if (this.isImageMode) this._resizeForImage();
};

CharacterRenderer.prototype.draw = function(frame) {
  if (this.isImageMode && this.image) {
    this._drawImageFrame(frame);
    return;
  }
  this._drawPixelFrame(frame);
};

CharacterRenderer.prototype._drawImageFrame = function(frame) {
  var ctx = this.ctx;
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.save();
  ctx.translate(frame.offsetX || 0, frame.offsetY || 0);
  ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
  ctx.restore();
};

CharacterRenderer.prototype._drawPixelFrame = function(frame) {
  var grid = frame.grid, px = this.pixelSize;
  if (!grid) return;
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
  return { width: this.canvas.width, height: this.canvas.height };
};
