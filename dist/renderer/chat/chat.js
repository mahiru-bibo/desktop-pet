// Chat window entry — plain JS
(function() {
  var ml, inp, sbtn, hdrN, hdrE;

  async function init() {
    ml=document.getElementById('message-list');
    inp=document.getElementById('chat-input');
    sbtn=document.getElementById('send-btn');
    hdrN=document.getElementById('char-name');
    hdrE=document.getElementById('char-emoji');

    try{var s=await window.electronAPI.getSettings();var em=['🎀','⚔️','🧙','😺'];hdrE.textContent=em[s.characterId]||'🎀';hdrN.textContent=s.characterName+' · '+s.model;}catch(e){}

    window.electronAPI.onResponse(function(m){if(m.role==='assistant'){addMsg(m);sbtn.disabled=false;inp.disabled=false;inp.focus();}});
    sbtn.addEventListener('click',send);
    inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
    document.getElementById('clear-btn').addEventListener('click',async function(){await window.electronAPI.clearHistory();ml.innerHTML='';showWel();});

    await loadHist();
    inp.focus();
  }

  async function loadHist(){try{var h=await window.electronAPI.getHistory();if(!h||h.length===0){showWel();return;}for(var i=0;i<h.length;i++){var m=h[i];if(m.role==='user'||m.role==='assistant')addMsg(m);}}catch(e){showWel();}}

  async function send(){var t=inp.value.trim();if(!t)return;addMsg({role:'user',content:t,timestamp:Date.now()});inp.value='';sbtn.disabled=true;inp.disabled=true;var ty=addTyping();try{await window.electronAPI.sendMessage(t);ty&&ty.remove();}catch(e){ty&&ty.remove();addMsg({role:'assistant',content:'发送失败: '+(e.message||'未知错误'),timestamp:Date.now()});sbtn.disabled=false;inp.disabled=false;inp.focus();}}

  function addMsg(m){var el=document.createElement('div');el.className='message '+m.role;var h='';if(m.role==='assistant')h+='<div class="role-label">🐾 宠物</div>';h+='<div>'+esc(m.content)+'</div>';if(m.timestamp){var d=new Date(m.timestamp);h+='<div class="time">'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+'</div>';}el.innerHTML=h;ml.appendChild(el);ml.scrollTop=ml.scrollHeight;}

  function addTyping(){var el=document.createElement('div');el.className='message assistant';el.innerHTML='<div class="role-label">🐾 宠物</div><div>正在思考...</div>';ml.appendChild(el);ml.scrollTop=ml.scrollHeight;return el;}

  function showWel(){var el=document.createElement('div');el.className='welcome';el.innerHTML='👋 你好呀！<br>我是你的桌面宠物～<br>和我聊聊天吧！';ml.appendChild(el);}

  function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}

  init().catch(console.error);
})();
