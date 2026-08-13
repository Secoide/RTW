const estadoSpda = {
  os: [],
  estruturas: [],
  estruturaAtual: null,
  ferramenta: null,
  continuidadeOrigem: null,
  proximoNumero: 1,
  panX: 0,
  panY: 0,
  mostrarAcoesNaoSelecionadas: true,
  tabelaAberta: false,
  tabelaTipo: "continuidade",
  tabelaConfigAberta: false,
  limites: {
    continuidade: 200,
    aterramento: 10
  },
  inicializado: false,
  documentoVinculado: false
};

const SPDA_ACOES_PONTO = [
  { id: "eletroduto_quebrado", titulo: "Eletroduto quebrado", icone: "fa-road-barrier" },
  { id: "abracadeira_ferrujada", titulo: "Abraçadeira ferrujada", icone: "fa-link" },
  { id: "subsistemas_nao_conectados", titulo: "Subsistemas não conectados", icone: "fa-plug-circle-xmark" },
  { id: "caixa_sem_tampa", titulo: "Caixa de inspeção sem tampa", icone: "fa-box-open" },
  { id: "descida_solta", titulo: "Descida solta", icone: "fa-arrow-down-long" },
  { id: "descidas_inexistentes_removidas", titulo: "Descidas inexistentes ou removidas", icone: "fa-circle-minus" },
  { id: "barra_chata_rompida", titulo: "Barra chata rompida", icone: "fa-grip-lines-vertical" },
  { id: "cabo_rompido", titulo: "Cabo rompido", icone: "fa-scissors" },
  { id: "condutor_enterrado_exposto", titulo: "Condutor enterrado exposto", icone: "fa-route" },
  { id: "baldinho_inspecao_soterrado", titulo: "Baldinho de inspeção soterrado", icone: "fa-box-archive" },
  { id: "soldas_exotermicas_deterioradas", titulo: "Soldas exotérmicas deterioradas", icone: "fa-fire-flame-curved" },
  { id: "terminal_desgastado", titulo: "Terminal desgastado", icone: "fa-screwdriver-wrench" }
];

const SPDA_MARGEM_EDICAO = 16;
const SPDA_LIMITES_STORAGE_KEY = "spda_limites_medicao";
const SPDA_TABELA_ENTER_SALVO = "spdaEnterSalvo";

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function apiSpda(url, opcoes = {}) {
  const resposta = await fetch(url, {
    credentials: "include",
    headers: opcoes.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...opcoes
  });

  const tipo = resposta.headers.get("content-type") || "";
  const dados = tipo.includes("application/json") ? await resposta.json() : await resposta.text();

  if (!resposta.ok) {
    throw new Error(dados?.mensagem || dados?.erro || "Falha na operação do SPDA.");
  }

  return dados;
}

function elementosVazios() {
  return { pontos: [], continuidades: [], aterramentos: [] };
}

function obterElementos() {
  if (!estadoSpda.estruturaAtual) return elementosVazios();
  estadoSpda.estruturaAtual.elementos ||= elementosVazios();
  estadoSpda.estruturaAtual.elementos.pontos ||= [];
  estadoSpda.estruturaAtual.elementos.continuidades ||= [];
  estadoSpda.estruturaAtual.elementos.aterramentos ||= [];
  return estadoSpda.estruturaAtual.elementos;
}

function normalizarNumero(valor) {
  return String(valor).padStart(2, "0");
}

function getCanvasPercent(event) {
  const rect = byId("spdaCanvas").getBoundingClientRect();
  return {
    x: limitarPercentual(((event.clientX - rect.left - estadoSpda.panX) / rect.width) * 100, -SPDA_MARGEM_EDICAO),
    y: limitarPercentual(((event.clientY - rect.top - estadoSpda.panY) / rect.height) * 100, -SPDA_MARGEM_EDICAO)
  };
}

function limitarPercentual(valor, margem = 3) {
  if (margem < 0) {
    const extra = Math.abs(margem);
    return Math.max(-extra, Math.min(100 + extra, valor));
  }
  return Math.max(margem, Math.min(100 - margem, valor));
}

function removerUnidadeVisual(valor, unidade) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  const unidadeLimpa = String(unidade || "").trim();
  if (!unidadeLimpa) return texto;
  return texto.replace(new RegExp(`\\s*${unidadeLimpa.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim();
}

function setHint(texto) {
  const hint = byId("spdaHint");
  if (hint) hint.textContent = texto;
}

function carregarLimitesSpda() {
  try {
    const salvo = JSON.parse(localStorage.getItem(SPDA_LIMITES_STORAGE_KEY) || "{}");
    estadoSpda.limites.continuidade = Number(salvo.continuidade) > 0 ? Number(salvo.continuidade) : 200;
    estadoSpda.limites.aterramento = Number(salvo.aterramento) > 0 ? Number(salvo.aterramento) : 10;
  } catch (_) {
    estadoSpda.limites = { continuidade: 200, aterramento: 10 };
  }
}

function salvarLimitesSpda() {
  localStorage.setItem(SPDA_LIMITES_STORAGE_KEY, JSON.stringify(estadoSpda.limites));
}

function sincronizarCamposLimiteSpda() {
  const continuidade = byId("spdaLimiteContinuidade");
  const aterramento = byId("spdaLimiteAterramento");
  if (continuidade) continuidade.value = estadoSpda.limites.continuidade;
  if (aterramento) aterramento.value = estadoSpda.limites.aterramento;
}

function obterPontoPorId(pontoId) {
  return obterElementos().pontos.find(ponto => ponto.id === pontoId);
}

function obterNumeroPonto(pontoId) {
  const ponto = obterPontoPorId(pontoId);
  return ponto ? normalizarNumero(ponto.numero) : "--";
}

function renderLegendaIconesSpda() {
  const lista = byId("spdaIconLegendList");
  if (!lista) return;
  lista.innerHTML = SPDA_ACOES_PONTO.map(acao => `
    <div class="spda-icon-legend-item" title="${escapeHtml(acao.titulo)}">
      <i class="fa-solid ${escapeHtml(acao.icone)}"></i>
      <span>${escapeHtml(acao.titulo)}</span>
    </div>
  `).join("");
}

function getAvaliacaoClasse(valor) {
  if (!valor) return "";
  const status = String(valor).toLowerCase();
  if (status === "aprovado") return "is-approved";
  if (status === "reprovado") return "is-failed";
  if (status.includes("impossibilitada")) return "is-blocked";
  return "is-waiting";
}

function parseNumeroMedicao(valor) {
  let texto = removerUnidadeVisual(valor, "mΩ")
    .replace(/Ω/gi, "")
    .replace(/[^\d,.-]/g, "")
    .trim();
  texto = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

function calcularAvaliacaoMedicao(tipo, valor) {
  const textoOriginal = removerUnidadeVisual(valor, tipo === "aterramento" ? "Ω" : "mΩ").trim();
  if (!textoOriginal) return "Aguardando";
  if (/^x$/i.test(textoOriginal)) return "Medição impossibilitada";

  const numero = parseNumeroMedicao(valor);
  if (numero === null) return "Aguardando";
  if (numero === 0) return "Reprovado";

  const limite = tipo === "aterramento" ? estadoSpda.limites.aterramento : estadoSpda.limites.continuidade;
  return numero > limite ? "Reprovado" : "Aprovado";
}

function renderTabelaPreenchimentoSpda() {
  const painel = byId("spdaTabelaPainel");
  const toggle = byId("spdaTabelaToggle");
  const conteudo = byId("spdaTabelaConteudo");
  if (!painel || !toggle || !conteudo) return;

  painel.classList.toggle("aberto", estadoSpda.tabelaAberta);
  toggle.classList.toggle("oculto", estadoSpda.tabelaAberta);
  const config = byId("spdaTabelaConfig");
  if (config) config.hidden = !estadoSpda.tabelaConfigAberta;
  sincronizarCamposLimiteSpda();
  document.querySelectorAll("[data-spda-tabela]").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.spdaTabela === estadoSpda.tabelaTipo);
  });

  const elementos = obterElementos();
  const tipo = estadoSpda.tabelaTipo;
  const unidade = tipo === "aterramento" ? "Ω" : "mΩ";
  const tituloValor = tipo === "aterramento" ? "Aterramento dos pontos de descida" : "Continuidade malha de aterramento";
  const maiorPonto = elementos.pontos.reduce((maior, ponto) => Math.max(maior, Number(ponto.numero) || 0), 0);
  const linhas = tipo === "aterramento"
    ? elementos.aterramentos.map(item => ({
      id: item.id,
      ordem: Number(obterNumeroPonto(item.ponto)) || 0,
      pontos: obterNumeroPonto(item.ponto),
      valor: removerUnidadeVisual(item.valor, unidade),
      avaliacao: calcularAvaliacaoMedicao(tipo, item.valor)
    }))
    : elementos.continuidades.map(item => {
      const numeroDe = Number(obterNumeroPonto(item.de)) || 0;
      const numeroPara = Number(obterNumeroPonto(item.para)) || 0;
      const menor = Math.min(numeroDe, numeroPara);
      const maior = Math.max(numeroDe, numeroPara);
      const fechamentoCircuito = menor === 1 && maior === maiorPonto && maiorPonto > 1;
      return {
        id: item.id,
        ordem: fechamentoCircuito ? Number.MAX_SAFE_INTEGER : (menor * 1000) + maior,
        pontos: fechamentoCircuito
          ? `${normalizarNumero(maior)}-${normalizarNumero(menor)}`
          : `${normalizarNumero(menor)}-${normalizarNumero(maior)}`,
        valor: removerUnidadeVisual(item.valor, unidade),
        avaliacao: calcularAvaliacaoMedicao(tipo, item.valor)
      };
    });

  linhas.sort((a, b) => a.ordem - b.ordem);

  if (!linhas.length) {
    conteudo.innerHTML = `<div class="spda-fill-empty">Nenhuma medição de ${tipo === "aterramento" ? "aterramento" : "continuidade"} criada.</div>`;
    return;
  }

  conteudo.innerHTML = `
    <table class="spda-fill-table">
      <thead>
        <tr>
          <th>Pontos</th>
          <th>${escapeHtml(tituloValor)} (${escapeHtml(unidade)})</th>
          <th>Avaliação</th>
        </tr>
      </thead>
      <tbody>
        ${linhas.map(linha => `
          <tr>
            <td>${escapeHtml(linha.pontos)}</td>
            <td>
              <div class="spda-fill-value">
                <input type="text" value="${escapeHtml(linha.valor)}" data-spda-valor="${escapeHtml(linha.id)}" inputmode="decimal">
                <span>${escapeHtml(unidade)}</span>
              </div>
            </td>
            <td>
              <span class="spda-fill-status ${escapeHtml(getAvaliacaoClasse(linha.avaliacao))}">
                ${escapeHtml(linha.avaliacao || "-")}
              </span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function atualizarTabelaMedicaoSpda(id, campo, valor) {
  const elementos = obterElementos();
  const lista = estadoSpda.tabelaTipo === "aterramento" ? elementos.aterramentos : elementos.continuidades;
  const item = lista.find(registro => String(registro.id) === String(id));
  if (!item) return;

  if (campo === "valor") {
    const unidade = estadoSpda.tabelaTipo === "aterramento" ? "Ω" : "mΩ";
    item.valor = valor ? `${valor} ${unidade}` : "";
    item.avaliacao = calcularAvaliacaoMedicao(estadoSpda.tabelaTipo, item.valor);
  }

  await salvarElementos({ silencioso: true });
  renderElementos();
  renderTabelaPreenchimentoSpda();
}

async function salvarValorTabelaEAvancar(input) {
  const inputs = Array.from(document.querySelectorAll("#spdaTabelaConteudo [data-spda-valor]"));
  const indiceAtual = inputs.indexOf(input);
  const proximoId = inputs[indiceAtual + 1]?.dataset.spdaValor || "";

  input.dataset[SPDA_TABELA_ENTER_SALVO] = "1";
  await atualizarTabelaMedicaoSpda(input.dataset.spdaValor, "valor", input.value.trim());

  if (!proximoId) return;
  requestAnimationFrame(() => {
    const proximo = document.querySelector(`#spdaTabelaConteudo [data-spda-valor="${CSS.escape(proximoId)}"]`);
    proximo?.focus();
    proximo?.select?.();
  });
}

async function fecharAcoesPontosSpda() {
  const elementos = obterElementos();
  let alterou = false;
  elementos.pontos.forEach(ponto => {
    if (ponto.acoesMinimizado !== true) {
      ponto.acoesMinimizado = true;
      alterou = true;
    }
  });

  if (!alterou) return;
  renderElementos();
  await salvarElementos({ silencioso: true });
}

function selecionarFerramenta(ferramenta) {
  if (!estadoSpda.estruturaAtual) {
    setHint("Selecione ou cadastre uma estrutura antes de marcar a planta.");
    return;
  }

  if (!estadoSpda.estruturaAtual.planta_url) {
    setHint("Anexe a planta baixa antes de inserir marcações.");
    return;
  }

  estadoSpda.ferramenta = ferramenta;
  estadoSpda.continuidadeOrigem = null;
  document.querySelectorAll(".spda-tool").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.tool === ferramenta);
  });

  const mensagens = {
    numero: `Clique na planta para posicionar o ponto ${normalizarNumero(estadoSpda.proximoNumero)}.`,
    continuidade: "Selecione o primeiro ponto numerado para medir continuidade.",
    aterramento: "Selecione um ponto numerado para informar a medição de aterramento."
  };
  setHint(mensagens[ferramenta] || "");
}

function cancelarFerramenta() {
  estadoSpda.ferramenta = null;
  estadoSpda.continuidadeOrigem = null;
  document.querySelectorAll(".spda-tool[data-tool]").forEach(btn => btn.classList.remove("ativo"));
  setHint("Ação cancelada. Selecione uma ferramenta para continuar.");
}

function recalcularProximoNumero() {
  const numerosUsados = new Set(
    obterElementos().pontos
      .map(ponto => Number(ponto.numero))
      .filter(numero => Number.isInteger(numero) && numero > 0)
  );

  let proximoNumero = 1;
  while (numerosUsados.has(proximoNumero)) {
    proximoNumero += 1;
  }

  estadoSpda.proximoNumero = proximoNumero;
}

function renderOS() {
  const select = byId("spdaSelectOS");
  if (!select) return;

  select.innerHTML = `<option value="">Selecione uma OS cadastrada...</option>` + estadoSpda.os.map(os => `
    <option value="${escapeHtml(os.id_OSs)}">OS ${escapeHtml(os.id_OSs)} - ${escapeHtml(os.descricao || os.nomeEmpresa || "")}</option>
  `).join("");
}

function renderEstruturas() {
  const lista = byId("spdaListaEstruturas");
  if (!lista) return;

  if (!byId("spdaSelectOS")?.value) {
    lista.innerHTML = `<div class="spda-empty-mini">Selecione uma OS para listar os prédios.</div>`;
    return;
  }

  if (!estadoSpda.estruturas.length) {
    lista.innerHTML = `<div class="spda-empty-mini">Nenhum prédio cadastrado nesta OS.</div>`;
    return;
  }

  lista.innerHTML = estadoSpda.estruturas.map(item => `
    <button type="button" class="spda-estrutura-card ${estadoSpda.estruturaAtual?.id_spda_estrutura === item.id_spda_estrutura ? "ativo" : ""}" data-id="${item.id_spda_estrutura}">
      <span>${escapeHtml(item.tipo_estrutura || "Estrutura")}</span>
      <strong>${escapeHtml(item.nome_predio)}</strong>
      <small>${item.planta_url ? "Planta anexada" : "Sem planta baixa"}</small>
    </button>
  `).join("");
}

function preencherForm(item = null) {
  byId("spdaEstruturaId").value = item?.id_spda_estrutura || "";
  byId("spdaNomePredio").value = item?.nome_predio || "";
  byId("spdaSubsistemas").value = item?.subsistemas || "";
  byId("spdaDescricao").value = item?.descricao_spda || "";
  byId("spdaTipoEstrutura").value = item?.tipo_estrutura || "";
}

function renderPlanta() {
  const estrutura = estadoSpda.estruturaAtual;
  const layer = byId("spdaPlantaLayer");
  const placeholder = byId("spdaPlantaPlaceholder");
  const titulo = byId("spdaEditorTitulo");
  const kicker = byId("spdaEditorKicker");

  if (!layer || !placeholder) return;

  titulo.textContent = estrutura?.nome_predio || "Nenhuma estrutura selecionada";
  kicker.textContent = estrutura ? `OS ${estrutura.id_os}` : "Planta baixa";

  if (!estrutura?.planta_url) {
    layer.innerHTML = "";
    placeholder.hidden = false;
    renderElementos();
    return;
  }

  placeholder.hidden = true;
  const url = `${estrutura.planta_url}?t=${Date.now()}`;
  if (String(estrutura.planta_mime || "").includes("pdf")) {
    layer.innerHTML = `<iframe src="${url}" title="Planta baixa SPDA"></iframe>`;
  } else {
    layer.innerHTML = `<img src="${url}" alt="Planta baixa SPDA">`;
  }
  renderElementos();
}

function criarPonto(ponto) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "spda-point";
  button.dataset.id = ponto.id;
  button.style.left = `${ponto.x}%`;
  button.style.top = `${ponto.y}%`;
  button.textContent = normalizarNumero(ponto.numero);
  button.title = `Ponto ${normalizarNumero(ponto.numero)}`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    acionarPonto(ponto);
  });
  return button;
}

function pontoTemMedicoesAssociadas(pontoId) {
  const elementos = obterElementos();
  return elementos.continuidades.some(item => item.de === pontoId || item.para === pontoId) ||
    elementos.aterramentos.some(item => item.ponto === pontoId);
}

async function removerPonto(pontoId) {
  if (pontoTemMedicoesAssociadas(pontoId)) {
    setHint("Remova as medições associadas antes de apagar este ponto.");
    return;
  }

  const elementos = obterElementos();
  elementos.pontos = elementos.pontos.filter(ponto => ponto.id !== pontoId);
  recalcularProximoNumero();
  await salvarElementos({ silencioso: true });
  renderElementos();
  setHint("Ponto removido.");
}

function iniciarMoverPonto(event, ponto) {
  event.preventDefault();
  event.stopPropagation();

  const botao = event.currentTarget;
  botao?.setPointerCapture?.(event.pointerId);
  setHint(`Arraste para deslocar o ponto ${normalizarNumero(ponto.numero)}.`);

  const mover = moveEvent => {
    moveEvent.preventDefault();
    const pontoAtual = obterElementos().pontos.find(item => item.id === ponto.id);
    if (!pontoAtual) return;

    const pos = getCanvasPercent(moveEvent);
    pontoAtual.x = Number(limitarPercentual(pos.x, -SPDA_MARGEM_EDICAO).toFixed(3));
    pontoAtual.y = Number(limitarPercentual(pos.y, -SPDA_MARGEM_EDICAO).toFixed(3));
    renderElementos();
  };

  const soltar = async eventUp => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    eventUp?.preventDefault?.();
    await salvarElementos({ silencioso: true });
    renderElementos();
    setHint(`Ponto ${normalizarNumero(ponto.numero)} deslocado.`);
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
}

function criarAcoesPonto(ponto) {
  ponto.acoes ||= [];
  const selecionadas = new Set(ponto.acoes);
  const minimizado = ponto.acoesMinimizado === true;
  const acoesVisiveis = SPDA_ACOES_PONTO.filter(acao => (
    !minimizado && (estadoSpda.mostrarAcoesNaoSelecionadas || selecionadas.has(acao.id))
  ));

  const legenda = document.createElement("div");
  legenda.className = `spda-point-actions ${minimizado ? "minimizado" : ""}`;
  if (Number(ponto.x) > 76) legenda.classList.add("is-left");
  if (Number(ponto.y) < 14) legenda.classList.add("is-below");
  legenda.style.left = `${ponto.x}%`;
  legenda.style.top = `${ponto.y}%`;

  acoesVisiveis.forEach(acao => {
    const selecionado = selecionadas.has(acao.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `spda-point-action ${selecionado ? "selecionado" : ""}`;
    button.title = acao.titulo;
    button.innerHTML = `<i class="fa-solid ${acao.icone}"></i>`;
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      const pontoAtual = obterElementos().pontos.find(item => item.id === ponto.id);
      if (!pontoAtual) return;
      pontoAtual.acoes ||= [];
      const jaSelecionado = pontoAtual.acoes.includes(acao.id);
      pontoAtual.acoes = jaSelecionado
        ? pontoAtual.acoes.filter(item => item !== acao.id)
        : Array.from(new Set([...pontoAtual.acoes, acao.id]));
      await salvarElementos({ silencioso: true });
      renderElementos();
      renderLegendaIconesSpda();
      setHint(jaSelecionado ? `${acao.titulo} removido do ponto.` : `${acao.titulo} marcado no ponto.`);
    });
    legenda.appendChild(button);
  });

  const alternar = document.createElement("button");
  alternar.type = "button";
  alternar.className = "spda-point-action spda-point-action-toggle";
  alternar.title = minimizado ? "Maximizar ações" : "Minimizar ações";
  alternar.innerHTML = `<i class="fa-solid ${minimizado ? "fa-up-right-and-down-left-from-center" : "fa-down-left-and-up-right-to-center"}"></i>`;
  alternar.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    const pontoAtual = obterElementos().pontos.find(item => item.id === ponto.id);
    if (!pontoAtual) return;
    pontoAtual.acoesMinimizado = pontoAtual.acoesMinimizado !== true;
    await salvarElementos({ silencioso: true });
    renderElementos();
  });
  legenda.appendChild(alternar);

  const mover = document.createElement("button");
  mover.type = "button";
  mover.className = "spda-point-action spda-point-action-move";
  mover.title = "Mover ponto";
  mover.innerHTML = '<i class="fa-solid fa-arrows-up-down-left-right"></i>';
  mover.addEventListener("pointerdown", event => iniciarMoverPonto(event, ponto));
  legenda.appendChild(mover);

  if (!pontoTemMedicoesAssociadas(ponto.id)) {
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "spda-point-action spda-point-action-remove";
    excluir.title = "Remover ponto";
    excluir.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
    excluir.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await removerPonto(ponto.id);
    });
    legenda.appendChild(excluir);
  }

  return legenda;
}

function criarLegendaAcoesSelecionadas(ponto) {
  const idsSelecionados = Array.isArray(ponto.acoes) ? ponto.acoes : [];
  const selecionadas = SPDA_ACOES_PONTO.filter(acao => idsSelecionados.includes(acao.id));
  if (!selecionadas.length) return null;
  const pos = calcularPosLegendaAcoes(ponto);

  const legenda = document.createElement("div");
  legenda.className = "spda-point-problem-legend";
  legenda.classList.toggle("is-left", pos.x < Number(ponto.x));
  legenda.style.left = `${pos.x}%`;
  legenda.style.top = `${pos.y}%`;
  legenda.innerHTML = selecionadas
    .map(acao => `<span>${escapeHtml(acao.titulo)}</span>`)
    .join("");
  legenda.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();
    legenda.setPointerCapture?.(event.pointerId);
    const moverLegenda = moveEvent => {
      const pontoAtual = obterElementos().pontos.find(item => item.id === ponto.id);
      if (!pontoAtual) return;
      const atual = getCanvasPercent(moveEvent);
      pontoAtual.legendaX = Number(limitarPercentual(atual.x, -SPDA_MARGEM_EDICAO).toFixed(3));
      pontoAtual.legendaY = Number(limitarPercentual(atual.y, -SPDA_MARGEM_EDICAO).toFixed(3));
      renderElementos();
    };
    const soltar = async () => {
      document.removeEventListener("pointermove", moverLegenda);
      document.removeEventListener("pointerup", soltar);
      await salvarElementos({ silencioso: true });
      setHint("Legenda dos problemas reposicionada.");
    };
    document.addEventListener("pointermove", moverLegenda);
    document.addEventListener("pointerup", soltar, { once: true });
  });
  return legenda;
}

function calcularPosLegendaAcoes(ponto) {
  const x = Number.isFinite(Number(ponto.legendaX))
    ? Number(ponto.legendaX)
    : Number(ponto.x) + (Number(ponto.x) > 68 ? -20 : 14);
  const y = Number.isFinite(Number(ponto.legendaY))
    ? Number(ponto.legendaY)
    : Number(ponto.y) + (Number(ponto.y) > 66 ? -12 : 10);

  return {
    x: limitarPercentual(x, -SPDA_MARGEM_EDICAO),
    y: limitarPercentual(y, -SPDA_MARGEM_EDICAO)
  };
}

function criarLinhaLegendaAcoesSelecionadas(ponto, largura, altura) {
  const idsSelecionados = Array.isArray(ponto.acoes) ? ponto.acoes : [];
  if (!idsSelecionados.length) return "";

  const pos = calcularPosLegendaAcoes(ponto);
  const x1 = (Number(ponto.x) / 100) * largura;
  const y1 = (Number(ponto.y) / 100) * altura;
  const textoX = (pos.x / 100) * largura;
  const textoY = (pos.y / 100) * altura;
  const lado = pos.x < Number(ponto.x) ? -1 : 1;
  const comprimentoHorizontal = Math.min(22, Math.max(58, largura * 0.055));
  const fimX = textoX - (lado * 8);
  const inicioHorizontalX = fimX - (lado * comprimentoHorizontal);
  const y2 = textoY;

  return `<path class="spda-problem-legend-line" d="M ${x1} ${y1} L ${inicioHorizontalX} ${y2} L ${fimX} ${y2}" />`;
}

function calcularCurvaContinuidade(item, pontos) {
  const p1 = pontos.find(ponto => ponto.id === item.de);
  const p2 = pontos.find(ponto => ponto.id === item.para);
  if (!p1 || !p2) return null;

  const canvas = byId("spdaCanvas");
  const largura = canvas?.clientWidth || 1000;
  const altura = canvas?.clientHeight || 680;
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.max(Math.hypot(dx, dy), 1);
  const curva = Math.min(13, Math.max(5.5, len * 0.2));
  let externoX = midX - 50;
  let externoY = midY - 50;
  const externoLen = Math.hypot(externoX, externoY) || 1;
  externoX /= externoLen;
  externoY /= externoLen;

  if (Math.abs(externoX) < 0.18 && Math.abs(externoY) < 0.18) {
    externoX = -dy / len;
    externoY = dx / len;
  }

  const ctrlX = Number.isFinite(Number(item.ctrlX))
    ? limitarPercentual(Number(item.ctrlX), -SPDA_MARGEM_EDICAO)
    : limitarPercentual(midX + externoX * curva, -SPDA_MARGEM_EDICAO);
  const ctrlY = Number.isFinite(Number(item.ctrlY))
    ? limitarPercentual(Number(item.ctrlY), -SPDA_MARGEM_EDICAO)
    : limitarPercentual(midY + externoY * curva, -SPDA_MARGEM_EDICAO);

  return {
    p1,
    p2,
    ctrlX,
    ctrlY,
    labelX: (p1.x + (2 * ctrlX) + p2.x) / 4,
    labelY: (p1.y + (2 * ctrlY) + p2.y) / 4,
    path: {
      x1: (p1.x / 100) * largura,
      y1: (p1.y / 100) * altura,
      x2: (p2.x / 100) * largura,
      y2: (p2.y / 100) * altura,
      cx: (ctrlX / 100) * largura,
      cy: (ctrlY / 100) * altura
    },
    viewBox: `0 0 ${largura} ${altura}`
  };
}

function curvaContinuidade(item, pontos) {
  const curva = calcularCurvaContinuidade(item, pontos);
  if (!curva) return "";

  return `
    <path class="spda-continuity-line" d="M ${curva.path.x1} ${curva.path.y1} Q ${curva.path.cx} ${curva.path.cy} ${curva.path.x2} ${curva.path.y2}" />
  `;
}

function criarControleCurva(item, curva) {
  const controle = document.createElement("button");
  controle.type = "button";
  controle.className = "spda-curve-handle";
  controle.title = "Arraste para ajustar o grau da linha";
  controle.style.left = `${curva.labelX}%`;
  controle.style.top = `${curva.labelY}%`;
  controle.innerHTML = '<i class="fa-solid fa-up-down-left-right"></i>';

  controle.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();
    controle.setPointerCapture?.(event.pointerId);
    const mover = moveEvent => {
      const atual = obterElementos().continuidades.find(continuidade => continuidade.id === item.id);
      if (!atual) return;
      const pos = getCanvasPercent(moveEvent);
      atual.ctrlX = Number(limitarPercentual((2 * pos.x) - ((curva.p1.x + curva.p2.x) / 2), -SPDA_MARGEM_EDICAO).toFixed(3));
      atual.ctrlY = Number(limitarPercentual((2 * pos.y) - ((curva.p1.y + curva.p2.y) / 2), -SPDA_MARGEM_EDICAO).toFixed(3));
      renderElementos();
    };
    const soltar = async () => {
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerup", soltar);
      await salvarElementos({ silencioso: true });
      setHint("Grau da linha ajustado.");
    };
    document.addEventListener("pointermove", mover);
    document.addEventListener("pointerup", soltar, { once: true });
  });

  return controle;
}

function criarCampoMedicao({ classe, left, top, valor, placeholder, unidade, onCommit, onRemove, onMove }) {
  const wrapper = document.createElement("div");
  wrapper.className = classe;
  wrapper.style.left = `${left}%`;
  wrapper.style.top = `${top}%`;

  const input = document.createElement("input");
  input.type = "text";
  input.value = removerUnidadeVisual(valor, unidade);
  input.placeholder = removerUnidadeVisual(placeholder, unidade) || "0,00";
  input.addEventListener("click", event => event.stopPropagation());
  input.addEventListener("keydown", async event => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
  });
  input.addEventListener("change", async () => {
    input.value = removerUnidadeVisual(input.value, unidade);
    await onCommit(input.value);
  });
  input.addEventListener("blur", async () => {
    input.value = removerUnidadeVisual(input.value, unidade);
    await onCommit(input.value);
  });

  wrapper.appendChild(input);
  if (unidade) {
    const unidadeEl = document.createElement("span");
    unidadeEl.className = "spda-medicao-unidade";
    unidadeEl.textContent = unidade;
    wrapper.appendChild(unidadeEl);
  }

  if (typeof onRemove === "function") {
    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "spda-medicao-remover";
    remover.title = "Remover medição";
    remover.innerHTML = "&times;";
    remover.addEventListener("pointerdown", event => {
      event.preventDefault();
      event.stopPropagation();
    });
    remover.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await onRemove();
    });
    wrapper.appendChild(remover);
  }

  if (typeof onMove === "function") {
    wrapper.classList.add("is-movable");
    wrapper.title = "Segure e arraste para mover";
    wrapper.addEventListener("pointerdown", event => {
      if (event.target.closest(".spda-medicao-remover")) return;
      event.stopPropagation();
      const inicio = { x: event.clientX, y: event.clientY };
      let arrastando = false;
      wrapper.setPointerCapture?.(event.pointerId);
      const moverCampo = moveEvent => {
        const distancia = Math.hypot(moveEvent.clientX - inicio.x, moveEvent.clientY - inicio.y);
        if (!arrastando && distancia < 4) return;
        arrastando = true;
        moveEvent.preventDefault();
        const pos = getCanvasPercent(moveEvent);
        onMove(pos, false);
      };
      const soltar = async eventUp => {
        document.removeEventListener("pointermove", moverCampo);
        document.removeEventListener("pointerup", soltar);
        if (arrastando) {
          eventUp?.preventDefault?.();
          await onMove(null, true);
          return;
        }
        if (event.target === input) input.focus();
      };
      document.addEventListener("pointermove", moverCampo);
      document.addEventListener("pointerup", soltar, { once: true });
    });
  }

  return wrapper;
}

function renderElementos() {
  const overlay = byId("spdaOverlayLayer");
  const svg = byId("spdaSvgLayer");
  if (!overlay || !svg) return;

  overlay.innerHTML = "";
  svg.innerHTML = "";
  const largura = byId("spdaCanvas")?.clientWidth || 1000;
  const altura = byId("spdaCanvas")?.clientHeight || 680;
  svg.setAttribute("viewBox", `0 0 ${largura} ${altura}`);

  const elementos = obterElementos();
  elementos.continuidades.forEach(item => {
    svg.insertAdjacentHTML("beforeend", curvaContinuidade(item, elementos.pontos));
  });

  elementos.pontos.forEach(ponto => {
    svg.insertAdjacentHTML("beforeend", criarLinhaLegendaAcoesSelecionadas(ponto, largura, altura));
    overlay.appendChild(criarPonto(ponto));
    const acoes = criarAcoesPonto(ponto);
    if (acoes) overlay.appendChild(acoes);
    const legendaProblemas = criarLegendaAcoesSelecionadas(ponto);
    if (legendaProblemas) overlay.appendChild(legendaProblemas);
  });

  elementos.continuidades.forEach(item => {
    const curva = calcularCurvaContinuidade(item, elementos.pontos);
    if (!curva) return;
    overlay.appendChild(criarControleCurva(item, curva));
    overlay.appendChild(criarCampoMedicao({
      classe: "spda-continuity-editor",
      left: curva.labelX,
      top: curva.labelY,
      valor: item.valor,
      placeholder: "mΩ",
      unidade: "mΩ",
      onCommit: async valor => {
        item.valor = valor;
        item.avaliacao = calcularAvaliacaoMedicao("continuidade", valor);
        await salvarElementos({ silencioso: true });
        renderTabelaPreenchimentoSpda();
      },
      onRemove: async () => {
        const elementosAtuais = obterElementos();
        elementosAtuais.continuidades = elementosAtuais.continuidades.filter(continuidade => {
          if (item.id && continuidade.id) return continuidade.id !== item.id;
          return !(continuidade.de === item.de && continuidade.para === item.para && continuidade.valor === item.valor);
        });
        await salvarElementos({ silencioso: true });
        renderElementos();
        setHint("Medição de continuidade removida.");
      }
    }));
  });

  elementos.aterramentos.forEach(item => {
    const ponto = elementos.pontos.find(p => p.id === item.ponto);
    if (!ponto) return;
    overlay.appendChild(criarCampoMedicao({
      classe: "spda-ground-label",
      left: Number.isFinite(Number(item.labelX)) ? Number(item.labelX) : ponto.x,
      top: Number.isFinite(Number(item.labelY)) ? Number(item.labelY) : ponto.y,
      valor: item.valor,
      placeholder: "Ω",
      unidade: "Ω",
      onCommit: async valor => {
        item.valor = valor;
        item.avaliacao = calcularAvaliacaoMedicao("aterramento", valor);
        await salvarElementos({ silencioso: true });
        renderTabelaPreenchimentoSpda();
      },
      onRemove: async () => {
        const elementosAtuais = obterElementos();
        elementosAtuais.aterramentos = elementosAtuais.aterramentos.filter(aterramento => {
          if (item.id && aterramento.id) return aterramento.id !== item.id;
          return !(aterramento.ponto === item.ponto && aterramento.valor === item.valor);
        });
        await salvarElementos({ silencioso: true });
        renderElementos();
        setHint("Medição de aterramento removida.");
      },
      onMove: async (pos, finalizar) => {
        if (pos) {
          item.labelX = Number(pos.x.toFixed(3));
          item.labelY = Number(pos.y.toFixed(3));
          renderElementos();
        }
        if (finalizar) {
          await salvarElementos({ silencioso: true });
          setHint("Posição da medição de aterramento ajustada.");
        }
      }
    }));
  });

  renderTabelaPreenchimentoSpda();
}

function aplicarPanPlanta() {
  const transform = `translate(${estadoSpda.panX}px, ${estadoSpda.panY}px)`;
  ["spdaPlantaLayer", "spdaSvgLayer", "spdaOverlayLayer"].forEach(id => {
    const layer = byId(id);
    if (layer) layer.style.transform = transform;
  });
}

async function salvarElementos({ silencioso = false } = {}) {
  if (!estadoSpda.estruturaAtual) return;
  const resposta = await apiSpda(`/api/spda/estruturas/${estadoSpda.estruturaAtual.id_spda_estrutura}/elementos`, {
    method: "PUT",
    body: JSON.stringify({ elementos: obterElementos() })
  });
  estadoSpda.estruturaAtual = resposta.estrutura;
  const index = estadoSpda.estruturas.findIndex(item => item.id_spda_estrutura === resposta.estrutura.id_spda_estrutura);
  if (index >= 0) estadoSpda.estruturas[index] = resposta.estrutura;
  if (!silencioso) setHint("Marcações salvas.");
}

async function acionarPonto(ponto) {
  const elementos = obterElementos();

  if (estadoSpda.ferramenta === "continuidade") {
    if (!estadoSpda.continuidadeOrigem) {
      estadoSpda.continuidadeOrigem = ponto.id;
      setHint(`Ponto ${normalizarNumero(ponto.numero)} selecionado. Agora selecione o segundo ponto.`);
      return;
    }

    if (estadoSpda.continuidadeOrigem === ponto.id) {
      setHint("Selecione um ponto diferente para continuidade.");
      return;
    }

    elementos.continuidades.push({
      id: `cont_${Date.now()}`,
      de: estadoSpda.continuidadeOrigem,
      para: ponto.id,
      valor: ""
    });
    estadoSpda.continuidadeOrigem = null;
    renderElementos();
    await salvarElementos({ silencioso: true });
    setHint("Continuidade adicionada. Preencha o valor no campo que apareceu sobre a linha.");
    return;
  }

  if (estadoSpda.ferramenta === "aterramento") {
    const existente = elementos.aterramentos.find(item => item.ponto === ponto.id);
    if (!existente) elementos.aterramentos.push({ id: `terra_${Date.now()}`, ponto: ponto.id, valor: "" });
    renderElementos();
    await salvarElementos({ silencioso: true });
    setHint("Medição de aterramento adicionada. Preencha o valor no campo acima do ponto.");
  }
}

async function adicionarPonto(event) {
  if (estadoSpda.ferramenta !== "numero") return;
  if (!estadoSpda.estruturaAtual?.planta_url) return;

  const pos = getCanvasPercent(event);
  const elementos = obterElementos();
  elementos.pontos.push({
    id: `ponto_${Date.now()}`,
    numero: estadoSpda.proximoNumero,
    x: Number(pos.x.toFixed(3)),
    y: Number(pos.y.toFixed(3)),
    acoes: [],
    acoesMinimizado: true
  });

  recalcularProximoNumero();
  renderElementos();
  await salvarElementos({ silencioso: true });
  setHint(`Ponto adicionado. Clique na planta para posicionar o ponto ${normalizarNumero(estadoSpda.proximoNumero)}.`);
}

async function carregarOS() {
  estadoSpda.os = await apiSpda("/api/os");
  renderOS();
}

async function carregarEstruturas() {
  const idOS = byId("spdaSelectOS")?.value;
  estadoSpda.estruturaAtual = null;
  preencherForm();
  renderPlanta();
  if (!idOS) {
    estadoSpda.estruturas = [];
    renderEstruturas();
    return;
  }

  estadoSpda.estruturas = await apiSpda(`/api/spda/os/${encodeURIComponent(idOS)}/estruturas`);
  estadoSpda.estruturaAtual = estadoSpda.estruturas[0] || null;
  preencherForm(estadoSpda.estruturaAtual);
  recalcularProximoNumero();
  renderEstruturas();
  renderPlanta();
  setHint(estadoSpda.estruturaAtual ? "Selecione uma ferramenta para marcar a planta." : "Cadastre o primeiro prédio desta OS.");
}

async function salvarEstrutura(event) {
  event.preventDefault();
  const idOS = byId("spdaSelectOS")?.value;
  if (!idOS) {
    setHint("Selecione uma OS antes de cadastrar o prédio.");
    return;
  }

  const id = byId("spdaEstruturaId").value;
  const payload = {
    nome_predio: byId("spdaNomePredio").value,
    subsistemas: byId("spdaSubsistemas").value,
    descricao_spda: byId("spdaDescricao").value,
    tipo_estrutura: byId("spdaTipoEstrutura").value,
    elementos: estadoSpda.estruturaAtual?.elementos || elementosVazios()
  };

  const url = id
    ? `/api/spda/estruturas/${encodeURIComponent(id)}`
    : `/api/spda/os/${encodeURIComponent(idOS)}/estruturas`;
  const resposta = await apiSpda(url, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload)
  });

  estadoSpda.estruturaAtual = resposta.estrutura;
  await carregarEstruturas();
  const criada = estadoSpda.estruturas.find(item => item.id_spda_estrutura === resposta.estrutura.id_spda_estrutura);
  if (criada) {
    estadoSpda.estruturaAtual = criada;
    preencherForm(criada);
    renderEstruturas();
    renderPlanta();
  }
  setHint("Estrutura salva. Agora você pode anexar a planta baixa.");
}

async function uploadPlanta() {
  const input = byId("spdaInputPlanta");
  const file = input?.files?.[0];
  if (!estadoSpda.estruturaAtual) {
    setHint("Salve ou selecione uma estrutura antes de anexar a planta.");
    if (input) input.value = "";
    return;
  }
  if (!file) return;

  const formData = new FormData();
  formData.append("planta", file);
  const resposta = await apiSpda(`/api/spda/estruturas/${estadoSpda.estruturaAtual.id_spda_estrutura}/planta`, {
    method: "POST",
    body: formData
  });

  estadoSpda.estruturaAtual = resposta.estrutura;
  await carregarEstruturas();
  estadoSpda.estruturaAtual = estadoSpda.estruturas.find(item => item.id_spda_estrutura === resposta.estrutura.id_spda_estrutura);
  preencherForm(estadoSpda.estruturaAtual);
  renderEstruturas();
  renderPlanta();
  setHint("Planta anexada. Use os botões rápidos para inserir pontos e medições.");
  input.value = "";
}

function selecionarEstrutura(id) {
  const estrutura = estadoSpda.estruturas.find(item => String(item.id_spda_estrutura) === String(id));
  if (!estrutura) return;
  estadoSpda.estruturaAtual = estrutura;
  estadoSpda.ferramenta = null;
  estadoSpda.continuidadeOrigem = null;
  document.querySelectorAll(".spda-tool[data-tool]").forEach(btn => btn.classList.remove("ativo"));
  byId("spdaToggleAcoes")?.classList.toggle("ativo", estadoSpda.mostrarAcoesNaoSelecionadas);
  preencherForm(estrutura);
  recalcularProximoNumero();
  renderEstruturas();
  renderPlanta();
  setHint(estrutura.planta_url ? "Selecione uma ferramenta para marcar a planta." : "Anexe a planta baixa para começar as marcações.");
}

async function desfazerUltimo() {
  const elementos = obterElementos();
  if (elementos.aterramentos.length) elementos.aterramentos.pop();
  else if (elementos.continuidades.length) elementos.continuidades.pop();
  else if (elementos.pontos.length) elementos.pontos.pop();
  recalcularProximoNumero();
  renderElementos();
  await salvarElementos({ silencioso: true });
  setHint("Última marcação removida.");
}

function bindSpda() {
  if (estadoSpda.inicializado) return;
  estadoSpda.inicializado = true;

  byId("spdaSelectOS")?.addEventListener("change", carregarEstruturas);
  byId("spdaRecarregar")?.addEventListener("click", carregarEstruturas);
  byId("spdaFormEstrutura")?.addEventListener("submit", salvarEstrutura);
  byId("spdaNovoCadastro")?.addEventListener("click", () => {
    estadoSpda.estruturaAtual = null;
    preencherForm();
    renderEstruturas();
    renderPlanta();
    setHint("Preencha os dados para cadastrar um novo prédio nesta OS.");
  });
  byId("spdaInputPlanta")?.addEventListener("change", uploadPlanta);
  byId("spdaCanvas")?.addEventListener("click", adicionarPonto);
  byId("spdaCanvasWrap")?.addEventListener("mousedown", iniciarPanPlanta, true);
  byId("spdaCanvasWrap")?.addEventListener("auxclick", event => {
    if (event.button === 1) event.preventDefault();
  });
  byId("spdaCanvasWrap")?.addEventListener("wheel", event => {
    event.preventDefault();
  }, { passive: false });
  byId("spdaToggleAcoes")?.addEventListener("click", () => {
    estadoSpda.mostrarAcoesNaoSelecionadas = !estadoSpda.mostrarAcoesNaoSelecionadas;
    byId("spdaToggleAcoes")?.classList.toggle("ativo", estadoSpda.mostrarAcoesNaoSelecionadas);
    renderElementos();
    setHint(estadoSpda.mostrarAcoesNaoSelecionadas ? "Mostrando todas as ações dos pontos." : "Mostrando apenas ações selecionadas.");
  });
  byId("spdaSalvarElementos")?.addEventListener("click", () => salvarElementos());
  byId("spdaImprimir")?.addEventListener("click", imprimirPlantaSpda);
  byId("spdaDesfazer")?.addEventListener("click", desfazerUltimo);
  byId("spdaTabelaToggle")?.addEventListener("click", () => {
    estadoSpda.tabelaAberta = true;
    renderTabelaPreenchimentoSpda();
  });
  byId("spdaTabelaFechar")?.addEventListener("click", () => {
    estadoSpda.tabelaAberta = false;
    renderTabelaPreenchimentoSpda();
  });
  byId("spdaTabelaConfigToggle")?.addEventListener("click", () => {
    estadoSpda.tabelaConfigAberta = !estadoSpda.tabelaConfigAberta;
    renderTabelaPreenchimentoSpda();
  });
  byId("spdaLimiteContinuidade")?.addEventListener("change", event => {
    const valor = Number(event.target.value);
    estadoSpda.limites.continuidade = valor > 0 ? valor : 200;
    salvarLimitesSpda();
    renderTabelaPreenchimentoSpda();
  });
  byId("spdaLimiteAterramento")?.addEventListener("change", event => {
    const valor = Number(event.target.value);
    estadoSpda.limites.aterramento = valor > 0 ? valor : 10;
    salvarLimitesSpda();
    renderTabelaPreenchimentoSpda();
  });
  document.querySelectorAll("[data-spda-tabela]").forEach(btn => {
    btn.addEventListener("click", () => {
      estadoSpda.tabelaTipo = btn.dataset.spdaTabela || "continuidade";
      renderTabelaPreenchimentoSpda();
    });
  });
  byId("spdaTabelaConteudo")?.addEventListener("change", event => {
    const valorInput = event.target.closest("[data-spda-valor]");
    const avaliacaoSelect = event.target.closest("[data-spda-avaliacao]");
    if (valorInput) {
      if (valorInput.dataset[SPDA_TABELA_ENTER_SALVO] === "1") {
        delete valorInput.dataset[SPDA_TABELA_ENTER_SALVO];
        return;
      }
      atualizarTabelaMedicaoSpda(valorInput.dataset.spdaValor, "valor", valorInput.value.trim());
    }
    if (avaliacaoSelect) atualizarTabelaMedicaoSpda(avaliacaoSelect.dataset.spdaAvaliacao, "avaliacao", avaliacaoSelect.value);
  });
  byId("spdaTabelaConteudo")?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    const valorInput = event.target.closest("[data-spda-valor]");
    if (!valorInput) return;
    event.preventDefault();
    event.stopPropagation();
    salvarValorTabelaEAvancar(valorInput);
  });

  if (!estadoSpda.documentoVinculado) {
    document.addEventListener("click", (event) => {
      const card = event.target.closest(".spda-estrutura-card");
      if (card) selecionarEstrutura(card.dataset.id);
      if (!byId("spdaPage")) return;
      const dentroAcoes = event.target.closest(".spda-point-actions, .spda-point");
      if (!dentroAcoes) fecharAcoesPontosSpda();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && byId("spdaPage")) {
        cancelarFerramenta();
      }
    });
    estadoSpda.documentoVinculado = true;
  }

  document.querySelectorAll(".spda-tool[data-tool]").forEach(btn => {
    btn.addEventListener("click", () => selecionarFerramenta(btn.dataset.tool));
  });
  carregarLimitesSpda();
  renderLegendaIconesSpda();
  renderTabelaPreenchimentoSpda();
}

function iniciarPanPlanta(event) {
  if (event.button !== 1) return;

  const wrap = byId("spdaCanvasWrap");
  const canvas = byId("spdaCanvas");
  if (!wrap || !canvas) return;

  event.preventDefault();
  event.stopPropagation();

  const inicio = {
    x: event.clientX,
    y: event.clientY,
    panX: estadoSpda.panX,
    panY: estadoSpda.panY
  };

  wrap.classList.add("is-panning");

  const mover = moveEvent => {
    moveEvent.preventDefault();
    estadoSpda.panX = inicio.panX + (moveEvent.clientX - inicio.x);
    estadoSpda.panY = inicio.panY + (moveEvent.clientY - inicio.y);
    aplicarPanPlanta();
  };

  const parar = () => {
    document.removeEventListener("mousemove", mover);
    document.removeEventListener("mouseup", parar);
    wrap.classList.remove("is-panning");
  };

  document.addEventListener("mousemove", mover);
  document.addEventListener("mouseup", parar, { once: true });
}

function imprimirPlantaSpda() {
  if (!estadoSpda.estruturaAtual?.planta_url) {
    setHint("Anexe a planta baixa antes de imprimir.");
    return;
  }

  const janela = window.open("", "_blank", "width=1200,height=820");
  if (!janela) {
    setHint("Libere pop-ups para gerar o PDF da planta SPDA.");
    return;
  }

  janela.document.open();
  janela.document.write(montarHtmlImpressaoSpda());
  janela.document.close();
}

function calcularEnquadramentoHtmlSpda() {
  const canvas = byId("spdaCanvas");
  if (!canvas) return null;

  const bounds = calcularBoundsImpressaoSpda();
  const rect = canvas.getBoundingClientRect();
  const larguraCanvas = rect.width || canvas.clientWidth || 1000;
  const alturaCanvas = rect.height || canvas.clientHeight || 680;
  const folga = 48;
  const minXpx = (bounds.minX / 100) * larguraCanvas;
  const minYpx = (bounds.minY / 100) * alturaCanvas;
  const larguraBounds = ((bounds.maxX - bounds.minX) / 100) * larguraCanvas;
  const alturaBounds = ((bounds.maxY - bounds.minY) / 100) * alturaCanvas;
  const larguraPagina = 1120;
  const alturaPagina = 730;
  const scale = Math.min(2.4, Math.min(larguraPagina / (larguraBounds + (folga * 2)), alturaPagina / (alturaBounds + (folga * 2))) + 0.12);
  const areaPagina = { largura: 1120, altura: 730 };
  const conteudoW = larguraBounds * scale;
  const conteudoH = alturaBounds * scale;
  const translateX = -minXpx + ((areaPagina.largura - conteudoW) / (2 * scale));
  const translateY = -minYpx + ((areaPagina.altura - conteudoH) / (2 * scale));

  return {
    larguraCanvas,
    alturaCanvas,
    larguraPagina: areaPagina.largura,
    alturaPagina: areaPagina.altura,
    scale,
    translateX,
    translateY
  };
}

function montarHtmlImpressaoSpda() {
  const enquadramento = calcularEnquadramentoHtmlSpda();
  const canvasHtml = prepararCanvasHtmlSpda();
  const estrutura = estadoSpda.estruturaAtual || {};
  const osTexto = byId("spdaSelectOS")?.selectedOptions?.[0]?.textContent || `OS ${estrutura.id_os || ""}`;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>SPDA - ${escapeHtml(estrutura.nome_predio || "Planta")}</title>
      <style>
        @page { size: A4 landscape; margin: 4mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          color: #151515;
          background: #fff;
          font-family: Arial, Helvetica, sans-serif;
        }
        .spda-print-page {
          width: 100%;
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 7px;
        }
        .spda-print-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
          padding-bottom: 7px;
          border-bottom: 2px solid #222;
        }
        .spda-print-head span {
          display: block;
          color: #9a5a16;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .spda-print-head h1 {
          margin: 2px 0 4px;
          font-size: 20px;
          line-height: 1.05;
        }
        .spda-print-meta {
          display: grid;
          grid-template-columns: repeat(4, max-content);
          gap: 6px 14px;
          color: #333;
          font-size: 10px;
        }
        .spda-print-meta b { color: #111; }
        .spda-print-stage {
          position: relative;
          width: ${enquadramento?.larguraPagina || 1120}px;
          height: ${enquadramento?.alturaPagina || 730}px;
          max-width: 100%;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
        }
        .spda-print-stage .spda-canvas {
          position: relative;
          width: ${enquadramento?.larguraCanvas || 1000}px;
          height: ${enquadramento?.alturaCanvas || 680}px;
          min-height: 0;
          overflow: visible;
          border: 0;
          border-radius: 0;
          background: #fff;
          transform: translate(${enquadramento?.translateX?.toFixed?.(2) + 100 || 0}px, ${enquadramento?.translateY?.toFixed?.(2) || 0}px) scale(${enquadramento?.scale?.toFixed?.(4) || 1});
          transform-origin: 0 0;
        }
        .spda-planta-layer,
        .spda-svg-layer,
        .spda-overlay-layer {
          position: absolute;
          inset: 0;
          transform: none !important;
          transform-origin: 0 0;
        }
        .spda-planta-layer {
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }
        .spda-planta-layer img,
        .spda-planta-layer iframe {
          width: 100%;
          height: 100%;
          border: 0;
          object-fit: contain;
          background: #fff;
        }
        .spda-svg-layer {
          z-index: 2;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
        }
        .spda-overlay-layer {
          z-index: 3;
          pointer-events: none;
        }
        .spda-point {
          position: absolute;
          z-index: 4;
          width: 28px;
          height: 28px;
          transform: translate(-50%, -50%);
          border: 2px solid #10a665;
          border-radius: 999px;
          color: #087144;
          background: rgba(255, 255, 255, 0.74);
          font-size: 13px;
          font-weight: 800;
          line-height: 24px;
          text-align: center;
          padding: 0;
        }
        .spda-continuity-line {
          fill: none;
          stroke: #ff6c2f;
          stroke-width: 1.4;
          vector-effect: non-scaling-stroke;
        }
        .spda-problem-legend-line {
          fill: none;
          stroke: rgba(0, 0, 0, 0.8);
          stroke-width: 1;
          vector-effect: non-scaling-stroke;
        }
        .spda-continuity-editor,
        .spda-ground-label {
          position: absolute;
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: 1px;
          min-height: 26px;
          padding: 0 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          transform: translate(-50%, -50%);
          box-shadow: none;
        }
        .spda-continuity-editor {
          border: 1px solid rgba(255, 91, 25, 0.42);
          color: #ff5b19;
        }
        .spda-ground-label {
          border: 1px solid rgba(31, 120, 200, 0.42);
          color: #1f78c8;
          transform: translate(-50%, calc(-100% - 16px));
        }
        .spda-continuity-editor input,
        .spda-ground-label input {
          width: 44px;
          min-height: 24px;
          border: 0;
          color: currentColor;
          background: transparent;
          font-size: 13px;
          font-weight: 800;
          text-align: right;
        }
        .spda-medicao-unidade {
          color: currentColor;
          font-size: 12px;
          font-weight: 900;
        }
        .spda-point-problem-legend {
          position: absolute;
          z-index: 5;
          display: grid;
          gap: 1px;
          min-width: 110px;
          max-width: 188px;
          padding: 3px 4px;
          color: #111;
          font-size: 9.5px;
          font-weight: 500;
          line-height: 1.12;
          transform: translate(-6px, -50%);
          text-align: left;
        }
        .spda-point-problem-legend.is-left {
          transform: translate(calc(-100% + 6px), -50%);
          text-align: right;
        }
        .spda-point-actions,
        .spda-curve-handle,
        .spda-medicao-remover,
        .spda-medicao-mover {
          display: none !important;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <main class="spda-print-page">
        <header class="spda-print-head">
          <div>
            <span>Relatório técnico SPDA</span>
            <h1>${escapeHtml(estrutura.nome_predio || "Planta baixa")}</h1>
            <div class="spda-print-meta">
              <div><b>OS:</b> ${escapeHtml(osTexto)}</div>
              <div><b>Estrutura:</b> ${escapeHtml(estrutura.tipo_estrutura || "-")}</div>
              <div><b>Subsistemas:</b> ${escapeHtml(estrutura.subsistemas || "-")}</div>
              <div><b>Descrição:</b> ${escapeHtml(estrutura.descricao_spda || "-")}</div>
            </div>
          </div>
        </header>
        <section class="spda-print-stage">
          ${canvasHtml}
        </section>
      </main>
      <script>
        window.addEventListener("load", function () {
          setTimeout(function () { window.print(); }, 450);
        });
      </script>
    </body>
    </html>
  `;
}

function prepararCanvasHtmlSpda() {
  const canvas = byId("spdaCanvas");
  if (!canvas) return "";
  const clone = canvas.cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  clone.querySelectorAll(".spda-point-actions, .spda-curve-handle, .spda-medicao-remover, .spda-medicao-mover").forEach(el => el.remove());
  clone.querySelectorAll(".spda-planta-layer, .spda-svg-layer, .spda-overlay-layer").forEach(el => {
    el.style.transform = "none";
  });
  clone.querySelectorAll("input").forEach(input => {
    input.setAttribute("value", input.value || input.getAttribute("value") || "");
    input.setAttribute("readonly", "readonly");
  });
  return clone.outerHTML;
}

function montarTabelaLegendaSpda() {
  const elementos = obterElementos();
  const ids = new Set();
  elementos.pontos.forEach(ponto => {
    (ponto.acoes || []).forEach(id => ids.add(id));
  });
  const acoes = SPDA_ACOES_PONTO.filter(acao => ids.has(acao.id));
  const linhas = acoes.length
    ? acoes.map(acao => `
        <tr>
          <td class="icone"><i class="fa-solid ${escapeHtml(acao.icone)}"></i></td>
          <td>${escapeHtml(acao.titulo)}</td>
        </tr>
      `).join("")
    : `<tr><td class="icone">-</td><td>Sem problemas marcados.</td></tr>`;

  return `
    <section class="spda-print-legend">
      <strong>Legenda de problemas marcados</strong>
      <table>
        <thead>
          <tr>
            <th class="icone">Ícone</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </section>
  `;
}

function calcularBoundsImpressaoSpda() {
  const elementos = obterElementos();
  const xs = [];
  const ys = [];
  const add = (x, y, folga = 0) => {
    if (Number.isFinite(Number(x))) {
      xs.push(Number(x) - folga, Number(x) + folga);
    }
    if (Number.isFinite(Number(y))) {
      ys.push(Number(y) - folga, Number(y) + folga);
    }
  };

  elementos.pontos.forEach(ponto => {
    add(ponto.x, ponto.y, 2.5);
    if (Array.isArray(ponto.acoes) && ponto.acoes.length) {
      const legenda = calcularPosLegendaAcoes(ponto);
      add(legenda.x, legenda.y, 12);
    }
  });

  elementos.continuidades.forEach(item => {
    const curva = calcularCurvaContinuidade(item, elementos.pontos);
    if (!curva) return;
    add(curva.p1.x, curva.p1.y, 2);
    add(curva.p2.x, curva.p2.y, 2);
    add(curva.ctrlX, curva.ctrlY, 4);
    add(curva.labelX, curva.labelY, 4);
  });

  elementos.aterramentos.forEach(item => {
    const ponto = elementos.pontos.find(p => p.id === item.ponto);
    add(
      Number.isFinite(Number(item.labelX)) ? Number(item.labelX) : ponto?.x,
      Number.isFinite(Number(item.labelY)) ? Number(item.labelY) : ponto?.y,
      5
    );
  });

  if (!xs.length || !ys.length) {
    xs.push(0, 100);
    ys.push(0, 100);
  }

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

export async function initSpda() {
  estadoSpda.inicializado = false;
  estadoSpda.os = [];
  estadoSpda.estruturas = [];
  estadoSpda.estruturaAtual = null;
  estadoSpda.ferramenta = null;
  estadoSpda.continuidadeOrigem = null;
  estadoSpda.proximoNumero = 1;
  estadoSpda.mostrarAcoesNaoSelecionadas = true;

  bindSpda();
  byId("spdaToggleAcoes")?.classList.add("ativo");
  try {
    await carregarOS();
    byId("spdaSelectOS")?.focus({ preventScroll: true });
  } catch (err) {
    console.error("Erro ao iniciar SPDA:", err);
    setHint(err.message || "Não foi possível carregar a tela SPDA.");
  }
}
