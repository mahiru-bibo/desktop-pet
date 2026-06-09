// Pet window entry - plain JS
(function() {
  var renderer, animCtrl, bubble, canvas, container;
  var dragging=false, sx=0, sy=0, hasMoved=false, TH=3;
  var lastTime=0;

  async function init() {
    container=document.getElementById('pet-container');
    canvas=document.getElementById('pet-canvas');
    if(!canvas||!container) return console.error('Missing DOM');

    var cid=0, ps=8, bd=8000;
    try{var s=await window.electronAPI.getSettings();cid=s.characterId||0;ps=s.pixelScale||8;bd=s.bubbleDuration||8000;}catch(e){}

    renderer=new CharacterRenderer(canvas,ps);
    animCtrl=new AnimationController(cid);
    bubble=new SpeechBubble(bd);
    bubble.mount(container);

    window.electronAPI.onSpeak(function(t){animCtrl.setState('talk');bubble.show(t);});
    window.electronAPI.onSetAnimation(function(s){animCtrl.setState(s);});

    canvas.addEventListener('mousedown',function(e){dragging=true;hasMoved=false;sx=e.screenX;sy=e.screenY;animCtrl.notifyInteraction();});
    window.addEventListener('mousemove',function(e){if(!dragging)return;var dx=e.screenX-sx,dy=e.screenY-sy;if(Math.abs(dx)>TH||Math.abs(dy)>TH)hasMoved=true;if(hasMoved){window.electronAPI.moveWindow(dx,dy);sx=e.screenX;sy=e.screenY;animCtrl.setState('walk');}});
    window.addEventListener('mouseup',function(){if(dragging){dragging=false;if(hasMoved){animCtrl.setState('idle');window.electronAPI.savePosition();}}});
    canvas.addEventListener('mouseup',function(){if(!hasMoved)window.electronAPI.openChat();});

    var sz=renderer.getSize();
    canvas.style.width=sz.width+'px';canvas.style.height=sz.height+'px';
    container.style.width=sz.width+'px';container.style.height=(sz.height+40)+'px';

    lastTime=performance.now();loop(lastTime);
  }

  function loop(t){var dt=Math.min(t-lastTime,100);lastTime=t;renderer.draw(animCtrl.tick(dt));requestAnimationFrame(loop);}
  init().catch(console.error);
})();
