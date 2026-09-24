(function(){
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

  // Calculadora de exemplo
  var p = document.getElementById("cPeso"), t = document.getElementById("cTipo"),
      q = document.getElementById("cQtd"), r = document.getElementById("cRes");
  function calc(){
    var liq = ((parseFloat(p.value)||0) - (parseFloat(t.value)||0) * Math.max(1, parseInt(q.value,10)||1)) / 1000;
    r.textContent = liq.toLocaleString("pt-BR", {minimumFractionDigits:3, maximumFractionDigits:3});
  }
  [p,t,q].forEach(function(el){ el.addEventListener("input", calc); });
  calc();
})();
