const estadoSpda = {
  os: [],
  estruturas: [],
  estruturaAtual: null,
  ferramenta: null,
  continuidadeOrigem: null,
  componenteSelecionado: null,
  caboOrigem: null,
  caboPontos: [],
  proximoNumero: 1,
  panX: 0,
  panY: 0,
  zoom: 1,
  enquadramentoAtivo: false,
  enquadramentoTipo: "planta",
  enquadramentoInicio: null,
  enquadramentoRetangulo: null,
  mostrarAcoesNaoSelecionadas: true,
  tabelaAberta: false,
  tabelaTipo: "continuidade",
  tabelaConfigAberta: false,
  anotacoesAberta: false,
  marcacaoAnotacaoAberta: null,
  reposicionamento: null,
  ignorarCliqueAposArraste: false,
  marcacaoDraft: null,
  anotacaoMarcacaoPreview: null,
  captacaoRompimentoInicio: null,
  captacaoRompimentoPreview: null,
  captacaoRompimentoPendente: null,
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
  { id: "sem_adesivo_advertencia", titulo: "Sem adesivo de Advertência", icone: "fa-triangle-exclamation" },
  { id: "terminal_desgastado", titulo: "Terminal desgastado", icone: "fa-screwdriver-wrench" }
];

const SPDA_COMPONENTES = {
  entrada_luz: { titulo: "Entrada de Luz", categoria: "eletrica", icone: "fa-plug-circle-bolt", sigla: "EL" },
  transformador: { titulo: "Transformador", categoria: "eletrica", icone: "fa-tower-broadcast", sigla: "TR" },
  qgbt: { titulo: "QGBT", categoria: "eletrica", icone: "fa-square", sigla: "QGBT" },
  qdf: { titulo: "QDF", categoria: "eletrica", icone: "fa-square-half-stroke", sigla: "QDF" },
  entrada_rede: { titulo: "Entrada de Rede", categoria: "rede", icone: "fa-ethernet", sigla: "ER" },
  rack: { titulo: "Rack", categoria: "rede", icone: "fa-server", sigla: "Rack" },
  central_incendio: { titulo: "Central de Incêndio", categoria: "ppci", icone: "fa-house-fire", sigla: "CI" },
  sensor_acionador: { titulo: "Sensor / Acionador", categoria: "ppci", icone: "fa-bell", sigla: "SA" },
  extintor: { titulo: "Extintor", categoria: "ppci", icone: "fa-fire-extinguisher", sigla: "EXT" },
  captor_extraviado: { titulo: "Captor extraviado", categoria: "captacao", icone: "fa-location-crosshairs", sigla: "CAP" }
};

const SPDA_COMPONENTES_ELETRICOS = new Set(["entrada_luz", "transformador", "qgbt", "qdf"]);
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
  return { pontos: [], continuidades: [], aterramentos: [], componentes: [], cabos: [], marcacoes: [], anotacoes_marcacoes: [], rompimentos_captacao: [] };
}

function obterElementos() {
  if (!estadoSpda.estruturaAtual) return elementosVazios();
  estadoSpda.estruturaAtual.elementos ||= elementosVazios();
  estadoSpda.estruturaAtual.elementos.pontos ||= [];
  estadoSpda.estruturaAtual.elementos.continuidades ||= [];
  estadoSpda.estruturaAtual.elementos.aterramentos ||= [];
  estadoSpda.estruturaAtual.elementos.componentes ||= [];
  estadoSpda.estruturaAtual.elementos.cabos ||= [];
  estadoSpda.estruturaAtual.elementos.marcacoes ||= [];
  estadoSpda.estruturaAtual.elementos.anotacoes_marcacoes ||= [];
  estadoSpda.estruturaAtual.elementos.rompimentos_captacao ||= [];
  return estadoSpda.estruturaAtual.elementos;
}

function normalizarNumero(valor) {
  return String(valor).padStart(2, "0");
}

function getCanvasPercent(event) {
  const rect = byId("spdaCanvas").getBoundingClientRect();
  const zoom = Number(estadoSpda.zoom) || 1;
  return {
    x: limitarPercentual(((event.clientX - rect.left - estadoSpda.panX) / (rect.width * zoom)) * 100, -SPDA_MARGEM_EDICAO),
    y: limitarPercentual(((event.clientY - rect.top - estadoSpda.panY) / (rect.height * zoom)) * 100, -SPDA_MARGEM_EDICAO)
  };
}

function getCanvasRawPercent(event) {
  const rect = byId("spdaCanvas").getBoundingClientRect();
  return {
    x: limitarPercentual(((event.clientX - rect.left) / rect.width) * 100, 0),
    y: limitarPercentual(((event.clientY - rect.top) / rect.height) * 100, 0)
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

function obterEnquadramentoPlanta() {
  const enquadramento = obterElementos().enquadramento;
  if (!enquadramento) return null;
  const x = Number(enquadramento.x);
  const y = Number(enquadramento.y);
  const width = Number(enquadramento.width);
  const height = Number(enquadramento.height);
  if (![x, y, width, height].every(Number.isFinite) || width < 3 || height < 3) return null;
  return { x, y, width, height };
}

function obterAreaPdfSpda() {
  const area = obterElementos().area_pdf;
  if (!area) return null;
  const x = Number(area.x);
  const y = Number(area.y);
  const width = Number(area.width);
  const height = Number(area.height);
  if (![x, y, width, height].every(Number.isFinite) || width < 3 || height < 3) return null;
  return { x, y, width, height };
}

function aplicarEnquadramentoPlanta() {
  const canvas = byId("spdaCanvas");
  if (!canvas) return;
  const enquadramento = obterEnquadramentoPlanta();
  if (!enquadramento) {
    resetarVisaoPlanta();
    return;
  }

  const largura = canvas.clientWidth || 0;
  const altura = canvas.clientHeight || 0;
  const zoomX = 100 / enquadramento.width;
  const zoomY = 100 / enquadramento.height;
  estadoSpda.zoom = Math.max(1, Math.min(3.8, Math.min(zoomX, zoomY) * 0.96));
  estadoSpda.panX = (largura / 2) - (((enquadramento.x + (enquadramento.width / 2)) / 100) * largura * estadoSpda.zoom);
  estadoSpda.panY = (altura / 2) - (((enquadramento.y + (enquadramento.height / 2)) / 100) * altura * estadoSpda.zoom);
  aplicarPanPlanta();
}

function calcularZoomReferenciaEnquadramentoSpda() {
  const enquadramento = obterEnquadramentoPlanta();
  if (!enquadramento) return 1;
  const zoomX = 100 / enquadramento.width;
  const zoomY = 100 / enquadramento.height;
  return Math.max(1, Math.min(3.8, Math.min(zoomX, zoomY) * 0.96));
}

function resetarVisaoPlanta() {
  estadoSpda.zoom = 1;
  estadoSpda.panX = 0;
  estadoSpda.panY = 0;
  aplicarPanPlanta();
}

function renderEnquadramentoSelecao() {
  const selection = byId("spdaFrameSelection");
  if (!selection) return;
  const rect = estadoSpda.enquadramentoRetangulo;
  if (!rect) {
    selection.hidden = true;
    return;
  }

  selection.hidden = false;
  const canvas = byId("spdaCanvas");
  const largura = canvas?.clientWidth || 1;
  const altura = canvas?.clientHeight || 1;
  const zoom = Number(estadoSpda.zoom) || 1;
  selection.style.left = `${(((rect.x / 100) * largura * zoom) + estadoSpda.panX) / largura * 100}%`;
  selection.style.top = `${(((rect.y / 100) * altura * zoom) + estadoSpda.panY) / altura * 100}%`;
  selection.style.width = `${rect.width * zoom}%`;
  selection.style.height = `${rect.height * zoom}%`;
}

function iniciarModoEnquadramentoPlanta() {
  if (!estadoSpda.estruturaAtual?.planta_url) {
    setHint("Anexe a planta antes de enquadrar.");
    return;
  }

  cancelarFerramenta();
  resetarVisaoPlanta();
  estadoSpda.enquadramentoAtivo = true;
  estadoSpda.enquadramentoTipo = "planta";
  estadoSpda.enquadramentoInicio = null;
  estadoSpda.enquadramentoRetangulo = null;
  byId("spdaFrameOverlay")?.removeAttribute("hidden");
  const ajuda = byId("spdaFrameOverlay")?.querySelector(".spda-frame-help span");
  const titulo = byId("spdaFrameOverlay")?.querySelector(".spda-frame-help strong");
  const botao = byId("spdaPularEnquadramento");
  if (titulo) titulo.textContent = "Enquadrar planta";
  if (ajuda) ajuda.textContent = "Arraste um retangulo sobre a area principal que deve abrir em destaque.";
  if (botao) botao.textContent = "Pular";
  renderEnquadramentoSelecao();
  setHint("Arraste um retangulo sobre a area da planta que deve abrir maior na tela.");
}

function iniciarModoAreaPdfSpda() {
  if (!estadoSpda.estruturaAtual?.planta_url) {
    setHint("Anexe a planta antes de definir a area do PDF.");
    return;
  }

  cancelarFerramenta();
  resetarVisaoPlanta();
  estadoSpda.enquadramentoAtivo = true;
  estadoSpda.enquadramentoTipo = "pdf";
  estadoSpda.enquadramentoInicio = null;
  estadoSpda.enquadramentoRetangulo = null;
  byId("spdaFrameOverlay")?.removeAttribute("hidden");
  const ajuda = byId("spdaFrameOverlay")?.querySelector(".spda-frame-help span");
  const titulo = byId("spdaFrameOverlay")?.querySelector(".spda-frame-help strong");
  const botao = byId("spdaPularEnquadramento");
  if (titulo) titulo.textContent = "Area do PDF";
  if (ajuda) ajuda.textContent = "Arraste um retangulo com a area que deve sair na exportacao.";
  if (botao) botao.textContent = "Limpar area";
  renderEnquadramentoSelecao();
  setHint("Marque a area que deve sair no PDF. Aumente o retangulo se precisar de mais folga.");
}

function encerrarModoEnquadramentoPlanta() {
  estadoSpda.enquadramentoAtivo = false;
  estadoSpda.enquadramentoTipo = "planta";
  estadoSpda.enquadramentoInicio = null;
  estadoSpda.enquadramentoRetangulo = null;
  byId("spdaFrameOverlay")?.setAttribute("hidden", "");
  renderEnquadramentoSelecao();
}

function calcularRetanguloEnquadramento(inicio, atual) {
  const x = Math.min(inicio.x, atual.x);
  const y = Math.min(inicio.y, atual.y);
  const width = Math.abs(atual.x - inicio.x);
  const height = Math.abs(atual.y - inicio.y);
  return {
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3)),
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3))
  };
}

function getPontoSelecaoEnquadramento(event) {
  return getCanvasPercent(event);
}

function aplicarAutoPanSelecaoEnquadramento(event) {
  const canvas = byId("spdaCanvas");
  if (!canvas) return false;

  const rect = canvas.getBoundingClientRect();
  const limite = {
    left: Math.max(rect.left, 0),
    top: Math.max(rect.top, 0),
    right: Math.min(rect.right, window.innerWidth),
    bottom: Math.min(rect.bottom, window.innerHeight)
  };
  const larguraVisivel = Math.max(1, limite.right - limite.left);
  const alturaVisivel = Math.max(1, limite.bottom - limite.top);
  const margem = Math.min(88, Math.max(42, Math.min(larguraVisivel, alturaVisivel) * 0.14));
  let dx = 0;
  let dy = 0;

  if (event.clientX > limite.right - margem) {
    dx = -Math.ceil((margem - (limite.right - event.clientX)) / 4);
  } else if (event.clientX < limite.left + margem) {
    dx = Math.ceil((margem - (event.clientX - limite.left)) / 4);
  }

  if (event.clientY > limite.bottom - margem) {
    dy = -Math.ceil((margem - (limite.bottom - event.clientY)) / 4);
  } else if (event.clientY < limite.top + margem) {
    dy = Math.ceil((margem - (event.clientY - limite.top)) / 4);
  }

  if (!dx && !dy) return false;

  estadoSpda.panX += Math.max(-18, Math.min(18, dx));
  estadoSpda.panY += Math.max(-18, Math.min(18, dy));
  aplicarPanPlanta();
  return true;
}

function iniciarSelecaoEnquadramento(event) {
  if (!estadoSpda.enquadramentoAtivo || event.button !== 0) return;
  if (event.target.closest("#spdaPularEnquadramento")) return;

  event.preventDefault();
  event.stopPropagation();

  estadoSpda.enquadramentoInicio = getPontoSelecaoEnquadramento(event);
  estadoSpda.enquadramentoRetangulo = null;
  renderEnquadramentoSelecao();
  let ultimoEvento = event;
  let autoPanFrame = null;

  const atualizarSelecao = pointerEvent => {
    const atual = getPontoSelecaoEnquadramento(pointerEvent);
    estadoSpda.enquadramentoRetangulo = calcularRetanguloEnquadramento(estadoSpda.enquadramentoInicio, atual);
    renderEnquadramentoSelecao();
  };

  const agendarAutoPan = () => {
    if (autoPanFrame) return;
    autoPanFrame = requestAnimationFrame(function executarAutoPan() {
      autoPanFrame = null;
      if (!ultimoEvento || !estadoSpda.enquadramentoAtivo) return;
      if (aplicarAutoPanSelecaoEnquadramento(ultimoEvento)) {
        atualizarSelecao(ultimoEvento);
        autoPanFrame = requestAnimationFrame(executarAutoPan);
      }
    });
  };

  const mover = moveEvent => {
    moveEvent.preventDefault();
    ultimoEvento = moveEvent;
    aplicarAutoPanSelecaoEnquadramento(moveEvent);
    atualizarSelecao(moveEvent);
    agendarAutoPan();
  };

  const soltar = async upEvent => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    if (autoPanFrame) cancelAnimationFrame(autoPanFrame);
    autoPanFrame = null;
    ultimoEvento = null;
    upEvent?.preventDefault?.();

    const rect = estadoSpda.enquadramentoRetangulo;
    if (!rect || rect.width < 4 || rect.height < 4) {
      estadoSpda.enquadramentoRetangulo = null;
      renderEnquadramentoSelecao();
      setHint("Selecione uma area maior para salvar o enquadramento.");
      return;
    }

    const elementos = obterElementos();
    const selecionandoPdf = estadoSpda.enquadramentoTipo === "pdf";
    if (selecionandoPdf) elementos.area_pdf = rect;
    else elementos.enquadramento = rect;
    encerrarModoEnquadramentoPlanta();
    if (selecionandoPdf) renderElementos();
    else aplicarEnquadramentoPlanta();
    await salvarElementos({ silencioso: true });
    setHint(selecionandoPdf
      ? "Area do PDF salva. A exportacao usara esse recorte com a folga marcada."
      : "Enquadramento salvo para este predio. Use o mouse do meio para navegar pelo restante da planta.");
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("pointercancel", soltar, { once: true });
}

async function pularEnquadramentoPlanta() {
  const selecionandoPdf = estadoSpda.enquadramentoTipo === "pdf";
  if (estadoSpda.estruturaAtual?.planta_url) {
    const elementos = obterElementos();
    if (selecionandoPdf) delete elementos.area_pdf;
    else delete elementos.enquadramento;
    await salvarElementos({ silencioso: true });
  }
  encerrarModoEnquadramentoPlanta();
  if (selecionandoPdf) renderElementos();
  else aplicarEnquadramentoPlanta();
  setHint(selecionandoPdf
    ? "Area personalizada do PDF removida. A exportacao volta para a planta inteira."
    : "Enquadramento ignorado. A planta abrira inteira no quadro.");
}

function fecharMenuContextoSpda() {
  document.querySelector(".spda-context-menu")?.remove();
}

function posicionarMenuContextoSpda(menu, event) {
  const margem = 8;
  const largura = menu.offsetWidth || 190;
  const altura = menu.offsetHeight || 120;
  const left = Math.min(event.clientX, window.innerWidth - largura - margem);
  const top = Math.min(event.clientY, window.innerHeight - altura - margem);
  menu.style.left = `${Math.max(margem, left)}px`;
  menu.style.top = `${Math.max(margem, top)}px`;
}

function abrirMenuContextoSpda(event, itens = []) {
  if (!itens.length) return;
  event.preventDefault();
  event.stopPropagation();
  fecharMenuContextoSpda();

  const menu = document.createElement("div");
  menu.className = "spda-context-menu";

  itens.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `spda-context-menu-item ${item.danger ? "is-danger" : ""}`;
    button.innerHTML = `
      <i class="fa-solid ${escapeHtml(item.icone || "fa-circle-dot")}"></i>
      <span>${escapeHtml(item.label)}</span>
    `;

    if (typeof item.onPointerDown === "function") {
      button.addEventListener("pointerdown", pointerEvent => {
        pointerEvent.preventDefault();
        pointerEvent.stopPropagation();
        item.onPointerDown(pointerEvent);
        fecharMenuContextoSpda();
      });
    } else {
      button.addEventListener("click", async clickEvent => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        fecharMenuContextoSpda();
        if (typeof item.onClick === "function") await item.onClick(clickEvent);
      });
    }

    menu.appendChild(button);
  });

  document.body.appendChild(menu);
  posicionarMenuContextoSpda(menu, event);
}

function prepararReposicionamentoSpda(descricao, aplicar) {
  estadoSpda.reposicionamento = { descricao, aplicar };
  estadoSpda.ferramenta = null;
  estadoSpda.componenteSelecionado = null;
  estadoSpda.caboOrigem = null;
  estadoSpda.caboPontos = [];
  encerrarModoEnquadramentoPlanta();
  limparSelecaoFerramentasSpda();
  setHint(`Clique na nova posicao para mover ${descricao}.`);
}

async function aplicarReposicionamentoSpda(event) {
  if (!estadoSpda.reposicionamento) return false;
  if (event.target.closest(".spda-context-menu")) return true;

  const { aplicar, descricao } = estadoSpda.reposicionamento;
  const pos = getCanvasPercent(event);
  estadoSpda.reposicionamento = null;
  if (typeof aplicar === "function") await aplicar(pos);
  renderElementos();
  setHint(`${descricao} reposicionado.`);
  return true;
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

function obterComponenteConfig(tipo) {
  return SPDA_COMPONENTES[tipo] || {
    titulo: "Componente",
    categoria: "generico",
    icone: "fa-location-dot",
    sigla: "CP"
  };
}

function limparSelecaoFerramentasSpda() {
  document.querySelectorAll(".spda-tool[data-tool], [data-spda-componente], .spda-cabo-option").forEach(btn => {
    btn.classList.remove("ativo");
  });
}

function obterComponentePorId(id) {
  return obterElementos().componentes.find(componente => componente.id === id);
}

function obterSequenciaComponenteSpda(componente) {
  const mesmoTipo = obterElementos().componentes.filter(item => item.tipo === componente.tipo);
  const indice = mesmoTipo.findIndex(item => item.id === componente.id);
  return indice >= 0 ? indice + 1 : mesmoTipo.length + 1;
}

function pontosCaboSpda(cabo, componentes = obterElementos().componentes) {
  const origem = componentes.find(componente => componente.id === cabo.de);
  const destino = componentes.find(componente => componente.id === cabo.para);
  if (!origem || !destino) return [];
  return [
    { x: Number(origem.x), y: Number(origem.y) },
    ...(Array.isArray(cabo.pontos) ? cabo.pontos.map(ponto => ({ x: Number(ponto.x), y: Number(ponto.y) })) : []),
    { x: Number(destino.x), y: Number(destino.y) }
  ].filter(ponto => Number.isFinite(ponto.x) && Number.isFinite(ponto.y));
}

function calcularCentroPontosSpda(pontos) {
  return calcularPontoEmCaminhoSpda(pontos, 0.5);
}

function calcularPontoEmCaminhoSpda(pontos, ratio = 0.5) {
  if (!pontos.length) return { x: 50, y: 50 };
  if (pontos.length === 1) return pontos[0];
  const segmentos = [];
  let total = 0;

  for (let i = 0; i < pontos.length - 1; i += 1) {
    const atual = pontos[i];
    const proximo = pontos[i + 1];
    const tamanho = Math.hypot(proximo.x - atual.x, proximo.y - atual.y);
    segmentos.push({ atual, proximo, tamanho });
    total += tamanho;
  }

  if (!total) return pontos[Math.floor(pontos.length / 2)];
  let acumulado = 0;
  const alvo = total * Math.max(0, Math.min(1, Number(ratio) || 0));
  for (const segmento of segmentos) {
    if (acumulado + segmento.tamanho >= alvo) {
      const proporcao = segmento.tamanho ? (alvo - acumulado) / segmento.tamanho : 0;
      return {
        x: segmento.atual.x + ((segmento.proximo.x - segmento.atual.x) * proporcao),
        y: segmento.atual.y + ((segmento.proximo.y - segmento.atual.y) * proporcao)
      };
    }
    acumulado += segmento.tamanho;
  }
  return pontos[pontos.length - 1];
}

function calcularRatioMaisProximoNoCaminhoSpda(pontos, alvo) {
  if (pontos.length < 2) return 0.5;
  let total = 0;
  const segmentos = [];
  for (let i = 0; i < pontos.length - 1; i += 1) {
    const a = pontos[i];
    const b = pontos[i + 1];
    const tamanho = Math.hypot(b.x - a.x, b.y - a.y);
    segmentos.push({ a, b, tamanho });
    total += tamanho;
  }
  if (!total) return 0.5;

  let melhor = { distancia: Infinity, acumulado: total / 2 };
  let percorrido = 0;
  segmentos.forEach(segmento => {
    if (!segmento.tamanho) return;
    const vx = segmento.b.x - segmento.a.x;
    const vy = segmento.b.y - segmento.a.y;
    const t = Math.max(0, Math.min(1, (((alvo.x - segmento.a.x) * vx) + ((alvo.y - segmento.a.y) * vy)) / (segmento.tamanho ** 2)));
    const proj = {
      x: segmento.a.x + (vx * t),
      y: segmento.a.y + (vy * t)
    };
    const distancia = Math.hypot(alvo.x - proj.x, alvo.y - proj.y);
    if (distancia < melhor.distancia) {
      melhor = { distancia, acumulado: percorrido + (segmento.tamanho * t) };
    }
    percorrido += segmento.tamanho;
  });

  return Math.max(0, Math.min(1, melhor.acumulado / total));
}

function pathCaboSpda(pontos, largura, altura) {
  if (pontos.length < 2) return "";
  return pontos
    .map((ponto, index) => {
      const x = (ponto.x / 100) * largura;
      const y = (ponto.y / 100) * altura;
      return `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
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
  if (status.includes("equipotencializa")) return "is-equipotential";
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
        avaliacao: item.tipo === "equipotencializacao"
          ? "Equipotencialização"
          : calcularAvaliacaoMedicao(tipo, item.valor)
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

function renderAnotacoesMarcacoesSpda() {
  const painel = byId("spdaAnotacoesPainel");
  const toggle = byId("spdaAnotacoesToggle");
  const conteudo = byId("spdaAnotacoesConteudo");
  if (!painel || !toggle || !conteudo) return;

  painel.classList.toggle("aberto", estadoSpda.anotacoesAberta);
  toggle.classList.toggle("oculto", estadoSpda.anotacoesAberta);

  const marcacoes = [...obterElementos().marcacoes].sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));
  if (!marcacoes.length) {
    conteudo.innerHTML = `<div class="spda-fill-empty">Nenhuma marcação visual criada.</div>`;
    return;
  }

  conteudo.innerHTML = `
    <table class="spda-fill-table spda-annotation-table">
      <thead>
        <tr>
          <th>Nº</th>
          <th>Anotação</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        ${marcacoes.map(marcacao => `
          <tr>
            <td>!${escapeHtml(marcacao.numero)}</td>
            <td>
              <textarea rows="2" data-spda-marcacao-anotacao="${escapeHtml(marcacao.id)}"
                placeholder="Descreva esta marcação...">${escapeHtml(marcacao.anotacao || "")}</textarea>
            </td>
            <td>
              <button type="button" class="spda-annotation-remove" data-spda-remover-marcacao="${escapeHtml(marcacao.id)}"
                title="Remover marcação">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renumerarMarcacoesVisuaisSpda() {
  const elementos = obterElementos();
  elementos.marcacoes
    .sort((a, b) => {
      const numeroA = Number(a.numero) || 0;
      const numeroB = Number(b.numero) || 0;
      if (numeroA !== numeroB) return numeroA - numeroB;
      return String(a.id || "").localeCompare(String(b.id || ""));
    })
    .forEach((marcacao, index) => {
      marcacao.numero = index + 1;
    });

  const textoAtualizado = obterTextoAnotacoesMarcacoesSpda();
  if (!textoAtualizado) elementos.anotacoes_marcacoes = [];
  else elementos.anotacoes_marcacoes.forEach(texto => {
    texto.texto = textoAtualizado;
  });
}

async function salvarAnotacaoMarcacaoSpda(marcacaoId, valor) {
  const marcacao = obterElementos().marcacoes.find(item => item.id === marcacaoId);
  if (!marcacao) return;

  const texto = String(valor || "").trim();
  if ((marcacao.anotacao || "") === texto) return;

  marcacao.anotacao = texto;
  const textoAtualizado = obterTextoAnotacoesMarcacoesSpda();
  const elementos = obterElementos();
  if (!textoAtualizado) elementos.anotacoes_marcacoes = [];
  else elementos.anotacoes_marcacoes.forEach(item => {
    item.texto = textoAtualizado;
  });
  await salvarElementos({ silencioso: true });
  renderElementos();
  setHint(`Anotação da marcação !${marcacao.numero} salva.`);
}

function obterTextoAnotacoesMarcacoesSpda() {
  return [...obterElementos().marcacoes]
    .sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0))
    .map(marcacao => ({
      numero: Number(marcacao.numero) || 0,
      anotacao: String(marcacao.anotacao || "").trim()
    }))
    .filter(item => item.numero > 0 && item.anotacao)
    .map(item => `!${item.numero} - ${item.anotacao}`)
    .join("\n");
}

async function removerTextoAnotacoesMarcacoesSpda(textoId) {
  const elementos = obterElementos();
  elementos.anotacoes_marcacoes = elementos.anotacoes_marcacoes.filter(item => item.id !== textoId);
  await salvarElementos({ silencioso: true });
  renderElementos();
  setHint("Texto de anotações removido da planta.");
}

async function removerMarcacaoAnotacaoTabelaSpda(marcacaoId) {
  const elementos = obterElementos();
  const existe = elementos.marcacoes.some(marcacao => marcacao.id === marcacaoId);
  if (!existe) return;

  elementos.marcacoes = elementos.marcacoes.filter(marcacao => marcacao.id !== marcacaoId);
  if (estadoSpda.marcacaoAnotacaoAberta === marcacaoId) estadoSpda.marcacaoAnotacaoAberta = null;
  renumerarMarcacoesVisuaisSpda();
  await salvarElementos({ silencioso: true });
  renderElementos();
  setHint("Marcação removida e numeração reorganizada.");
}

function iniciarMoverTextoAnotacoesMarcacoesSpda(event, texto) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();

  const inicio = { x: event.clientX, y: event.clientY };
  let arrastando = false;

  const mover = moveEvent => {
    const distancia = Math.hypot(moveEvent.clientX - inicio.x, moveEvent.clientY - inicio.y);
    if (!arrastando && distancia < 4) return;
    arrastando = true;
    moveEvent.preventDefault();

    const atual = obterElementos().anotacoes_marcacoes.find(item => item.id === texto.id);
    if (!atual) return;
    const pos = getCanvasPercent(moveEvent);
    atual.x = Number(pos.x.toFixed(3));
    atual.y = Number(pos.y.toFixed(3));
    renderElementos();
  };

  const soltar = async upEvent => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    upEvent?.preventDefault?.();
    if (!arrastando) return;
    estadoSpda.ignorarCliqueAposArraste = true;
    await salvarElementos({ silencioso: true });
    setHint("Texto de anotações reposicionado.");
    setTimeout(() => {
      estadoSpda.ignorarCliqueAposArraste = false;
    }, 0);
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("pointercancel", soltar, { once: true });
}

function criarTextoAnotacoesMarcacoesSpda(texto, preview = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `spda-mark-annotation-text ${preview ? "is-preview" : ""}`;
  wrapper.style.left = `${texto.x}%`;
  wrapper.style.top = `${texto.y}%`;
  wrapper.innerHTML = String(texto.texto || "")
    .split("\n")
    .filter(Boolean)
    .map(linha => `<span>${escapeHtml(linha)}</span>`)
    .join("");

  if (!preview) {
    wrapper.title = "Segure e arraste para mover";
    wrapper.addEventListener("pointerdown", event => iniciarMoverTextoAnotacoesMarcacoesSpda(event, texto));
    wrapper.addEventListener("contextmenu", event => abrirMenuContextoSpda(event, [
      {
        label: "Remover texto",
        icone: "fa-xmark",
        danger: true,
        onClick: () => removerTextoAnotacoesMarcacoesSpda(texto.id)
      }
    ]));
  }

  return wrapper;
}

function atualizarPreviewAnotacoesMarcacoesSpda(event) {
  if (estadoSpda.ferramenta !== "anotacoes_marcacoes") return;
  if (!estadoSpda.estruturaAtual?.planta_url || estadoSpda.enquadramentoAtivo) return;
  const texto = obterTextoAnotacoesMarcacoesSpda();
  if (!texto) {
    if (estadoSpda.anotacaoMarcacaoPreview) {
      estadoSpda.anotacaoMarcacaoPreview = null;
      renderElementos();
    }
    return;
  }
  const pos = getCanvasPercent(event);
  estadoSpda.anotacaoMarcacaoPreview = {
    x: Number(pos.x.toFixed(3)),
    y: Number(pos.y.toFixed(3)),
    texto
  };
  renderElementos();
}

function atualizarPreviewRompimentoCaptacaoSpda(event) {
  if (estadoSpda.ferramenta !== "rompimento_captacao") return;
  if (!estadoSpda.estruturaAtual?.planta_url || estadoSpda.enquadramentoAtivo) return;
  if (!estadoSpda.captacaoRompimentoInicio || estadoSpda.captacaoRompimentoPendente) return;

  const pos = getCanvasPercent(event);
  estadoSpda.captacaoRompimentoPreview = {
    ...estadoSpda.captacaoRompimentoInicio,
    x2: Number(pos.x.toFixed(3)),
    y2: Number(pos.y.toFixed(3)),
    tipo: "cabo"
  };
  renderElementos();
}

async function atualizarTabelaMedicaoSpda(id, campo, valor) {
  const elementos = obterElementos();
  const lista = estadoSpda.tabelaTipo === "aterramento" ? elementos.aterramentos : elementos.continuidades;
  const item = lista.find(registro => String(registro.id) === String(id));
  if (!item) return;

  if (campo === "valor") {
    const unidade = estadoSpda.tabelaTipo === "aterramento" ? "Ω" : "mΩ";
    item.valor = valor ? `${valor} ${unidade}` : "";
    item.avaliacao = item.tipo === "equipotencializacao"
      ? "Equipotencializacao"
      : calcularAvaliacaoMedicao(estadoSpda.tabelaTipo, item.valor);
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
  estadoSpda.componenteSelecionado = null;
  estadoSpda.caboOrigem = null;
  estadoSpda.caboPontos = [];
  estadoSpda.reposicionamento = null;
  estadoSpda.marcacaoDraft = null;
  estadoSpda.anotacaoMarcacaoPreview = null;
  estadoSpda.captacaoRompimentoInicio = null;
  estadoSpda.captacaoRompimentoPreview = null;
  estadoSpda.captacaoRompimentoPendente = null;
  encerrarModoEnquadramentoPlanta();
  limparSelecaoFerramentasSpda();
  document.querySelectorAll(".spda-tool[data-tool], .spda-cabo-option[data-tool]").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.tool === ferramenta);
  });

  const mensagens = {
    numero: `Clique na planta para posicionar o ponto ${normalizarNumero(estadoSpda.proximoNumero)}.`,
    continuidade: "Selecione o primeiro ponto numerado para medir continuidade.",
    aterramento: "Selecione um ponto numerado para informar a medição de aterramento.",
    cabo: "Selecione o componente elétrico de origem do cabo.",
    rompimento_captacao: "Clique no primeiro ponto da captação rompida e depois no segundo ponto para escolher cabo ou barra.",
    marcacao_circular: "Clique e arraste do centro para fora para criar uma marcação circular.",
    marcacao_retangular: "Clique e arraste de um canto ao outro para criar uma marcação retangular.",
    anotacoes_marcacoes: "Mova o mouse sobre a planta e clique onde deseja inserir as anotações das marcações."
  };
  setHint(ferramenta === "anotacoes_marcacoes" && !obterTextoAnotacoesMarcacoesSpda()
    ? "Nenhuma marcação possui anotação preenchida para inserir na planta."
    : (mensagens[ferramenta] || ""));
  renderElementos();
}

function selecionarComponenteSpda(tipo) {
  if (!estadoSpda.estruturaAtual) {
    setHint("Selecione ou cadastre uma estrutura antes de marcar a planta.");
    return;
  }

  if (!estadoSpda.estruturaAtual.planta_url) {
    setHint("Anexe a planta baixa antes de inserir componentes.");
    return;
  }

  const config = obterComponenteConfig(tipo);
  estadoSpda.ferramenta = "componente";
  estadoSpda.componenteSelecionado = tipo;
  estadoSpda.continuidadeOrigem = null;
  estadoSpda.caboOrigem = null;
  estadoSpda.caboPontos = [];
  estadoSpda.marcacaoDraft = null;
  estadoSpda.anotacaoMarcacaoPreview = null;
  estadoSpda.captacaoRompimentoInicio = null;
  estadoSpda.captacaoRompimentoPreview = null;
  estadoSpda.captacaoRompimentoPendente = null;
  encerrarModoEnquadramentoPlanta();
  limparSelecaoFerramentasSpda();
  document.querySelector(`[data-spda-componente="${CSS.escape(tipo)}"]`)?.classList.add("ativo");
  setHint(`${config.titulo} selecionado. Clique na planta para posicionar.`);
  renderElementos();
}

function cancelarFerramenta() {
  estadoSpda.ferramenta = null;
  estadoSpda.continuidadeOrigem = null;
  estadoSpda.componenteSelecionado = null;
  estadoSpda.caboOrigem = null;
  estadoSpda.caboPontos = [];
  estadoSpda.marcacaoDraft = null;
  estadoSpda.anotacaoMarcacaoPreview = null;
  estadoSpda.captacaoRompimentoInicio = null;
  estadoSpda.captacaoRompimentoPreview = null;
  estadoSpda.captacaoRompimentoPendente = null;
  encerrarModoEnquadramentoPlanta();
  limparSelecaoFerramentasSpda();
  renderElementos();
  setHint("Ação cancelada. Selecione uma ferramenta para continuar.");
}

async function abrirGuiaSpda() {
  try {
    sessionStorage.setItem("connectpear_guia_inicial", "spda");
  } catch {
    // Se o navegador bloquear o armazenamento, apenas abre o guia na tela inicial.
  }

  const { carregarPagina } = await import("../services/ui/page-loader.js");
  carregarPagina("/client/pages/guia.html");
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

function obterProximoNumeroMarcacaoSpda() {
  const usados = new Set(
    obterElementos().marcacoes
      .map(marcacao => Number(marcacao.numero))
      .filter(numero => Number.isInteger(numero) && numero > 0)
  );

  let numero = 1;
  while (usados.has(numero)) numero += 1;
  return numero;
}

function normalizarRetanguloSpda(a, b) {
  return {
    x: Number(Math.min(a.x, b.x).toFixed(3)),
    y: Number(Math.min(a.y, b.y).toFixed(3)),
    width: Number(Math.abs(b.x - a.x).toFixed(3)),
    height: Number(Math.abs(b.y - a.y).toFixed(3))
  };
}

function criarMarcacaoCircularSpda(inicio, atual) {
  const canvas = byId("spdaCanvas");
  const largura = canvas?.clientWidth || 1;
  const altura = canvas?.clientHeight || 1;
  const dxPx = ((atual.x - inicio.x) / 100) * largura;
  const dyPx = ((atual.y - inicio.y) / 100) * altura;
  const raioPx = Math.max(1, Math.hypot(dxPx, dyPx));
  const width = (raioPx * 2 / largura) * 100;
  const height = (raioPx * 2 / altura) * 100;

  return {
    x: Number((inicio.x - (width / 2)).toFixed(3)),
    y: Number((inicio.y - (height / 2)).toFixed(3)),
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3))
  };
}

function posicaoInicialRotuloMarcacaoSpda(marcacao) {
  if (marcacao.tipo === "circular") {
    return {
      x: Number((marcacao.x + marcacao.width).toFixed(3)),
      y: Number((marcacao.y + (marcacao.height / 2)).toFixed(3))
    };
  }

  return {
    x: Number((marcacao.x + marcacao.width).toFixed(3)),
    y: Number((marcacao.y + (marcacao.height / 2)).toFixed(3))
  };
}

function limitarRotuloNaBordaMarcacaoSpda(marcacao, pos) {
  const x1 = Number(marcacao.x);
  const y1 = Number(marcacao.y);
  const width = Number(marcacao.width);
  const height = Number(marcacao.height);
  const cx = x1 + (width / 2);
  const cy = y1 + (height / 2);

  if (marcacao.tipo === "circular") {
    const rx = Math.max(width / 2, 0.001);
    const ry = Math.max(height / 2, 0.001);
    const angulo = Math.atan2((pos.y - cy) / ry, (pos.x - cx) / rx);
    return {
      x: Number((cx + (Math.cos(angulo) * rx)).toFixed(3)),
      y: Number((cy + (Math.sin(angulo) * ry)).toFixed(3))
    };
  }

  const left = x1;
  const right = x1 + width;
  const top = y1;
  const bottom = y1 + height;
  const candidatos = [
    { x: Math.max(left, Math.min(right, pos.x)), y: top },
    { x: Math.max(left, Math.min(right, pos.x)), y: bottom },
    { x: left, y: Math.max(top, Math.min(bottom, pos.y)) },
    { x: right, y: Math.max(top, Math.min(bottom, pos.y)) }
  ];
  candidatos.sort((a, b) => Math.hypot(pos.x - a.x, pos.y - a.y) - Math.hypot(pos.x - b.x, pos.y - b.y));
  return {
    x: Number(candidatos[0].x.toFixed(3)),
    y: Number(candidatos[0].y.toFixed(3))
  };
}

async function removerMarcacaoVisualSpda(marcacaoId) {
  const elementos = obterElementos();
  elementos.marcacoes = elementos.marcacoes.filter(marcacao => marcacao.id !== marcacaoId);
  if (estadoSpda.marcacaoAnotacaoAberta === marcacaoId) estadoSpda.marcacaoAnotacaoAberta = null;
  renumerarMarcacoesVisuaisSpda();
  await salvarElementos({ silencioso: true });
  renderElementos();
  setHint("Marcação visual removida e numeração reorganizada.");
}

function criarEditorAnotacaoMarcacaoSpda(marcacao, posRotulo) {
  if (estadoSpda.marcacaoAnotacaoAberta !== marcacao.id) return null;

  const editor = document.createElement("div");
  editor.className = "spda-mark-note-editor";
  editor.style.left = `${posRotulo.x}%`;
  editor.style.top = `${posRotulo.y}%`;
  editor.innerHTML = `
    <textarea rows="2" placeholder="Anotação da marcação !${escapeHtml(marcacao.numero)}">${escapeHtml(marcacao.anotacao || "")}</textarea>
    <div>
      <button type="button" data-spda-note-save>Salvar</button>
      <button type="button" data-spda-note-close>Fechar</button>
    </div>
  `;

  const textarea = editor.querySelector("textarea");
  const salvar = async () => {
    await salvarAnotacaoMarcacaoSpda(marcacao.id, textarea.value);
    estadoSpda.marcacaoAnotacaoAberta = null;
    renderElementos();
  };

  editor.addEventListener("click", event => event.stopPropagation());
  editor.addEventListener("pointerdown", event => event.stopPropagation());
  textarea.addEventListener("keydown", async event => {
    event.stopPropagation();
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    await salvar();
  });
  textarea.addEventListener("blur", () => salvarAnotacaoMarcacaoSpda(marcacao.id, textarea.value));
  editor.querySelector("[data-spda-note-save]")?.addEventListener("click", salvar);
  editor.querySelector("[data-spda-note-close]")?.addEventListener("click", event => {
    event.preventDefault();
    estadoSpda.marcacaoAnotacaoAberta = null;
    renderElementos();
  });

  requestAnimationFrame(() => {
    textarea.focus({ preventScroll: true });
    textarea.select();
  });

  return editor;
}

function criarMarcacaoVisualSpda(marcacao, preview = false) {
  const fragmento = document.createDocumentFragment();
  const forma = document.createElement("div");
  forma.className = `spda-visual-mark spda-visual-mark-${marcacao.tipo || "retangular"} ${preview ? "is-preview" : ""}`;
  forma.style.left = `${marcacao.x}%`;
  forma.style.top = `${marcacao.y}%`;
  forma.style.width = `${marcacao.width}%`;
  forma.style.height = `${marcacao.height}%`;
  forma.title = `Marcação !${marcacao.numero || ""}`;
  if (!preview) {
    forma.addEventListener("contextmenu", event => abrirMenuContextoSpda(event, [
      {
        label: "Remover marcação",
        icone: "fa-xmark",
        danger: true,
        onClick: () => removerMarcacaoVisualSpda(marcacao.id)
      }
    ]));
  }
  fragmento.appendChild(forma);

  if (marcacao.numero) {
    const posRotulo = limitarRotuloNaBordaMarcacaoSpda(marcacao, {
      x: Number.isFinite(Number(marcacao.labelX)) ? Number(marcacao.labelX) : marcacao.x + marcacao.width,
      y: Number.isFinite(Number(marcacao.labelY)) ? Number(marcacao.labelY) : marcacao.y + (marcacao.height / 2)
    });
    const rotulo = document.createElement("button");
    rotulo.type = "button";
    rotulo.className = `spda-visual-mark-label ${preview ? "is-preview" : ""}`;
    rotulo.style.left = `${posRotulo.x}%`;
    rotulo.style.top = `${posRotulo.y}%`;
    rotulo.textContent = `!${marcacao.numero}`;
    rotulo.title = "Segure e arraste pela borda da marcação";
    if (!preview) {
      rotulo.addEventListener("pointerdown", event => iniciarMoverRotuloMarcacaoSpda(event, marcacao));
      rotulo.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        estadoSpda.marcacaoAnotacaoAberta = estadoSpda.marcacaoAnotacaoAberta === marcacao.id ? null : marcacao.id;
        renderElementos();
      });
      rotulo.addEventListener("contextmenu", event => abrirMenuContextoSpda(event, [
        {
          label: "Remover marcação",
          icone: "fa-xmark",
          danger: true,
          onClick: () => removerMarcacaoVisualSpda(marcacao.id)
        }
      ]));
    }
    fragmento.appendChild(rotulo);
    const editor = criarEditorAnotacaoMarcacaoSpda(marcacao, posRotulo);
    if (editor) fragmento.appendChild(editor);
  }

  return fragmento;
}

function iniciarMoverRotuloMarcacaoSpda(event, marcacao) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();

  const mover = moveEvent => {
    moveEvent.preventDefault();
    const atual = obterElementos().marcacoes.find(item => item.id === marcacao.id);
    if (!atual) return;
    const pos = limitarRotuloNaBordaMarcacaoSpda(atual, getCanvasPercent(moveEvent));
    atual.labelX = pos.x;
    atual.labelY = pos.y;
    renderElementos();
  };

  const soltar = async () => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    await salvarElementos({ silencioso: true });
    setHint("Número da marcação reposicionado.");
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("pointercancel", soltar, { once: true });
}

function iniciarDesenhoMarcacaoVisualSpda(event) {
  if (!["marcacao_circular", "marcacao_retangular"].includes(estadoSpda.ferramenta)) return false;
  if (!estadoSpda.estruturaAtual?.planta_url || estadoSpda.enquadramentoAtivo) return false;
  if (event.button !== 0) return false;
  if (event.target.closest(".spda-point, .spda-point-actions, .spda-component, .spda-component-actions, .spda-cable-label, .spda-continuity-editor, .spda-ground-label, .spda-visual-mark, .spda-visual-mark-label")) return false;

  event.preventDefault();
  event.stopPropagation();

  const inicio = getCanvasPercent(event);
  const tipo = estadoSpda.ferramenta === "marcacao_circular" ? "circular" : "retangular";
  estadoSpda.marcacaoDraft = {
    id: "preview_marcacao",
    tipo,
    numero: obterProximoNumeroMarcacaoSpda(),
    x: inicio.x,
    y: inicio.y,
    width: 0,
    height: 0
  };

  const mover = moveEvent => {
    moveEvent.preventDefault();
    const atual = getCanvasPercent(moveEvent);
    const base = tipo === "circular"
      ? criarMarcacaoCircularSpda(inicio, atual)
      : normalizarRetanguloSpda(inicio, atual);
    estadoSpda.marcacaoDraft = {
      ...estadoSpda.marcacaoDraft,
      ...base
    };
    const label = posicaoInicialRotuloMarcacaoSpda(estadoSpda.marcacaoDraft);
    estadoSpda.marcacaoDraft.labelX = label.x;
    estadoSpda.marcacaoDraft.labelY = label.y;
    renderElementos();
  };

  const soltar = async upEvent => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    upEvent?.preventDefault?.();

    const draft = estadoSpda.marcacaoDraft;
    estadoSpda.marcacaoDraft = null;
    if (!draft || draft.width < 0.25 || draft.height < 0.25) {
      renderElementos();
      setHint("Arraste para definir um tamanho maior para a marcação.");
      return;
    }

    const label = posicaoInicialRotuloMarcacaoSpda(draft);
    obterElementos().marcacoes.push({
      id: `marc_${Date.now()}`,
      tipo,
      numero: draft.numero,
      x: Number(draft.x.toFixed(3)),
      y: Number(draft.y.toFixed(3)),
      width: Number(draft.width.toFixed(3)),
      height: Number(draft.height.toFixed(3)),
      labelX: label.x,
      labelY: label.y
    });
    renderElementos();
    await salvarElementos({ silencioso: true });
    setHint(`Marcação !${draft.numero} adicionada. Arraste o número para ajustar na borda.`);
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("pointercancel", soltar, { once: true });
  return true;
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
    resetarVisaoPlanta();
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
  requestAnimationFrame(aplicarEnquadramentoPlanta);
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
    if (estadoSpda.ignorarCliqueAposArraste) {
      event.preventDefault();
      event.stopPropagation();
      estadoSpda.ignorarCliqueAposArraste = false;
      return;
    }
    event.stopPropagation();
    acionarPonto(ponto);
  });
  button.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    if (estadoSpda.ferramenta || estadoSpda.continuidadeOrigem) return;
    iniciarMoverPonto(event, ponto);
  });
  button.addEventListener("contextmenu", event => {
    const itens = [];

    if (!pontoTemMedicoesAssociadas(ponto.id)) {
      itens.push({
        label: "Remover ponto",
        icone: "fa-xmark",
        danger: true,
        onClick: () => removerPonto(ponto.id)
      });
    } else {
      itens.push({
        label: "Remova as medicoes antes",
        icone: "fa-circle-info",
        onClick: () => setHint("Remova as medicoes associadas antes de apagar este ponto.")
      });
    }

    abrirMenuContextoSpda(event, itens);
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

  const inicio = { x: event.clientX, y: event.clientY };
  let arrastando = false;
  setHint(`Arraste para deslocar o ponto ${normalizarNumero(ponto.numero)}.`);

  const mover = moveEvent => {
    const distancia = Math.hypot(moveEvent.clientX - inicio.x, moveEvent.clientY - inicio.y);
    if (!arrastando && distancia < 4) return;
    arrastando = true;
    moveEvent.preventDefault();
    const pontoAtual = obterElementos().pontos.find(item => item.id === ponto.id);
    if (!pontoAtual) return;

    const pos = getCanvasPercent(moveEvent);
    const novoX = Number(limitarPercentual(pos.x, -SPDA_MARGEM_EDICAO).toFixed(3));
    const novoY = Number(limitarPercentual(pos.y, -SPDA_MARGEM_EDICAO).toFixed(3));
    const deltaX = novoX - Number(pontoAtual.x);
    const deltaY = novoY - Number(pontoAtual.y);

    obterElementos().aterramentos
      .filter(aterramento => aterramento.ponto === pontoAtual.id)
      .forEach(aterramento => {
        const baseX = Number.isFinite(Number(aterramento.labelX)) ? Number(aterramento.labelX) : Number(pontoAtual.x);
        const baseY = Number.isFinite(Number(aterramento.labelY)) ? Number(aterramento.labelY) : Number(pontoAtual.y);
        aterramento.labelX = Number(limitarPercentual(baseX + deltaX, -SPDA_MARGEM_EDICAO).toFixed(3));
        aterramento.labelY = Number(limitarPercentual(baseY + deltaY, -SPDA_MARGEM_EDICAO).toFixed(3));
      });

    pontoAtual.x = novoX;
    pontoAtual.y = novoY;
    renderElementos();
  };

  const soltar = async eventUp => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    eventUp?.preventDefault?.();
    if (!arrastando) return;
    estadoSpda.ignorarCliqueAposArraste = true;
    await salvarElementos({ silencioso: true });
    renderElementos();
    setHint(`Ponto ${normalizarNumero(ponto.numero)} deslocado.`);
    setTimeout(() => {
      estadoSpda.ignorarCliqueAposArraste = false;
    }, 0);
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("pointercancel", soltar, { once: true });
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
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const moverLegenda = moveEvent => {
      moveEvent.preventDefault();
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
      document.removeEventListener("pointercancel", soltar);
      await salvarElementos({ silencioso: true });
      setHint("Legenda dos problemas reposicionada.");
    };
    document.addEventListener("pointermove", moverLegenda);
    document.addEventListener("pointerup", soltar, { once: true });
    document.addEventListener("pointercancel", soltar, { once: true });
  });
  return legenda;
}

function calcularPosLegendaAcoes(ponto) {
  const zoomReferencia = calcularZoomReferenciaEnquadramentoSpda();
  const deslocamentoX = (Number(ponto.x) > 68 ? -9 : 6) / zoomReferencia;
  const deslocamentoY = (Number(ponto.y) > 66 ? -4.5 : 4) / zoomReferencia;
  const x = Number.isFinite(Number(ponto.legendaX))
    ? Number(ponto.legendaX)
    : Number(ponto.x) + deslocamentoX;
  const y = Number.isFinite(Number(ponto.legendaY))
    ? Number(ponto.legendaY)
    : Number(ponto.y) + deslocamentoY;

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
  const zoomReferencia = calcularZoomReferenciaEnquadramentoSpda();
  const diametroPonto = 28 / zoomReferencia;
  const comprimentoHorizontal = Math.max(7, Math.min(16, diametroPonto * 0.72));
  const fimX = textoX - (lado * Math.max(2, 5 / zoomReferencia));
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
  const curva = Math.min(10, Math.max(3.2, len * 0.16));
  let externoX = -dy / len;
  let externoY = dx / len;

  if (Math.abs(dx) >= Math.abs(dy) * 1.35) {
    externoX = 0;
    externoY = midY >= 50 ? 1 : -1;
  } else if (Math.abs(dy) >= Math.abs(dx) * 1.35) {
    externoX = midX >= 50 ? -1 : 1;
    externoY = 0;
  } else {
    const ladoCentro = ((midX - 50) * externoX) + ((midY - 50) * externoY);
    if (ladoCentro > 0) {
      externoX *= -1;
      externoY *= -1;
    }
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
  const classeTipo = item.tipo === "equipotencializacao" ? "is-equipotential" : "";

  return `
    <path class="spda-continuity-line ${classeTipo}" d="M ${curva.path.x1} ${curva.path.y1} Q ${curva.path.cx} ${curva.path.cy} ${curva.path.x2} ${curva.path.y2}" />
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
    const mover = moveEvent => {
      moveEvent.preventDefault();
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
      document.removeEventListener("pointercancel", soltar);
      await salvarElementos({ silencioso: true });
      setHint("Grau da linha ajustado.");
    };
    document.addEventListener("pointermove", mover);
    document.addEventListener("pointerup", soltar, { once: true });
    document.addEventListener("pointercancel", soltar, { once: true });
  });

  return controle;
}

function iniciarArrasteCampoMedicao(event, wrapper, input, onMove) {
  if (event.button !== 0 || typeof onMove !== "function") return;
  event.preventDefault();
  event.stopPropagation();
  const inicio = { x: event.clientX, y: event.clientY };
  let arrastando = false;

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
    document.removeEventListener("pointercancel", soltar);
    if (arrastando) {
      eventUp?.preventDefault?.();
      await onMove(null, true);
      return;
    }
    if (event.target === input) input.focus();
  };

  document.addEventListener("pointermove", moverCampo);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("pointercancel", soltar, { once: true });
}

function criarCampoMedicao({ classe, left, top, valor, placeholder, unidade, onCommit, onRemove, onMove, contextMenuItems = [] }) {
  const wrapper = document.createElement("div");
  wrapper.className = classe;
  wrapper.style.left = `${left}%`;
  wrapper.style.top = `${top}%`;

  const input = document.createElement("input");
  input.type = "text";
  input.value = removerUnidadeVisual(valor, unidade);
  input.placeholder = removerUnidadeVisual(placeholder, unidade) || "0,00";
  let ultimoValorConfirmado = input.value;
  const confirmarValor = async () => {
    input.value = removerUnidadeVisual(input.value, unidade);
    if (input.value === ultimoValorConfirmado) return;
    await onCommit(input.value);
    ultimoValorConfirmado = input.value;
  };
  input.addEventListener("click", event => event.stopPropagation());
  input.addEventListener("keydown", async event => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }
  });
  input.addEventListener("change", confirmarValor);
  input.addEventListener("blur", confirmarValor);

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
    wrapper.addEventListener("pointerdown", event => iniciarArrasteCampoMedicao(event, wrapper, input, onMove));
  }

  const itensContexto = [];
  contextMenuItems.forEach(item => itensContexto.push(item));
  if (typeof onRemove === "function") {
    itensContexto.push({
      label: "Remover medicao",
      icone: "fa-xmark",
      danger: true,
      onClick: onRemove
    });
  }
  if (itensContexto.length) {
    wrapper.addEventListener("contextmenu", event => abrirMenuContextoSpda(event, itensContexto));
  }

  return wrapper;
}

function criarLinhaCaboSpda(cabo, componentes, largura, altura, preview = false) {
  const pontos = preview ? cabo.pontos : pontosCaboSpda(cabo, componentes);
  const path = pathCaboSpda(pontos, largura, altura);
  if (!path) return "";
  return `<path class="spda-cable-line ${preview ? "spda-cable-line-preview" : ""}" d="${path}"></path>`;
}

function criarLinhaRompimentoCaptacaoSpda(item, largura, altura, preview = false) {
  const x1 = (Number(item.x1) / 100) * largura;
  const y1 = (Number(item.y1) / 100) * altura;
  const x2 = (Number(item.x2) / 100) * largura;
  const y2 = (Number(item.y2) / 100) * altura;
  if (![x1, y1, x2, y2].every(Number.isFinite)) return "";

  const dx = x2 - x1;
  const dy = y2 - y1;
  const angulo = Math.atan2(dy, dx) * (180 / Math.PI);
  const anguloTexto = (angulo > 90 || angulo < -90) ? angulo + 180 : angulo;
  const centroX = (x1 + x2) / 2;
  const centroY = (y1 + y2) / 2;
  const classePreview = preview ? " is-preview" : "";
  const titulo = obterTituloRompimentoCaptacaoSpda(item.tipo).toUpperCase();
  const larguraTexto = Math.max(14, titulo.length * 1.55);

  return `
    <line class="spda-capture-break-line${classePreview}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />
    <g class="spda-capture-break-marks${classePreview}" transform="translate(${centroX} ${centroY}) rotate(${angulo})">
      <line x1="-1.35" y1="-1.6" x2="-0.45" y2="1.6" />
      <line x1="0.45" y1="-1.6" x2="1.35" y2="1.6" />
    </g>
    <g class="spda-capture-break-label-svg${classePreview}" transform="translate(${centroX} ${centroY}) rotate(${anguloTexto}) translate(0 -3.5)">
      <text x="0" y="1.3">${escapeHtml(titulo)}</text>
    </g>
  `;
}

function obterCentroRompimentoCaptacaoSpda(item) {
  return {
    x: (Number(item.x1) + Number(item.x2)) / 2,
    y: (Number(item.y1) + Number(item.y2)) / 2
  };
}

function obterAnguloRompimentoCaptacaoSpda(item) {
  const canvas = byId("spdaCanvas");
  const largura = canvas?.clientWidth || 1;
  const altura = canvas?.clientHeight || 1;
  const dx = ((Number(item.x2) - Number(item.x1)) / 100) * largura;
  const dy = ((Number(item.y2) - Number(item.y1)) / 100) * altura;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

function obterTituloRompimentoCaptacaoSpda(tipo) {
  return tipo === "barra" ? "barra rompida" : "cabo rompido";
}

async function removerRompimentoCaptacaoSpda(id) {
  const elementos = obterElementos();
  elementos.rompimentos_captacao = elementos.rompimentos_captacao.filter(item => item.id !== id);
  await salvarElementos({ silencioso: true });
  renderElementos();
  setHint("Problema de captação removido da planta.");
}

function criarRotuloRompimentoCaptacaoSpda(item, preview = false) {
  const centro = obterCentroRompimentoCaptacaoSpda(item);
  const rotulo = document.createElement("div");
  rotulo.className = `spda-capture-break-label ${preview ? "is-preview" : ""}`;
  rotulo.style.left = `${centro.x}%`;
  rotulo.style.top = `${centro.y}%`;
  rotulo.style.transform = "translate(-50%, -50%)";
  rotulo.title = obterTituloRompimentoCaptacaoSpda(item.tipo);

  if (!preview) {
    rotulo.addEventListener("contextmenu", event => abrirMenuContextoSpda(event, [
      {
        label: "Remover rompimento",
        icone: "fa-xmark",
        danger: true,
        onClick: () => removerRompimentoCaptacaoSpda(item.id)
      }
    ]));
  }

  return rotulo;
}

function criarMenuRompimentoCaptacaoSpda(item) {
  if (!item) return null;
  const centro = obterCentroRompimentoCaptacaoSpda(item);
  const menu = document.createElement("div");
  menu.className = "spda-capture-break-menu";
  menu.style.left = `${centro.x}%`;
  menu.style.top = `${centro.y}%`;
  menu.innerHTML = `
    <span>Tipo de rompimento</span>
    <div>
      <button type="button" data-spda-capture-break-type="cabo">
        <i class="fa-solid fa-scissors"></i> Cabo
      </button>
      <button type="button" data-spda-capture-break-type="barra">
        <i class="fa-solid fa-grip-lines-vertical"></i> Barra
      </button>
    </div>
  `;

  menu.querySelectorAll("[data-spda-capture-break-type]").forEach(botao => {
    botao.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await confirmarRompimentoCaptacaoSpda(botao.dataset.spdaCaptureBreakType);
    });
  });

  return menu;
}

async function confirmarRompimentoCaptacaoSpda(tipo) {
  const pendente = estadoSpda.captacaoRompimentoPendente;
  if (!pendente) return;
  const elementos = obterElementos();
  elementos.rompimentos_captacao.push({
    id: `romp_cap_${Date.now()}`,
    tipo: tipo === "barra" ? "barra" : "cabo",
    x1: Number(pendente.x1.toFixed(3)),
    y1: Number(pendente.y1.toFixed(3)),
    x2: Number(pendente.x2.toFixed(3)),
    y2: Number(pendente.y2.toFixed(3))
  });
  estadoSpda.captacaoRompimentoInicio = null;
  estadoSpda.captacaoRompimentoPreview = null;
  estadoSpda.captacaoRompimentoPendente = null;
  renderElementos();
  await salvarElementos({ silencioso: true });
  setHint(`${obterTituloRompimentoCaptacaoSpda(tipo)} adicionado na captação.`);
}

function criarRotuloCaboSpda(cabo, componentes) {
  const pontos = pontosCaboSpda(cabo, componentes);
  if (pontos.length < 2) return null;
  const centro = calcularPontoEmCaminhoSpda(pontos, Number.isFinite(Number(cabo.labelT)) ? Number(cabo.labelT) : 0.5);
  const wrapper = document.createElement("div");
  wrapper.className = "spda-cable-label";
  wrapper.style.left = `${centro.x}%`;
  wrapper.style.top = `${centro.y}%`;
  wrapper.innerHTML = `
    <div class="spda-cable-label-fields">
      <input type="text" class="spda-cable-size" value="${escapeHtml(cabo.bitola || "#50mm²")}" title="Dimensão do cabo">
      <label class="spda-cable-distance" title="Distância do cabo">
        <input type="text" value="${escapeHtml(cabo.distancia || "")}" inputmode="decimal" placeholder="0,00">
        <span>mts</span>
      </label>
    </div>
    <button type="button" class="spda-cable-label-move" title="Mover dados do cabo sobre a linha">
      <i class="fa-solid fa-up-down-left-right"></i>
    </button>
  `;

  const inputBitola = wrapper.querySelector(".spda-cable-size");
  const inputDistancia = wrapper.querySelector(".spda-cable-distance input");
  let ultimoValorSalvo = `${cabo.bitola || "#50mm²"}|${cabo.distancia || ""}`;
  const salvarCampo = async () => {
    const bitola = inputBitola.value.trim() || "#50mm²";
    const distancia = inputDistancia.value.trim();
    const chaveAtual = `${bitola}|${distancia}`;
    if (chaveAtual === ultimoValorSalvo) return;

    const caboAtual = obterElementos().cabos.find(item => item.id === cabo.id) || cabo;
    caboAtual.bitola = bitola;
    caboAtual.distancia = distancia;
    ultimoValorSalvo = chaveAtual;
    await salvarElementos({ silencioso: true });
    setHint("Dados do cabo atualizados.");
  };

  [inputBitola, inputDistancia].forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("keydown", async event => {
      event.stopPropagation();
      if (event.key !== "Enter") return;
      event.preventDefault();
      input.blur();
    });
    input.addEventListener("change", salvarCampo);
    input.addEventListener("blur", salvarCampo);
  });

  const mover = wrapper.querySelector(".spda-cable-label-move");
  mover.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();
    const moverCampo = moveEvent => {
      moveEvent.preventDefault();
      const caboAtual = obterElementos().cabos.find(item => item.id === cabo.id) || cabo;
      const pontosAtuais = pontosCaboSpda(caboAtual, obterElementos().componentes);
      if (pontosAtuais.length < 2) return;
      const pos = getCanvasPercent(moveEvent);
      caboAtual.labelT = Number(calcularRatioMaisProximoNoCaminhoSpda(pontosAtuais, pos).toFixed(4));
      renderElementos();
    };
    const soltar = async () => {
      document.removeEventListener("pointermove", moverCampo);
      document.removeEventListener("pointerup", soltar);
      document.removeEventListener("pointercancel", soltar);
      await salvarElementos({ silencioso: true });
      setHint("Dados do cabo reposicionados sobre a linha.");
    };
    document.addEventListener("pointermove", moverCampo);
    document.addEventListener("pointerup", soltar, { once: true });
    document.addEventListener("pointercancel", soltar, { once: true });
  });

  return wrapper;
}

async function removerComponenteSpda(componenteId) {
  const elementos = obterElementos();
  const componente = elementos.componentes.find(item => item.id === componenteId);
  if (!componente) return;

  elementos.componentes = elementos.componentes.filter(item => item.id !== componenteId);
  elementos.cabos = elementos.cabos.filter(cabo => cabo.de !== componenteId && cabo.para !== componenteId);

  if (estadoSpda.caboOrigem === componenteId) {
    estadoSpda.caboOrigem = null;
    estadoSpda.caboPontos = [];
  }

  await salvarElementos({ silencioso: true });
  renderElementos();
  setHint(`${obterComponenteConfig(componente.tipo).titulo} removido da planta.`);
}

function iniciarMoverComponenteSpda(event, componente) {
  event.preventDefault();
  event.stopPropagation();

  const inicio = { x: event.clientX, y: event.clientY };
  let arrastando = false;
  setHint(`Arraste para deslocar ${obterComponenteConfig(componente.tipo).titulo}.`);

  const mover = moveEvent => {
    const distancia = Math.hypot(moveEvent.clientX - inicio.x, moveEvent.clientY - inicio.y);
    if (!arrastando && distancia < 4) return;
    arrastando = true;
    moveEvent.preventDefault();
    const componenteAtual = obterElementos().componentes.find(item => item.id === componente.id);
    if (!componenteAtual) return;

    const pos = getCanvasPercent(moveEvent);
    componenteAtual.x = Number(limitarPercentual(pos.x, -SPDA_MARGEM_EDICAO).toFixed(3));
    componenteAtual.y = Number(limitarPercentual(pos.y, -SPDA_MARGEM_EDICAO).toFixed(3));
    renderElementos();
  };

  const soltar = async eventUp => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("pointercancel", soltar);
    eventUp?.preventDefault?.();
    if (!arrastando) return;
    estadoSpda.ignorarCliqueAposArraste = true;
    await salvarElementos({ silencioso: true });
    renderElementos();
    setHint("Componente deslocado.");
    setTimeout(() => {
      estadoSpda.ignorarCliqueAposArraste = false;
    }, 0);
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("pointercancel", soltar, { once: true });
}

function criarAcoesComponenteSpda(componente) {
  const wrapper = document.createElement("div");
  wrapper.className = "spda-component-actions";
  if (Number(componente.x) > 82) wrapper.classList.add("is-left");
  if (Number(componente.y) < 12) wrapper.classList.add("is-below");
  wrapper.style.left = `${componente.x}%`;
  wrapper.style.top = `${componente.y}%`;

  const mover = document.createElement("button");
  mover.type = "button";
  mover.className = "spda-point-action spda-point-action-move";
  mover.title = "Mover componente";
  mover.innerHTML = '<i class="fa-solid fa-arrows-up-down-left-right"></i>';
  mover.addEventListener("pointerdown", event => iniciarMoverComponenteSpda(event, componente));
  wrapper.appendChild(mover);

  const remover = document.createElement("button");
  remover.type = "button";
  remover.className = "spda-point-action spda-point-action-remove";
  remover.title = "Remover componente";
  remover.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  remover.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();
    await removerComponenteSpda(componente.id);
  });
  wrapper.appendChild(remover);

  return wrapper;
}

function criarComponenteSpda(componente) {
  const config = obterComponenteConfig(componente.tipo);
  const ehCaptorExtraviado = componente.tipo === "captor_extraviado";
  const iconeHtml = componente.tipo === "qdf"
    ? '<span class="spda-qdf-mini-symbol" aria-hidden="true"></span>'
    : `<i class="fa-solid ${escapeHtml(config.icone)}"></i>`;
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = `spda-component spda-component-${config.categoria}`;
  if (componente.tipo === "extintor") botao.classList.add("spda-component-extintor");
  if (ehCaptorExtraviado) botao.classList.add("spda-component-captor-extraviado");
  if (estadoSpda.caboOrigem === componente.id) botao.classList.add("is-cable-origin");
  botao.style.left = `${componente.x}%`;
  botao.style.top = `${componente.y}%`;
  botao.title = config.titulo;
  if (ehCaptorExtraviado) {
    botao.innerHTML = `
      <svg class="spda-captor-extraviado-svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path d="M24 5v16" />
        <path d="M16 21h16" />
        <path d="M24 21l-9 17h18z" />
        <path d="M18 38h12" />
        <path d="M12 43h24" />
      </svg>
    `;
  } else if (componente.tipo === "extintor") {
    const sequencia = String(obterSequenciaComponenteSpda(componente)).padStart(2, "0");
    botao.title = `EXT-${sequencia} - ${config.titulo}`;
    botao.innerHTML = `
      <span class="spda-extintor-label">EXT-${sequencia}</span>
      <span class="spda-component-icon">${iconeHtml}</span>
    `;
  } else {
    botao.innerHTML = `
      <span class="spda-component-icon">${iconeHtml}</span>
      <span class="spda-component-text">
        <strong>${escapeHtml(config.sigla)}</strong>
        <small>${escapeHtml(config.titulo)}</small>
      </span>
    `;
  }
  botao.addEventListener("click", async event => {
    if (estadoSpda.ignorarCliqueAposArraste) {
      event.preventDefault();
      event.stopPropagation();
      estadoSpda.ignorarCliqueAposArraste = false;
      return;
    }
    event.stopPropagation();
    await acionarComponenteSpda(componente);
  });
  botao.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    if (estadoSpda.ferramenta || estadoSpda.componenteSelecionado || estadoSpda.caboOrigem) return;
    iniciarMoverComponenteSpda(event, componente);
  });
  botao.addEventListener("contextmenu", event => abrirMenuContextoSpda(event, [
    {
      label: "Remover elemento",
      icone: "fa-xmark",
      danger: true,
      onClick: () => removerComponenteSpda(componente.id)
    }
  ]));
  return botao;
}

function criarMarcacaoAreaPdfSpda() {
  const area = obterAreaPdfSpda();
  if (!area) return null;

  const marcador = document.createElement("div");
  marcador.className = "spda-pdf-area-marker";
  marcador.style.left = `${area.x}%`;
  marcador.style.top = `${area.y}%`;
  marcador.style.width = `${area.width}%`;
  marcador.style.height = `${area.height}%`;
  marcador.innerHTML = '<span>Área PDF</span>';
  return marcador;
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
  const marcadorAreaPdf = criarMarcacaoAreaPdfSpda();
  if (marcadorAreaPdf) overlay.appendChild(marcadorAreaPdf);

  elementos.marcacoes.forEach(marcacao => {
    overlay.appendChild(criarMarcacaoVisualSpda(marcacao));
  });
  if (estadoSpda.marcacaoDraft) {
    overlay.appendChild(criarMarcacaoVisualSpda(estadoSpda.marcacaoDraft, true));
  }
  elementos.anotacoes_marcacoes.forEach(texto => {
    overlay.appendChild(criarTextoAnotacoesMarcacoesSpda(texto));
  });
  if (estadoSpda.anotacaoMarcacaoPreview) {
    overlay.appendChild(criarTextoAnotacoesMarcacoesSpda(estadoSpda.anotacaoMarcacaoPreview, true));
  }

  elementos.cabos.forEach(cabo => {
    svg.insertAdjacentHTML("beforeend", criarLinhaCaboSpda(cabo, elementos.componentes, largura, altura));
  });

  elementos.rompimentos_captacao.forEach(item => {
    svg.insertAdjacentHTML("beforeend", criarLinhaRompimentoCaptacaoSpda(item, largura, altura));
  });

  if (estadoSpda.captacaoRompimentoPreview) {
    svg.insertAdjacentHTML("beforeend", criarLinhaRompimentoCaptacaoSpda(estadoSpda.captacaoRompimentoPreview, largura, altura, true));
  }

  if (estadoSpda.captacaoRompimentoPendente) {
    svg.insertAdjacentHTML("beforeend", criarLinhaRompimentoCaptacaoSpda(estadoSpda.captacaoRompimentoPendente, largura, altura, true));
  }

  if (estadoSpda.ferramenta === "cabo" && estadoSpda.caboOrigem) {
    const origem = obterComponentePorId(estadoSpda.caboOrigem);
    if (origem) {
      svg.insertAdjacentHTML("beforeend", criarLinhaCaboSpda({
        pontos: [
          { x: Number(origem.x), y: Number(origem.y) },
          ...estadoSpda.caboPontos
        ]
      }, elementos.componentes, largura, altura, true));
    }
  }

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

  elementos.componentes.forEach(componente => {
    overlay.appendChild(criarComponenteSpda(componente));
  });

  elementos.cabos.forEach(cabo => {
    const rotulo = criarRotuloCaboSpda(cabo, elementos.componentes);
    if (rotulo) overlay.appendChild(rotulo);
  });

  elementos.rompimentos_captacao.forEach(item => {
    overlay.appendChild(criarRotuloRompimentoCaptacaoSpda(item));
  });

  if (estadoSpda.captacaoRompimentoPreview) {
    overlay.appendChild(criarRotuloRompimentoCaptacaoSpda(estadoSpda.captacaoRompimentoPreview, true));
  }

  const menuRompimentoCaptacao = criarMenuRompimentoCaptacaoSpda(estadoSpda.captacaoRompimentoPendente);
  if (menuRompimentoCaptacao) overlay.appendChild(menuRompimentoCaptacao);

  elementos.continuidades.forEach(item => {
    const curva = calcularCurvaContinuidade(item, elementos.pontos);
    if (!curva) return;
    overlay.appendChild(criarControleCurva(item, curva));
    overlay.appendChild(criarCampoMedicao({
      classe: `spda-continuity-editor ${item.tipo === "equipotencializacao" ? "is-equipotential" : ""}`,
      left: curva.labelX,
      top: curva.labelY,
      valor: item.valor,
      placeholder: "mΩ",
      unidade: "mΩ",
      onCommit: async valor => {
        const elementosAtuais = obterElementos();
        const atual = elementosAtuais.continuidades.find(continuidade => {
          if (item.id && continuidade.id) return continuidade.id === item.id;
          return continuidade.de === item.de && continuidade.para === item.para;
        });
        if (!atual) return;
        atual.valor = valor;
        atual.avaliacao = atual.tipo === "equipotencializacao"
          ? "Equipotencializacao"
          : calcularAvaliacaoMedicao("continuidade", valor);
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
      },
      contextMenuItems: [
        {
          label: item.tipo === "equipotencializacao" ? "Remover equipotencializacao" : "Equipotencializacao",
          icone: "fa-link",
          onClick: async () => {
            if (item.tipo === "equipotencializacao") {
              delete item.tipo;
              item.avaliacao = calcularAvaliacaoMedicao("continuidade", item.valor);
            } else {
              item.tipo = "equipotencializacao";
              item.avaliacao = "Equipotencializacao";
            }
            await salvarElementos({ silencioso: true });
            renderElementos();
            renderTabelaPreenchimentoSpda();
            setHint(item.tipo === "equipotencializacao"
              ? "Medicao marcada como equipotencializacao."
              : "Medicao voltou ao padrao de continuidade.");
          }
        }
      ]
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
          const atual = obterElementos().aterramentos.find(aterramento => {
            if (item.id && aterramento.id) return aterramento.id === item.id;
            return aterramento.ponto === item.ponto;
          });
          if (!atual) return;
          atual.labelX = Number(pos.x.toFixed(3));
          atual.labelY = Number(pos.y.toFixed(3));
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
  renderAnotacoesMarcacoesSpda();
}

function aplicarPanPlanta() {
  const zoom = Number(estadoSpda.zoom) || 1;
  const transform = `translate(${estadoSpda.panX}px, ${estadoSpda.panY}px)`;
  ["spdaPlantaLayer", "spdaSvgLayer", "spdaOverlayLayer"].forEach(id => {
    const layer = byId(id);
    if (!layer) return;
    layer.style.width = `${zoom * 100}%`;
    layer.style.height = `${zoom * 100}%`;
    layer.style.transform = transform;
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

  if (!estadoSpda.ferramenta) {
    let alterou = false;
    elementos.pontos.forEach(item => {
      const deveMinimizar = item.id !== ponto.id;
      if (item.acoesMinimizado !== deveMinimizar) {
        item.acoesMinimizado = deveMinimizar;
        alterou = true;
      }
    });
    if (alterou) {
      renderElementos();
      await salvarElementos({ silencioso: true });
    }
    return;
  }

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

async function acionarComponenteSpda(componente) {
  if (estadoSpda.ferramenta !== "cabo") return;

  const config = obterComponenteConfig(componente.tipo);
  if (!SPDA_COMPONENTES_ELETRICOS.has(componente.tipo)) {
    setHint(`${config.titulo} não pode ser usado como ponto de alimentação.`);
    return;
  }

  if (!estadoSpda.caboOrigem) {
    estadoSpda.caboOrigem = componente.id;
    estadoSpda.caboPontos = [];
    renderElementos();
    setHint(`${config.titulo} selecionado como origem. Clique na planta para criar desvios ou selecione o destino elétrico.`);
    return;
  }

  if (estadoSpda.caboOrigem === componente.id) {
    setHint("Selecione um componente elétrico diferente para finalizar o cabo.");
    return;
  }

  const origem = obterComponentePorId(estadoSpda.caboOrigem);
  if (!origem) {
    estadoSpda.caboOrigem = null;
    estadoSpda.caboPontos = [];
    setHint("Origem do cabo não encontrada. Selecione novamente.");
    renderElementos();
    return;
  }

  const elementos = obterElementos();
  elementos.cabos.push({
    id: `cabo_${Date.now()}`,
    de: origem.id,
    para: componente.id,
    pontos: estadoSpda.caboPontos.map(ponto => ({
      x: Number(ponto.x.toFixed ? ponto.x.toFixed(3) : Number(ponto.x).toFixed(3)),
      y: Number(ponto.y.toFixed ? ponto.y.toFixed(3) : Number(ponto.y).toFixed(3))
    })),
    bitola: "#50mm²",
    distancia: "",
    labelT: 0.5
  });

  estadoSpda.caboOrigem = null;
  estadoSpda.caboPontos = [];
  renderElementos();
  await salvarElementos({ silencioso: true });
  setHint("Cabo de alimentação adicionado. A dimens?o pode ser ajustada no rótulo do caminho.");
}

async function adicionarPonto(event) {
  if (!estadoSpda.estruturaAtual?.planta_url) return;
  if (estadoSpda.enquadramentoAtivo) return;
  if (await aplicarReposicionamentoSpda(event)) return;
  if (!["numero", "componente", "cabo", "anotacoes_marcacoes", "rompimento_captacao"].includes(estadoSpda.ferramenta)) return;
  if (event.target.closest(".spda-point, .spda-point-actions, .spda-component, .spda-component-actions, .spda-cable-label, .spda-continuity-editor, .spda-ground-label, .spda-visual-mark, .spda-visual-mark-label, .spda-mark-annotation-text, .spda-capture-break-label, .spda-capture-break-menu")) return;

  const pos = getCanvasPercent(event);
  const elementos = obterElementos();

  if (estadoSpda.ferramenta === "rompimento_captacao") {
    if (estadoSpda.captacaoRompimentoPendente) {
      setHint("Escolha se o rompimento é cabo ou barra antes de criar outro.");
      return;
    }

    if (!estadoSpda.captacaoRompimentoInicio) {
      estadoSpda.captacaoRompimentoInicio = {
        x1: Number(pos.x.toFixed(3)),
        y1: Number(pos.y.toFixed(3))
      };
      estadoSpda.captacaoRompimentoPreview = null;
      renderElementos();
      setHint("Primeiro ponto definido. Clique no segundo local da captação rompida.");
      return;
    }

    const distancia = Math.hypot(
      pos.x - estadoSpda.captacaoRompimentoInicio.x1,
      pos.y - estadoSpda.captacaoRompimentoInicio.y1
    );
    if (distancia < 0.8) {
      setHint("Clique em um segundo ponto mais distante para criar o rompimento.");
      return;
    }

    estadoSpda.captacaoRompimentoPendente = {
      ...estadoSpda.captacaoRompimentoInicio,
      x2: Number(pos.x.toFixed(3)),
      y2: Number(pos.y.toFixed(3)),
      tipo: "cabo"
    };
    estadoSpda.captacaoRompimentoPreview = null;
    renderElementos();
    setHint("Escolha no menu se o rompimento é cabo ou barra.");
    return;
  }

  if (estadoSpda.ferramenta === "anotacoes_marcacoes") {
    const texto = obterTextoAnotacoesMarcacoesSpda();
    if (!texto) {
      setHint("Nenhuma marcação possui anotação preenchida para inserir na planta.");
      return;
    }
    elementos.anotacoes_marcacoes.push({
      id: `anot_marc_${Date.now()}`,
      x: Number(pos.x.toFixed(3)),
      y: Number(pos.y.toFixed(3)),
      texto
    });
    estadoSpda.anotacaoMarcacaoPreview = null;
    renderElementos();
    await salvarElementos({ silencioso: true });
    setHint("Anotações das marcações adicionadas na planta.");
    return;
  }

  if (estadoSpda.ferramenta === "componente" && estadoSpda.componenteSelecionado) {
    const config = obterComponenteConfig(estadoSpda.componenteSelecionado);
    elementos.componentes.push({
      id: `comp_${Date.now()}`,
      tipo: estadoSpda.componenteSelecionado,
      categoria: config.categoria,
      titulo: config.titulo,
      x: Number(pos.x.toFixed(3)),
      y: Number(pos.y.toFixed(3))
    });
    renderElementos();
    await salvarElementos({ silencioso: true });
    setHint(`${config.titulo} adicionado. Clique novamente na planta para adicionar outro.`);
    return;
  }

  if (estadoSpda.ferramenta === "cabo") {
    if (!estadoSpda.caboOrigem) {
      setHint("Selecione primeiro o componente elétrico de origem do cabo.");
      return;
    }
    estadoSpda.caboPontos.push({
      x: Number(pos.x.toFixed(3)),
      y: Number(pos.y.toFixed(3))
    });
    renderElementos();
    setHint("Desvio do cabo adicionado. Continue clicando para desenhar o caminho ou selecione o componente elétrico de destino.");
    return;
  }

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
  requestAnimationFrame(iniciarModoEnquadramentoPlanta);
  input.value = "";
}

function selecionarEstrutura(id) {
  const estrutura = estadoSpda.estruturas.find(item => String(item.id_spda_estrutura) === String(id));
  if (!estrutura) return;
  estadoSpda.estruturaAtual = estrutura;
  estadoSpda.ferramenta = null;
  estadoSpda.continuidadeOrigem = null;
  estadoSpda.componenteSelecionado = null;
  estadoSpda.caboOrigem = null;
  estadoSpda.caboPontos = [];
  encerrarModoEnquadramentoPlanta();
  limparSelecaoFerramentasSpda();
  byId("spdaToggleAcoes")?.classList.toggle("ativo", estadoSpda.mostrarAcoesNaoSelecionadas);
  preencherForm(estrutura);
  recalcularProximoNumero();
  renderEstruturas();
  renderPlanta();
  setHint(estrutura.planta_url ? "Selecione uma ferramenta para marcar a planta." : "Anexe a planta baixa para começar as marcações.");
}

async function desfazerUltimo() {
  const elementos = obterElementos();
  if (elementos.rompimentos_captacao.length) elementos.rompimentos_captacao.pop();
  else if (elementos.cabos.length) elementos.cabos.pop();
  else if (elementos.anotacoes_marcacoes.length) elementos.anotacoes_marcacoes.pop();
  else if (elementos.marcacoes.length) elementos.marcacoes.pop();
  else if (elementos.componentes.length) elementos.componentes.pop();
  else if (elementos.aterramentos.length) elementos.aterramentos.pop();
  else if (elementos.continuidades.length) elementos.continuidades.pop();
  else if (elementos.pontos.length) elementos.pontos.pop();
  recalcularProximoNumero();
  renderElementos();
  await salvarElementos({ silencioso: true });
  setHint("Última marca??o removida.");
}

function prepararCloneCanvasExportacaoSpda(canvas) {
  const clone = canvas.cloneNode(true);
  clone.id = "spdaCanvasExportado";

  clone.querySelectorAll("input").forEach(input => {
    input.setAttribute("value", input.value || "");
  });

  clone.querySelectorAll(
    ".spda-point-actions, .spda-component-actions, .spda-curve-handle, .spda-medicao-remover, .spda-medicao-mover, .spda-cable-label-move, .spda-frame-overlay, .spda-pdf-area-marker, .spda-mark-annotation-text.is-preview, .spda-capture-break-label.is-preview, .spda-capture-break-menu, .spda-capture-break-line.is-preview, .spda-capture-break-marks.is-preview, .spda-capture-break-label-svg.is-preview"
  ).forEach(item => item.remove());

  ["spdaPlantaLayer", "spdaSvgLayer", "spdaOverlayLayer"].forEach(id => {
    const layer = clone.querySelector(`#${id}`);
    if (!layer) return;
    layer.removeAttribute("id");
    layer.style.width = "100%";
    layer.style.height = "100%";
    layer.style.transform = "none";
  });

  const svg = clone.querySelector("svg");
  if (svg) {
    svg.removeAttribute("id");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
  }

  return clone;
}

function montarHtmlExportacaoLivreSpda(canvasHtml, exportacao) {
  const estrutura = estadoSpda.estruturaAtual || {};
  const titulo = estrutura.nome_predio || "Planta SPDA";
  const os = estrutura.id_os ? `OS ${estrutura.id_os}` : "SPDA";
  const descricao = [
    estrutura.tipo_estrutura ? `Estrutura: ${estrutura.tipo_estrutura}` : "",
    estrutura.subsistemas ? `Subsistemas: ${estrutura.subsistemas}` : "",
    estrutura.descricao_spda ? `Descricao: ${estrutura.descricao_spda}` : ""
  ].filter(Boolean).join(" | ");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>SPDA - ${escapeHtml(titulo)}</title>
  <link rel="stylesheet" href="/css/spda.css">
  <style>
    @page { size: auto; margin: 0; }
    html,
    body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    body {
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
    }
    .spda-export-toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 10px;
      border-bottom: 1px solid #d4d4d4;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }
    .spda-export-toolbar strong {
      display: block;
      font-size: 15px;
      line-height: 1.1;
    }
    .spda-export-toolbar span {
      display: block;
      margin-top: 2px;
      font-size: 10px;
      line-height: 1.2;
    }
    .spda-export-toolbar button {
      min-height: 30px;
      padding: 0 12px;
      border: 1px solid rgba(238, 119, 34, 0.5);
      border-radius: 7px;
      color: #151515;
      background: linear-gradient(90deg, #ee7722, #efda38);
      font-weight: 800;
      cursor: pointer;
    }
    .spda-export-page {
      position: relative;
      width: ${exportacao.larguraPagina}px;
      height: ${exportacao.alturaPagina}px;
      margin: 0;
      padding: 0;
      background: #fff;
      overflow: hidden;
    }
    #spdaCanvasExportado {
      position: absolute !important;
      left: ${exportacao.offsetX}px !important;
      top: ${exportacao.offsetY}px !important;
      width: ${exportacao.larguraCanvas}px !important;
      height: ${exportacao.alturaCanvas}px !important;
      min-height: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: #fff !important;
      overflow: visible !important;
    }
    #spdaCanvasExportado .spda-planta-layer,
    #spdaCanvasExportado .spda-svg-layer,
    #spdaCanvasExportado .spda-overlay-layer {
      width: 100% !important;
      height: 100% !important;
      transform: none !important;
    }
    #spdaCanvasExportado .spda-planta-layer {
      padding: 0 !important;
    }
    #spdaCanvasExportado .spda-planta-layer img,
    #spdaCanvasExportado .spda-planta-layer iframe {
      border-radius: 0 !important;
    }
    #spdaCanvasExportado .spda-point-actions,
    #spdaCanvasExportado .spda-component-actions,
    #spdaCanvasExportado .spda-curve-handle,
    #spdaCanvasExportado .spda-medicao-remover,
    #spdaCanvasExportado .spda-medicao-mover,
    #spdaCanvasExportado .spda-cable-label-move {
      display: none !important;
    }
    @media print {
      html,
      body {
        width: 100%;
        height: 100%;
      }
      body {
        display: grid;
        place-items: center;
      }
      .spda-export-toolbar { display: none !important; }
      .spda-export-page {
        margin: auto !important;
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="spda-export-toolbar">
    <div>
      <strong>${escapeHtml(titulo)}</strong>
      <span>${escapeHtml(os)}${descricao ? ` | ${escapeHtml(descricao)}` : ""}</span>
    </div>
    <button type="button" onclick="window.print()">Imprimir / salvar PDF</button>
  </div>
  <main class="spda-export-page">
    ${canvasHtml}
  </main>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 450);
    });
  </script>
</body>
</html>`;
}

function exportarPlantaLivreSpda() {
  const canvas = byId("spdaCanvas");
  if (!canvas || !estadoSpda.estruturaAtual?.planta_url) {
    setHint("Selecione uma estrutura com planta antes de exportar.");
    return;
  }

  const zoomReferencia = calcularZoomReferenciaEnquadramentoSpda();
  const larguraBase = canvas.clientWidth || 1000;
  const alturaBase = canvas.clientHeight || 680;
  const larguraCanvas = Math.max(900, Math.round(larguraBase * zoomReferencia));
  const alturaCanvas = Math.max(640, Math.round(alturaBase * zoomReferencia));
  const area = obterAreaPdfSpda();
  const exportacao = area
    ? {
      larguraCanvas,
      alturaCanvas,
      larguraPagina: Math.max(320, Math.round(larguraCanvas * (area.width / 100))),
      alturaPagina: Math.max(240, Math.round(alturaCanvas * (area.height / 100))),
      offsetX: -Math.round(larguraCanvas * (area.x / 100)),
      offsetY: -Math.round(alturaCanvas * (area.y / 100))
    }
    : {
      larguraCanvas,
      alturaCanvas,
      larguraPagina: larguraCanvas,
      alturaPagina: alturaCanvas,
      offsetX: 0,
      offsetY: 0
    };
  const clone = prepararCloneCanvasExportacaoSpda(canvas);
  const janela = window.open("", "_blank", `width=${Math.min(exportacao.larguraPagina + 60, 1600)},height=${Math.min(exportacao.alturaPagina + 120, 1000)}`);

  if (!janela) {
    setHint("Permita pop-ups para exportar a planta em PDF.");
    return;
  }

  janela.document.open();
  janela.document.write(montarHtmlExportacaoLivreSpda(clone.outerHTML, exportacao));
  janela.document.close();
  setHint(area ? "Area marcada aberta para imprimir ou salvar em PDF." : "Planta inteira aberta para imprimir ou salvar em PDF.");
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
  byId("spdaEditarEnquadramento")?.addEventListener("click", iniciarModoEnquadramentoPlanta);
  byId("spdaAreaPdf")?.addEventListener("click", iniciarModoAreaPdfSpda);
  byId("spdaPularEnquadramento")?.addEventListener("click", pularEnquadramentoPlanta);
  byId("spdaFrameOverlay")?.addEventListener("pointerdown", iniciarSelecaoEnquadramento);
  byId("spdaCanvas")?.addEventListener("pointerdown", iniciarDesenhoMarcacaoVisualSpda);
  byId("spdaCanvas")?.addEventListener("pointermove", atualizarPreviewAnotacoesMarcacoesSpda);
  byId("spdaCanvas")?.addEventListener("pointermove", atualizarPreviewRompimentoCaptacaoSpda);
  byId("spdaCanvas")?.addEventListener("click", adicionarPonto);
  byId("spdaCanvasWrap")?.addEventListener("mousedown", iniciarPanPlanta, true);
  byId("spdaCanvasWrap")?.addEventListener("auxclick", event => {
    if (event.button === 1) event.preventDefault();
  });
  byId("spdaCanvasWrap")?.addEventListener("wheel", event => {
    if (event.target.closest(".spda-fill-panel")) return;
    event.preventDefault();
  }, { passive: false });
  byId("spdaToggleAcoes")?.addEventListener("click", () => {
    estadoSpda.mostrarAcoesNaoSelecionadas = !estadoSpda.mostrarAcoesNaoSelecionadas;
    byId("spdaToggleAcoes")?.classList.toggle("ativo", estadoSpda.mostrarAcoesNaoSelecionadas);
    renderElementos();
    setHint(estadoSpda.mostrarAcoesNaoSelecionadas ? "Mostrando todas as ações dos pontos." : "Mostrando apenas ações selecionadas.");
  });
  byId("spdaSalvarElementos")?.addEventListener("click", () => salvarElementos());
  byId("spdaExportarLivre")?.addEventListener("click", exportarPlantaLivreSpda);
  byId("spdaDesfazer")?.addEventListener("click", desfazerUltimo);
  byId("spdaAbrirGuia")?.addEventListener("click", abrirGuiaSpda);
  byId("spdaTabelaToggle")?.addEventListener("click", () => {
    estadoSpda.tabelaAberta = true;
    estadoSpda.anotacoesAberta = false;
    renderAnotacoesMarcacoesSpda();
    renderTabelaPreenchimentoSpda();
  });
  byId("spdaTabelaFechar")?.addEventListener("click", () => {
    estadoSpda.tabelaAberta = false;
    renderTabelaPreenchimentoSpda();
  });
  byId("spdaAnotacoesToggle")?.addEventListener("click", () => {
    estadoSpda.anotacoesAberta = true;
    estadoSpda.tabelaAberta = false;
    renderTabelaPreenchimentoSpda();
    renderAnotacoesMarcacoesSpda();
  });
  byId("spdaAnotacoesFechar")?.addEventListener("click", () => {
    estadoSpda.anotacoesAberta = false;
    renderAnotacoesMarcacoesSpda();
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
  byId("spdaAnotacoesConteudo")?.addEventListener("change", event => {
    const campo = event.target.closest("[data-spda-marcacao-anotacao]");
    if (campo) salvarAnotacaoMarcacaoSpda(campo.dataset.spdaMarcacaoAnotacao, campo.value);
  });
  byId("spdaAnotacoesConteudo")?.addEventListener("click", event => {
    const remover = event.target.closest("[data-spda-remover-marcacao]");
    if (!remover) return;
    removerMarcacaoAnotacaoTabelaSpda(remover.dataset.spdaRemoverMarcacao);
  });
  byId("spdaAnotacoesConteudo")?.addEventListener("keydown", event => {
    const campo = event.target.closest("[data-spda-marcacao-anotacao]");
    if (!campo || event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    salvarAnotacaoMarcacaoSpda(campo.dataset.spdaMarcacaoAnotacao, campo.value);
    const campos = Array.from(document.querySelectorAll("#spdaAnotacoesConteudo [data-spda-marcacao-anotacao]"));
    const proximo = campos[campos.indexOf(campo) + 1];
    proximo?.focus();
  });

  if (!estadoSpda.documentoVinculado) {
    document.addEventListener("click", (event) => {
      const card = event.target.closest(".spda-estrutura-card");
      if (card) selecionarEstrutura(card.dataset.id);
      if (!byId("spdaPage")) return;
      if (!event.target.closest(".spda-context-menu")) fecharMenuContextoSpda();
      const dentroAcoes = event.target.closest(".spda-point-actions, .spda-point");
      if (!dentroAcoes) fecharAcoesPontosSpda();
      if (!event.target.closest(".spda-mark-note-editor, .spda-visual-mark-label")) {
        if (estadoSpda.marcacaoAnotacaoAberta) {
          estadoSpda.marcacaoAnotacaoAberta = null;
          renderElementos();
        }
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && byId("spdaPage")) {
        fecharMenuContextoSpda();
        cancelarFerramenta();
      }
    });
    estadoSpda.documentoVinculado = true;
  }

  document.querySelectorAll(".spda-tool[data-tool], .spda-cabo-option[data-tool], .spda-fill-config-toggle[data-tool]").forEach(btn => {
    btn.addEventListener("click", () => selecionarFerramenta(btn.dataset.tool));
  });
  document.querySelectorAll("[data-spda-componente]").forEach(btn => {
    btn.addEventListener("click", () => selecionarComponenteSpda(btn.dataset.spdaComponente));
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
    if (estadoSpda.enquadramentoAtivo) renderEnquadramentoSelecao();
  };

  const parar = () => {
    document.removeEventListener("mousemove", mover);
    document.removeEventListener("mouseup", parar);
    wrap.classList.remove("is-panning");
  };

  document.addEventListener("mousemove", mover);
  document.addEventListener("mouseup", parar, { once: true });
}

export async function initSpda() {
  estadoSpda.inicializado = false;
  estadoSpda.os = [];
  estadoSpda.estruturas = [];
  estadoSpda.estruturaAtual = null;
  estadoSpda.ferramenta = null;
  estadoSpda.continuidadeOrigem = null;
  estadoSpda.componenteSelecionado = null;
  estadoSpda.caboOrigem = null;
  estadoSpda.caboPontos = [];
  estadoSpda.proximoNumero = 1;
  resetarVisaoPlanta();
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
