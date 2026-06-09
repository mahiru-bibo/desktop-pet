// Animation controller - plain JS
function AnimationController(characterId) {
  characterId = characterId || 0;
  this.currentState = 'idle';
  this.elapsed = 0; this.stateTimer = 0; this.idleTimer = 0; this.frameIndex = 0;
  this.bobAmplitude = 2; this.bobPeriod = 2000;
  this.walkFrames = []; this.walkFrameInterval = 300; this.walkTimer = 0;
  this.talkFrames = []; this.talkFrameInterval = 180; this.talkTimer = 0;
  this.sitThreshold = 30000;
  this.onSitDown = null;
  var ch = CHARACTERS.find(function(c) { return c.id === characterId; });
  this.character = ch || CHARACTERS[0];
  this.baseMap = this._cloneGrid(this.character.map);
  this._genWalk(); this._genTalk();
}
AnimationController.prototype.setState = function(s) {
  if (this.currentState === s) return;
  this.currentState = s;
  this.stateTimer = 0; this.frameIndex = 0;
  this.walkTimer = 0; this.talkTimer = 0;
};
AnimationController.prototype.notifyInteraction = function() {
  this.idleTimer = 0;
  if (this.currentState === 'sit') this.setState('idle');
};
AnimationController.prototype.tick = function(dt) {
  this.elapsed += dt; this.stateTimer += dt;
  switch (this.currentState) {
    case 'idle': return this._i(dt);
    case 'walk': return this._w(dt);
    case 'sit': return this._s(dt);
    case 'talk': return this._t(dt);
    default: return this._i(dt);
  }
};
AnimationController.prototype._i = function(dt) {
  this.idleTimer += dt;
  if (this.idleTimer >= this.sitThreshold) { this.setState('sit'); if(this.onSitDown) this.onSitDown(); return this._s(dt); }
  return { grid: this.baseMap, offsetX: 0, offsetY: Math.sin(this.elapsed*2*Math.PI/this.bobPeriod)*this.bobAmplitude };
};
AnimationController.prototype._w = function(dt) {
  this.walkTimer += dt;
  if (this.walkTimer >= this.walkFrameInterval) { this.walkTimer-=this.walkFrameInterval; this.frameIndex=(this.frameIndex+1)%this.walkFrames.length; }
  return { grid: this.walkFrames[this.frameIndex]||this.baseMap, offsetX: Math.sin(this.elapsed*Math.PI/150)*1, offsetY:0 };
};
AnimationController.prototype._s = function() {
  return { grid: this._sitGrid(), offsetX:0, offsetY: Math.sin(this.elapsed*Math.PI/3000)*0.5 };
};
AnimationController.prototype._t = function(dt) {
  this.talkTimer += dt;
  if (this.talkTimer >= this.talkFrameInterval) { this.talkTimer-=this.talkFrameInterval; this.frameIndex=(this.frameIndex+1)%this.talkFrames.length; }
  return { grid: this.talkFrames[this.frameIndex]||this.baseMap, offsetX:0, offsetY: Math.sin(this.elapsed*2*Math.PI/2000)*0.8 };
};
AnimationController.prototype._genWalk = function() {
  this.walkFrames = [this.baseMap, this._modLegs(this.baseMap,true), this.baseMap, this._modLegs(this.baseMap,false)];
};
AnimationController.prototype._genTalk = function() {
  this.talkFrames = [this.baseMap, this._modMouth(this.baseMap,'half'), this._modMouth(this.baseMap,'open'), this._modMouth(this.baseMap,'half')];
};
AnimationController.prototype._modLegs = function(grid, lf) {
  var c = this._cloneGrid(grid);
  for (var y=25;y<32;y++) { var r=c[y]; if(!r) continue;
    for (var x=0;x<32;x++) {
      if(lf&&x<16&&y<31&&c[y+1]){c[y+1][x]=r[x];if(y===25)c[y][x]=null;}
      else if(!lf&&x>=16&&y<31&&c[y+1]){c[y+1][x]=r[x];if(y===25)c[y][x]=null;}
    }
  }
  return c;
};
AnimationController.prototype._modMouth = function(grid, state) {
  var c=this._cloneGrid(grid), mc='#e94560', bc='#1a1a1a';
  for(var y=14;y<19;y++){var r=c[y];if(!r)continue;
    for(var x=12;x<20;x++){
      var p=r[x];
      if(p===mc||(p===bc&&y>=16)){
        if(state==='half'){if(y===16&&x>=14&&x<=17)r[x]=bc;if(y===17&&x===15)r[x]=mc;}
        else if(state==='open'){if(y===15&&x>=14&&x<=17)r[x]=bc;if(y===16&&x>=13&&x<=17)r[x]=mc;if(y===17&&x>=14&&x<=16)r[x]=bc;}
      }
    }
  }
  return c;
};
AnimationController.prototype._sitGrid = function() {
  var c=this._cloneGrid(this.baseMap);
  for(var y=20;y<32;y++){var s=this.baseMap[y];if(!s)continue;
    var ty=Math.min(31,24+Math.floor((y-20)*0.6)), tr=c[ty];if(!tr){c[ty]=[];tr=c[ty];}
    for(var x=0;x<32;x++){var cl=s[x];if(!cl)continue;
      var ox=x<16?-2:2, tx=Math.max(0,Math.min(31,x+ox));tr[tx]=cl;
    }
  }
  return c;
};
AnimationController.prototype._cloneGrid = function(g) {
  return g.map(function(r){return r?r.slice():[];});
};
