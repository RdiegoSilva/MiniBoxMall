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
  var DEFAULT_CODIGOS = {
    // BOVINOS
    "184": "COSTEL P.A",
    "9048": "COST JANELÃO RESERVA",
    "10961": "COST TRASEIRO FRIBOI MINGA",
    "200": "BIFE AMACIADO",
    "8670": "BIFE LIGHT",
    "167": "BISTECA PAULISTA",
    "6096": "BISTECA GAUCHA",
    "319": "COST PEITO",
    "180": "CUPIM",
    "176": "LOMBO C/OS",
    "68": "MÃO DE VACA",
    "179": "CARNE MUIDA",
    "815": "MÚSCULO BO",
    "182": "OSSO BUCO",
    "6035": "PALETA",
    "6095": "STROGONOFF",
    // BOVINOS — CORTES TRÁS
    "390": "ALCATRA BO",
    "677": "BISTECA BO",
    "7272": "CAPA CONTRA",
    "397": "CONTRA FILE",
    "398": "COXÃO DURO",
    "388": "COXÃO MOLE",
    "429": "FILÉ MIGNO",
    "650": "FRALDINHA",
    "389": "LAGARTO",
    "384": "MAMINHA RESF",
    "653": "MÚSCULO BO",
    "9686": "MÚSCULO BO",
    "399": "PATINHO",
    "385": "PICANHA",
    "8915": "PICANHA FATIADA FRIGOTIL",
    // DIVERSOS
    "9298": "CARNE DO SOL",
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

  // Preenche no cadastro os códigos padrão que ainda não existem (não mexe nos que você já tem/editou)
  (function mesclarCodigosPadrao(){
    var alterado = false;
    Object.keys(DEFAULT_CODIGOS).forEach(function(cod){
      if(!codigos[cod]){
        codigos[cod] = { nome: DEFAULT_CODIGOS[cod], tipo: "grande" };
        alterado = true;
      }
    });
    if(alterado) safeSet(CODIGOS_KEY, codigos);
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

  var totalItens = document.getElementById("totalItens");
  var totalBruto = document.getElementById("totalBruto");
  var totalLiquido = document.getElementById("totalLiquido");
  var topbarTotalVal = document.getElementById("topbarTotalVal");

  function fmt(n){
    if(isNaN(n)) n = 0;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  function scaleToKg(raw){ var n = parseFloat(raw); return isNaN(n) ? NaN : n / 1000; }
  function gramasToKg(raw){ var n = parseFloat(raw); return isNaN(n) ? NaN : n / 1000; }

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
    if(bandejaSelect.value === "personalizada"){ taraPersonalizadaField.classList.remove("hidden"); taraPersonalizadaField.style.display = ""; }
    else{ taraPersonalizadaField.style.display = "none"; }
  }

  function taraFor(tipo){
    if(tipo === "grande") return taras.grande;
    if(tipo === "pequena") return taras.pequena;
    if(tipo === "personalizada") return gramasToKg(taraPersonalizadaInput.value) || 0;
    return 0;
  }
  function tipoLabel(tipo){
    if(tipo === "grande") return "Bandeja grande";
    if(tipo === "pequena") return "Bandeja pequena";
    if(tipo === "personalizada") return "Tara personalizada";
    return "Sem bandeja";
  }

  function loadTarasIntoInputs(){
    taraGrandeInput.value = taras.grande;
    taraPequenaInput.value = taras.pequena;
  }

  function tick(el){ el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }

  function updatePreview(){
    var peso = scaleToKg(pesoInput.value);
    if(isNaN(peso)) peso = 0;
    var tara = taraFor(bandejaSelect.value);
    previewLiquido.textContent = fmt(peso - tara);
    tick(displayReadout);
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
    var salvo = codigos[codigo];
    if(salvo){
      nomeInput.value = salvo.nome || "";
      bandejaSelect.value = salvo.tipo || "grande";
      toggleTaraPersonalizadaField();
      if(salvo.tipo === "personalizada" && salvo.taraGramas != null){
        taraPersonalizadaInput.value = salvo.taraGramas;
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
    if(!codigo){ foundTag.classList.remove("checking"); return; }
    foundTagTxt.textContent = "Verificando código…";
    foundTag.classList.add("checking");
    autoFillTimer = setTimeout(tentarAutoPreencher, 450);
  });

  function salvarCodigo(codigo, nome, tipo){
    if(!codigo) return;
    var entrada = { nome: nome, tipo: tipo };
    if(tipo === "personalizada"){ entrada.taraGramas = parseFloat(taraPersonalizadaInput.value) || 0; }
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
    [totalItens, totalBruto, totalLiquido].forEach(function(el){
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

  function renderLista(idxDestaque){
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

        var head = document.createElement("div");
        head.className = "ticket-head";

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
          "<span>" + tipoLabel(item.tipoUltimo) + "</span>" +
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
            "<span>" + p.data + " " + p.hora + " — " + tipoLabel(p.tipo) + "</span>" +
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

    totalItens.textContent = lista.length;
    totalBruto.textContent = fmt(somaBruto) + " kg";
    totalLiquido.textContent = fmt(somaLiquido) + " kg";
    topbarTotalVal.innerHTML = fmt(somaLiquido) + " <small>kg</small>";
    listCountHint.textContent = lista.length + (lista.length === 1 ? " item" : " itens");
    flashTotais();
  }

  btnAdd.addEventListener("click", function(){
    var codigo = codigoInput.value.trim();
    var nome = nomeInput.value.trim();
    var peso = scaleToKg(pesoInput.value);
    var tipo = bandejaSelect.value;

    if(!nome){ nomeInput.focus(); ativarAba("pesar"); return; }
    if(isNaN(peso) || peso <= 0){ pesoInput.focus(); ativarAba("pesar"); return; }
    if(tipo === "personalizada" && (taraPersonalizadaInput.value === "" || isNaN(parseFloat(taraPersonalizadaInput.value)))){
      taraPersonalizadaInput.focus();
      ativarAba("pesar");
      return;
    }

    var tara = taraFor(tipo);
    var t = agora();
    var pesagem = { pesoBruto: peso, tara: tara, tipo: tipo, data: t.data, hora: t.hora, horarioIso: t.iso };

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
        criadoData: t.data,
        criadoHora: t.hora,
        atualizadoData: t.data,
        atualizadoHora: t.hora,
        pesagens: [pesagem]
      });
      idxFinal = 0;
    }

    salvarCodigo(codigo, nome, tipo);
    safeSet(LISTA_KEY, lista);
    renderLista(idxFinal);
    limparFormulario();
    toast("✅ Pesagem adicionada");
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
    linhas.push("📅 Fechamento: " + t.data + " às " + t.hora);
    linhas.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if(lista.length === 0){
      linhas.push("Nenhuma pesagem registrada.");
    } else {
      lista.forEach(function(item){
        var ag = agregados(item);
        somaBruto += ag.bruto;
        somaLiquido += ag.liquido;

        var titulo = (item.codigo ? "🏷️ " + item.codigo + " — " : "🏷️ ") + item.nome;
        linhas.push("");
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

  function gerarPDF(){
    if(!window.jspdf || !window.jspdf.jsPDF){
      toast("⚠️ Biblioteca de PDF não carregou (verifique a internet)");
      return false;
    }
    var t = agora();
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    var pageWidth = doc.internal.pageSize.getWidth();
    var margin = 40;

    doc.setFillColor(23, 138, 76);
    doc.rect(0, 0, pageWidth, 86, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MINI BOX MALL AÇOUGUE", margin, 40);
    doc.setFontSize(13);
    doc.text("PESACERTO — Resultado da pesagem", margin, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Fechamento: " + t.data + " às " + t.hora, margin, 76);

    var somaBruto = 0, somaLiquido = 0;
    var linhas = lista.map(function(item){
      var ag = agregados(item);
      somaBruto += ag.bruto;
      somaLiquido += ag.liquido;
      return [
        item.codigo || "—",
        item.nome || "(sem nome)",
        String(ag.qtd),
        fmt(ag.bruto) + " kg",
        fmt(ag.tara) + " kg",
        fmt(ag.liquido) + " kg"
      ];
    });

    if(linhas.length === 0){
      doc.setTextColor(20, 23, 28);
      doc.setFontSize(12);
      doc.text("Nenhuma pesagem registrada.", margin, 120);
    } else {
      doc.autoTable({
        startY: 104,
        margin: { left: margin, right: margin },
        head: [["Código", "Item", "Pesagens", "Bruto", "Tara", "Líquido"]],
        body: linhas,
        foot: [["", "TOTAL GERAL", String(lista.length), fmt(somaBruto) + " kg", "", fmt(somaLiquido) + " kg"]],
        theme: "grid",
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6, textColor: [20, 23, 28], lineColor: [226, 229, 235], lineWidth: 0.6 },
        headStyles: { fillColor: [23, 138, 76], textColor: [255, 255, 255], fontStyle: "bold" },
        footStyles: { fillColor: [228, 246, 238], textColor: [11, 120, 82], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [244, 245, 248] },
        columnStyles: {
          0: { cellWidth: 60 },
          2: { cellWidth: 55, halign: "center" },
          3: { cellWidth: 70, halign: "right" },
          4: { cellWidth: 60, halign: "right" },
          5: { cellWidth: 75, halign: "right" }
        }
      });
    }

    doc.setTextColor(102, 110, 122);
    doc.setFontSize(9);
    doc.text("Documento gerado automaticamente pelo PesaCerto — dados armazenados apenas no navegador do balcão.", margin, doc.internal.pageSize.getHeight() - 24);

    doc.save(nomeArquivoBase() + ".pdf");
    return true;
  }

  btnPdf.addEventListener("click", function(){
    if(lista.length === 0){
      toast("⚠️ Não há pesagens para gerar o PDF");
      return;
    }
    if(gerarPDF()) toast("📄 PDF baixado!");
  });

  btnEncerrar.addEventListener("click", function(){
    if(lista.length === 0){
      window.alert("Não há pesagens para encerrar.");
      return;
    }
    // Encerrar apenas baixa o PDF: sem senha e sem limpar a lista.
    // A senha continua sendo pedida somente para excluir/remover itens.
    if(gerarPDF()) toast("✅ Pesagem encerrada e PDF baixado!");
  });

  codigoInput.addEventListener("blur", tentarAutoPreencher);
  codigoInput.addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); tentarAutoPreencher(); }
  });
  pesoInput.addEventListener("input", updatePreview);
  taraPersonalizadaInput.addEventListener("input", updatePreview);
  bandejaSelect.addEventListener("change", function(){ toggleTaraPersonalizadaField(); updatePreview(); });

  loadTarasIntoInputs();
  toggleTaraPersonalizadaField();
  updatePreview();
  renderLista();
  renderLixeira();
})();
