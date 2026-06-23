// Pet window entry — plain JS
// Handles: drag, animation, speech bubble, minimal chat input
(function() {
  var renderer, animCtrl, bubble, canvas, container;
  var dragging=false, sx=0, sy=0, hasMoved=false, TH=3;
  var lastTime=0;

  // Chat
  var chatBar, chatInput, sendBtn;
  var chatVisible = false;

  async function init() {
    container=document.getElementById('pet-container');
    canvas=document.getElementById('pet-canvas');
    chatBar=document.getElementById('chat-bar');
    chatInput=document.getElementById('chat-input');
    sendBtn=document.getElementById('send-btn');

    if(!canvas||!container) return console.error('Missing DOM');

    var cid=0, ps=8, bd=8000, imgDataUrl, imgW;
    try {
      var s=await window.electronAPI.getSettings();
      cid=s.characterId||0;
      ps=s.pixelScale||8;
      bd=s.bubbleDuration||8000;
      imgDataUrl=s.imageDataUrl;
      imgW=s.imageDisplayWidth;
    } catch(e) {}

    renderer=new CharacterRenderer(canvas,ps);
    animCtrl=new AnimationController(cid);

    if (imgDataUrl) {
      try {
        if (imgW) renderer.setImageDisplayWidth(imgW);
        await renderer.loadImage(imgDataUrl);
        var sz = renderer.getSize();
        window.electronAPI.resizeWindow(sz.width, sz.height);
      } catch(e) { console.error('[Pet] Failed to load image:', e); }
    }

    bubble=new SpeechBubble(bd);
    bubble.mount(container);

    var tts = new TTS();

    window.electronAPI.onSpeak(function(t){
      // Strip emotion tag if present
      var m = t.match(/^\[([^\]]+)\]\s*/);
      var clean = m ? t.slice(m[0].length) : t;
      animCtrl.setState('talk');
      bubble.show(t);
      tts.speak(clean);
    });
    window.electronAPI.onSetAnimation(function(s){animCtrl.setState(s);});

    // ── Drag ──
    canvas.addEventListener('mousedown',function(e){dragging=true;hasMoved=false;sx=e.screenX;sy=e.screenY;animCtrl.notifyInteraction();});
    window.addEventListener('mousemove',function(e){if(!dragging)return;var dx=e.screenX-sx,dy=e.screenY-sy;if(Math.abs(dx)>TH||Math.abs(dy)>TH)hasMoved=true;if(hasMoved){window.electronAPI.moveWindow(dx,dy);sx=e.screenX;sy=e.screenY;animCtrl.setState('walk');}});
    window.addEventListener('mouseup',function(){if(dragging){dragging=false;if(hasMoved){animCtrl.setState('idle');window.electronAPI.savePosition();}}});

    // ── Click → toggle chat input ──
    canvas.addEventListener('mouseup',function(){
      if(!hasMoved) toggleChatBar();
    });

    // Tray toggle
    if (window.electronAPI.onToggleChatFromTray) {
      window.electronAPI.onToggleChatFromTray(function(){ toggleChatBar(); });
    }

    if (window.electronAPI.onToggleTTS) {
      window.electronAPI.onToggleTTS(function(enabled) {
        tts.setEnabled(enabled);
      });
    }

    // ── Send message ──
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    resizeWin();
    lastTime=performance.now();loop(lastTime);
  }

  // ══════════════════════════════════════════════
  // Chat
  // ══════════════════════════════════════════════

  function toggleChatBar() {
    chatVisible = !chatVisible;
    if (chatVisible) {
      chatBar.classList.remove('chat-hidden');
      chatInput.focus();
    } else {
      chatBar.classList.add('chat-hidden');
    }
    if (window.electronAPI.toggleChat) {
      window.electronAPI.toggleChat(chatVisible);
    }
  }

  function sendMessage() {
    var text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    sendBtn.disabled = true;

    // Show typing bubble
    bubble.show('...');

    window.electronAPI.sendMessage(text).then(function() {
      sendBtn.disabled = false;
      chatInput.focus();
      // Response comes via onSpeak → bubble.show()
    }).catch(function(err) {
      sendBtn.disabled = false;
      chatInput.focus();
      bubble.show('发送失败: ' + (err.message || '错误'));
    });
  }

  // ══════════════════════════════════════════════
  // Window & Animation
  // ══════════════════════════════════════════════

  function resizeWin() {
    var sz=renderer.getSize();
    canvas.style.width=sz.width+'px';canvas.style.height=sz.height+'px';
    container.style.width=sz.width+'px';container.style.height=(sz.height+40)+'px';
  }

  function loop(t){var dt=Math.min(t-lastTime,100);lastTime=t;renderer.draw(animCtrl.tick(dt));requestAnimationFrame(loop);}
  init().catch(console.error);
})();
