// Speech bubble — plain JS

function SpeechBubble(duration) {
  this.duration = duration || 8000;
  this.hideTimer = null;
  this.onHide = null;

  this.element = document.createElement('div');
  this.element.id = 'speech-bubble';
  this.element.style.cssText =
    'position:absolute;top:8px;left:50%;transform:translateX(-50%);'+
    'background:#fff;color:#1a1a1a;padding:8px 12px;border-radius:12px;'+
    'font-size:13px;font-family:"Microsoft YaHei","PingFang SC",sans-serif;'+
    'max-width:220px;min-width:60px;text-align:center;'+
    'box-shadow:0 3px 12px rgba(0,0,0,0.25);opacity:0;pointer-events:none;'+
    'transition:opacity 0.25s ease;z-index:10;word-wrap:break-word;line-height:1.4;';

  this.textElement = document.createElement('span');
  this.element.appendChild(this.textElement);

  var tail = document.createElement('div');
  tail.style.cssText =
    'position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);'+
    'width:0;height:0;border-left:8px solid transparent;'+
    'border-right:8px solid transparent;border-top:8px solid #fff;';
  this.element.appendChild(tail);
}

SpeechBubble.prototype.mount = function(parent) {
  parent.appendChild(this.element);
};

SpeechBubble.prototype.show = function(text) {
  if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  this.textElement.textContent = text;
  this.element.style.opacity = '1';
  var self = this;
  this.hideTimer = setTimeout(function() { self.hide(); }, this.duration);
};

SpeechBubble.prototype.hide = function() {
  this.element.style.opacity = '0';
  if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  if (this.onHide) this.onHide();
};

SpeechBubble.prototype.showTyping = function() {
  if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  this.textElement.textContent = '...';
  this.element.style.opacity = '1';
};
