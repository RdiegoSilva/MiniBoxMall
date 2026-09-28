(function(){
  "use strict";

  var TARA_KEY = "pesacerto_taras_v2";
  var LISTA_KEY = "pesacerto_lista_v2";
  var CODIGOS_KEY = "pesacerto_codigos_v2";
  var TRASH_KEY = "pesacerto_lixeira_v1";
  var TRASH_MAX_DIAS = 7;

  var DEFAULT_TARAS = { grande: 1.616, pequena: 0.934 };

  // migra dados salvos com nomes antigos ("rotativo_..." e "kgcalc_...") para as chaves atuais, sem perder nada
  function migrarChave(antiga, nova){
    try{
      if(localStorage.getItem(nova) === null && localStorage.getItem(antiga) !== null){
        localStorage.setItem(nova, localStorage.getItem(antiga));
      }
    }catch(e){}
  }
  migrarChave("kgcalc_taras_v2", TARA_KEY);
  migrarChave("kgcalc_lista_v2", LISTA_KEY);
  migrarChave("kgcalc_codigos_v2", CODIGOS_KEY);
  migrarChave("kgcalc_lixeira_v1", TRASH_KEY);
  migrarChave("rotativo_taras_v2", TARA_KEY);
  migrarChave("rotativo_lista_v2", LISTA_KEY);
  migrarChave("rotativo_codigos_v2", CODIGOS_KEY);

  function safeGet(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      if(raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    }catch(e){ return fallback; }
  }
  function safeSet(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e){ return false; }
  }

  var taras = safeGet(TARA_KEY, DEFAULT_TARAS);
  if (typeof taras.grande !== "number") taras.grande = DEFAULT_TARAS.grande;
  if (typeof taras.pequena !== "number") taras.pequena = DEFAULT_TARAS.pequena;

  // lista: [{ codigo, nome, tipoUltimo, criadoEm, atualizadoEm, pesagens:[{pesoBruto,tara,tipo,horario}] }]
  var lista = safeGet(LISTA_KEY, []);
  if(!Array.isArray(lista)) lista = [];

  var codigos = safeGet(CODIGOS_KEY, {});
  if(typeof codigos !== "object" || codigos === null) codigos = {};

  // Catálogo padrão de códigos → nome da carne (tipo de bandeja default: "grande").
  // Só é usado para PREENCHER códigos que ainda não existem no cadastro do navegador —
  // nunca sobrescreve um nome que você já editou/salvou manualmente.
  var CATALOGO_VERSAO = "2026-09-24";
  var CATALOGO_KEY = "pesacerto_catalogo_versao";
  var DEFAULT_CODIGOS = {
    // SUÍNOS
    "206": "CARRE SUÍNO",
    "6081": "COSTELA SUÍNA",
    "10148": "COSTELA SUÍNA CON",
    "9265": "PICANHA SUÍNA DO CHEF",
    "8909": "PRIME RIB GUAÍUBA SUÍNO",
    "8595": "SOBREPALETA SUÍNA",
    "212": "PERNIL SUÍNO C/OSSO",
    "8940": "PERNIL SUÍNO S/OSSO",
    "10335": "PICANHA SUÍNA PERDIGÃO NABRASA",
    "789300091189": "PICANHA SUÍNA SADIA 900G",
    "8903": "SARRAB SUÍNO",
    "926": "TRIPA SUÍNA",
    // SUÍNOS RESF
    "629": "BISTECA PALETA SUÍNA",
    "8901": "COPA LOMBO SUÍNO",
    "627": "COSTELA SUÍNA",
    "8900": "LOMBO SUÍNO C/OSSO",
    "8899": "PANCETA SUÍNA",
    "624": "PERNIL SUÍNO",
    "7181": "TOUCINHO SUÍNO",
    // BOVINOS
    "7534": "ANCHO ESTÂNCIA 92",
    "7643": "BABY BEEF ESTÂNCIA 92",
    "938": "BANANINHA P/ CHURRASCO",
    "7645": "BOMBOM ALC ESTÂNCIA 92",
    "9952": "CHORIZO ESTÂNCIA 92 ANGUS",
    "7644": "CHORIZO ESTÂNCIA 92 PEDAÇO",
    "8323": "COSTELA JAN ESTÂNCIA 92",
    "10760": "CUPIM BOLINHA ESTÂNCIA 92",
    "861": "CUPIM BOVINO CONG",
    "8854": "FRALDINHA ESTÂNCIA 92",
    "8144": "MAMINHA ALC ESTÂNCIA 92",
    "9953": "MAMINHA ANA PAUL ANG",
    "8836": "MAMINHA ARG PLATE",
    "9589": "MAMINHA BOV PLENA",
    "9609": "MAMINHA FRIBOI",
    "9333": "MAMINHA FRIGOTIL",
    "10811": "MAMINHA IMP BEEF CLUB",
    "9608": "MAMINHA MATURATTA",
    "8881": "MAMINHA PUL NACIONAL",
    "10406": "MAMINHA PUL SELECTION",
    "9259": "MAMINHA PUL URUGUAIA",
    "9611": "MAMINHA URUG FRIGOY",
    "7896": "PICANHA ARG CABANAS LAS",
    "10568": "PICANHA ARG FINEXCOR",
    "9613": "PICANHA ARG GORINA",
    "9954": "PICANHA ANA PAUL ANG",
    "10650": "PICANHA AUS KILCOY",
    "8276": "PICANHA ESTÂNCIA 92",
    "9612": "PICANHA MATURATTA",
    "9260": "PICANHA PUL NACIONAL",
    "9261": "PICANHA PUL URUGUAIA",
    "9615": "PICANHA URUG PANDO",
    "10891": "PICANHA BOVINA FRIBOI EM MEDALHÃO",
    "9956": "SHORT RIBS MINERVA ANGUS",
    "8238": "TOMAHAWK ESTÂNCIA 92",
    // BOVINOS RESF/CONG
    "9604": "CHORIZO DO CHEF",
    "8866": "CHORIZO MINERVA MESTRE",
    // BOVINOS DIV - MIÚDOS
    "805": "BAÇO BOVINO",
    "867": "BIFE FÍGADO BOVINO",
    "754": "BUCHO BOVINO",
    "1169": "CORAÇÃO BOVINO",
    "4": "FÍGADO BOVINO",
    "934": "BIFE FÍGADO BOVINO",
    "1936": "LÍNGUA BOVINA",
    "748": "MOCOTÓ BOVINO",
    "755": "PANELADA MINIBOX",
    "1645": "RABO BOVINO",
    "213": "RINS BOVINO",
    "749": "TRIPA BOVINA",
    // BOVINOS — COSTELA / DIANTEIRO E TRÁS
    "184": "COSTEL P.A",
    "9048": "COST JANELÃO RESERVA",
    "10961": "COST TRASEIRO FRIBOI MINGA",
    "200": "BIFE AMAC",
    "8670": "BIFE LIGHT",
    "167": "BIST PAULI",
    "6096": "BISTECA GA",
    "319": "COST PEITO",
    "180": "CUPIM",
    "176": "LOMBO C/OS",
    "68": "MÃO DE VAC",
    "179": "MOÍDA",
    "815": "MÚSCULO BO",
    "182": "OSSO BUCO",
    "6035": "PALETA",
    "6095": "STROGONOFF",
    // BOVINOS — CORTES TRÁS
    "390": "ALCATRA BO",
    "677": "BISTECA BO",
    "7272": "CAPA CONTR",
    "397": "CONTRA FIL",
    "398": "COXÃO DURO",
    "388": "COXÃO MOLE",
    "429": "FILE MIGNO",
    "650": "FRALDINHA",
    "389": "LAGARTO",
    "384": "MAMINHA",
    "653": "MUSCULO BO",
    "9686": "MUSCULO BO",
    "399": "PATINHO",
    "385": "PICANHA",
    "8915": "PICANHA FATIADA FRIGOTIL",
    // BOVINOS — DIVERSOS
    "9298": "CARNE DE SOL",
    // OVINOS E CAPRINOS
    "10648": "ALCATRA CORD ESTÂNCIA 92",
    "7614": "BISTECA DE CARNEIRO",
    "9785": "CARRE CORD C.OURO FRANCES",
    "10338": "CARRE CORD GUIAUBA FRANCES",
    "9781": "COST CORDEIR C.OURO",
    "8669": "COST CORDEIR ESTÂNCIA 92",
    "8667": "PALETA CORD ESTÂNCIA 92",
    "8668": "PERNIL CORD ESTÂNCIA 92",
    "9926": "PICANHA CORD GUIAUBA",
    "10649": "T BONE CORD ESTÂNCIA 92"
  };

  // Aplica a lista padrão: códigos novos são criados; ao subir a versão do catálogo, os nomes
  // dos códigos da lista são atualizados (o tipo de bandeja já salvo é mantido).
  (function mesclarCodigosPadrao(){
    var alterado = false;
    var versaoSalva = null;
    try{ versaoSalva = localStorage.getItem(CATALOGO_KEY); }catch(e){}
    var atualizarNomes = versaoSalva !== CATALOGO_VERSAO;
    Object.keys(DEFAULT_CODIGOS).forEach(function(cod){
      if(!codigos[cod]){
        codigos[cod] = { nome: DEFAULT_CODIGOS[cod], tipo: "grande" };
        alterado = true;
      } else if(atualizarNomes && codigos[cod].nome !== DEFAULT_CODIGOS[cod]){
        codigos[cod].nome = DEFAULT_CODIGOS[cod];
        alterado = true;
      }
    });
    if(alterado) safeSet(CODIGOS_KEY, codigos);
    try{ localStorage.setItem(CATALOGO_KEY, CATALOGO_VERSAO); }catch(e){}
  })();

  // lixeira: [{ id, tipo:'item'|'lote', label, deletedData, deletedHora, item?:{...}, items?:[...] }]
  var lixeira = safeGet(TRASH_KEY, []);
  if(!Array.isArray(lixeira)) lixeira = [];

  var suprimirAutoFill = false;

  var codigoInput = document.getElementById("codigo");
  var foundTag = document.getElementById("foundTag");
  var foundTagTxt = document.getElementById("foundTagTxt");
  var notfoundTag = document.getElementById("notfoundTag");
  var btnRegistrarCodigo = document.getElementById("btnRegistrarCodigo");
  var nomeInput = document.getElementById("nome");
  var bandejaSelect = document.getElementById("bandeja");
  var pesoInput = document.getElementById("peso");
  var qtdInput = document.getElementById("qtdBandejas");
  var qtdMenos = document.getElementById("qtdMenos");
  var qtdMais = document.getElementById("qtdMais");
  var qtdBandejasField = document.getElementById("qtdBandejasField");
  var mistaField = document.getElementById("mistaField");
  var qtdGrandesInput = document.getElementById("qtdGrandes");
  var qtdPequenasInput = document.getElementById("qtdPequenas");
  var taraExtraInput = document.getElementById("taraExtra");
  var taraPersonalizadaField = document.getElementById("taraPersonalizadaField");
  var taraPersonalizadaInput = document.getElementById("taraPersonalizada");
  var previewLiquido = document.getElementById("previewLiquido");
  var displayReadout = previewLiquido.closest(".display-readout");
  var btnAdd = document.getElementById("btnAdd");

  var taraGrandeInput = document.getElementById("taraGrande");
  var taraPequenaInput = document.getElementById("taraPequena");
  var btnSaveTara = document.getElementById("btnSaveTara");

  var listaEl = document.getElementById("lista");
  var listCountHint = document.getElementById("listCountHint");
  var btnClear = document.getElementById("btnClear");
  var btnToggleLixeira = document.getElementById("btnToggleLixeira");
  var lixeiraBadge = document.getElementById("lixeiraBadge");
  var lixeiraPanel = document.getElementById("lixeiraPanel");
  var lixeiraListEl = document.getElementById("lixeiraList");
  var btnEsvaziarLixeira = document.getElementById("btnEsvaziarLixeira");

  var modalOverlay = document.getElementById("modalOverlay");
  var modalMsg = document.getElementById("modalMsg");
  var modalSenhaInput = document.getElementById("modalSenhaInput");
  var modalErro = document.getElementById("modalErro");
  var modalConfirmar = document.getElementById("modalConfirmar");
  var modalCancelar = document.getElementById("modalCancelar");
  var btnCopy = document.getElementById("btnCopy");
  var btnPdf = document.getElementById("btnPdf");
  var btnEncerrar = document.getElementById("btnEncerrar");
  var toastEl = document.getElementById("toast");

  var totalItensEls = document.querySelectorAll("[data-total-itens]");
  var totalBrutoEls = document.querySelectorAll("[data-total-bruto]");
  var totalLiquidoEls = document.querySelectorAll("[data-total-liquido]");
  var topbarTotalVal = document.getElementById("topbarTotalVal");
  var ultimasPesagensEl = document.getElementById("ultimasPesagens");

  // formato dos pesos: 3 casas (101,900) ou 1 casa (101,9) — escolha em Configurações
  var casas = 3;
  try{ casas = localStorage.getItem("pesacerto_casas") === "1" ? 1 : 3; }catch(e){}
  function fmt(n){
    if(isNaN(n)) n = 0;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  // aceita vírgula ou ponto (101,9 ou 101.9)
  function numBR(raw){ return parseFloat(String(raw == null ? "" : raw).replace(",", ".")); }
  function unidadePeso(){ var u = document.getElementById("pesoUnidade"); return u ? u.value : "kg"; }
  // peso da balança: kg (como no visor) ou g, conforme o seletor
  function scaleToKg(raw){ var n = numBR(raw); if(isNaN(n)) return NaN; return unidadePeso() === "g" ? n / 1000 : n; }
  // soma ilimitada separada por + (ex.: "4+4+0,932+0,123" = 9,055). Retorna NaN se não houver nenhum número.
  function somaMais(raw){
    var soma = 0, achou = false;
    String(raw || "").replace(/,/g, ".").split(/[+;\s]+/).forEach(function(x){
      var n = parseFloat(x);
      if(!isNaN(n) && n >= 0){ soma += n; achou = true; }
    });
    return achou ? Math.round(soma * 1e6) / 1e6 : NaN;
  }
  function gramasToKg(raw){ return somaMais(raw); } // tara personalizada agora é em kg, com +

  function agora(){
    var d = new Date();
    return {
      iso: d.toISOString(),
      data: d.toLocaleDateString("pt-BR"),
      hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };
  }

  var toastTimer = null;
  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove("show"); }, 2200);
  }

  // ---------- Modal de senha de exclusão (senha revelada na tela: 1234) ----------
  var SENHA_EXCLUSAO = "1234";
  var acaoPendente = null;

  function pedirSenha(mensagem, aoConfirmar){
    acaoPendente = aoConfirmar;
    modalMsg.textContent = mensagem;
    modalSenhaInput.value = "";
    modalErro.classList.remove("show");
    modalOverlay.hidden = false;
    setTimeout(function(){ modalSenhaInput.focus(); }, 10);
  }

  function fecharModalSenha(){
    modalOverlay.hidden = true;
    acaoPendente = null;
  }

  function confirmarModalSenha(){
    if(!acaoPendente) return;
    if(modalSenhaInput.value === SENHA_EXCLUSAO){
      var executar = acaoPendente;
      fecharModalSenha();
      executar();
    } else {
      modalErro.classList.remove("show");
      void modalErro.offsetWidth;
      modalErro.classList.add("show");
      modalSenhaInput.value = "";
      modalSenhaInput.focus();
    }
  }

  modalConfirmar.addEventListener("click", confirmarModalSenha);
  modalCancelar.addEventListener("click", fecharModalSenha);
  modalOverlay.addEventListener("click", function(e){ if(e.target === modalOverlay) fecharModalSenha(); });
  modalSenhaInput.addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); confirmarModalSenha(); }
    if(e.key === "Escape"){ e.preventDefault(); fecharModalSenha(); }
  });

  // ---------- Lixeira (excluir com opção de recuperar) ----------
  function deepCopy(obj){ return JSON.parse(JSON.stringify(obj)); }

  function purgarLixeiraAntiga(){
    var limiteMs = TRASH_MAX_DIAS * 24 * 60 * 60 * 1000;
    var agoraMs = Date.now();
    lixeira = lixeira.filter(function(e){
      var t = e.deletedIso ? new Date(e.deletedIso).getTime() : agoraMs;
      return (agoraMs - t) < limiteMs;
    });
  }

  function pushLixeira(entrada){
    var t = agora();
    entrada.id = t.iso + "_" + Math.random().toString(36).slice(2, 8);
    entrada.deletedIso = t.iso;
    entrada.deletedData = t.data;
    entrada.deletedHora = t.hora;
    lixeira.unshift(entrada);
    purgarLixeiraAntiga();
    safeSet(TRASH_KEY, lixeira);
    renderLixeira();
  }

  function restaurarDaLixeira(id){
    var idx = lixeira.findIndex(function(e){ return e.id === id; });
    if(idx === -1) return;
    var entrada = lixeira[idx];

    if(entrada.tipo === "lote"){
      lista = entrada.items.concat(lista);
    } else if(entrada.tipo === "item"){
      var i = -1;
      if(entrada.item.codigo){
        i = lista.findIndex(function(it){ return it.codigo && it.codigo.toLowerCase() === entrada.item.codigo.toLowerCase(); });
      }
      if(i > -1){ lista.splice(i, 1); }
      lista.unshift(entrada.item);
    }

    lixeira.splice(idx, 1);
    safeSet(LISTA_KEY, lista);
    safeSet(TRASH_KEY, lixeira);
    renderLista(0);
    renderLixeira();
    toast("♻️ Pesagem restaurada");
  }

  function excluirDaLixeiraDefinitivo(id){
    var idx = lixeira.findIndex(function(e){ return e.id === id; });
    if(idx === -1) return;
    lixeira.splice(idx, 1);
    safeSet(TRASH_KEY, lixeira);
    renderLixeira();
  }

  function renderLixeira(){
    purgarLixeiraAntiga();
    safeSet(TRASH_KEY, lixeira);

    lixeiraBadge.textContent = lixeira.length;
    btnToggleLixeira.classList.toggle("has-items", lixeira.length > 0);

    lixeiraListEl.innerHTML = "";
    if(lixeira.length === 0){
      var vazio = document.createElement("div");
      vazio.className = "lixeira-empty";
      vazio.textContent = "A lixeira está vazia.";
      lixeiraListEl.appendChild(vazio);
      return;
    }

    lixeira.forEach(function(entrada){
      var row = document.createElement("div");
      row.className = "lixeira-item";

      var info = document.createElement("div");
      info.className = "lixeira-item-info";

      var nome = document.createElement("span");
      nome.className = "nome";
      nome.textContent = entrada.label;
      info.appendChild(nome);

      var meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = "Excluído em " + entrada.deletedData + " às " + entrada.deletedHora;
      info.appendChild(meta);

      row.appendChild(info);

      var actions = document.createElement("div");
      actions.className = "lixeira-item-actions";

      var btnRestaurar = document.createElement("button");
      btnRestaurar.className = "btn btn-outline-ok btn-sm";
      btnRestaurar.type = "button";
      btnRestaurar.textContent = "♻️ Restaurar";
      btnRestaurar.addEventListener("click", function(){ restaurarDaLixeira(entrada.id); });
      actions.appendChild(btnRestaurar);

      var btnExcluir = document.createElement("button");
      btnExcluir.className = "btn btn-outline-danger btn-sm";
      btnExcluir.type = "button";
      btnExcluir.textContent = "Excluir";
      btnExcluir.addEventListener("click", function(){
        pedirSenha("Excluir definitivamente \"" + entrada.label + "\"? Essa ação não pode ser desfeita.", function(){
          excluirDaLixeiraDefinitivo(entrada.id);
        });
      });
      actions.appendChild(btnExcluir);

      row.appendChild(actions);
      lixeiraListEl.appendChild(row);
    });
  }

  btnToggleLixeira.addEventListener("click", function(){
    var abrir = lixeiraPanel.hasAttribute("hidden");
    if(abrir){ lixeiraPanel.removeAttribute("hidden"); renderLixeira(); }
    else { lixeiraPanel.setAttribute("hidden", ""); }
  });

  btnEsvaziarLixeira.addEventListener("click", function(){
    if(lixeira.length === 0) return;
    pedirSenha("Excluir definitivamente todos os itens da lixeira? Essa ação não pode ser desfeita.", function(){
      lixeira = [];
      safeSet(TRASH_KEY, lixeira);
      renderLixeira();
    });
  });

  // ---------- Navegação por abas (mobile) ----------
  var tabButtons = document.querySelectorAll(".tabbar-btn");
  var tabPanels = document.querySelectorAll(".tab-panel");
  function ativarAba(nome){
    tabPanels.forEach(function(p){ p.classList.toggle("active", p.getAttribute("data-tab") === nome); });
    tabButtons.forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-tab-target") === nome); });
  }
  tabButtons.forEach(function(btn){
    btn.addEventListener("click", function(){ ativarAba(btn.getAttribute("data-tab-target")); });
  });

  function toggleTaraPersonalizadaField(){
    var v = bandejaSelect.value;
    if(v === "personalizada"){ taraPersonalizadaField.classList.remove("hidden"); taraPersonalizadaField.style.display = ""; }
    else{ taraPersonalizadaField.style.display = "none"; }
    mistaField.style.display = (v === "mista") ? "" : "none";
    qtdBandejasField.style.display = (v === "mista" || v === "nenhuma") ? "none" : "";
  }

  function taraFor(tipo){
    if(tipo === "grande") return taras.grande;
    if(tipo === "pequena") return taras.pequena;
    if(tipo === "personalizada") return gramasToKg(taraPersonalizadaInput.value) || 0;
    return 0;
  }
  function getQtd(){
    var n = parseInt(qtdInput.value, 10);
    return (isNaN(n) || n < 1) ? 1 : Math.min(n, 20);
  }
  function setQtd(n){
    qtdInput.value = Math.max(1, Math.min(20, n));
    updatePreview();
  }
  function lerQtdMista(input){
    var n = parseInt(input.value, 10);
    return (isNaN(n) || n < 0) ? 0 : Math.min(n, 20);
  }
  // tara extra (digitada em kg, separada por +) devolvida em gramas
  function lerExtraGramas(){
    var kg = somaMais(taraExtraInput.value);
    return isNaN(kg) ? 0 : Math.round(kg * 1000 * 1000) / 1000; // guardado em gramas (compatível com o histórico)
  }
  function getMista(){ return { g: lerQtdMista(qtdGrandesInput), p: lerQtdMista(qtdPequenasInput), x: lerExtraGramas() }; }
  function taraTotal(tipo){
    if(tipo === "mista"){ var m = getMista(); return m.g * taras.grande + m.p * taras.pequena + m.x / 1000; }
    return taraFor(tipo) * getQtd();
  }
  function tipoLabel(tipo, qtd, mista){
    if(tipo === "mista"){
      var m = mista || { g: 0, p: 0, x: 0 }, partes = [];
      if(m.g) partes.push(m.g + "× grande");
      if(m.p) partes.push(m.p + "× pequena");
      if(m.x) partes.push(String(m.x / 1000).replace(".", ",") + " kg personalizada");
      return "Bandejas: " + (partes.join(" + ") || "nenhuma");
    }
    var base = tipoLabelBase(tipo);
    return (qtd && qtd > 1 && tipo !== "nenhuma") ? qtd + "× " + base : base;
  }
  function tipoLabelBase(tipo){
    if(tipo === "grande") return "Bandeja grande";
    if(tipo === "pequena") return "Bandeja pequena";
    if(tipo === "personalizada") return "Tara personalizada";
    return "Sem bandeja";
  }

  function loadTarasIntoInputs(){
    taraGrandeInput.value = taras.grande;
    taraPequenaInput.value = taras.pequena;
  }


  // ---------- Extras: feedback, desfazer, histórico do código, aviso de peso ----------
  var histTag = document.getElementById("histTag");
  var undoBar = document.getElementById("undoBar");
  var undoBtn = document.getElementById("undoBtn");
  var avisoModal = document.getElementById("avisoModal");
  var avisoMsg = document.getElementById("avisoMsg");
  var avisoCorrigir = document.getElementById("avisoCorrigir");
  var avisoContinuar = document.getElementById("avisoContinuar");
  var pesagemConfirmada = false;
  var undoSnap = null, undoTimer = null, avisoAcao = null;

  function fx(nome){ try{ if(window.PesaFX && window.PesaFX[nome]) window.PesaFX[nome](); }catch(e){} }

  function mostrarDesfazer(snap){
    undoSnap = snap;
    undoBar.hidden = false;
    undoBar.classList.remove("run"); void undoBar.offsetWidth; undoBar.classList.add("run");
    clearTimeout(undoTimer);
    undoTimer = setTimeout(esconderDesfazer, 8000);
  }
  function esconderDesfazer(){
    clearTimeout(undoTimer);
    undoSnap = null;
    if(undoBar) undoBar.hidden = true;
  }
  undoBtn.addEventListener("click", function(){
    if(!undoSnap) return;
    var snap = undoSnap;
    lista = snap;
    safeSet(LISTA_KEY, lista);
    renderLista();
    toast("↩️ Pesagem desfeita");
  });

  function atualizarHist(codigo){
    histTag.hidden = true;
    if(!codigo) return;
    var item = lista.find(function(it){ return it.codigo && it.codigo.toLowerCase() === codigo.toLowerCase(); });
    if(!item || !item.pesagens.length) return;
    var hoje = agora().data, soma = 0, n = 0;
    item.pesagens.forEach(function(p){ if(p.data === hoje){ soma += p.pesoBruto - p.tara; n++; } });
    var u = item.pesagens[item.pesagens.length - 1];
    histTag.innerHTML = "🕘 Última: <b>" + fmt(u.pesoBruto - u.tara) + " kg</b> às " + u.hora +
      " &nbsp;·&nbsp; Hoje: <b>" + n + "</b> " + (n === 1 ? "pesagem" : "pesagens") + ", <b>" + fmt(soma) + " kg</b> líquido";
    histTag.hidden = false;
  }

  function analisarPeso(codigo, liq){
    if(liq <= 0) return "O líquido deu " + fmt(liq) + " kg: o peso está menor que a bandeja. Confira se digitou em gramas (1,5 kg = 1500).";
    return ""; // avisos de peso alto / fora da média removidos (balança pode pesar 100 kg ou mais)
    if(codigo){
      var item = lista.find(function(it){ return it.codigo && it.codigo.toLowerCase() === codigo.toLowerCase(); });
      if(item && item.pesagens.length){
        var soma = 0;
        item.pesagens.forEach(function(p){ soma += p.pesoBruto - p.tara; });
        var media = soma / item.pesagens.length;
        if(liq > media * 4 && liq - media > 2) return "Esta pesagem (" + fmt(liq) + " kg) é mais de 4× a média deste código (" + fmt(media) + " kg). Confira o peso digitado.";
        if(media > 1 && liq < media / 5) return "Esta pesagem (" + fmt(liq) + " kg) é bem menor que a média deste código (" + fmt(media) + " kg). Faltou algum zero?";
      }
    }
    return "";
  }
  function mostrarAviso(msg, aoContinuar){
    avisoMsg.textContent = msg;
    avisoAcao = aoContinuar;
    avisoModal.hidden = false;
    fx("erro");
    avisoCorrigir.focus();
  }
  function fecharAviso(){ avisoModal.hidden = true; avisoAcao = null; }
  avisoCorrigir.addEventListener("click", function(){ fecharAviso(); pesoInput.focus(); pesoInput.select(); });
  avisoContinuar.addEventListener("click", function(){ var f = avisoAcao; fecharAviso(); if(f) f(); });
  avisoModal.addEventListener("click", function(e){ if(e.target === avisoModal) fecharAviso(); });

  function logoParaPdf(){
    return new Promise(function(resolve){
      try{
        var origem = document.querySelector(".logo-box img");
        var src = origem && origem.getAttribute("src");
        if(!src) src = "logo.png";

        var img = new Image();
        img.onload = function(){
          try{
            var c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            c.getContext("2d").drawImage(img, 0, 0);
            resolve({ url: c.toDataURL("image/png"), w: c.width, h: c.height });
          }catch(e){ resolve(null); }
        };
        img.onerror = function(){ resolve(null); };
        img.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "pdf=" + Date.now();
      }catch(e){ resolve(null); }
    });
  }

  function tick(el){ el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }

  function updatePreview(){
    var peso = scaleToKg(pesoInput.value);
    if(isNaN(peso)) peso = 0;
    var tara = taraTotal(bandejaSelect.value);
    previewLiquido.textContent = fmt(peso - tara);
    tick(displayReadout);
    var th = document.getElementById("taraPersHint");
    if(th){
      var st = somaMais(taraPersonalizadaInput.value);
      th.textContent = isNaN(st) ? "Some quantas quiser com o botão +. Ex.: 4+4+0,932+0,123 = 9,055 kg" : "Total da tara: " + fmt(st) + " kg";
    }
  }

  var TEXTO_ENCONTRADO = "Código já cadastrado — esta pesagem vai somar";
  var autoFillTimer = null;

  function tentarAutoPreencher(){
    if(suprimirAutoFill) return;
    clearTimeout(autoFillTimer);
    var codigo = codigoInput.value.trim();
    if(!codigo){
      foundTag.classList.remove("show", "checking");
      notfoundTag.classList.remove("show");
      return;
    }
    atualizarHist(codigo);
    var salvo = codigos[codigo];
    if(salvo){
      nomeInput.value = salvo.nome || "";
      bandejaSelect.value = salvo.tipo || "grande";
      toggleTaraPersonalizadaField();
      if(salvo.tipo === "personalizada"){
        if(salvo.taraTexto != null) taraPersonalizadaInput.value = salvo.taraTexto;
        else if(salvo.taraGramas != null) taraPersonalizadaInput.value = String(salvo.taraGramas / 1000).replace(".", ",");
      }
      foundTagTxt.textContent = TEXTO_ENCONTRADO;
      foundTag.classList.remove("checking");
      foundTag.classList.add("show");
      notfoundTag.classList.remove("show");
      updatePreview();
      pesoInput.focus();
    } else {
      foundTag.classList.remove("show", "checking");
      notfoundTag.classList.add("show");
    }
  }

  // Reconhece o código automaticamente enquanto o usuário digita (sem precisar de Tab/Enter),
  // com uma pausa curta (450ms) pra não interromper no meio da digitação.
  codigoInput.addEventListener("input", function(){
    if(suprimirAutoFill) return;
    clearTimeout(autoFillTimer);
    var codigo = codigoInput.value.trim();
    foundTag.classList.remove("show");
    notfoundTag.classList.remove("show");
    atualizarHist("");
    if(!codigo){ foundTag.classList.remove("checking"); return; }
    foundTagTxt.textContent = "Verificando código…";
    foundTag.classList.add("checking");
    autoFillTimer = setTimeout(tentarAutoPreencher, 450);
  });

  function salvarCodigo(codigo, nome, tipo){
    if(!codigo) return;
    var entrada = { nome: nome, tipo: tipo };
    if(tipo === "personalizada"){ entrada.taraTexto = taraPersonalizadaInput.value.trim(); entrada.taraGramas = (somaMais(taraPersonalizadaInput.value) || 0) * 1000; }
    codigos[codigo] = entrada;
    safeSet(CODIGOS_KEY, codigos);
  }

  btnRegistrarCodigo.addEventListener("click", function(){
    var codigo = codigoInput.value.trim();
    var nome = nomeInput.value.trim();
    if(!codigo) return;
    if(!nome){
      nomeInput.focus();
      toast("✍️ Digite o nome da carne antes de registrar");
      return;
    }
    salvarCodigo(codigo, nome, bandejaSelect.value);
    notfoundTag.classList.remove("show");
    foundTagTxt.textContent = "Código cadastrado! Próxima vez ele já vem sozinho";
    foundTag.classList.remove("checking");
    foundTag.classList.add("show");
    toast("✅ Código " + codigo + " cadastrado");
  });

  function limparFormulario(){
    clearTimeout(autoFillTimer);
    codigoInput.value = "";
    nomeInput.value = "";
    pesoInput.value = "";
    taraPersonalizadaInput.value = "";
    bandejaSelect.value = "grande";
    qtdInput.value = 1;
    qtdGrandesInput.value = 1;
    qtdPequenasInput.value = 1;
    taraExtraInput.value = "";
    atualizarHist("");
    foundTag.classList.remove("show", "checking");
    notfoundTag.classList.remove("show");
    toggleTaraPersonalizadaField();
    updatePreview();
  }

  function agregados(item){
    var bruto = item.pesagens.reduce(function(a,p){ return a + p.pesoBruto; }, 0);
    var tara = item.pesagens.reduce(function(a,p){ return a + p.tara; }, 0);
    return { bruto: bruto, tara: tara, liquido: bruto - tara, qtd: item.pesagens.length };
  }

  function flashTotais(){
    [].concat(
      Array.prototype.slice.call(totalItensEls),
      Array.prototype.slice.call(totalBrutoEls),
      Array.prototype.slice.call(totalLiquidoEls)
    ).forEach(function(el){
      el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    });
  }

  // Renomeia um item da lista e mantém o cadastro do código (autopreenchimento) em sincronia.
  function renomearItem(idx, novoNome){
    var item = lista[idx];
    if(!item) return;
    novoNome = (novoNome || "").trim();
    if(!novoNome || novoNome === item.nome) return;
    item.nome = novoNome;
    if(item.codigo && codigos[item.codigo]){
      codigos[item.codigo].nome = novoNome;
      safeSet(CODIGOS_KEY, codigos);
    }
    safeSet(LISTA_KEY, lista);
    toast("✏️ Nome atualizado");
    renderLista();
  }

  function entrarModoEdicaoNome(idBox, idx, item){
    var nameSpan = idBox.querySelector(".name");
    if(!nameSpan) return;
    var input = document.createElement("input");
    input.type = "text";
    input.className = "name-edit-input";
    input.value = item.nome || "";
    nameSpan.replaceWith(input);
    input.focus();
    input.select();

    var finalizado = false;
    function confirmar(){
      if(finalizado) return;
      finalizado = true;
      renomearItem(idx, input.value);
    }
    function cancelar(){
      if(finalizado) return;
      finalizado = true;
      renderLista();
    }
    input.addEventListener("blur", confirmar);
    input.addEventListener("keydown", function(e){
      if(e.key === "Enter"){ e.preventDefault(); input.blur(); }
      if(e.key === "Escape"){ e.preventDefault(); cancelar(); }
    });
  }

  var selecionados = [];
  var bulkBar = document.getElementById("bulkBar"), bulkAll = document.getElementById("bulkAll"), bulkInfo = document.getElementById("bulkInfo");
  function atualizarBulk(){
    if(!bulkBar) return;
    selecionados = selecionados.filter(function(it){ return lista.indexOf(it) > -1; });
    bulkBar.hidden = lista.length === 0;
    var n = selecionados.length;
    bulkAll.checked = n > 0 && n === lista.length;
    bulkAll.indeterminate = n > 0 && n < lista.length;
    bulkInfo.textContent = n ? n + (n === 1 ? " selecionado" : " selecionados") : "Selecionar todos";
    bulkBar.classList.toggle("tem-sel", n > 0);
    Array.prototype.forEach.call(bulkBar.querySelectorAll("[data-bulk]"), function(b){ b.disabled = n === 0; });
  }
  if(bulkBar){
    bulkAll.addEventListener("change", function(){ selecionados = bulkAll.checked ? lista.slice() : []; renderLista(); });
    bulkBar.addEventListener("click", function(e){
      var b = e.target.closest("[data-bulk]"); if(!b || !selecionados.length) return;
      var acao = b.getAttribute("data-bulk"), alvo = selecionados.slice(), n = alvo.length;
      if(acao === "ok" || acao === "atencao"){
        alvo.forEach(function(it){ it.status = acao; });
        safeSet(LISTA_KEY, lista); selecionados = []; renderLista();
        toast((acao === "ok" ? "✔️ " : "⚠️ ") + n + (n === 1 ? " item marcado como " : " itens marcados como ") + (acao === "ok" ? "OK" : "ATENÇÃO"));
      } else if(acao === "excluir"){
        pedirSenha("Mover " + n + (n === 1 ? " item" : " itens") + " para a lixeira?", function(){
          alvo.forEach(function(it){
            pushLixeira({ tipo: "item", label: (it.codigo ? it.codigo + " — " : "") + it.nome, item: deepCopy(it) });
            var i = lista.indexOf(it); if(i > -1) lista.splice(i, 1);
          });
          safeSet(LISTA_KEY, lista); selecionados = []; renderLista();
          toast("🗑️ " + n + (n === 1 ? " item movido" : " itens movidos") + " para a lixeira");
        });
      }
    });
  }
  function renderLista(idxDestaque){ renderListaBase(idxDestaque); atualizarBulk(); }
  function renderListaBase(idxDestaque){
    if(idxDestaque === undefined) esconderDesfazer();
    listaEl.innerHTML = "";

    if(lista.length === 0){
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Nenhuma pesagem adicionada ainda.";
      listaEl.appendChild(empty);
    } else {
      lista.forEach(function(item, idx){
        var ag = agregados(item);

        var ticket = document.createElement("div");
        ticket.className = "ticket";
        if(idx === idxDestaque){ ticket.classList.add("entering"); }
        if(item.status === "ok") ticket.classList.add("status-ok");
        else if(item.status === "atencao") ticket.classList.add("status-atencao");

        var head = document.createElement("div");
        head.className = "ticket-head";

        var chk = document.createElement("input");
        chk.type = "checkbox"; chk.className = "sel-chk"; chk.setAttribute("aria-label", "Selecionar item");
        chk.checked = selecionados.indexOf(item) > -1;
        chk.addEventListener("change", function(){
          var p = selecionados.indexOf(item);
          if(chk.checked && p < 0) selecionados.push(item); else if(!chk.checked && p > -1) selecionados.splice(p, 1);
          atualizarBulk();
        });
        head.appendChild(chk);

        var idBox = document.createElement("div");
        idBox.className = "ticket-id";

        var codChip = document.createElement("span");
        if(item.codigo){
          codChip.className = "chip-codigo";
          codChip.textContent = item.codigo;
        } else {
          codChip.className = "chip-codigo sem-codigo";
          codChip.textContent = "S/ CÓD";
        }
        idBox.appendChild(codChip);

        var name = document.createElement("span");
        name.className = "name";
        name.textContent = item.nome || "(sem nome)";
        idBox.appendChild(name);

        var countBadge = document.createElement("span");
        countBadge.className = "badge-count";
        countBadge.textContent = "· " + ag.qtd + (ag.qtd === 1 ? " pesagem" : " pesagens");
        idBox.appendChild(countBadge);
        head.appendChild(idBox);

        var actions = document.createElement("div");
        actions.className = "ticket-actions";

        [["ok", "✔️", "Marcar como conferido"], ["atencao", "⚠️", "Marcar como atenção"]].forEach(function(st){
          var b = document.createElement("button");
          b.type = "button";
          b.className = "btn btn-icon-round st-btn st-" + st[0] + (item.status === st[0] ? " on" : "");
          b.title = st[2];
          b.setAttribute("aria-pressed", String(item.status === st[0]));
          b.textContent = st[1];
          b.addEventListener("click", function(){
            item.status = (item.status === st[0]) ? "" : st[0];
            safeSet(LISTA_KEY, lista);
            renderLista();
          });
          actions.appendChild(b);
        });

        var editBtn = document.createElement("button");
        editBtn.className = "btn btn-icon-round";
        editBtn.type = "button";
        editBtn.title = "Editar nome da carne";
        editBtn.textContent = "✏️";
        editBtn.addEventListener("click", function(){ entrarModoEdicaoNome(idBox, idx, item); });
        actions.appendChild(editBtn);

        var delBtn = document.createElement("button");
        delBtn.className = "btn btn-icon-round danger";
        delBtn.type = "button";
        delBtn.title = "Mover para a lixeira";
        delBtn.textContent = "🗑️";
        delBtn.addEventListener("click", function(){
          pedirSenha("Mover \"" + (item.codigo || item.nome) + "\" para a lixeira?", function(){
            pushLixeira({ tipo: "item", label: (item.codigo ? item.codigo + " — " : "") + item.nome, item: deepCopy(item) });
            lista.splice(idx, 1);
            safeSet(LISTA_KEY, lista);
            renderLista();
            toast("🗑️ Movido para a lixeira");
          });
        });
        actions.appendChild(delBtn);
        head.appendChild(actions);

        ticket.appendChild(head);

        var meta = document.createElement("div");
        meta.className = "ticket-meta";
        meta.innerHTML =
          "<span>" + tipoLabel(item.tipoUltimo, item.qtdUltimo, item.mistaUltimo) + "</span>" +
          "<span>Bruto: <b>" + fmt(ag.bruto) + " kg</b></span>" +
          "<span>Tara: <b>" + fmt(ag.tara) + " kg</b></span>" +
          "<span>Última: <b>" + item.atualizadoData + " " + item.atualizadoHora + "</b></span>";
        ticket.appendChild(meta);

        var liquidoEl = document.createElement("div");
        liquidoEl.className = "ticket-liquido";
        liquidoEl.innerHTML = "<span class=\"lbl\">Líquido total</span><b>" + fmt(ag.liquido) + " kg</b>";
        ticket.appendChild(liquidoEl);

        var det = document.createElement("details");
        det.className = "pesagens";
        var sum = document.createElement("summary");
        sum.textContent = "Ver pesagens (" + ag.qtd + ")";
        det.appendChild(sum);
        item.pesagens.forEach(function(p, pIdx){
          var row = document.createElement("div");
          row.className = "pesagem-row";
          row.innerHTML =
            "<span>" + p.data + " " + p.hora + " — " + tipoLabel(p.tipo, p.qtdBandejas, p.mista) + "</span>" +
            "<span>Bruto <b>" + fmt(p.pesoBruto) + "</b> · Tara <b>" + fmt(p.tara) + "</b> · Líq <b>" + fmt(p.pesoBruto - p.tara) + "</b> kg</span>";
          var rm = document.createElement("button");
          rm.className = "btn btn-outline-danger btn-remover-pesagem";
          rm.type = "button";
          rm.textContent = "Remover";
          rm.addEventListener("click", function(){
            pedirSenha("Remover esta pesagem?", function(){
              pushLixeira({ tipo: "item", label: (item.codigo ? item.codigo + " — " : "") + item.nome, item: deepCopy(item) });
              item.pesagens.splice(pIdx, 1);
              if(item.pesagens.length === 0){
                lista.splice(idx, 1);
              }
              safeSet(LISTA_KEY, lista);
              renderLista();
              toast("🗑️ Pesagem movida para a lixeira");
            });
          });
          row.appendChild(rm);
          det.appendChild(row);
        });
        ticket.appendChild(det);

        listaEl.appendChild(ticket);
      });
    }

    var somaBruto = 0, somaLiquido = 0;
    lista.forEach(function(item){ var ag = agregados(item); somaBruto += ag.bruto; somaLiquido += ag.liquido; });

    totalItensEls.forEach(function(el){ el.textContent = lista.length; });
    totalBrutoEls.forEach(function(el){ el.textContent = fmt(somaBruto) + " kg"; });
    totalLiquidoEls.forEach(function(el){ el.textContent = fmt(somaLiquido) + " kg"; });
    topbarTotalVal.innerHTML = fmt(somaLiquido) + " <small>kg</small>";
    listCountHint.textContent = lista.length + (lista.length === 1 ? " item" : " itens");
    flashTotais();
    renderUltimasPesagens();
  }

  // ---------- Card "Últimas pesagens" (resumo na aba Pesar) ----------
  var btnLimparUltimas = document.getElementById("btnLimparUltimas");
  if(btnLimparUltimas){
    btnLimparUltimas.addEventListener("click", function(){
      if(!window.confirm("Limpar a tabela de últimas pesagens?\n\nSuas pesagens da lista NÃO são apagadas — só somem desta tabela.")) return;
      try{ localStorage.setItem("pesacerto_ultimas_limpas", new Date().toISOString()); }catch(e){}
      renderUltimasPesagens();
      toast("🧹 Últimas pesagens limpas");
    });
  }
  function renderUltimasPesagens(){
    if(!ultimasPesagensEl) return;
    var linhas = [];
    lista.forEach(function(item){
      item.pesagens.forEach(function(p){
        linhas.push({
          codigo: item.codigo || "—",
          nome: item.nome || "(sem nome)",
          bruto: p.pesoBruto,
          tara: p.tara,
          liquido: p.pesoBruto - p.tara,
          data: p.data, hora: p.hora, iso: p.horarioIso || "",
          ordem: (p.data || "") + " " + (p.hora || "")
        });
      });
    });
    var corte = ""; try{ corte = localStorage.getItem("pesacerto_ultimas_limpas") || ""; }catch(e){}
    if(corte) linhas = linhas.filter(function(l){ return l.iso && l.iso > corte; });
    linhas.sort(function(a,b){ return b.ordem.localeCompare(a.ordem); });
    linhas = linhas.slice(0, 6);

    ultimasPesagensEl.innerHTML = "";
    if(linhas.length === 0){
      var tr = document.createElement("tr");
      tr.innerHTML = "<td colspan='6' class='empty-row'>Nenhuma pesagem registrada ainda.</td>";
      ultimasPesagensEl.appendChild(tr);
      return;
    }
    linhas.forEach(function(l){
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td><span class='chip-codigo chip-mini'>" + l.codigo + "</span></td>" +
        "<td>" + l.nome + "</td>" +
        "<td>" + fmt(l.bruto) + " kg</td>" +
        "<td>" + fmt(l.tara) + " kg</td>" +
        "<td class='cel-liquido'>" + fmt(l.liquido) + " kg</td>" +
        "<td>" + (l.hora || "") + "</td>";
      ultimasPesagensEl.appendChild(tr);
    });
  }

  btnAdd.addEventListener("click", function(){
    var codigo = codigoInput.value.trim();
    var nome = nomeInput.value.trim();
    var peso = scaleToKg(pesoInput.value);
    var tipo = bandejaSelect.value;

    if(!nome){ nomeInput.focus(); ativarAba("pesar"); return; }
    if(isNaN(peso) || peso <= 0){ pesoInput.focus(); ativarAba("pesar"); return; }
    if(tipo === "personalizada" && isNaN(somaMais(taraPersonalizadaInput.value))){
      taraPersonalizadaInput.focus();
      ativarAba("pesar");
      return;
    }

    var qtdBandejas = getQtd();
    var mista = (tipo === "mista") ? getMista() : null;
    var tara = taraTotal(tipo);
    var aviso = pesagemConfirmada ? "" : analisarPeso(codigo, peso - tara);
    if(aviso){
      mostrarAviso(aviso, function(){ pesagemConfirmada = true; btnAdd.click(); });
      return;
    }
    var marcarAtencao = pesagemConfirmada;
    pesagemConfirmada = false;
    var snapDesfazer = deepCopy(lista);
    var t = agora();
    var pesagem = { pesoBruto: peso, tara: tara, tipo: tipo, qtdBandejas: qtdBandejas, mista: mista, data: t.data, hora: t.hora, horarioIso: t.iso };

    var idxExistente = -1;
    if(codigo){
      idxExistente = lista.findIndex(function(it){ return it.codigo && it.codigo.toLowerCase() === codigo.toLowerCase(); });
    }

    var idxFinal;
    if(idxExistente > -1){
      var itemExistente = lista[idxExistente];
      itemExistente.pesagens.push(pesagem);
      itemExistente.nome = nome;
      itemExistente.tipoUltimo = tipo;
      itemExistente.qtdUltimo = qtdBandejas;
      itemExistente.mistaUltimo = mista;
      itemExistente.atualizadoData = t.data;
      itemExistente.atualizadoHora = t.hora;
      // move para o topo, como "recém atualizado"
      lista.splice(idxExistente, 1);
      lista.unshift(itemExistente);
      idxFinal = 0;
    } else {
      lista.unshift({
        codigo: codigo,
        nome: nome,
        tipoUltimo: tipo,
        qtdUltimo: qtdBandejas,
        mistaUltimo: mista,
        criadoData: t.data,
        criadoHora: t.hora,
        atualizadoData: t.data,
        atualizadoHora: t.hora,
        pesagens: [pesagem]
      });
      idxFinal = 0;
    }

    lista[0].status = marcarAtencao ? "atencao" : "";
    if(marcarAtencao) pesagem.aviso = true;
    salvarCodigo(codigo, nome, tipo);
    safeSet(LISTA_KEY, lista);
    renderLista(idxFinal);
    limparFormulario();
    toast(marcarAtencao ? "⚠️ Adicionada e marcada para conferir" : "✅ Pesagem adicionada");
    fx("ok");
    mostrarDesfazer(snapDesfazer);
    codigoInput.focus();
  });

  btnSaveTara.addEventListener("click", function(){
    var g = parseFloat(taraGrandeInput.value);
    var p = parseFloat(taraPequenaInput.value);
    if(!isNaN(g) && g >= 0) taras.grande = g;
    if(!isNaN(p) && p >= 0) taras.pequena = p;
    safeSet(TARA_KEY, taras);
    loadTarasIntoInputs();
    updatePreview();
    toast("⚖️ Tara salva");
  });

  btnClear.addEventListener("click", function(){
    if(lista.length === 0) return;
    pedirSenha("Mover toda a lista (" + lista.length + " itens) para a lixeira?", function(){
      pushLixeira({ tipo: "lote", label: lista.length + (lista.length === 1 ? " item" : " itens"), items: deepCopy(lista) });
      lista = [];
      safeSet(LISTA_KEY, lista);
      renderLista();
      toast("🗑️ Lista movida para a lixeira");
    });
  });

  // ---------- Texto para copiar (organizado, com emojis) ----------
  function montarTextoResultado(){
    var linhas = [];
    var t = agora();
    var somaBruto = 0, somaLiquido = 0;

    linhas.push("🥩 MINI BOX MALL AÇOUGUE — PESACERTO");
    linhas.push("📅 Fechamento: " + t.data + " às " + t.hora + "  ·  ordem A–Z");
    linhas.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if(lista.length === 0){
      linhas.push("Nenhuma pesagem registrada.");
    } else {
      lista.slice().sort(function(a, b){ return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base", numeric: true }); }).forEach(function(item){
        var ag = agregados(item);
        somaBruto += ag.bruto;
        somaLiquido += ag.liquido;

        var titulo = (item.codigo ? "🏷️ " + item.codigo + " — " : "🏷️ ") + item.nome;
        linhas.push("");
        if(item.status === "ok") titulo += "  ✔️ conferido";
        else if(item.status === "atencao") titulo += "  ⚠️ ATENÇÃO";
        linhas.push(titulo);
        linhas.push("   ⚖️ " + ag.qtd + (ag.qtd === 1 ? " pesagem" : " pesagens") + " · última às " + item.atualizadoHora);
        linhas.push("   Bruto " + fmt(ag.bruto) + " kg  −  Tara " + fmt(ag.tara) + " kg");
        linhas.push("   ✅ Líquido: " + fmt(ag.liquido) + " kg");
      });

      linhas.push("");
      linhas.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      linhas.push("📦 Códigos/itens: " + lista.length);
      linhas.push("⚖️ Total bruto: " + fmt(somaBruto) + " kg");
      linhas.push("✅ TOTAL LÍQUIDO: " + fmt(somaLiquido) + " kg");
    }

    return linhas.join("\n");
  }

  function fallbackCopy(texto){
    var ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var ok = false;
    try{ ok = document.execCommand("copy"); }catch(e){ ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  btnCopy.addEventListener("click", function(){
    var texto = montarTextoResultado();
    function feedback(sucesso){
      toast(sucesso ? "📋 Resultado copiado!" : "⚠️ Não foi possível copiar");
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(texto).then(function(){ feedback(true); }).catch(function(){ feedback(fallbackCopy(texto)); });
    } else {
      feedback(fallbackCopy(texto));
    }
  });

  // ---------- PDF organizado ----------
  function nomeArquivoBase(){
    var t = agora();
    return "pesacerto_" + t.data.split("/").reverse().join("-") + "_" + t.hora.replace(":", "h");
  }

  async function gerarPDF(){
    if(!window.jspdf || !window.jspdf.jsPDF){
      toast("⚠️ Biblioteca de PDF não carregou (verifique a internet)");
      return false;
    }
    var t = agora();
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    var pageWidth = doc.internal.pageSize.getWidth();
    var margin = 40;

    // ---------- Cabeçalho (azul marinho, igual ao site) ----------
    var AZUL = [29, 78, 216], MARINHO = [10, 32, 80], TXT = [15, 29, 58], MUTED = [95, 111, 140];
    doc.setFillColor(MARINHO[0], MARINHO[1], MARINHO[2]);
    doc.rect(0, 0, pageWidth, 88, "F");
    var seg = 90;
    for(var i = 0; i < seg; i++){
      var k = 1 - Math.abs(2 * (i / (seg - 1)) - 1);
      doc.setFillColor(Math.round(29 + 31 * k), Math.round(78 + 52 * k), Math.round(216 + 30 * k));
      doc.rect(i * pageWidth / seg, 88, pageWidth / seg + 0.6, 5, "F");
    }
    var logo = await logoParaPdf();
    var textoX = margin;
    if(logo){
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin - 4, 14, 64, 60, 10, 10, "F");
      var esc = Math.min(56 / logo.w, 52 / logo.h);
      doc.addImage(logo.url, "PNG", margin - 4 + (64 - logo.w * esc) / 2, 14 + (60 - logo.h * esc) / 2, logo.w * esc, logo.h * esc);
      textoX = margin + 78;
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MINI BOX MALL AÇOUGUE", textoX, 40);
    doc.setFontSize(12.5);
    doc.setTextColor(147, 197, 253);
    doc.text("PESACERTO  |  Relatório de pesagem", textoX, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(203, 220, 250);
    doc.text("Itens em ordem alfabética (A–Z)", textoX, 76);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(t.data, pageWidth - margin, 42, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(203, 220, 250);
    doc.text("Fechamento às " + t.hora, pageWidth - margin, 58, { align: "right" });

    // ---------- Dados em ordem alfabética ----------
    var ordenada = lista.slice().sort(function(a, b){
      return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base", numeric: true });
    });
    var somaBruto = 0, somaTara = 0, somaLiquido = 0, totPes = 0, nAtencao = 0, maior = null;
    var ags = ordenada.map(function(item){
      var ag = agregados(item);
      somaBruto += ag.bruto; somaTara += ag.tara; somaLiquido += ag.liquido; totPes += ag.qtd;
      if(item.status === "atencao") nAtencao++;
      if(!maior || ag.liquido > maior.l) maior = { n: item.nome || "(sem nome)", l: ag.liquido };
      return ag;
    });

    // ---------- Cartões de resumo ----------
    var cards = [
      ["ITENS", String(ordenada.length), totPes + (totPes === 1 ? " pesagem" : " pesagens")],
      ["PESO BRUTO", fmt(somaBruto) + " kg", "antes das taras"],
      ["TARA TOTAL", fmt(somaTara) + " kg", "descontado"],
      ["PESO LÍQUIDO", fmt(somaLiquido) + " kg", nAtencao ? nAtencao + " em atenção" : "tudo conferido"]
    ];
    var cw = (pageWidth - margin * 2 - 30) / 4;
    cards.forEach(function(c, idx){
      var x = margin + idx * (cw + 10), dest = idx === 3;
      doc.setFillColor(dest ? MARINHO[0] : 232, dest ? MARINHO[1] : 240, dest ? MARINHO[2] : 254);
      doc.roundedRect(x, 108, cw, 56, 9, 9, "F");
      if(!dest){ doc.setFillColor(AZUL[0], AZUL[1], AZUL[2]); doc.roundedRect(x, 108, 4, 56, 2, 2, "F"); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
      doc.setTextColor(dest ? 147 : AZUL[0], dest ? 197 : AZUL[1], dest ? 253 : AZUL[2]);
      doc.text(c[0], x + 12, 123);
      doc.setFontSize(13.5);
      doc.setTextColor(dest ? 255 : TXT[0], dest ? 255 : TXT[1], dest ? 255 : TXT[2]);
      doc.text(c[1], x + 12, 142);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
      doc.setTextColor(dest ? 190 : MUTED[0], dest ? 210 : MUTED[1], dest ? 245 : MUTED[2]);
      doc.text(c[2], x + 12, 155);
    });

    // ---------- Faixa de informações (taras + mais pesado) ----------
    var infoY = 176;
    doc.setFillColor(244, 247, 252);
    doc.setDrawColor(225, 232, 243); doc.setLineWidth(0.6);
    doc.roundedRect(margin, infoY, pageWidth - margin * 2, 34, 8, 8, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(AZUL[0], AZUL[1], AZUL[2]);
    doc.text("TARAS CADASTRADAS", margin + 12, infoY + 13);
    doc.text("ITEM MAIS PESADO", margin + 270, infoY + 13);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(TXT[0], TXT[1], TXT[2]);
    doc.text("Grande " + fmt(taras.grande) + " kg   |   Pequena " + fmt(taras.pequena) + " kg", margin + 12, infoY + 26);
    var mn = maior ? maior.n : "—"; if(mn.length > 24) mn = mn.slice(0, 23) + "…";
    doc.text(maior ? mn + " (" + fmt(maior.l) + " kg)" : "—", margin + 270, infoY + 26);

    var tabelaY = infoY + 50;
    if(ordenada.length === 0){
      doc.setTextColor(TXT[0], TXT[1], TXT[2]); doc.setFont("helvetica", "normal"); doc.setFontSize(12);
      doc.text("Nenhuma pesagem registrada.", margin, tabelaY);
    } else {
      // corpo: separador por letra + linhas do item
      var body = [], meta = [], letraAtual = "", n = 0;
      ordenada.forEach(function(item, idx){
        var nm = String(item.nome || "(sem nome)");
        var L = nm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").charAt(0).toUpperCase();
        if(!/[A-Z]/.test(L)) L = "#";
        if(L !== letraAtual){
          letraAtual = L;
          body.push([{ content: L, colSpan: 8, styles: { fillColor: [222, 233, 252], textColor: AZUL, fontStyle: "bold", fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 8, right: 4 } } }]);
          meta.push(null);
        }
        var ag = ags[idx]; n++;
        var st = item.status === "atencao" ? "ATENÇÃO" : (item.status === "ok" ? "OK" : "—");
        body.push([String(n), item.codigo || "—", nm, String(ag.qtd), fmt(ag.bruto) + " kg", fmt(ag.tara) + " kg", fmt(ag.liquido) + " kg", st]);
        meta.push(item.status || "");
      });
      doc.autoTable({
        startY: tabelaY,
        margin: { left: margin, right: margin, bottom: 52 },
        head: [["#", "Cód.", "Item", "Pesag.", "Bruto", "Tara", "Líquido", "Status"]],
        body: body,
        foot: [["", "", "TOTAL GERAL", String(totPes), fmt(somaBruto) + " kg", fmt(somaTara) + " kg", fmt(somaLiquido) + " kg", ""]],
        showFoot: "lastPage",
        theme: "plain",
        styles: { font: "helvetica", fontSize: 9.5, cellPadding: { top: 6.5, bottom: 6.5, left: 6, right: 6 }, textColor: TXT, lineColor: [225, 232, 243], lineWidth: { bottom: 0.5 }, valign: "middle", overflow: "linebreak" },
        headStyles: { fillColor: MARINHO, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9, lineWidth: 0 },
        footStyles: { fillColor: MARINHO, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10, lineWidth: 0 },
        columnStyles: {
          0: { cellWidth: 24, halign: "center", textColor: MUTED },
          1: { cellWidth: 46, fontStyle: "bold", textColor: AZUL },
          3: { cellWidth: 42, halign: "center" },
          4: { cellWidth: 66, halign: "right" },
          5: { cellWidth: 58, halign: "right", textColor: MUTED },
          6: { cellWidth: 72, halign: "right", fontStyle: "bold", textColor: [12, 86, 60] },
          7: { cellWidth: 52, halign: "center", fontStyle: "bold", fontSize: 8 }
        },
        didParseCell: function(d){
          if(d.section === "foot"){ if([4, 5, 6].indexOf(d.column.index) > -1) d.cell.styles.halign = "right"; if(d.column.index === 3) d.cell.styles.halign = "center"; }
          if(d.section === "head"){ if([4, 5, 6].indexOf(d.column.index) > -1) d.cell.styles.halign = "right"; if([0, 3, 7].indexOf(d.column.index) > -1) d.cell.styles.halign = "center"; }
          if(d.section !== "body") return;
          var m = meta[d.row.index];
          if(m === null || m === undefined) return;
          if(m === "atencao") d.cell.styles.fillColor = [254, 243, 224];
          else if(d.row.index % 2 === 0) d.cell.styles.fillColor = [248, 250, 254];
          if(d.column.index === 7){ d.cell.styles.textColor = m === "atencao" ? [180, 83, 9] : (m === "ok" ? [15, 122, 56] : MUTED); }
        }
      });
    }

    // ---------- Rodapé em todas as páginas ----------
    var altura = doc.internal.pageSize.getHeight(), pgs = doc.getNumberOfPages();
    var versao = (typeof PESACERTO_VERSAO !== "undefined") ? " v" + PESACERTO_VERSAO : "";
    for(var pg = 1; pg <= pgs; pg++){
      doc.setPage(pg);
      doc.setDrawColor(AZUL[0], AZUL[1], AZUL[2]); doc.setLineWidth(1.6);
      doc.line(margin, altura - 40, pageWidth - margin, altura - 40);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text("Gerado pelo PesaCerto" + versao + " em " + t.data + " às " + t.hora + " — dados armazenados apenas neste navegador.", margin, altura - 26);
      doc.setFont("helvetica", "bold"); doc.setTextColor(AZUL[0], AZUL[1], AZUL[2]);
      doc.text("Página " + pg + " de " + pgs, pageWidth - margin, altura - 26, { align: "right" });
    }

    doc.save(nomeArquivoBase() + ".pdf");
    return true;
  }

  btnPdf.addEventListener("click", function(){
    if(lista.length === 0){
      toast("⚠️ Não há pesagens para gerar o PDF");
      return;
    }
    gerarPDF().then(function(ok){ if(ok) toast("📄 PDF baixado!"); });
  });

  var btnWhats = document.getElementById("btnWhats");
  btnWhats.addEventListener("click", function(){
    if(lista.length === 0){ toast("⚠️ Não há pesagens para enviar"); return; }
    window.open("https://wa.me/?text=" + encodeURIComponent(montarTextoResultado()), "_blank");
  });

  btnEncerrar.addEventListener("click", function(){
    if(lista.length === 0){
      window.alert("Não há pesagens para encerrar.");
      return;
    }
    // Encerrar apenas baixa o PDF: sem senha e sem limpar a lista.
    // A senha continua sendo pedida somente para excluir/remover itens.
    gerarPDF().then(function(ok){ if(ok){ toast("✅ Pesagem encerrada e PDF baixado!"); fx("festa"); } });
  });

  // ---------- Backup e sincronização dos códigos ----------
  // Junta códigos de uma origem externa; só sobrescreve os existentes se "sobrescrever" for true.
  function mesclarCodigos(origem, sobrescrever){
    var n = 0;
    if(!origem || typeof origem !== "object") return 0;
    Object.keys(origem).forEach(function(cod){
      var v = origem[cod];
      if(!v || typeof v !== "object" || !v.nome) return;
      if(sobrescrever || !codigos[cod]){ codigos[cod] = v; n++; }
    });
    if(n) safeSet(CODIGOS_KEY, codigos);
    return n;
  }

  // 1) Se existir um "codigos.json" na mesma pasta do site (ex.: no GitHub), carrega sozinho em qualquer aparelho.
  try{
    fetch("codigos.json", { cache: "no-store" })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(dados){
        if(dados && mesclarCodigos(dados, false) && codigoInput.value.trim()) tentarAutoPreencher();
      })
      .catch(function(){});
  }catch(e){}

  // 2) Botões: salvar todos os códigos em um arquivo / carregar de um arquivo.
  var btnExportCodigos = document.getElementById("btnExportCodigos");
  var btnImportCodigos = document.getElementById("btnImportCodigos");
  var fileImportCodigos = document.getElementById("fileImportCodigos");

  if(btnExportCodigos){
    btnExportCodigos.addEventListener("click", function(){
      var blob = new Blob([JSON.stringify(codigos, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "codigos.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
      toast("⬇️ " + Object.keys(codigos).length + " códigos salvos em codigos.json");
    });
  }
  if(btnImportCodigos && fileImportCodigos){
    btnImportCodigos.addEventListener("click", function(){ fileImportCodigos.click(); });
    fileImportCodigos.addEventListener("change", function(){
      var f = fileImportCodigos.files && fileImportCodigos.files[0];
      if(!f) return;
      var rd = new FileReader();
      rd.onload = function(){
        try{
          var n = mesclarCodigos(JSON.parse(rd.result), true);
          toast(n ? "⬆️ " + n + " códigos carregados" : "⚠️ Nenhum código válido no arquivo");
        }catch(e){ toast("⚠️ Arquivo inválido"); }
        fileImportCodigos.value = "";
      };
      rd.readAsText(f);
    });
  }

  codigoInput.addEventListener("blur", tentarAutoPreencher);
  codigoInput.addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); tentarAutoPreencher(); }
  });
  pesoInput.addEventListener("input", updatePreview);
  (function(){
    var u = document.getElementById("pesoUnidade"), ph = document.getElementById("pesoHint");
    if(!u) return;
    try{ var sv = localStorage.getItem("pesacerto_unidade"); if(sv === "g" || sv === "kg") u.value = sv; }catch(e){}
    function atualizaUnidade(){
      var kg = u.value === "kg";
      pesoInput.placeholder = kg ? "ex.: 101,9" : "ex.: 1500";
      if(ph) ph.textContent = kg ? "Como no visor: 101,9 = 101,9 kg" : "Em gramas: 1500 = 1,5 kg";
      updatePreview();
    }
    u.addEventListener("change", function(){ try{ localStorage.setItem("pesacerto_unidade", u.value); }catch(e){} atualizaUnidade(); });
    atualizaUnidade();
  })();
  qtdInput.addEventListener("input", updatePreview);
  qtdInput.addEventListener("blur", function(){ qtdInput.value = getQtd(); updatePreview(); });
  qtdMenos.addEventListener("click", function(){ setQtd(getQtd() - 1); });
  qtdMais.addEventListener("click", function(){ setQtd(getQtd() + 1); });

  function ligarStepper(input, menos, mais){
    function ajustar(d){
      input.value = Math.max(0, Math.min(20, lerQtdMista(input) + d));
      updatePreview();
    }
    menos.addEventListener("click", function(){ ajustar(-1); });
    mais.addEventListener("click", function(){ ajustar(1); });
    input.addEventListener("input", updatePreview);
    input.addEventListener("blur", function(){ input.value = lerQtdMista(input); updatePreview(); });
  }
  taraExtraInput.addEventListener("input", updatePreview);
  ligarStepper(qtdGrandesInput, document.getElementById("qtdGrandesMenos"), document.getElementById("qtdGrandesMais"));
  ligarStepper(qtdPequenasInput, document.getElementById("qtdPequenasMenos"), document.getElementById("qtdPequenasMais"));
  taraPersonalizadaInput.addEventListener("input", updatePreview);
  bandejaSelect.addEventListener("change", function(){ toggleTaraPersonalizadaField(); updatePreview(); });

  // ---------- Aba "Códigos": ver, editar e excluir o catálogo salvo neste navegador ----------
  (function(){
    var painel = document.getElementById("codigosLista");
    if(!painel) return;
    var busca = document.getElementById("codigosBusca");
    var contagem = document.getElementById("codigosContagem");
    var formNovo = document.getElementById("formNovoCodigo");
    var inCod = document.getElementById("novoCodCodigo");
    var inNome = document.getElementById("novoCodNome");
    var inTipo = document.getElementById("novoCodTipo");

    function tipoNome(t){
      return t === "pequena" ? "Bandeja pequena" : t === "mista" ? "Combinar" : t === "personalizada" ? "Tara personalizada" : t === "nenhuma" ? "Sem bandeja" : "Bandeja grande";
    }

    function renderCodigos(){
      var termo = (busca.value || "").trim().toLowerCase();
      var chaves = Object.keys(codigos).sort(function(a,b){ return (codigos[a].nome||"").localeCompare(codigos[b].nome||"", "pt-BR", { sensitivity: "base", numeric: true }); });
      if(termo){
        chaves = chaves.filter(function(c){
          return c.toLowerCase().indexOf(termo) > -1 || (codigos[c].nome||"").toLowerCase().indexOf(termo) > -1;
        });
      }
      contagem.textContent = chaves.length + (chaves.length === 1 ? " código" : " códigos");
      painel.innerHTML = "";
      if(chaves.length === 0){
        var vazio = document.createElement("div");
        vazio.className = "empty";
        vazio.textContent = "Nenhum código encontrado.";
        painel.appendChild(vazio);
        return;
      }
      chaves.forEach(function(cod){
        var row = document.createElement("div");
        row.className = "cod-row";

        var idBox = document.createElement("div");
        idBox.className = "cod-id";
        idBox.innerHTML = "<span class='chip-codigo chip-mini'>" + cod + "</span>";
        row.appendChild(idBox);

        var nomeSpan = document.createElement("span");
        nomeSpan.className = "cod-nome";
        nomeSpan.textContent = codigos[cod].nome || "";
        nomeSpan.title = "Toque para editar o nome";
        nomeSpan.addEventListener("click", function(){
          var input = document.createElement("input");
          input.type = "text"; input.className = "cod-nome-edit"; input.value = codigos[cod].nome || "";
          nomeSpan.replaceWith(input); input.focus(); input.select();
          function salvarNome(){
            var v = input.value.trim();
            if(v){ codigos[cod].nome = v; safeSet(CODIGOS_KEY, codigos); toast("✏️ Nome atualizado"); }
            renderCodigos();
          }
          input.addEventListener("blur", salvarNome);
          input.addEventListener("keydown", function(e){ if(e.key === "Enter") input.blur(); if(e.key === "Escape") renderCodigos(); });
        });
        row.appendChild(nomeSpan);

        var tipoSel = document.createElement("select");
        tipoSel.className = "cod-tipo";
        [["grande","Bandeja grande"],["pequena","Bandeja pequena"],["mista","Combinar"],["personalizada","Tara personalizada"],["nenhuma","Sem bandeja"]].forEach(function(o){
          var op = document.createElement("option"); op.value = o[0]; op.textContent = o[1];
          if(codigos[cod].tipo === o[0]) op.selected = true;
          tipoSel.appendChild(op);
        });
        tipoSel.addEventListener("change", function(){
          codigos[cod].tipo = tipoSel.value; safeSet(CODIGOS_KEY, codigos); toast("⚖️ " + tipoNome(tipoSel.value) + " definida para " + cod);
        });
        row.appendChild(tipoSel);

        var del = document.createElement("button");
        del.type = "button"; del.className = "btn btn-icon-round danger"; del.title = "Excluir código"; del.textContent = "🗑️";
        del.addEventListener("click", function(){
          pedirSenha("Excluir o código \"" + cod + " — " + (codigos[cod].nome||"") + "\" do catálogo?", function(){
            delete codigos[cod]; safeSet(CODIGOS_KEY, codigos); toast("🗑️ Código excluído"); renderCodigos();
          });
        });
        row.appendChild(del);

        painel.appendChild(row);
      });
    }

    busca.addEventListener("input", renderCodigos);
    formNovo.addEventListener("submit", function(e){
      e.preventDefault();
      var cod = inCod.value.trim(), nome = inNome.value.trim();
      if(!cod || !nome){ toast("⚠️ Preencha código e nome"); return; }
      codigos[cod] = { nome: nome, tipo: inTipo.value };
      safeSet(CODIGOS_KEY, codigos);
      inCod.value = ""; inNome.value = ""; inTipo.value = "grande";
      toast("✅ Código " + cod + " salvo no catálogo");
      renderCodigos();
    });

    document.querySelectorAll(".tabbar-btn[data-tab-target='codigos']").forEach(function(b){
      b.addEventListener("click", renderCodigos);
    });
    renderCodigos();
  })();

  // ---------- Atalhos de "Ações rápidas" (aba Pesar) que espelham os botões da Lista ----------
  [["btnCopyQuick","btnCopy"],["btnPdfQuick","btnPdf"],["btnWhatsQuick","btnWhats"],["btnEncerrarQuick","btnEncerrar"]].forEach(function(par){
    var origem = document.getElementById(par[0]), destino = document.getElementById(par[1]);
    if(origem && destino) origem.addEventListener("click", function(){ destino.click(); });
  });

  loadTarasIntoInputs();
  toggleTaraPersonalizadaField();
  updatePreview();
  (function(){
    var sel = document.getElementById("prefCasas");
    if(!sel) return;
    sel.value = String(casas);
    sel.addEventListener("change", function(){
      casas = sel.value === "1" ? 1 : 3;
      try{ localStorage.setItem("pesacerto_casas", String(casas)); }catch(e){}
      renderLista(); updatePreview();
      toast("🔢 Formato: " + (casas === 1 ? "101,9 kg" : "101,900 kg"));
    });
  })();
  renderLista();
  renderLixeira();
})();
