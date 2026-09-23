const REFERENCIA_SERVICO_KEY = "connectpear_eng_campo_referencia_servico";
const DIAGRAMA_SERVICO_KEY = "connectpear_eng_campo_diagrama_servico";

const estadoDiagrama = {
  modo: null,
  tipoLinha: null,
  painelPendente: null,
  painelEditando: null,
  painelContexto: null,
  ligacao: null,
  corte: null,
  alinhamento: null,
  arraste: null,
  suprimirCliqueAte: 0,
  dados: carregarDiagrama()
};

document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.getElementById("referenciaServicoDialog");
  const form = document.getElementById("referenciaServicoForm");
  const painelDialog = document.getElementById("painelServicoDialog");
  const painelForm = document.getElementById("painelServicoForm");
  const canvas = document.getElementById("engCampoCanvas");

  document.getElementById("btnReferenciaServico")?.addEventListener("click", () => {
    preencherFormularioReferencia();
    abrirDialog(dialog);
  });

  document.getElementById("btnCriarPainel")?.addEventListener("click", () => {
    alternarModo(estadoDiagrama.modo === "painel" ? null : "painel");
  });

  document.getElementById("btnCriarAlimentador")?.addEventListener("click", () => {
    alternarModoLinha("alimentacao");
  });

  document.getElementById("btnCriarRede")?.addEventListener("click", () => {
    alternarModoLinha("rede");
  });

  document.getElementById("btnCriarEmergencia")?.addEventListener("click", () => {
    alternarModoLinha("emergencia");
  });

  document.getElementById("btnFecharReferenciaServico")?.addEventListener("click", () => {
    fecharDialog(dialog);
  });

  document.getElementById("btnFecharPainelServico")?.addEventListener("click", () => {
    estadoDiagrama.painelPendente = null;
    estadoDiagrama.painelEditando = null;
    fecharDialog(painelDialog);
  });

  document.getElementById("btnRemoverPainelContext")?.addEventListener("click", () => {
    if (estadoDiagrama.painelContexto) removerPainel(estadoDiagrama.painelContexto);
    fecharMenuContextoPainel();
  });

  document.getElementById("btnLimparReferenciaServico")?.addEventListener("click", () => {
    localStorage.removeItem(REFERENCIA_SERVICO_KEY);
    form?.reset();
    renderizarResumoReferencia();
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    salvarReferenciaServico(new FormData(form));
    fecharDialog(dialog);
    renderizarResumoReferencia();
  });

  painelForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    salvarPainelServico(new FormData(painelForm));
    fecharDialog(painelDialog);
  });

  canvas?.addEventListener("click", (event) => {
    if (event.target.closest(".eng-painel-node")) return;
    if (estadoDiagrama.modo !== "painel") return;

    const rect = canvas.getBoundingClientRect();
    estadoDiagrama.painelPendente = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    preencherNovoPainel();
    abrirDialog(painelDialog);
  });

  canvas?.addEventListener("pointerdown", iniciarCorteQuadro);
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#painelContextMenu")) fecharMenuContextoPainel();
  });
  canvas?.addEventListener("mousemove", moverCursorPainel);
  window.addEventListener("pointermove", moverItemQuadro);
  window.addEventListener("pointermove", atualizarLigacaoPreview);
  window.addEventListener("pointermove", atualizarCorteQuadro);
  window.addEventListener("pointerup", finalizarArraste);
  window.addEventListener("pointerup", finalizarLigacaoPreview);
  window.addEventListener("pointerup", finalizarCorteQuadro);
  window.addEventListener("pointercancel", finalizarArraste);
  window.addEventListener("pointercancel", cancelarLigacaoPreview);
  window.addEventListener("pointercancel", cancelarCorteQuadro);

  renderizarResumoReferencia();
  renderizarDiagrama();
});

function abrirDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "open");
}

function fecharDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

function obterReferenciaServico() {
  try {
    const dados = JSON.parse(localStorage.getItem(REFERENCIA_SERVICO_KEY) || "null");
    return dados && typeof dados === "object" ? dados : null;
  } catch {
    localStorage.removeItem(REFERENCIA_SERVICO_KEY);
    return null;
  }
}

function preencherFormularioReferencia() {
  const form = document.getElementById("referenciaServicoForm");
  const dados = obterReferenciaServico();
  if (!form || !dados) return;

  Object.entries(dados).forEach(([campo, valor]) => {
    const input = form.elements[campo];
    if (input) input.value = valor ?? "";
  });
}

function salvarReferenciaServico(formData) {
  const dados = Object.fromEntries(formData.entries());
  dados.atualizadoEm = new Date().toISOString();
  localStorage.setItem(REFERENCIA_SERVICO_KEY, JSON.stringify(dados));
}

function renderizarResumoReferencia() {
  const resumo = document.getElementById("referenciaServicoResumo");
  if (!resumo) return;

  const dados = obterReferenciaServico();
  if (!dados) {
    resumo.hidden = true;
    resumo.innerHTML = "";
    atualizarBotoesDimensionamento(false);
    alternarModo(null);
    return;
  }

  resumo.hidden = false;
  resumo.innerHTML = `
    <strong>${escapeHtml(dados.nomeServico || "Referencia de servico")}</strong>
    <span>${escapeHtml(dados.entradaPrincipal || "-")}</span>
    <span>${escapeHtml(dados.tensaoFF || "-")} V FF</span>
    <span>${escapeHtml(dados.tensaoFN || "-")} V FN</span>
    <span>FP ${escapeHtml(dados.fatorPotencia || "-")}</span>
  `;
  const posicao = estadoDiagrama.dados.referencia || { x: 6, y: 6 };
  resumo.style.left = `${posicao.x}px`;
  resumo.style.top = `${posicao.y}px`;
  resumo.addEventListener("pointerdown", (event) => iniciarArraste(event, "referencia", null));
  atualizarBotoesDimensionamento(true);
}

function atualizarBotoesDimensionamento(referenciaSalva = !!obterReferenciaServico()) {
  document.getElementById("btnCriarPainel")?.toggleAttribute("hidden", !referenciaSalva);
  document.getElementById("btnCriarAlimentador")?.toggleAttribute("hidden", !referenciaSalva);
  document.getElementById("btnCriarRede")?.toggleAttribute("hidden", !referenciaSalva);
  document.getElementById("btnCriarEmergencia")?.toggleAttribute("hidden", !referenciaSalva);
}

function carregarDiagrama() {
  try {
    const dados = JSON.parse(localStorage.getItem(DIAGRAMA_SERVICO_KEY) || "null");
    if (dados && Array.isArray(dados.paineis) && Array.isArray(dados.alimentadores)) {
      return {
        referencia: dados.referencia || { x: 6, y: 6 },
        paineis: dados.paineis,
        alimentadores: dados.alimentadores
      };
    }
  } catch {
    localStorage.removeItem(DIAGRAMA_SERVICO_KEY);
  }

  return { referencia: { x: 6, y: 6 }, paineis: [], alimentadores: [] };
}

function salvarDiagrama() {
  localStorage.setItem(DIAGRAMA_SERVICO_KEY, JSON.stringify(estadoDiagrama.dados));
}

function alternarModo(modo) {
  estadoDiagrama.modo = modo;
  if (modo !== "alimentador") estadoDiagrama.tipoLinha = null;
  estadoDiagrama.ligacao = null;
  estadoDiagrama.corte = null;
  estadoDiagrama.alinhamento = null;
  document.body.classList.toggle("eng-modo-painel", modo === "painel");
  document.body.classList.toggle("eng-modo-alimentador", modo === "alimentador");
  document.getElementById("btnCriarPainel")?.classList.toggle("active", modo === "painel");
  document.getElementById("btnCriarAlimentador")?.classList.toggle("active", modo === "alimentador" && estadoDiagrama.tipoLinha === "alimentacao");
  document.getElementById("btnCriarRede")?.classList.toggle("active", modo === "alimentador" && estadoDiagrama.tipoLinha === "rede");
  document.getElementById("btnCriarEmergencia")?.classList.toggle("active", modo === "alimentador" && estadoDiagrama.tipoLinha === "emergencia");
  document.getElementById("engCampoCursor")?.toggleAttribute("hidden", modo !== "painel");
  renderizarDiagrama();
}

function alternarModoLinha(tipoLinha) {
  if (estadoDiagrama.modo === "alimentador" && estadoDiagrama.tipoLinha === tipoLinha) {
    alternarModo(null);
    return;
  }

  estadoDiagrama.tipoLinha = tipoLinha;
  alternarModo("alimentador");
  estadoDiagrama.tipoLinha = tipoLinha;
  document.getElementById("btnCriarAlimentador")?.classList.toggle("active", tipoLinha === "alimentacao");
  document.getElementById("btnCriarRede")?.classList.toggle("active", tipoLinha === "rede");
  document.getElementById("btnCriarEmergencia")?.classList.toggle("active", tipoLinha === "emergencia");
}

function moverCursorPainel(event) {
  const cursor = document.getElementById("engCampoCursor");
  const canvas = document.getElementById("engCampoCanvas");
  if (!cursor || !canvas || estadoDiagrama.modo !== "painel") return;

  const rect = canvas.getBoundingClientRect();
  cursor.style.left = `${event.clientX - rect.left}px`;
  cursor.style.top = `${event.clientY - rect.top}px`;
}

function preencherNovoPainel() {
  const form = document.getElementById("painelServicoForm");
  if (!form) return;

  estadoDiagrama.painelEditando = null;
  document.getElementById("painelServicoTitulo").textContent = "Novo painel";
  form.reset();
  form.elements.tag.value = proximaTagPainel();
}

function preencherEditarPainel(painel) {
  const form = document.getElementById("painelServicoForm");
  if (!form || !painel) return;

  estadoDiagrama.painelPendente = null;
  estadoDiagrama.painelEditando = painel.id;
  document.getElementById("painelServicoTitulo").textContent = "Editar painel";
  form.elements.tipo.value = painel.tipo;
  form.elements.tag.value = painel.tag;
}

function proximaTagPainel() {
  const total = estadoDiagrama.dados.paineis.length;
  return total === 0 ? "ENTRADA" : `QD-${String(total).padStart(2, "0")}`;
}

function salvarPainelServico(formData) {
  if (estadoDiagrama.painelEditando) {
    editarPainel(formData);
    return;
  }

  criarPainel(formData);
}

function criarPainel(formData) {
  if (!estadoDiagrama.painelPendente) return;

  const dados = Object.fromEntries(formData.entries());
  const painel = {
    id: gerarId(),
    tipo: dados.tipo || "QD",
    tag: dados.tag || proximaTagPainel(),
    x: Math.max(8, estadoDiagrama.painelPendente.x - 36),
    y: Math.max(8, estadoDiagrama.painelPendente.y - 22)
  };

  estadoDiagrama.dados.paineis.push(painel);
  estadoDiagrama.painelPendente = null;
  estadoDiagrama.painelEditando = null;
  salvarDiagrama();
  alternarModo(null);
  renderizarDiagrama();
}

function editarPainel(formData) {
  const painel = estadoDiagrama.dados.paineis.find((item) => item.id === estadoDiagrama.painelEditando);
  if (!painel) return;

  const dados = Object.fromEntries(formData.entries());
  painel.tipo = dados.tipo || painel.tipo;
  painel.tag = dados.tag || painel.tag;
  estadoDiagrama.painelEditando = null;
  salvarDiagrama();
  renderizarDiagrama();
}

function renderizarDiagrama() {
  const canvas = document.getElementById("engCampoCanvas");
  const linhas = document.getElementById("engCampoLinhas");
  if (!canvas || !linhas) return;

  canvas.querySelectorAll(".eng-painel-node").forEach((node) => node.remove());
  canvas.querySelectorAll(".eng-alimentador-label").forEach((label) => label.remove());

  estadoDiagrama.dados.paineis.forEach((painel) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `eng-painel-node tipo-${normalizarClasseTipoPainel(painel.tipo)}`;
    node.dataset.id = painel.id;
    node.style.left = `${painel.x}px`;
    node.style.top = `${painel.y}px`;
    node.title = painel.tag;
    node.innerHTML = `
      <i class="fa-solid fa-table-cells-large"></i>
      <span>${escapeHtml(painel.tag)}</span>
      <small>${escapeHtml(painel.tipo)}</small>
    `;
    node.addEventListener("pointerdown", (event) => {
      if (estadoDiagrama.modo === "alimentador") {
        iniciarLigacaoPreview(event, painel.id);
        return;
      }

      iniciarArraste(event, "painel", painel.id);
    });
    node.addEventListener("click", (event) => abrirEdicaoPainel(event, painel.id));
    node.addEventListener("dblclick", (event) => prepararAberturaDimensionamento(event, painel.id));
    node.addEventListener("contextmenu", (event) => abrirMenuContextoPainel(event, painel.id));
    canvas.appendChild(node);
  });

  renderizarAlimentadores();
}

function renderizarAlimentadores() {
  const canvas = document.getElementById("engCampoCanvas");
  const linhas = document.getElementById("engCampoLinhas");
  if (!canvas || !linhas) return;

  canvas.querySelectorAll(".eng-alimentador-label").forEach((label) => label.remove());

  linhas.innerHTML = `${criarDefinicoesSvgAlimentador()}${estadoDiagrama.dados.alimentadores.map((alimentador) => {
    const origem = estadoDiagrama.dados.paineis.find((painel) => painel.id === alimentador.origem);
    const destino = estadoDiagrama.dados.paineis.find((painel) => painel.id === alimentador.destino);
    if (!origem || !destino) return "";

    const a = centroPainel(origem);
    const b = centroPainel(destino);
    const caminho = criarCaminhoCurvo(a, b);
    const tipo = alimentador.tipo || "alimentacao";
    if (tipo === "alimentacao") renderizarLabelAlimentador(canvas, alimentador, a, b);
    return `
      <path class="eng-alimentador-borda tipo-${tipo}" d="${caminho}" />
      <path class="eng-alimentador-linha tipo-${tipo}" d="${caminho}" />
    `;
  }).join("")}`;

  if (estadoDiagrama.ligacao) {
    const origem = estadoDiagrama.dados.paineis.find((painel) => painel.id === estadoDiagrama.ligacao.origem);
    if (origem) {
      const caminho = criarCaminhoCurvo(centroPainel(origem), estadoDiagrama.ligacao.atual);
      const tipo = estadoDiagrama.tipoLinha || "alimentacao";
      linhas.innerHTML += `
        <path class="eng-alimentador-borda tipo-${tipo} preview" d="${caminho}" />
        <path class="eng-alimentador-linha tipo-${tipo} preview" d="${caminho}" />
      `;
    }
  }

  if (estadoDiagrama.corte) {
    linhas.innerHTML += `
      <line class="eng-corte-linha" x1="${estadoDiagrama.corte.inicio.x}" y1="${estadoDiagrama.corte.inicio.y}" x2="${estadoDiagrama.corte.fim.x}" y2="${estadoDiagrama.corte.fim.y}" />
    `;
  }

  if (estadoDiagrama.alinhamento) {
    const guias = [];
    if (estadoDiagrama.alinhamento.x !== null) {
      guias.push(`<line class="eng-alinhamento-guia" x1="${estadoDiagrama.alinhamento.x}" y1="0" x2="${estadoDiagrama.alinhamento.x}" y2="100%" />`);
    }
    if (estadoDiagrama.alinhamento.y !== null) {
      guias.push(`<line class="eng-alinhamento-guia" x1="0" y1="${estadoDiagrama.alinhamento.y}" x2="100%" y2="${estadoDiagrama.alinhamento.y}" />`);
    }
    linhas.innerHTML += guias.join("");
  }
}

function criarDefinicoesSvgAlimentador() {
  return `
    <defs>
      <marker id="eng-seta-alimentacao" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 1 L 7 4 L 0 7 z" fill="#111827"></path>
      </marker>
      <marker id="eng-seta-rede" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 1 L 7 4 L 0 7 z" fill="#2563eb"></path>
      </marker>
      <marker id="eng-seta-emergencia" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M 0 1 L 7 4 L 0 7 z" fill="#dc2626"></path>
      </marker>
    </defs>
  `;
}

function renderizarLabelAlimentador(canvas, alimentador, origem, destino) {
  const centro = calcularCentroLabelAlimentador(alimentador, origem, destino);
  const label = document.createElement("div");
  label.className = "eng-alimentador-label";
  label.dataset.id = alimentador.id;
  label.style.left = `${centro.x}px`;
  label.style.top = `${centro.y}px`;
  label.innerHTML = `
    <button type="button" class="eng-alimentador-label-move" title="Mover informacoes" aria-label="Mover informacoes">
      <i class="fa-solid fa-arrows-up-down-left-right"></i>
    </button>
    <input data-campo="bitola" value="${escapeHtml(alimentador.bitola || "")}" placeholder="#mm²" aria-label="Bitola do cabo">
    <input data-campo="distancia" value="${escapeHtml(alimentador.distancia || "")}" placeholder="0m" aria-label="Distancia do alimentador">
  `;

  label.addEventListener("pointerdown", (event) => event.stopPropagation());
  label.addEventListener("click", (event) => event.stopPropagation());
  label.querySelector(".eng-alimentador-label-move")?.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    iniciarArraste(event, "label", alimentador.id, label);
  });
  label.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      alimentador[input.dataset.campo] = input.value;
      salvarDiagrama();
    });
    input.addEventListener("blur", () => {
      input.value = formatarCampoAlimentador(input.dataset.campo, input.value);
      alimentador[input.dataset.campo] = input.value;
      salvarDiagrama();
    });
  });

  canvas.appendChild(label);
}

function calcularCentroLabelAlimentador(alimentador, origem, destino) {
  if (!Number.isFinite(Number(alimentador.labelOffsetX)) && !Number.isFinite(Number(alimentador.labelOffsetY))) {
    aplicarOffsetInicialLabel(alimentador, origem, destino);
  }

  return {
    x: Math.round(((origem.x + destino.x) / 2) + Number(alimentador.labelOffsetX || 0)),
    y: Math.round(((origem.y + destino.y) / 2) + Number(alimentador.labelOffsetY || 0))
  };
}

function aplicarOffsetInicialLabel(alimentador, origem, destino) {
  const base = {
    x: Math.round((origem.x + destino.x) / 2),
    y: Math.round((origem.y + destino.y) / 2)
  };
  const ocupados = estadoDiagrama.dados.alimentadores
    .filter((item) => item.id !== alimentador.id && (item.tipo || "alimentacao") === "alimentacao")
    .map((item) => ({
      x: Math.round((centroPainelPorId(item.origem).x + centroPainelPorId(item.destino).x) / 2) + Number(item.labelOffsetX || 0),
      y: Math.round((centroPainelPorId(item.origem).y + centroPainelPorId(item.destino).y) / 2) + Number(item.labelOffsetY || 0)
    }));

  let indice = 0;
  while (ocupados.some((ponto) => Math.abs(ponto.x - base.x) < 78 && Math.abs(ponto.y - base.y) < 38)) {
    indice += 1;
    base.y += indice % 2 === 0 ? -20 : 20;
    base.x += 10;
    if (indice > 8) break;
  }

  alimentador.labelOffsetX = base.x - Math.round((origem.x + destino.x) / 2);
  alimentador.labelOffsetY = base.y - Math.round((origem.y + destino.y) / 2);
}

function centroPainelPorId(id) {
  const painel = estadoDiagrama.dados.paineis.find((item) => item.id === id);
  return painel ? centroPainel(painel) : { x: 0, y: 0 };
}

function centroPainel(painel) {
  return {
    x: Number(painel.x) + 36,
    y: Number(painel.y) + 22
  };
}

function criarCaminhoCurvo(a, b) {
  const meioX = Math.round((a.x + b.x) / 2);
  const raio = Math.min(10, Math.abs(meioX - a.x) / 2, Math.abs(b.y - a.y) / 2);
  const dirX1 = meioX >= a.x ? 1 : -1;
  const dirY = b.y >= a.y ? 1 : -1;
  const dirX2 = b.x >= meioX ? 1 : -1;

  if (raio <= 0) {
    return `M ${a.x} ${a.y} L ${meioX} ${a.y} L ${meioX} ${b.y} L ${b.x} ${b.y}`;
  }

  return [
    `M ${a.x} ${a.y}`,
    `L ${meioX - (dirX1 * raio)} ${a.y}`,
    `Q ${meioX} ${a.y} ${meioX} ${a.y + (dirY * raio)}`,
    `L ${meioX} ${b.y - (dirY * raio)}`,
    `Q ${meioX} ${b.y} ${meioX + (dirX2 * raio)} ${b.y}`,
    `L ${b.x} ${b.y}`
  ].join(" ");
}

function criarPontosRota(a, b) {
  const meioX = Math.round((a.x + b.x) / 2);
  return [
    { x: a.x, y: a.y },
    { x: meioX, y: a.y },
    { x: meioX, y: b.y },
    { x: b.x, y: b.y }
  ];
}

function gerarId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizarClasseTipoPainel(tipo = "") {
  return String(tipo).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function iniciarArraste(event, tipo, id, elementoAlvo = event.currentTarget) {
  if (estadoDiagrama.modo === "painel" || estadoDiagrama.modo === "alimentador") return;
  if (event.button !== undefined && event.button !== 0) return;

  const canvas = document.getElementById("engCampoCanvas");
  const alvo = elementoAlvo;
  if (!canvas || !alvo) return;

  const rectCanvas = canvas.getBoundingClientRect();
  const rectAlvo = alvo.getBoundingClientRect();
  estadoDiagrama.arraste = {
    tipo,
    id,
    moveu: false,
    offsetX: event.clientX - rectAlvo.left,
    offsetY: event.clientY - rectAlvo.top,
    largura: rectAlvo.width,
    altura: rectAlvo.height,
    canvasX: rectCanvas.left,
    canvasY: rectCanvas.top,
    canvasW: rectCanvas.width,
    canvasH: rectCanvas.height
  };

  alvo.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function iniciarLigacaoPreview(event, painelId) {
  if (event.button !== undefined && event.button !== 0) return;

  const canvas = document.getElementById("engCampoCanvas");
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  estadoDiagrama.ligacao = {
    origem: painelId,
    atual: {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  renderizarAlimentadores();
}

function iniciarCorteQuadro(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (estadoDiagrama.modo || event.target.closest(".eng-painel-node, .referencia-servico-resumo")) return;
  if (!estadoDiagrama.dados.alimentadores.length) return;

  const ponto = obterPontoCanvas(event);
  if (!ponto) return;

  estadoDiagrama.corte = {
    inicio: ponto,
    fim: ponto,
    moveu: false
  };
}

function atualizarCorteQuadro(event) {
  if (!estadoDiagrama.corte) return;

  const ponto = obterPontoCanvas(event);
  if (!ponto) return;

  estadoDiagrama.corte.fim = ponto;
  estadoDiagrama.corte.moveu = distanciaEntre(estadoDiagrama.corte.inicio, ponto) > 8;
  renderizarAlimentadores();
}

function finalizarCorteQuadro() {
  if (!estadoDiagrama.corte) return;

  const corte = estadoDiagrama.corte;
  estadoDiagrama.corte = null;

  if (corte.moveu) {
    cortarAlimentadoresCruzados(corte.inicio, corte.fim);
    salvarDiagrama();
  }

  renderizarAlimentadores();
}

function cancelarCorteQuadro() {
  estadoDiagrama.corte = null;
  renderizarAlimentadores();
}

function cortarAlimentadoresCruzados(inicio, fim) {
  estadoDiagrama.dados.alimentadores = estadoDiagrama.dados.alimentadores.filter((alimentador) => {
    const origem = estadoDiagrama.dados.paineis.find((painel) => painel.id === alimentador.origem);
    const destino = estadoDiagrama.dados.paineis.find((painel) => painel.id === alimentador.destino);
    if (!origem || !destino) return false;

    const pontos = criarPontosRota(centroPainel(origem), centroPainel(destino));
    const cruzou = pontos.slice(0, -1).some((ponto, index) =>
      segmentosIntersectam(inicio, fim, ponto, pontos[index + 1])
    );

    return !cruzou;
  });
}

function segmentosIntersectam(a, b, c, d) {
  const o1 = orientacao(a, b, c);
  const o2 = orientacao(a, b, d);
  const o3 = orientacao(c, d, a);
  const o4 = orientacao(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && pontoNoSegmento(a, c, b)) return true;
  if (o2 === 0 && pontoNoSegmento(a, d, b)) return true;
  if (o3 === 0 && pontoNoSegmento(c, a, d)) return true;
  if (o4 === 0 && pontoNoSegmento(c, b, d)) return true;
  return false;
}

function orientacao(a, b, c) {
  const valor = ((b.y - a.y) * (c.x - b.x)) - ((b.x - a.x) * (c.y - b.y));
  if (Math.abs(valor) < 0.0001) return 0;
  return valor > 0 ? 1 : 2;
}

function pontoNoSegmento(a, b, c) {
  return b.x <= Math.max(a.x, c.x) && b.x >= Math.min(a.x, c.x)
    && b.y <= Math.max(a.y, c.y) && b.y >= Math.min(a.y, c.y);
}

function atualizarLigacaoPreview(event) {
  if (!estadoDiagrama.ligacao) return;

  const canvas = document.getElementById("engCampoCanvas");
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  estadoDiagrama.ligacao.atual = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  renderizarAlimentadores();
}

function finalizarLigacaoPreview(event) {
  if (!estadoDiagrama.ligacao) return;

  const destinoNode = document.elementFromPoint(event.clientX, event.clientY)?.closest(".eng-painel-node");
  const destino = destinoNode?.dataset.id;
  const origem = estadoDiagrama.ligacao.origem;
  const tipo = estadoDiagrama.tipoLinha || "alimentacao";

  if (destino && destino !== origem) {
    alternarAlimentador(origem, destino, tipo);
  }

  estadoDiagrama.ligacao = null;
  salvarDiagrama();
  renderizarAlimentadores();
}

function cancelarLigacaoPreview() {
  estadoDiagrama.ligacao = null;
  renderizarAlimentadores();
}

function alternarAlimentador(origem, destino, tipo) {
  const index = estadoDiagrama.dados.alimentadores.findIndex((alimentador) =>
    alimentador.origem === origem && alimentador.destino === destino && (alimentador.tipo || "alimentacao") === tipo
  );

  if (index >= 0) {
    estadoDiagrama.dados.alimentadores.splice(index, 1);
    return;
  }

  estadoDiagrama.dados.alimentadores.push({
    id: gerarId(),
    origem,
    destino,
    tipo,
    bitola: "",
    distancia: "",
    labelOffsetX: null,
    labelOffsetY: null
  });
}

function formatarCampoAlimentador(campo, valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";

  if (campo === "bitola") {
    if (/^#.*mm²$/i.test(texto)) return texto;
    const numero = texto.replace(/[^\d,.]/g, "").replace(",", ".");
    return numero ? `#${numero.replace(".", ",")}mm²` : texto;
  }

  if (campo === "distancia") {
    if (/m$/i.test(texto)) return texto;
    const numero = texto.replace(/[^\d,.]/g, "").replace(",", ".");
    return numero ? `${numero.replace(".", ",")}m` : texto;
  }

  return texto;
}

function moverItemQuadro(event) {
  const arraste = estadoDiagrama.arraste;
  if (!arraste) return;

  let x = limitar(event.clientX - arraste.canvasX - arraste.offsetX, 0, arraste.canvasW - arraste.largura);
  let y = limitar(event.clientY - arraste.canvasY - arraste.offsetY, 0, arraste.canvasH - arraste.altura);
  arraste.moveu = true;

  if (arraste.tipo === "painel") {
    const painel = estadoDiagrama.dados.paineis.find((item) => item.id === arraste.id);
    if (!painel) return;

    const alinhado = aplicarAlinhamentoPainel(arraste, x, y);
    x = alinhado.x;
    y = alinhado.y;

    painel.x = Math.round(x);
    painel.y = Math.round(y);

    const node = obterNodePainel(arraste.id);
    if (node) {
      node.style.left = `${painel.x}px`;
      node.style.top = `${painel.y}px`;
    }
    renderizarAlimentadores();
    return;
  }

  if (arraste.tipo === "label") {
    const alimentador = estadoDiagrama.dados.alimentadores.find((item) => item.id === arraste.id);
    if (!alimentador) return;

    const origem = centroPainelPorId(alimentador.origem);
    const destino = centroPainelPorId(alimentador.destino);
    const ponto = pontoMaisProximoNaRota({ x: x + (arraste.largura / 2), y: y + (arraste.altura / 2) }, criarPontosRota(origem, destino));
    alimentador.labelOffsetX = Math.round(ponto.x - ((origem.x + destino.x) / 2));
    alimentador.labelOffsetY = Math.round(ponto.y - ((origem.y + destino.y) / 2));

    const label = document.querySelector(`.eng-alimentador-label[data-id="${CSS.escape(arraste.id)}"]`);
    if (label) {
      label.style.left = `${Math.round(ponto.x)}px`;
      label.style.top = `${Math.round(ponto.y)}px`;
    }
    return;
  }

  estadoDiagrama.dados.referencia = { x: Math.round(x), y: Math.round(y) };
  const resumo = document.getElementById("referenciaServicoResumo");
  if (resumo) {
    resumo.style.left = `${estadoDiagrama.dados.referencia.x}px`;
    resumo.style.top = `${estadoDiagrama.dados.referencia.y}px`;
  }
}

function finalizarArraste() {
  if (!estadoDiagrama.arraste) return;
  if (estadoDiagrama.arraste.moveu) estadoDiagrama.suprimirCliqueAte = Date.now() + 250;
  salvarDiagrama();
  estadoDiagrama.arraste = null;
  estadoDiagrama.alinhamento = null;
  renderizarAlimentadores();
}

function obterNodePainel(id) {
  return Array.from(document.querySelectorAll(".eng-painel-node"))
    .find((node) => node.dataset.id === id);
}

function abrirEdicaoPainel(event, painelId) {
  if (estadoDiagrama.modo || Date.now() < estadoDiagrama.suprimirCliqueAte) return;

  const painel = estadoDiagrama.dados.paineis.find((item) => item.id === painelId);
  const dialog = document.getElementById("painelServicoDialog");
  if (!painel) return;

  fecharMenuContextoPainel();
  preencherEditarPainel(painel);
  abrirDialog(dialog);
  event.stopPropagation();
}

function prepararAberturaDimensionamento(event, painelId) {
  event.preventDefault();
  event.stopPropagation();
  estadoDiagrama.painelContexto = painelId;
}

function abrirMenuContextoPainel(event, painelId) {
  event.preventDefault();
  event.stopPropagation();

  const menu = document.getElementById("painelContextMenu");
  const canvas = document.getElementById("engCampoCanvas");
  if (!menu || !canvas) return;

  const rect = canvas.getBoundingClientRect();
  estadoDiagrama.painelContexto = painelId;
  menu.hidden = false;
  menu.style.left = `${event.clientX - rect.left}px`;
  menu.style.top = `${event.clientY - rect.top}px`;
}

function fecharMenuContextoPainel() {
  const menu = document.getElementById("painelContextMenu");
  if (menu) menu.hidden = true;
  estadoDiagrama.painelContexto = null;
}

function removerPainel(painelId) {
  estadoDiagrama.dados.paineis = estadoDiagrama.dados.paineis.filter((painel) => painel.id !== painelId);
  estadoDiagrama.dados.alimentadores = estadoDiagrama.dados.alimentadores.filter((alimentador) =>
    alimentador.origem !== painelId && alimentador.destino !== painelId
  );
  salvarDiagrama();
  renderizarDiagrama();
}

function limitar(valor, min, max) {
  return Math.min(Math.max(valor, min), Math.max(min, max));
}

function aplicarAlinhamentoPainel(arraste, x, y) {
  const tolerancia = 10;
  const centroAtual = {
    x: x + (arraste.largura / 2),
    y: y + (arraste.altura / 2)
  };
  const alinhamento = { x: null, y: null };

  estadoDiagrama.dados.paineis
    .filter((painel) => painel.id !== arraste.id)
    .forEach((painel) => {
      const centro = centroPainel(painel);
      if (alinhamento.x === null && Math.abs(centroAtual.x - centro.x) <= tolerancia) {
        alinhamento.x = centro.x;
        x = centro.x - (arraste.largura / 2);
      }
      if (alinhamento.y === null && Math.abs(centroAtual.y - centro.y) <= tolerancia) {
        alinhamento.y = centro.y;
        y = centro.y - (arraste.altura / 2);
      }
    });

  estadoDiagrama.alinhamento = alinhamento.x === null && alinhamento.y === null ? null : alinhamento;

  return {
    x: limitar(x, 0, arraste.canvasW - arraste.largura),
    y: limitar(y, 0, arraste.canvasH - arraste.altura)
  };
}

function obterPontoCanvas(event) {
  const canvas = document.getElementById("engCampoCanvas");
  if (!canvas) return null;

  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function distanciaEntre(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pontoMaisProximoNaRota(ponto, rota) {
  return rota.slice(0, -1).reduce((melhor, inicio, index) => {
    const candidato = pontoMaisProximoNoSegmento(ponto, inicio, rota[index + 1]);
    const distancia = distanciaEntre(ponto, candidato);
    return distancia < melhor.distancia ? { ponto: candidato, distancia } : melhor;
  }, { ponto: rota[0], distancia: Infinity }).ponto;
}

function pontoMaisProximoNoSegmento(ponto, inicio, fim) {
  const dx = fim.x - inicio.x;
  const dy = fim.y - inicio.y;
  const tamanho = (dx * dx) + (dy * dy);
  if (tamanho === 0) return inicio;

  const t = limitar((((ponto.x - inicio.x) * dx) + ((ponto.y - inicio.y) * dy)) / tamanho, 0, 1);
  return {
    x: inicio.x + (t * dx),
    y: inicio.y + (t * dy)
  };
}

function escapeHtml(valor = "") {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
