(function(){
  // Versão do site
  var v = (typeof PESACERTO_VERSAO !== "undefined") ? PESACERTO_VERSAO : "";
  document.querySelectorAll("[data-versao]").forEach(function(el){ el.textContent = el.tagName === "B" ? "versão " + v : "v" + v; });

  // Índice automático a partir dos títulos das seções
  var toc = document.getElementById("toc");
  document.querySelectorAll(".step[id]").forEach(function(sec){
    var h = sec.querySelector("h2"), n = h.querySelector("em");
    var a = document.createElement("a");
    a.href = "#" + sec.id;
    a.textContent = n.textContent + ". " + h.textContent.replace(n.textContent, "").trim();
    toc.appendChild(a);
  });

  // Barra de progresso de leitura
  var bar = document.getElementById("bar");
  function prog(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%";
  }
  window.addEventListener("scroll", prog, {passive:true}); prog();

  // Calculadora de exemplo (peso em kg ou g; tara em kg somada com +)
  var p = document.getElementById("cPeso"), u = document.getElementById("cUn"),
      t = document.getElementById("cTara"), r = document.getElementById("cRes");
  function num(s){ return parseFloat(String(s).replace(",", ".")); }
  function calc(){
    var peso = num(p.value); if(isNaN(peso)) peso = 0; if(u.value === "g") peso /= 1000;
    var tara = 0;
    String(t.value).replace(/,/g, ".").split(/[+;\s]+/).forEach(function(x){ var n = parseFloat(x); if(!isNaN(n) && n > 0) tara += n; });
    r.textContent = (peso - tara).toLocaleString("pt-BR", {minimumFractionDigits:3, maximumFractionDigits:3});
  }
  [p,u,t].forEach(function(el){ el.addEventListener("input", calc); });
  calc();
})();
