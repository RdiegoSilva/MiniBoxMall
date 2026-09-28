/* PesaCerto — efeitos visuais: chuva suave, versão do site e animações */
(function(){
  "use strict";
  var doc = document, root = doc.documentElement;
  var KEY = "pesacerto_chuva";
  var reduz = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function lerPref(){ try{ var v = localStorage.getItem(KEY); return v === null ? !reduz : v === "1"; }catch(e){ return !reduz; } }
  var ligado = lerPref();

  /* ---------- Versão ---------- */
  var ver = (typeof PESACERTO_VERSAO !== "undefined") ? PESACERTO_VERSAO : "1.0.0";
  var dt  = (typeof PESACERTO_DATA !== "undefined") ? PESACERTO_DATA : "";
  doc.querySelectorAll("[data-versao]").forEach(function(el){ el.textContent = "v" + ver; });
  doc.querySelectorAll("[data-versao-data]").forEach(function(el){ el.textContent = "v" + ver + (dt ? " · " + dt : ""); });

  /* ---------- Status online/offline ---------- */
  var ns = doc.getElementById("netStatus");
  function rede(){ if(!ns) return; var on = navigator.onLine; ns.classList.toggle("off", !on); ns.lastElementChild.textContent = on ? "Sistema online" : "Modo offline"; }
  addEventListener("online", rede); addEventListener("offline", rede); rede();

  /* ---------- Chuva ---------- */
  var cv = doc.createElement("canvas");
  cv.className = "chuva"; cv.setAttribute("aria-hidden", "true");
  doc.body.appendChild(cv);
  var cx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, gotas = [], splashes = [], raf = 0, ultimo = 0;

  function qtd(){ return Math.round(Math.min(90, Math.max(28, W / 16)) * (W < 760 ? .7 : 1)); }
  function nova(topo){
    var z = Math.random();                       // profundidade: perto = maior e mais rápida
    return { x: Math.random() * (W + 120) - 60, y: topo ? -20 - Math.random() * H : Math.random() * H,
             l: 10 + z * 22, v: 380 + z * 520, w: .6 + z * 1.3, a: .16 + z * .34 };
  }
  function ajusta(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gotas = []; for(var i = 0, n = qtd(); i < n; i++) gotas.push(nova(false));
  }
  function cor(a){
    return (root.getAttribute("data-theme") === "dark" ? "rgba(96,165,250," : "rgba(37,99,235,") + a + ")";
  }
  var VENTO = .22; // inclinação
  function quadro(t){
    raf = requestAnimationFrame(quadro);
    var dt = Math.min(.05, (t - ultimo) / 1000 || .016); ultimo = t;
    cx.clearRect(0, 0, W, H); cx.lineCap = "round";
    for(var i = 0; i < gotas.length; i++){
      var g = gotas[i];
      g.y += g.v * dt; g.x += g.v * dt * VENTO;
      if(g.y > H){
        if(g.a > .3 && Math.random() < .5) splashes.push({ x: g.x, y: H - 2, r: 1, a: .35 });
        gotas[i] = nova(true); gotas[i].y = -10; continue;
      }
      cx.strokeStyle = cor(g.a); cx.lineWidth = g.w;
      cx.beginPath(); cx.moveTo(g.x, g.y); cx.lineTo(g.x - g.l * VENTO, g.y - g.l); cx.stroke();
    }
    for(var s = splashes.length - 1; s >= 0; s--){
      var p = splashes[s]; p.r += 26 * dt; p.a -= .9 * dt;
      if(p.a <= 0){ splashes.splice(s, 1); continue; }
      cx.strokeStyle = cor(p.a); cx.lineWidth = 1;
      cx.beginPath(); cx.ellipse(p.x, p.y, p.r, p.r * .3, 0, 0, 6.283); cx.stroke();
    }
  }
  function inicia(){ if(raf || !ligado || doc.hidden) return; cv.style.display = ""; ultimo = performance.now(); raf = requestAnimationFrame(quadro); }
  function para(){ cancelAnimationFrame(raf); raf = 0; cx.clearRect(0, 0, W, H); }
  function aplica(){ if(ligado){ inicia(); } else { para(); cv.style.display = "none"; } }
  ajusta(); aplica();
  var rt; addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(ajusta, 150); });
  doc.addEventListener("visibilitychange", function(){ doc.hidden ? para() : aplica(); });

  var sw = doc.getElementById("prefChuva");
  if(sw){
    sw.checked = ligado;
    sw.addEventListener("change", function(){
      ligado = sw.checked;
      try{ localStorage.setItem(KEY, ligado ? "1" : "0"); }catch(e){}
      aplica();
    });
  }

  /* ---------- Efeito "ondinha" nos botões ---------- */
  doc.addEventListener("pointerdown", function(e){
    var b = e.target.closest && e.target.closest(".btn, .tabbar-btn, .acoes-btn, .btn-plus, .qty-btn");
    if(!b || reduz) return;
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 1.6;
    var s = doc.createElement("span"); s.className = "ripple";
    s.style.cssText = "width:" + d + "px;height:" + d + "px;left:" + (e.clientX - r.left - d / 2) + "px;top:" + (e.clientY - r.top - d / 2) + "px";
    if(getComputedStyle(b).position === "static") b.style.position = "relative";
    b.style.overflow = "hidden"; b.appendChild(s);
    setTimeout(function(){ s.remove(); }, 650);
  }, { passive: true });
})();
