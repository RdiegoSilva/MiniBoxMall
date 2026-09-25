/* PesaCerto — preferências, som/vibração, tela ligada, festa e PWA */
(function(){
  var KEY = "pesacerto_prefs";
  var prefs = { som:true, tela:true };
  try{ var p = JSON.parse(localStorage.getItem(KEY)||"{}"); for(var k in p) prefs[k] = p[k]; }catch(e){}
  function salvar(){ try{ localStorage.setItem(KEY, JSON.stringify(prefs)); }catch(e){} }

  /* ---------- Som e vibração ---------- */
  var ac = null;
  function beep(freq, dur, tipo, vol){
    try{
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if(ac.state === "suspended") ac.resume();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = tipo || "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || .15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + dur);
    }catch(e){}
  }
  function vibra(p){ try{ if(prefs.som && navigator.vibrate) navigator.vibrate(p); }catch(e){} }

  /* ---------- Confete ao encerrar ---------- */
  function confete(){
    if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cv = document.createElement("canvas"); cv.className = "confete";
    var W = cv.width = innerWidth, H = cv.height = innerHeight, cx = cv.getContext("2d");
    var msg = document.createElement("div"); msg.className = "festa-msg"; msg.textContent = "🎉 Pesagem encerrada!";
    document.body.appendChild(cv); document.body.appendChild(msg);
    var cores = ["#dc2626","#ff5a4d","#22c55e","#4ade80","#fbbf24","#ffffff"], ps = [];
    for(var i=0;i<140;i++) ps.push({ x:W/2+(Math.random()-.5)*80, y:H*.55, vx:(Math.random()-.5)*14, vy:-Math.random()*16-6, s:Math.random()*7+4, r:Math.random()*6, vr:(Math.random()-.5)*.4, c:cores[i%cores.length] });
    var ini = performance.now();
    (function q(t){
      var d = t - ini; cx.clearRect(0,0,W,H);
      ps.forEach(function(p){ p.vy+=.38; p.x+=p.vx; p.y+=p.vy; p.vx*=.99; p.r+=p.vr;
        cx.save(); cx.translate(p.x,p.y); cx.rotate(p.r); cx.fillStyle=p.c; cx.globalAlpha=Math.max(0,1-d/2600); cx.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6); cx.restore(); });
      if(d < 2600) requestAnimationFrame(q); else { cv.remove(); msg.remove(); }
    })(ini);
  }

  window.PesaFX = {
    ok:   function(){ if(prefs.som){ beep(880,.09,"sine"); setTimeout(function(){ beep(1175,.09,"sine"); },90); } vibra(60); },
    erro: function(){ if(prefs.som){ beep(220,.28,"square",.09); } vibra([90,60,90]); },
    festa:function(){ if(prefs.som){ [523,659,784,1047].forEach(function(f,i){ setTimeout(function(){ beep(f,.16,"triangle"); },i*110); }); } vibra([60,40,60,40,160]); confete(); }
  };

  /* ---------- Tela sempre ligada ---------- */
  var lock = null;
  function wake(){
    if(!prefs.tela || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    navigator.wakeLock.request("screen").then(function(l){ lock = l; l.addEventListener("release", function(){ lock = null; }); }).catch(function(){});
  }
  function unwake(){ if(lock){ lock.release().catch(function(){}); lock = null; } }
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState === "visible") wake(); });
  document.addEventListener("click", function once(){ wake(); document.removeEventListener("click", once); });

  /* ---------- Preferências aplicadas ---------- */
  function aplicar(){
    prefs.tela ? wake() : unwake();
  }
  aplicar();

  /* ---------- Painel de configurações ---------- */
  var painel = document.getElementById("settingsPanel"), fundo = document.getElementById("settingsBackdrop"), btn = document.getElementById("btnSettings");
  function abrir(v){
    painel.hidden = fundo.hidden = !v;
    btn.setAttribute("aria-expanded", String(v));
  }
  btn.addEventListener("click", function(){ abrir(painel.hidden); });
  fundo.addEventListener("click", function(){ abrir(false); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") abrir(false); });
  document.querySelectorAll("[data-pref]").forEach(function(cb){
    cb.checked = !!prefs[cb.dataset.pref];
    cb.addEventListener("change", function(){
      prefs[cb.dataset.pref] = cb.checked; salvar(); aplicar();
      if(cb.dataset.pref === "som" && cb.checked) window.PesaFX.ok();
    });
  });

  /* ---------- PWA: service worker + instalar ---------- */
  if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
    navigator.serviceWorker.register("sw.js").catch(function(){});
  }
  var evInstalar = null, bi = document.getElementById("btnInstall"), ios = document.getElementById("iosHint");
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); evInstalar = e; bi.hidden = false; });
  bi.addEventListener("click", function(){ if(!evInstalar) return; evInstalar.prompt(); evInstalar.userChoice.finally(function(){ evInstalar = null; bi.hidden = true; }); });
  window.addEventListener("appinstalled", function(){ bi.hidden = true; });
  var standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone) ios.hidden = false;
})();
