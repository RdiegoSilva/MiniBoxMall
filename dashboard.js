/* PesaCerto — Dashboard (lê a lista e os códigos salvos neste navegador) */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  function get(k, f){ try{ var r = localStorage.getItem(k); return r ? JSON.parse(r) : f; }catch(e){ return f; } }
  function kg(n){ return (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " kg"; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dia(off){ var d = new Date(); d.setDate(d.getDate() - off); return d.toLocaleDateString("pt-BR"); }
  function delta(a, b, un){
    if(!b && !a) return ["sem dados", ""];
    if(!b) return ["novo hoje", "up"];
    var p = Math.round((a - b) / b * 100);
    return [(p >= 0 ? "↑ +" : "↓ ") + p + "% " + un, p >= 0 ? "up" : "down"];
  }
  function set(id, v, cls){ var e = $(id); if(!e) return; e.textContent = v; if(cls !== undefined) e.className = cls; }
  function num(s){ var n = parseFloat(String(s || "").replace(/\./g, "").replace(",", ".")); return isNaN(n) ? 0 : n; }

  function render(){
    var lista = get("pesacerto_lista_v2", []), cod = get("pesacerto_codigos_v2", {});
    var hoje = dia(0), ontem = dia(1), todas = [], h = [], o = [];
    lista.forEach(function(it){
      (it.pesagens || []).forEach(function(p, i){
        var r = { nome: it.nome || it.codigo || "—", bruto: p.pesoBruto || 0, tara: p.tara || 0, data: p.data, hora: p.hora, iso: p.horarioIso || "", at: it.status === "atencao", i: i };
        r.liq = r.bruto - r.tara; todas.push(r);
        if(r.data === hoje) h.push(r); else if(r.data === ontem) o.push(r);
      });
    });
    function soma(a){ return a.reduce(function(s, r){ return s + r.liq; }, 0); }
    set("dashData", "📅 " + new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }));
    set("stPesagens", h.length); var d1 = delta(h.length, o.length, "comparado a ontem"); set("stPesagensD", d1[0], d1[1]);
    set("stPeso", kg(soma(h))); var d2 = delta(soma(h), soma(o), "comparado a ontem"); set("stPesoD", d2[0], d2[1]);
    set("stProd", Object.keys(cod).length);
    var bons = h.filter(function(r){ return !r.at; }).length;
    set("stOk", h.length ? Math.round(bons / h.length * 100) + "%" : "—");
    set("stOkD", !h.length ? "Sem pesagens hoje" : (bons === h.length ? "Sem divergências" : (h.length - bons) + " em atenção"));

    todas.sort(function(a, b){ return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0; });
    var tb = $("dashUltimas");
    tb.innerHTML = todas.slice(0, 5).map(function(r){
      return "<tr><td>" + esc(r.data) + " " + esc(r.hora) + "</td><td>" + esc(r.nome) + "</td><td>" + kg(r.bruto) + "</td><td>" + kg(r.tara) + "</td><td class=\"cel-liquido\">" + kg(r.liq) + "</td><td><span class=\"pill-st " + (r.at ? "at" : "ok") + "\">" + (r.at ? "⚠ Atenção" : "✓ OK") + "</span></td></tr>";
    }).join("") || "<tr><td colspan=\"6\" class=\"empty-row\">Nenhuma pesagem ainda. Toque em Nova Pesagem.</td></tr>";

    var g = {}; h.forEach(function(r){ g[r.nome] = (g[r.nome] || 0) + r.liq; });
    var top = Object.keys(g).map(function(k){ return [k, g[k]]; }).sort(function(a, b){ return b[1] - a[1]; }).slice(0, 5), mx = top.length ? top[0][1] : 1;
    $("dashRank").innerHTML = top.map(function(t, i){
      return "<li><span class=\"rk\">" + (i + 1) + "</span><span class=\"rn\">" + esc(t[0]) + "</span><span class=\"bar\"><i style=\"width:" + Math.max(6, t[1] / mx * 100) + "%\"></i></span><b>" + kg(t[1]) + "</b></li>";
    }).join("") || "<li class=\"empty-row\">Sem pesagens hoje.</li>";

    set("lsItens", lista.length);
    set("lsLiq", kg(lista.reduce(function(s, it){ return s + (it.pesagens || []).reduce(function(a, p){ return a + (p.pesoBruto - p.tara); }, 0); }, 0)));
    set("lsAt", lista.filter(function(it){ return it.status === "atencao"; }).length);
    live();
  }

  function live(){
    var p = $("peso"), u = $("pesoUnidade"), b = parseFloat(String(p && p.value || "").replace(",", "."));
    if(isNaN(b)) b = 0; if(u && u.value === "g") b /= 1000;
    var l = num($("previewLiquido") && $("previewLiquido").textContent);
    set("trBruto", kg(b)); set("trLiq", kg(b ? l : 0)); set("trTara", kg(b ? Math.max(0, b - l) : 0));
  }
  document.addEventListener("input", live);

  /* pesquisa de produto */
  var busca = $("dashBusca"), res = $("dashRes");
  function usar(codigo){
    var c = $("codigo"); if(!c) return;
    document.querySelector('[data-tab-target="pesar"]').click();
    c.value = codigo; c.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(function(){ var p = $("peso"); if(p) p.focus(); }, 500);
    busca.value = ""; res.hidden = true;
  }
  function pesquisa(){
    var q = busca.value.trim().toLowerCase(), cod = get("pesacerto_codigos_v2", {});
    if(!q){ res.hidden = true; return; }
    var achou = Object.keys(cod).filter(function(k){ var n = (cod[k] && cod[k].nome) || cod[k] || ""; return k.toLowerCase().indexOf(q) >= 0 || String(n).toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
    res.innerHTML = achou.map(function(k){ var n = (cod[k] && cod[k].nome) || cod[k]; return "<button type=\"button\" data-cod=\"" + esc(k) + "\"><b>" + esc(k) + "</b> " + esc(n) + "</button>"; }).join("") || "<span class=\"nada\">Nenhum produto encontrado.</span>";
    res.hidden = false;
  }
  busca.addEventListener("input", pesquisa);
  busca.addEventListener("keydown", function(e){ if(e.key === "Enter"){ var b = res.querySelector("button"); if(b) usar(b.getAttribute("data-cod")); } });
  res.addEventListener("click", function(e){ var b = e.target.closest("button"); if(b) usar(b.getAttribute("data-cod")); });
  $("trSalvar").addEventListener("click", function(){ var a = $("btnAdd"); if(a) a.click(); });

  render();
  document.addEventListener("click", function(){ setTimeout(render, 80); });
  setInterval(function(){ var pn = document.querySelector(".panel-dashboard"); if(pn && pn.classList.contains("active") && !document.hidden) render(); }, 2000);
})();
