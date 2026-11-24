import { ATRIBUTOS_POR_MATERIAL } from "../utils/material/material.config.js";
import { criarEstadoVazio, exportarPrototipoJson, lerPrototipoJson } from "../utils/material/prototipo-atributos-arquivo.js";

const STORAGE_KEY = "prototipo_atributos_material_v1";

const OPCOES_ATRIBUTOS_BASE = {
  cor: ["Preto", "Azul", "Verde", "Vermelho", "Branco", "Amarelo", "Marrom", "Cinza"],
  bitola: ["1,5mm²", "2,5mm²", "4mm²", "6mm²", "10mm²", "16mm²", "25mm²", "35mm²", "50mm²", "70mm²", "95mm²", "120mm²"],
  numero_de_vias: ["2x", "3x", "4x", "5x", "6x"],
  material: ["Cobre", "Alumínio"],
  tipo: ["Flexível", "Rígido", "PP", "HEPR", "PVC 750V", "PVC 1kV", "EPR 1kV"]
};

const NOMES_NODES_BASE = {
  "material-principal": "Material Principal",
  cor: "Cor",
  bitola: "Bitola",
  material: "Material",
  tipo: "Tipo"
};

const ORDENADOR_OPCOES_PROTO = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base"
});

let linhasAtivas = [];
let linhasBloqueioAtivas = [];
let linhasAtribuicaoAtivas = [];
let linhasAtributoUnicoAtivas = [];
let linhasImagemAtivas = [];
let atributoUnicoOutsideHandler = null;
let linhaTemporaria = null;
let pontoTemporario = null;
let estadoAtual = null;
let relacaoSelecionada = null;
let corteAtual = null;
let bloqueioEmCriacao = null;
let bloqueioImagemEmCriacao = null;
let opcoesAtributos = {};
let nomesNodes = {};
let simuladorEscolhas = {};
let historicoEstados = [];
let futuroEstados = [];
let ultimoSnapshotHistorico = "";
let restaurandoHistorico = false;
let atalhosHistoricoConfigurados = false;
const zoomMinimo = 0.25;
const zoomMaximo = 3;
const cameraProto = { panX: 0, panY: 0, escala: 1, limiteInferior: zoomMinimo };
let cameraStageConfigurada = null;
let eventosCamera = null;
let observadorQuadro = null;
let frameCamera = 0;
let ajustarAoAbrir = true;

export function initPrototipoAtributosMaterial() {
  const stage = document.getElementById("protoStage");
  if (!stage) {
    limparPrototipoAtributosMaterial();
    return;
  }

  removerLinhas();
  estadoAtual = carregarEstado();
  ultimoSnapshotHistorico = criarSnapshotEstado();
  relacaoSelecionada = null;
  simuladorEscolhas = {};
  normalizarAtributosEstado();

  renderizarAtributosDinamicos(stage);
  removerAtributosNaoSalvos(stage);
  atualizarNodeMaterialPrincipal(stage);
  aplicarPosicoesSalvas(stage);
  atualizarMapasAtributos(stage);
  configurarCameraStage(stage);
  aplicarCameraStage(stage);
  portalizarPaineisPrototipo(stage);
  atualizarPosicaoPaineisPrototipo();
  configurarArrasteNodes(stage);
  configurarCriacaoLinhas(stage);
  configurarCliqueContadores(stage);
  configurarCorteLinhas(stage);
  configurarMenuBloqueio(stage);
  configurarAdicionarAtributo(stage);
  configurarMaterialPrincipal(stage);
  configurarSimulador();
  configurarRecolherAtributoUnico(stage);
  configurarAcoes();
  redesenharLinhas();
  atualizarResumo();
  atualizarSimulador();
}

export function limparPrototipoAtributosMaterial() {
  eventosCamera?.abort();
  observadorQuadro?.disconnect();
  cancelAnimationFrame(frameCamera);
  frameCamera = 0;
  cameraStageConfigurada = null;
  ajustarAoAbrir = true;
  removerLinhas();
  linhaTemporaria?.remove?.();
  linhaTemporaria = null;
  pontoTemporario?.remove?.();
  pontoTemporario = null;
  corteAtual?.remove?.();
  corteAtual = null;
  bloqueioEmCriacao = null;
  bloqueioImagemEmCriacao = null;

  document.querySelectorAll(`
    .proto-block-rule,
    .proto-specific-rule,
    .proto-unique-rule,
    .proto-simulator,
    .proto-attr-drawer,
    .proto-image-modal,
    .proto-material-modal,
    .leader-line,
    svg[class*="leader-line"],
    [class*="leader-line"]
  `).forEach(elemento => elemento.remove());

  document.getElementById("protoContextMenu")?.remove();
}

function portalizarPaineisPrototipo(stage) {
  ["protoSimuladorDrawer", "protoAttrDrawer"].forEach(id => {
    const elemento = document.getElementById(id);
    if (!elemento || elemento.parentElement === document.body) return;
    elemento.dataset.protoPortal = "1";
    elemento.dataset.protoStageId = stage.id;
    document.body.appendChild(elemento);
  });
}

function normalizarAtributosEstado() {
  if (!Array.isArray(estadoAtual.atributosExtras)) {
    estadoAtual.atributosExtras = [];
  }
  if (!Array.isArray(estadoAtual.materiaisPrincipais)) {
    estadoAtual.materiaisPrincipais = [];
  }
  if (!estadoAtual.opcoesPersonalizadas || typeof estadoAtual.opcoesPersonalizadas !== "object") {
    estadoAtual.opcoesPersonalizadas = {};
  }
  if (!estadoAtual.opcoesRemovidas || typeof estadoAtual.opcoesRemovidas !== "object") {
    estadoAtual.opcoesRemovidas = {};
  }
  if (!Array.isArray(estadoAtual.imagensAnexadas)) {
    estadoAtual.imagensAnexadas = [];
  }
  reconstruirAtributosDoEstado();
}

function reconstruirAtributosDoEstado() {
  const ids = new Set((estadoAtual.atributosExtras || []).map(attr => attr.id));

  Object.keys(estadoAtual.relacoes || {}).forEach(chave => {
    chave.split("::").forEach(id => {
      if (id !== "material-principal") ids.add(id);
    });
  });

  (estadoAtual.bloqueios || []).forEach(regra => {
    if (regra.origem !== "material-principal") ids.add(regra.origem);
    if (regra.destino !== "material-principal") ids.add(regra.destino);
  });

  (estadoAtual.atribuicoesEspecificas || []).forEach(regra => {
    if (regra.origem !== "material-principal") ids.add(regra.origem);
    if (regra.destino !== "material-principal") ids.add(regra.destino);
  });

  (estadoAtual.atributosUnicos || []).forEach(regra => {
    if (regra.origem !== "material-principal") ids.add(regra.origem);
    if (regra.destino !== "material-principal") ids.add(regra.destino);
  });

  ids.forEach(id => {
    if ((estadoAtual.atributosExtras || []).some(attr => attr.id === id)) return;
    const nome = obterNomeAtributoPorId(id);
    const pos = estadoAtual.posicoes?.[id] || obterPosicaoPadraoAtributo(estadoAtual.atributosExtras.length);
    estadoAtual.atributosExtras.push({
      id,
      nome,
      descricao: "Atributo do cadastro de materiais",
      left: pos.left,
      top: pos.top
    });
    estadoAtual.posicoes[id] = pos;
  });
}

function obterNomeAtributoPorId(id) {
  return NOMES_NODES_BASE[id]
    || listarAtributosCadastro().find(nome => normalizarIdAtributo(nome) === id)
    || humanizarIdAtributo(id);
}

function humanizarIdAtributo(id) {
  return String(id || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function obterPosicaoPadraoAtributo(indice) {
  const coluna = (indice + 1) % 3;
  const linha = Math.floor((indice + 1) / 3);
  return {
    left: 360 + coluna * 280,
    top: 70 + linha * 150
  };
}

function renderizarAtributosDinamicos(stage) {
  const mundo = stage.querySelector(".proto-world");
  stage.querySelectorAll(".proto-node[data-extra='1']").forEach(node => node.remove());

  estadoAtual.atributosExtras.forEach(attr => {
    if (!attr?.id || stage.querySelector(`.proto-node[data-node="${attr.id}"]`)) return;

    const node = criarNodeAtributo(attr.id, attr.nome, attr.left, attr.top);
    node.dataset.extra = "1";
    mundo.appendChild(node);
  });
}

function removerAtributosNaoSalvos(stage) {
  const idsSalvos = new Set((estadoAtual.atributosExtras || []).map(attr => attr.id));
  stage.querySelectorAll(".proto-node[data-node]").forEach(node => {
    const id = node.dataset.node;
    if (id === "material-principal" || idsSalvos.has(id)) return;
    node.remove();
  });
}

function atualizarNodeMaterialPrincipal(stage) {
  const node = stage.querySelector(".proto-node-main[data-node='material-principal']");
  if (!node) return;

  const nome = estadoAtual.materialBase || "Sem material";
  node.querySelector("strong").textContent = nome;
}

function atualizarMapasAtributos(stage) {
  opcoesAtributos = {};
  nomesNodes = {
    ...NOMES_NODES_BASE,
    "material-principal": estadoAtual.materialBase || NOMES_NODES_BASE["material-principal"]
  };

  stage.querySelectorAll(".proto-node[data-node]").forEach(node => {
    const id = node.dataset.node;
    if (id === "material-principal") return;

    const nome = node.querySelector("strong")?.textContent?.trim() || id;
    nomesNodes[id] = nome;
    opcoesAtributos[id] = obterOpcoesAtributo(id, nome);
  });
}

function obterOpcoesAtributo(id, nome) {
  const personalizadas = Array.isArray(estadoAtual.opcoesPersonalizadas?.[id])
    ? estadoAtual.opcoesPersonalizadas[id]
    : [];
  const removidas = new Set(
    (Array.isArray(estadoAtual.opcoesRemovidas?.[id]) ? estadoAtual.opcoesRemovidas[id] : [])
      .map(normalizarBusca)
  );
  const base = OPCOES_ATRIBUTOS_BASE[id] || obterOpcoesBasePorNome(nome);
  return ordenarOpcoesAtributo([...base, ...personalizadas]
    .filter(Boolean)
    .filter(opcao => !removidas.has(normalizarBusca(opcao))));
}

function ordenarOpcoesAtributo(opcoes) {
  return [...new Set((opcoes || []).filter(Boolean))]
    .sort((a, b) => ORDENADOR_OPCOES_PROTO.compare(String(a), String(b)));
}

function obterOpcoesBasePorNome(nome) {
  const normalizado = normalizarIdAtributo(nome);
  const basePorNome = Object.entries(OPCOES_ATRIBUTOS_BASE)
    .find(([id]) => id === normalizado);

  return basePorNome?.[1] || [];
}

function configurarCliqueContadores(stage) {
  stage.onclick = event => {
    const contador = event.target.closest("[data-count-for]");
    if (!contador || !stage.contains(contador)) return;

    event.preventDefault();
    event.stopPropagation();
    abrirAtributoPeloContador(contador);
  };

  stage.querySelectorAll("[data-count-for]").forEach(contador => {
    contador.onpointerdown = event => {
      event.stopPropagation();
    };

    contador.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      abrirAtributoPeloContador(contador);
    };
  });
}

function abrirAtributoPeloContador(contador) {
  const destino = contador.dataset.countFor;
  const chaveExistente = Object.keys(estadoAtual.relacoes || {})
    .find(chave => chave.split("::")[1] === destino);
  const chave = chaveExistente || criarChave("material-principal", destino);

  if (!relacaoPermitida(...chave.split("::"))) return;

  if (!estadoAtual.relacoes[chave]) {
    estadoAtual.relacoes[chave] = [];
    salvarEstado();
  }

  relacaoSelecionada = chave;
  redesenharLinhas();
  abrirPainelRelacao(chave);
}

function configurarSimulador() {
  const janela = document.getElementById("protoSimuladorDrawer");
  const abrir = document.getElementById("protoToggleSimulador");
  const busca = document.getElementById("protoSimuladorBusca");
  const status = document.getElementById("protoSimuladorStatus");
  const opcoes = document.getElementById("protoSimuladorOpcoes");
  const galeria = document.getElementById("protoSimuladorImagens");
  const copiar = document.getElementById("protoSimuladorCopiar");
  const retornoCopia = document.getElementById("protoSimuladorRetornoCopia");
  const fichaTexto = document.getElementById("protoSimuladorFichaTexto");
  let versaoEtapa = 0;

  abrir.addEventListener("click", () => {
    fecharDrawerAtributos();
    janela.showModal();
    atualizarSimulador();
  });
  document.getElementById("protoSimuladorFechar").addEventListener("click", () => janela.close());
  janela.addEventListener("click", event => {
    if (event.target === janela) janela.close();
  });
  janela.addEventListener("close", () => abrir.focus({ preventScroll: true }));

  const atualizarEtapa = () => {
    versaoEtapa++;
    busca.value = "";
    delete galeria.dataset.foto;
    retornoCopia.textContent = "";
    fichaTexto.hidden = true;
    atualizarSimulador();
    opcoes.closest(".proto-simulator-main").scrollTop = 0;
    status.focus({ preventScroll: true });
  };

  busca.addEventListener("input", atualizarSimulador);
  document.getElementById("protoSimuladorMostrarBloqueados").addEventListener("change", atualizarSimulador);
  galeria.addEventListener("click", event => {
    const controle = event.target.closest("[data-sim-foto]");
    if (!controle) return;
    galeria.dataset.foto = controle.dataset.simFoto;
    atualizarImagensSimulador(galeria);
    galeria.querySelector(`[data-sim-direcao="${controle.dataset.simDirecao}"]`)?.focus({ preventScroll: true });
  });
  copiar.addEventListener("click", async () => {
    const versao = versaoEtapa;
    const texto = [
      "Material: " + (estadoAtual.materialBase || "Sem material definido"),
      ...Object.entries(simuladorEscolhas).map(([atributo, valor]) => (nomesNodes[atributo] || atributo) + ": " + valor)
    ].join("\n");
    copiar.disabled = true;
    try {
      await navigator.clipboard.writeText(texto);
      if (versao !== versaoEtapa || !janela.open) return;
      fichaTexto.hidden = true;
      retornoCopia.textContent = "Ficha copiada.";
    } catch {
      if (versao !== versaoEtapa || !janela.open) return;
      fichaTexto.value = texto;
      fichaTexto.hidden = false;
      fichaTexto.focus();
      fichaTexto.select();
      retornoCopia.textContent = "A ficha está selecionada. Use o comando Copiar do seu dispositivo.";
    } finally {
      copiar.disabled = false;
    }
  });
  document.getElementById("protoSimuladorLimpar").addEventListener("click", () => {
    simuladorEscolhas = {};
    atualizarEtapa();
  });
  const voltarPara = atributo => {
    removerEscolhasPosteriores(atributo);
    delete simuladorEscolhas[atributo];
    atualizarEtapa();
  };
  document.getElementById("protoSimuladorVoltar").addEventListener("click", () => {
    voltarPara(Object.keys(simuladorEscolhas).at(-1));
  });

  opcoes.addEventListener("click", event => {
    const botao = event.target.closest("[data-sim-option]");
    if (!botao || botao.disabled) return;

    simuladorEscolhas[botao.dataset.simAttr] = botao.dataset.simOption;
    atualizarEtapa();
  });

  document.getElementById("protoSimuladorEscolhas").addEventListener("click", event => {
    const botao = event.target.closest("[data-sim-remove]");
    if (botao) voltarPara(botao.dataset.simRemove);
  });
}

function fecharDrawerAtributos() {
  const drawer = document.getElementById("protoAttrDrawer");
  const botao = document.getElementById("protoAddAtributo");

  drawer?.classList.remove("open");
  drawer?.setAttribute("aria-hidden", "true");
  if (drawer) drawer.inert = true;
  botao?.classList.remove("open");
  botao?.setAttribute("aria-expanded", "false");
  atualizarVisibilidadeLinhasPorPainel();
}

function atualizarVisibilidadeLinhasPorPainel() {
  atualizarPosicaoPaineisPrototipo();
}

function atualizarPosicaoPaineisPrototipo() {
  const stage = document.getElementById("protoStage");
  if (!stage) return;

  const rect = stage.getBoundingClientRect();
  const root = document.documentElement;
  const dimensoes = {
    "--proto-stage-top": rect.top,
    "--proto-stage-left": rect.left,
    "--proto-stage-right-gap": Math.max(0, window.innerWidth - rect.right),
    "--proto-stage-bottom-gap": Math.max(0, window.innerHeight - rect.bottom),
    "--proto-stage-width": rect.width,
    "--proto-stage-height": rect.height
  };
  for (const [propriedade, comprimento] of Object.entries(dimensoes)) {
    const valor = comprimento + "px";
    if (valor !== root.style.getPropertyValue(propriedade)) root.style.setProperty(propriedade, valor);
  }
}

function reposicionarLinhasAtivas() {
  atualizarPosicaoPaineisPrototipo();
  const stage = document.getElementById("protoStage");
  if (stage) {
    posicionarCaixasIntermediarias(stage);
  }
  linhasAtivas.forEach(item => item.line?.position?.());
  linhasBloqueioAtivas.forEach(item => item.line?.position?.());
  linhasAtribuicaoAtivas.forEach(item => item.line?.position?.());
  linhasAtributoUnicoAtivas.forEach(item => item.line?.position?.());
  linhasImagemAtivas.forEach(item => item.line?.position?.());
  recortarLinhasAoQuadro();
}

function configurarCameraStage(stage) {
  if (cameraStageConfigurada === stage) return;
  eventosCamera?.abort();
  observadorQuadro?.disconnect();
  cameraStageConfigurada = stage;
  eventosCamera = new AbortController();
  const opcoes = { signal: eventosCamera.signal };
  const botaoMover = document.getElementById("protoModoMover");
  let arraste = null;
  let espaco = false;
  let larguraAnterior = stage.clientWidth;
  let alturaAnterior = stage.clientHeight;

  const atualizarModo = () => {
    stage.classList.toggle("modo-mover", espaco || botaoMover.getAttribute("aria-pressed") === "true");
  };
  botaoMover.addEventListener("click", () => {
    botaoMover.setAttribute("aria-pressed", String(botaoMover.getAttribute("aria-pressed") !== "true"));
    atualizarModo();
  }, opcoes);

  stage.addEventListener("pointerdown", event => {
    const mover = event.button === 1 || (event.button === 0 &&
      (stage.classList.contains("modo-mover") || (event.pointerType === "touch" && event.target === stage)));
    if (!mover || arraste) return;

    event.preventDefault();
    event.stopPropagation();
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-panning");
    arraste = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: cameraProto.panX, panY: cameraProto.panY };
  }, { ...opcoes, capture: true });

  stage.addEventListener("pointermove", event => {
    if (arraste?.id !== event.pointerId) return;
    cameraProto.panX = arraste.panX + event.clientX - arraste.x;
    cameraProto.panY = arraste.panY + event.clientY - arraste.y;
    aplicarCameraStage(stage);
  }, opcoes);

  const soltar = event => {
    if (arraste?.id !== event.pointerId) return;
    arraste = null;
    stage.classList.remove("is-panning");
  };
  for (const tipo of ["pointerup", "pointercancel", "lostpointercapture"]) {
    stage.addEventListener(tipo, soltar, opcoes);
  }

  stage.addEventListener("auxclick", event => {
    if (event.button === 1) event.preventDefault();
  }, opcoes);

  stage.addEventListener("wheel", event => {
    event.preventDefault();
    if (arraste || corteAtual || linhaTemporaria || !event.deltaY) return;
    const rect = stage.getBoundingClientRect();
    const unidade = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
    const delta = Math.max(-180, Math.min(180, event.deltaY * unidade));
    ajustarZoomStage(stage, cameraProto.escala * Math.exp(-delta * 0.002), event.clientX - rect.left, event.clientY - rect.top);
  }, { ...opcoes, passive: false });

  const zoomPorPasso = fator => ajustarZoomStage(stage, cameraProto.escala * fator);
  document.getElementById("protoZoomMenos").addEventListener("click", () => zoomPorPasso(1 / 1.2), opcoes);
  document.getElementById("protoZoomMais").addEventListener("click", () => zoomPorPasso(1.2), opcoes);
  document.getElementById("protoZoomAtual").addEventListener("click", () => ajustarZoomStage(stage, 1), opcoes);
  document.getElementById("protoEnquadrar").addEventListener("click", () => enquadrarQuadro(stage), opcoes);

  document.addEventListener("keydown", event => {
    if (event.code !== "Space" || event.target.closest("button, input, textarea, select, [contenteditable]")) return;
    if (event.target !== stage && !stage.matches(":hover")) return;
    event.preventDefault();
    espaco = true;
    atualizarModo();
  }, opcoes);
  const liberarEspaco = () => {
    espaco = false;
    atualizarModo();
  };
  document.addEventListener("keyup", event => {
    if (event.code === "Space") liberarEspaco();
  }, opcoes);
  window.addEventListener("blur", liberarEspaco, opcoes);

  stage.addEventListener("keydown", event => {
    if (event.target !== stage) return;
    const movimento = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[event.key];
    if (movimento) {
      cameraProto.panX += movimento[0];
      cameraProto.panY += movimento[1];
      aplicarCameraStage(stage);
    } else if (event.key === "+" || event.key === "=") {
      zoomPorPasso(1.2);
    } else if (event.key === "-") {
      zoomPorPasso(1 / 1.2);
    } else if (event.key === "0") {
      enquadrarQuadro(stage);
    } else {
      return;
    }
    event.preventDefault();
  }, opcoes);

  observadorQuadro = new ResizeObserver(() => {
    const largura = stage.clientWidth;
    const altura = stage.clientHeight;
    if (!largura || !altura) return;
    if (ajustarAoAbrir) {
      ajustarAoAbrir = false;
      enquadrarQuadro(stage);
    } else {
      cameraProto.panX += (largura - larguraAnterior) / 2;
      cameraProto.panY += (altura - alturaAnterior) / 2;
      aplicarCameraStage(stage);
    }
    larguraAnterior = largura;
    alturaAnterior = altura;
  });
  observadorQuadro.observe(stage);
  window.addEventListener("resize", () => aplicarCameraStage(stage), opcoes);
  window.addEventListener("scroll", event => {
    if (event.target === document || event.target.contains?.(stage)) aplicarCameraStage(stage);
  }, { ...opcoes, capture: true });
}

function ajustarZoomStage(stage, escala, x = stage.clientWidth / 2, y = stage.clientHeight / 2) {
  escala = Math.max(cameraProto.limiteInferior, Math.min(zoomMaximo, escala));
  if (escala === cameraProto.escala) return;
  const fator = escala / cameraProto.escala;
  cameraProto.panX = x - (x - cameraProto.panX) * fator;
  cameraProto.panY = y - (y - cameraProto.panY) * fator;
  cameraProto.escala = escala;
  aplicarCameraStage(stage);
}

function enquadrarQuadro(stage) {
  const cartoes = [...stage.querySelectorAll(".proto-node, .proto-image-card")];
  if (!cartoes.length) return;

  const margem = 40;
  const esquerda = Math.min(...cartoes.map(item => item.offsetLeft));
  const topo = Math.min(...cartoes.map(item => item.offsetTop));
  const direita = Math.max(...cartoes.map(item => item.offsetLeft + item.offsetWidth));
  const fundo = Math.max(...cartoes.map(item => item.offsetTop + item.offsetHeight));
  const escala = Math.max(0.01, Math.min(1,
    (stage.clientWidth - margem * 2) / Math.max(1, direita - esquerda),
    (stage.clientHeight - margem * 2) / Math.max(1, fundo - topo)
  ));

  cameraProto.escala = escala;
  cameraProto.limiteInferior = Math.min(zoomMinimo, escala);
  cameraProto.panX = (stage.clientWidth - (direita + esquerda) * escala) / 2;
  cameraProto.panY = (stage.clientHeight - (fundo + topo) * escala) / 2;
  aplicarCameraStage(stage);
}

function aplicarCameraStage(stage = document.getElementById("protoStage")) {
  if (!stage || frameCamera) return;
  frameCamera = requestAnimationFrame(() => {
    frameCamera = 0;
    if (!stage.isConnected) return;

    stage.style.setProperty("--proto-pan-x", cameraProto.panX + "px");
    stage.style.setProperty("--proto-pan-y", cameraProto.panY + "px");
    stage.style.setProperty("--proto-escala", cameraProto.escala);
    document.getElementById("protoZoomAtual").textContent = Math.round(cameraProto.escala * 100) + "%";
    document.getElementById("protoZoomMenos").disabled = cameraProto.escala <= cameraProto.limiteInferior;
    document.getElementById("protoZoomMais").disabled = cameraProto.escala >= zoomMaximo;

    reposicionarLinhasAtivas();
  });
}

function deltaCamera(valor) {
  return valor / cameraProto.escala;
}

function recortarLinhasAoQuadro() {
  const quadro = document.getElementById("protoStage")?.getBoundingClientRect();
  if (!quadro) return;
  document.querySelectorAll("svg.leader-line").forEach(linha => recortarElementoQuadro(linha, quadro, linha.getBoundingClientRect()));
}

function recortarElementoQuadro(elemento, quadro, rect, escala = 1) {
  const bordas = [quadro.top - rect.top, rect.right - quadro.right, rect.bottom - quadro.bottom, quadro.left - rect.left];
  elemento.style.clipPath = bordas.some(borda => borda > 0)
    ? "inset(" + bordas.map(borda => Math.max(0, borda) / escala + "px").join(" ") + ")"
    : "";
}

function removerEscolhasPosteriores(atributo) {
  let remover = false;
  Object.keys(simuladorEscolhas).forEach(chave => {
    if (chave === atributo) {
      remover = true;
      return;
    }
    if (remover) delete simuladorEscolhas[chave];
  });
}

function atualizarSimulador() {
  if (!document.getElementById("protoSimuladorDrawer")?.open || !estadoAtual) return;
  const status = document.getElementById("protoSimuladorStatus");

  const placaEtapa = document.getElementById("protoSimuladorEtapa");
  const escolhasEl = document.getElementById("protoSimuladorEscolhas");
  const opcoesEl = document.getElementById("protoSimuladorOpcoes");
  const filtro = document.getElementById("protoSimuladorFiltro");
  const imagensEl = document.getElementById("protoSimuladorImagens");
  const mostrarBloqueados = document.getElementById("protoSimuladorMostrarBloqueados");
  const controleBloqueados = document.getElementById("protoSimuladorControleBloqueados");
  const proximo = obterProximoPassoSimulador();
  const escolhas = Object.entries(simuladorEscolhas);

  document.getElementById("protoSimuladorMaterial").textContent = estadoAtual.materialBase || "Sem material definido";
  document.getElementById("protoSimuladorVoltar").disabled = !escolhas.length;
  document.getElementById("protoSimuladorLimpar").disabled = !escolhas.length;
  escolhasEl.innerHTML = montarHtmlEscolhasSimulador(escolhas);

  atualizarImagensSimulador(imagensEl);

  const bloqueadas = proximo?.opcoes.filter(opcao => opcao.bloqueada) || [];
  const disponiveis = proximo?.opcoes.filter(opcao => !opcao.bloqueada) || [];
  const visiveis = mostrarBloqueados.checked ? [...disponiveis, ...bloqueadas] : disponiveis;
  controleBloqueados.hidden = !bloqueadas.length;
  document.getElementById("protoSimuladorRotuloBloqueados").textContent = `Mostrar bloqueados (${bloqueadas.length})`;
  document.getElementById("protoSimuladorCopiar").hidden = Boolean(proximo) || !escolhas.length;
  const campoBusca = document.getElementById("protoSimuladorBusca");
  filtro.hidden = !proximo || (visiveis.length < 7 && !campoBusca.value);
  placaEtapa.hidden = !proximo;
  opcoesEl.classList.toggle("is-finished", !proximo);
  if (!proximo) {
    const concluido = escolhas.length > 0;
    status.textContent = concluido ? "Montagem concluída" : "Nenhuma escolha disponível";
    opcoesEl.innerHTML = concluido
      ? '<p class="proto-simulator-empty"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Confira a configuração na ficha do material.</p>'
      : '<p class="proto-simulator-empty">Configure uma ligação com opções selecionadas no quadro para simular a montagem.</p>';
    return;
  }

  const busca = normalizarBusca(campoBusca.value);
  const resultados = visiveis.filter(opcao => normalizarBusca(opcao.valor).includes(busca));
  const destino = nomesNodes[proximo.destino] || proximo.destino;
  status.textContent = "Escolha " + destino;
  placaEtapa.textContent = "Etapa " + (escolhas.length + 1);

  if (proximo.opcoes.every(opcao => opcao.bloqueada)) {
    status.textContent = destino + " sem opções disponíveis";
  }
  opcoesEl.innerHTML = resultados.length ? resultados.map(opcao => `
    <button type="button" ${opcao.bloqueada ? 'class="is-blocked" disabled' : ''}
      data-sim-attr="${escapeHtml(proximo.destino)}" data-sim-option="${escapeHtml(opcao.valor)}">
      <span>${escapeHtml(opcao.valor)}</span>
      <i class="fa-solid ${opcao.bloqueada ? "fa-lock" : "fa-chevron-right"}" aria-hidden="true"></i>
      ${opcao.motivo ? `<small>${escapeHtml(opcao.motivo)}</small>` : ""}
    </button>
  `).join("") : `<p class="proto-simulator-empty">${!visiveis.length
    ? "Todas as opções desta etapa estão bloqueadas."
    : "Nenhuma opção encontrada."}</p>`;
}

function montarHtmlEscolhasSimulador(escolhas) {
  return escolhas.map(([atributo, valor]) => {
    const nome = escapeHtml(nomesNodes[atributo] || atributo);
    return `
      <div class="proto-sim-escolha">
        <dt>${nome}</dt>
        <dd><button type="button" data-sim-remove="${escapeHtml(atributo)}" title="Refazer escolha de ${nome}">
          <span>${escapeHtml(valor)}</span><i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button></dd>
      </div>`;
  }).join("");
}

function atualizarImagensSimulador(galeria) {
  const imagens = obterImagensCompativeisSimulador();
  galeria.hidden = !imagens.length;
  if (!imagens.length) {
    galeria.replaceChildren();
    return;
  }
  const indice = Math.max(0, imagens.findIndex(imagem => imagem.id === galeria.dataset.foto));
  const imagem = imagens[indice];
  galeria.dataset.foto = imagem.id;
  const anterior = imagens[(indice + imagens.length - 1) % imagens.length];
  const proxima = imagens[(indice + 1) % imagens.length];
  galeria.innerHTML = `
    <div class="proto-sim-images-head">
      <strong>Fotos</strong>
      ${imagens.length > 1 ? `<div class="proto-sim-images-controls">
        <button type="button" data-sim-foto="${escapeHtml(anterior.id)}" data-sim-direcao="anterior" aria-label="Foto anterior">‹</button>
        <span aria-live="polite">${indice + 1} / ${imagens.length}</span>
        <button type="button" data-sim-foto="${escapeHtml(proxima.id)}" data-sim-direcao="proxima" aria-label="Próxima foto">›</button>
      </div>` : ""}
    </div>
    <figure>
      <img src="${escapeHtml(imagem.src)}" alt="${escapeHtml(imagem.nome || "Imagem vinculada")}">
      <figcaption>${escapeHtml(imagem.motivo)}</figcaption>
    </figure>`;
}

function obterImagensCompativeisSimulador() {
  const ultimaEscolha = Object.keys(simuladorEscolhas).at(-1);
  const escolhas = {
    "material-principal": estadoAtual.materialBase,
    ...simuladorEscolhas
  };

  return (estadoAtual.imagensAnexadas || [])
    .filter(imagem => imagem.src)
    .map(imagem => {
      const bloqueada = (imagem.bloqueios || []).some(bloqueio => {
        const valorEscolhido = escolhas[bloqueio.atributo];
        return valorEscolhido && (bloqueio.valores || []).includes(valorEscolhido);
      });
      if (bloqueada) return null;

      const vinculosCompativeis = (imagem.vinculos || []).filter(vinculo => {
        const valorEscolhido = escolhas[vinculo.atributo];
        return valorEscolhido && (vinculo.valores || []).includes(valorEscolhido);
      });

      if (!vinculosCompativeis.length) return null;

      return {
        ...imagem,
        daUltimaEscolha: vinculosCompativeis.some(vinculo => vinculo.atributo === ultimaEscolha),
        motivo: vinculosCompativeis
          .map(vinculo => `${nomesNodes[vinculo.atributo] || vinculo.atributo}: ${escolhas[vinculo.atributo]}`)
          .join(" | ")
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.daUltimaEscolha) - Number(a.daUltimaEscolha));
}

function obterProximoPassoSimulador() {
  const origemPreferencial = Object.keys(simuladorEscolhas).at(-1) || "material-principal";
  const selecionados = {
    "material-principal": estadoAtual.materialBase,
    ...simuladorEscolhas
  };
  const relacoes = Object.keys(estadoAtual.relacoes || {});

  const candidatos = [
    ...relacoes.filter(chave => chave.split("::")[0] === origemPreferencial),
    ...relacoes.filter(chave => {
      const [origem] = chave.split("::");
      return selecionados[origem] && origem !== origemPreferencial;
    })
  ];

  for (const chave of [...new Set(candidatos)]) {
    const [origem, destino] = chave.split("::");
    if (simuladorEscolhas[destino]) continue;

    const opcoes = calcularOpcoesSimulador(origem, destino, estadoAtual.relacoes[chave] || [], selecionados);
    if (opcoes.length) return { origem, destino, opcoes };
  }

  return null;
}

function calcularOpcoesSimulador(origem, destino, opcoesBase, selecionados) {
  const bloqueadas = new Map();

  (estadoAtual.bloqueios || []).forEach(bloqueio => {
    if (bloqueio.destino !== destino) return;
    if (selecionados[bloqueio.origem] !== bloqueio.valorPai) return;

    (bloqueio.valoresFilho || []).forEach(valor => {
      bloqueadas.set(valor, `Bloqueado por ${nomesNodes[bloqueio.origem]}: ${bloqueio.valorPai}`);
    });
  });

  const especifica = (estadoAtual.atribuicoesEspecificas || []).find(regra => {
    return regra.destino === destino
      && selecionados[regra.origem]
      && !(regra.valoresPai || []).includes(selecionados[regra.origem]);
  });

  if (especifica) {
    return opcoesBase.map(valor => ({
      valor,
      bloqueada: true,
      motivo: `Oculto por ${nomesNodes[especifica.origem]}: ${selecionados[especifica.origem]}`
    }));
  }

  const unico = (estadoAtual.atributosUnicos || []).find(regra => {
    return regra.destino === destino
      && selecionados[regra.origem] === regra.valorPai
      && regra.valorFilho;
  });
  const opcoes = unico ? [unico.valorFilho] : opcoesBase;

  return [...new Set(opcoes)].map(valor => ({
    valor,
    bloqueada: bloqueadas.has(valor),
    motivo: bloqueadas.get(valor) || (unico ? `Atributo único de ${unico.valorPai}` : "")
  }));
}

function configurarCorteLinhas(stage) {
  stage.onpointerdown = event => {
    if (event.button !== 0) return;
    if (event.target.closest(".proto-attr-drawer, .proto-add-attr")) return;
    if (event.target !== stage) return;
    if (!Object.keys(estadoAtual?.relacoes || {}).length) return;

    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    const inicio = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    corteAtual?.remove();
    corteAtual = document.createElement("div");
    corteAtual.className = "proto-cut-line";
    stage.appendChild(corteAtual);
    atualizarLinhaCorte(inicio, inicio);

    const mover = moveEvent => {
      const fim = {
        x: moveEvent.clientX - rect.left,
        y: moveEvent.clientY - rect.top
      };
      atualizarLinhaCorte(inicio, fim);
      destacarLinhasCortadas(stage, inicio, fim);
    };

    const soltar = upEvent => {
      document.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerup", soltar);

      const fim = {
        x: upEvent.clientX - rect.left,
        y: upEvent.clientY - rect.top
      };
      cortarLinhasCruzadas(stage, inicio, fim);
      corteAtual?.remove();
      corteAtual = null;
    };

    document.addEventListener("pointermove", mover);
    document.addEventListener("pointerup", soltar, { once: true });
  };
}

function configurarMenuBloqueio(stage) {
  let menu = document.getElementById("protoContextMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "protoContextMenu";
    menu.className = "proto-context-menu";
    document.body.appendChild(menu);
  }

  stage.oncontextmenu = event => {
    const node = event.target.closest(".proto-node");
    if (!node || !stage.contains(node) || !opcoesAtributos[node.dataset.node]) return;

    event.preventDefault();
    fecharMenuBloqueio();

    const podeRemover = node.dataset.extra === "1";
    menu.innerHTML = `
      <button type="button" data-action="bloquear">
        <i class="fa-solid fa-ban"></i>
        Bloquear opção de atributo
      </button>
      <button type="button" data-action="atribuicao-especifica">
        <i class="fa-solid fa-filter proto-menu-icon-specific"></i>
        Atribuição específica
      </button>
      <button type="button" data-action="atributo-unico">
        <i class="fa-solid fa-link proto-menu-icon-unique"></i>
        Atributo único
      </button>
      <div class="proto-context-subgroup" data-submenu-group="imagem">
        <button type="button" data-submenu-toggle="imagem">
          <span><i class="fa-solid fa-image proto-menu-icon-image"></i> Imagem</span>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        <div class="proto-context-submenu" data-submenu-panel="imagem">
          <button type="button" data-action="anexar-imagem">
            <i class="fa-solid fa-paperclip proto-menu-icon-image"></i>
            Anexar
          </button>
          <button type="button" data-action="bloquear-imagem">
            <i class="fa-solid fa-ban"></i>
            Bloquear
          </button>
        </div>
      </div>
      ${podeRemover ? `
        <button type="button" data-action="remover">
          <i class="fa-solid fa-trash"></i>
          Remover atributo
        </button>
      ` : ""}
    `;
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.classList.add("show");

    menu.querySelector("[data-action='bloquear']").onclick = () => {
      fecharMenuBloqueio();
      selecionarOpcaoPaiBloqueio(stage, node.dataset.node);
    };

    menu.querySelector("[data-action='atribuicao-especifica']").onclick = () => {
      fecharMenuBloqueio();
      iniciarLinhaAtribuicao(stage, node.dataset.node);
    };

    menu.querySelector("[data-action='atributo-unico']").onclick = () => {
      fecharMenuBloqueio();
      iniciarLinhaAtributoUnico(stage, node.dataset.node);
    };

    menu.querySelector("[data-submenu-toggle='imagem']").onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      menu.querySelector("[data-submenu-group='imagem']")?.classList.toggle("open");
    };

    menu.querySelector("[data-action='anexar-imagem']").onclick = () => {
      fecharMenuBloqueio();
      abrirModalAnexarImagem(node.dataset.node);
    };

    menu.querySelector("[data-action='bloquear-imagem']").onclick = () => {
      fecharMenuBloqueio();
      abrirModalBloquearImagemAtributo(stage, node.dataset.node);
    };

    menu.querySelector("[data-action='remover']")?.addEventListener("click", () => {
      fecharMenuBloqueio();
      removerAtributoExtra(stage, node.dataset.node);
    });
  };

  document.addEventListener("click", fecharMenuBloqueio);
}

async function removerAtributoExtra(stage, idAtributo) {
  const attr = estadoAtual.atributosExtras.find(item => item.id === idAtributo);
  if (!attr) return;

  const confirmar = window.Swal
    ? await window.Swal.fire({
      icon: "warning",
      theme: "dark",
      title: "Remover atributo?",
      text: `As conexões e bloqueios ligados a ${attr.nome} também serão removidos.`,
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar"
    })
    : { isConfirmed: window.confirm(`Remover atributo ${attr.nome}?`) };

  if (!confirmar?.isConfirmed) return;

  removerReferenciasAtributo(stage, idAtributo);
  atualizarMapasAtributos(stage);
  salvarEstado();
  redesenharLinhas();
  renderizarListaAdicionarAtributos(stage);
}

function removerReferenciasAtributo(stage, idAtributo) {
  estadoAtual.atributosExtras = (estadoAtual.atributosExtras || []).filter(item => item.id !== idAtributo);
  delete estadoAtual.posicoes[idAtributo];

  Object.keys(estadoAtual.relacoes || {}).forEach(chave => {
    const [origem, destino] = chave.split("::");
    if (origem === idAtributo || destino === idAtributo) {
      delete estadoAtual.relacoes[chave];
    }
  });

  estadoAtual.bloqueios = (estadoAtual.bloqueios || []).filter(bloqueio => {
    return bloqueio.origem !== idAtributo && bloqueio.destino !== idAtributo;
  });

  estadoAtual.atribuicoesEspecificas = (estadoAtual.atribuicoesEspecificas || []).filter(regra => {
    return regra.origem !== idAtributo && regra.destino !== idAtributo;
  });

  estadoAtual.atributosUnicos = (estadoAtual.atributosUnicos || []).filter(regra => {
    return regra.origem !== idAtributo && regra.destino !== idAtributo;
  });

  estadoAtual.imagensAnexadas = (estadoAtual.imagensAnexadas || [])
    .map(imagem => ({
      ...imagem,
      vinculos: (imagem.vinculos || []).filter(vinculo => vinculo.atributo !== idAtributo),
      bloqueios: (imagem.bloqueios || []).filter(bloqueio => bloqueio.atributo !== idAtributo)
    }))
    .filter(imagem => (imagem.vinculos || []).length || (imagem.bloqueios || []).length);

  if (relacaoSelecionada?.split("::").includes(idAtributo)) {
    relacaoSelecionada = null;
    limparPainelRelacao();
  }

  stage.querySelector(`.proto-node[data-node="${cssEscape(idAtributo)}"]`)?.remove();
}

function configurarAdicionarAtributo(stage) {
  const botao = document.getElementById("protoAddAtributo");
  const drawer = document.getElementById("protoAttrDrawer");
  const busca = document.getElementById("protoBuscaAtributo");
  const lista = document.getElementById("protoListaAtributos");

  if (!botao || !drawer || !busca || !lista) return;

  renderizarListaAdicionarAtributos(stage);

  botao.onclick = event => {
    event.preventDefault();
    event.stopPropagation();
    fecharDrawerSimulador();
    const aberto = drawer.classList.toggle("open");
    drawer.setAttribute("aria-hidden", String(!aberto));
    drawer.inert = !aberto;
    botao.classList.toggle("open", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
    atualizarVisibilidadeLinhasPorPainel();
    if (aberto) {
      renderizarListaAdicionarAtributos(stage);
      busca.focus({ preventScroll: true });
    }
    reposicionarLinhasAtivas();
    setTimeout(reposicionarLinhasAtivas, 260);
  };

  botao.onpointerdown = event => event.stopPropagation();
  drawer.onpointerdown = event => event.stopPropagation();
  drawer.onclick = event => event.stopPropagation();

  busca.oninput = () => renderizarListaAdicionarAtributos(stage);
  lista.onclick = event => {
    const item = event.target.closest("[data-attr-add]");
    if (!item) return;

    event.preventDefault();
    event.stopPropagation();
    adicionarNodeAtributo(stage, item.dataset.attrAdd);
    renderizarListaAdicionarAtributos(stage);
  };
}

function fecharDrawerSimulador() {
  const janela = document.getElementById("protoSimuladorDrawer");
  if (janela?.open) janela.close();
}

function renderizarListaAdicionarAtributos(stage) {
  const lista = document.getElementById("protoListaAtributos");
  const busca = document.getElementById("protoBuscaAtributo");
  if (!lista) return;

  const termo = normalizarBusca(busca?.value || "");
  const atributos = listarAtributosCadastro()
    .filter(nome => !stage.querySelector(`.proto-node[data-node="${normalizarIdAtributo(nome)}"]`))
    .filter(nome => normalizarBusca(nome).includes(termo));

  lista.innerHTML = atributos.length
    ? atributos.map(nome => `
      <button type="button" data-attr-add="${escapeHtml(nome)}">
        <span>${escapeHtml(nome)}</span>
        <i class="fa-solid fa-plus"></i>
      </button>
    `).join("")
    : `<div class="proto-attr-empty">Nenhum atributo disponível.</div>`;
}

function normalizarBusca(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function listarAtributosCadastro() {
  const valores = new Set();

  Object.values(ATRIBUTOS_POR_MATERIAL || {}).forEach(lista => {
    (lista || []).forEach(attr => {
      const nome = String(attr || "").trim();
      if (nome) valores.add(nome);
    });
  });

  return [...valores].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function adicionarNodeAtributo(stage, nome, opcoes = {}) {
  const deveSalvar = opcoes.salvar !== false;
  const id = normalizarIdAtributo(nome);
  if (!id) return;

  const existente = stage.querySelector(`.proto-node[data-node="${id}"]`);
  if (existente) {
    garantirAtributoNoEstado(existente, id, nome);
    if (deveSalvar) salvarEstado();
    renderizarListaAdicionarAtributos(stage);
    return;
  }

  const pos = obterProximaPosicaoAtributo(stage);
  const node = criarNodeAtributo(id, nome, pos.left, pos.top);
  node.dataset.extra = "1";
  stage.querySelector(".proto-world").appendChild(node);

  estadoAtual.atributosExtras.push({
    id,
    nome,
    descricao: "Atributo do cadastro de materiais",
    left: pos.left,
    top: pos.top
  });
  estadoAtual.posicoes[id] = pos;

  atualizarMapasAtributos(stage);
  configurarArrasteNodes(stage);
  configurarCriacaoLinhas(stage);
  configurarCliqueContadores(stage);
  configurarMenuBloqueio(stage);
  if (deveSalvar) salvarEstado();
  aplicarCameraStage(stage);
  renderizarListaAdicionarAtributos(stage);
}

function garantirAtributoNoEstado(node, id, nome) {
  const existente = estadoAtual.atributosExtras.find(attr => attr.id === id);
  const left = parseFloat(node.style.left) || estadoAtual.posicoes?.[id]?.left || 0;
  const top = parseFloat(node.style.top) || estadoAtual.posicoes?.[id]?.top || 0;
  const dados = {
    id,
    nome,
    descricao: "Atributo do cadastro de materiais",
    left,
    top
  };

  if (existente) {
    Object.assign(existente, dados);
  } else {
    estadoAtual.atributosExtras.push(dados);
  }

  estadoAtual.posicoes[id] = { left, top };
}

function configurarMaterialPrincipal(stage) {
  document.getElementById("protoNovoMaterialPrincipal")?.addEventListener("click", event => {
    event.preventDefault();
    abrirJanelaMaterialPrincipal(stage);
  });
}

function abrirJanelaMaterialPrincipal(stage) {
  let modal = document.getElementById("protoMaterialPrincipalModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "protoMaterialPrincipalModal";
    modal.className = "proto-material-modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="proto-material-modal-card">
      <div class="proto-material-modal-head">
        <div>
          <span>Novo Material Principal</span>
          <strong>Definir base do protótipo</strong>
        </div>
        <button type="button" data-proto-material-close title="Fechar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <label class="proto-material-field">
        <small>Nome do material</small>
        <input id="protoMaterialPrincipalInput" type="text" value="${escapeHtml(estadoAtual.materialBase || "")}" placeholder="Ex: Eletrocalha" autocomplete="off">
      </label>
      <div id="protoMaterialSugestoes" class="proto-material-suggestions"></div>
      <div id="protoMaterialPreview" class="proto-material-preview"></div>
      <div class="proto-material-actions">
        <button type="button" class="bt_padrao bt_cancelar" data-proto-material-close>Cancelar</button>
        <button type="button" class="bt_padrao bt_confirmar" id="protoSalvarMaterialPrincipal">
          <i class="fa-solid fa-floppy-disk"></i>
          Salvar
        </button>
      </div>
    </div>
  `;

  modal.classList.add("open");

  const input = modal.querySelector("#protoMaterialPrincipalInput");
  const fechar = () => modal.classList.remove("open");
  const renderizarPreview = () => renderizarPreviewMaterialPrincipal(input.value);

  modal.querySelectorAll("[data-proto-material-close]").forEach(botao => {
    botao.addEventListener("click", fechar);
  });

  modal.onclick = event => {
    if (event.target === modal) fechar();
  };

  input.addEventListener("input", renderizarPreview);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      aplicarMaterialPrincipal(stage, input.value);
      fechar();
    }
  });

  modal.querySelector("#protoMaterialSugestoes").addEventListener("click", event => {
    const botao = event.target.closest("[data-material-sugestao]");
    if (!botao) return;
    input.value = botao.dataset.materialSugestao;
    renderizarPreview();
    input.focus();
  });

  modal.querySelector("#protoSalvarMaterialPrincipal").addEventListener("click", () => {
    aplicarMaterialPrincipal(stage, input.value);
    fechar();
  });

  renderizarPreview();
  input.focus();
  input.select();
}

function renderizarPreviewMaterialPrincipal(valor) {
  const sugestoesEl = document.getElementById("protoMaterialSugestoes");
  const previewEl = document.getElementById("protoMaterialPreview");
  if (!sugestoesEl || !previewEl) return;

  const termo = normalizarBusca(valor);
  const sugestoes = listarMateriaisPrincipais()
    .filter(nome => !termo || normalizarBusca(nome).includes(termo))
    .slice(0, 8);
  const cadastro = encontrarMaterialRegistrado(valor);
  const atributos = cadastro ? obterAtributosMaterial(valor) : [];

  sugestoesEl.innerHTML = sugestoes.length
    ? sugestoes.map(nome => `
      <button type="button" data-material-sugestao="${escapeHtml(nome)}">
        <i class="fa-solid fa-cube"></i>
        <span>${escapeHtml(nome)}</span>
      </button>
    `).join("")
    : `<span class="proto-material-empty">Nenhum material parecido encontrado.</span>`;

  previewEl.innerHTML = cadastro
    ? `
      <div class="proto-material-preview-head">
        <strong>${escapeHtml(cadastro)}</strong>
        <span>${atributos.length} atributo(s) cadastrados</span>
      </div>
      <div class="proto-material-attrs">
        ${atributos.map(attr => `<span>${escapeHtml(attr)}</span>`).join("")}
      </div>
    `
    : `
      <div class="proto-material-preview-head">
        <strong>Material personalizado</strong>
        <span>Sem cadastro de atributos encontrado</span>
      </div>
      <p>Ao salvar, ele será usado como base do protótipo. Os atributos podem ser adicionados pelo botão de atributos.</p>
    `;
}

function aplicarMaterialPrincipal(stage, valor) {
  const nome = String(valor || "").trim();
  if (!nome) return;

  estadoAtual.materialBase = nome;

  if (!estadoAtual.materiaisPrincipais.some(item => normalizarBusca(item) === normalizarBusca(nome))) {
    estadoAtual.materiaisPrincipais.push(nome);
  }

  sincronizarAtributosDoMaterial(stage, obterAtributosMaterial(nome), { salvar: false });
  atualizarNodeMaterialPrincipal(stage);
  atualizarMapasAtributos(stage);
  salvarEstado();
  redesenharLinhas();
  atualizarResumo();
}

function sincronizarAtributosDoMaterial(stage, atributos, opcoes = {}) {
  if (!Array.isArray(atributos) || !atributos.length) return;

  const idsPermitidos = new Set(atributos.map(attr => normalizarIdAtributo(attr)).filter(Boolean));

  stage.querySelectorAll(".proto-node[data-node]").forEach(node => {
    const id = node.dataset.node;
    if (id === "material-principal" || idsPermitidos.has(id)) return;
    removerReferenciasAtributo(stage, id);
  });

  atributos.forEach(attr => adicionarNodeAtributo(stage, attr, { salvar: false }));
  atualizarMapasAtributos(stage);

  if (opcoes.salvar !== false) {
    salvarEstado();
    redesenharLinhas();
    renderizarListaAdicionarAtributos(stage);
  }
}

function listarMateriaisPrincipais() {
  const nomes = new Set([
    ...Object.keys(ATRIBUTOS_POR_MATERIAL || {}),
    ...(estadoAtual.materiaisPrincipais || []),
    estadoAtual.materialBase
  ].filter(Boolean));

  return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function obterAtributosMaterial(nome) {
  const chave = encontrarMaterialRegistrado(nome);
  return chave ? [...new Set(ATRIBUTOS_POR_MATERIAL[chave] || [])] : [];
}

function encontrarMaterialRegistrado(nome) {
  const normalizado = normalizarIdAtributo(nome);
  if (!normalizado) return null;

  const entradas = Object.keys(ATRIBUTOS_POR_MATERIAL || {})
    .map(chave => ({ chave, id: normalizarIdAtributo(chave) }))
    .sort((a, b) => b.id.length - a.id.length);

  return entradas.find(item => item.id === normalizado)?.chave
    || entradas.find(item => normalizado.includes(item.id))?.chave
    || null;
}

function criarNodeAtributo(id, nome, left, top) {
  const node = document.createElement("article");
  node.className = "proto-node";
  node.dataset.node = id;
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
  node.innerHTML = `
    <button type="button" class="proto-node-handle" title="Arrastar linha"></button>
    <strong>${escapeHtml(nome)}</strong>
    <button type="button" class="proto-node-count" data-count-for="${escapeHtml(id)}">0 selecionados</button>
  `;
  return node;
}

function obterProximaPosicaoAtributo(stage) {
  const existentes = stage.querySelectorAll(".proto-node").length;
  const coluna = existentes % 3;
  const linha = Math.floor(existentes / 3);
  const left = 360 + coluna * 280;
  const top = 70 + linha * 150;
  const maxLeft = Math.max(12, stage.clientWidth - 240);
  const maxTop = Math.max(12, stage.clientHeight - 140);

  return {
    left: limitar(left, 12, maxLeft),
    top: limitar(top, 12, maxTop)
  };
}

function normalizarIdAtributo(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function fecharMenuBloqueio() {
  document.getElementById("protoContextMenu")?.classList.remove("show");
}

async function selecionarOpcaoPaiBloqueio(stage, origemId) {
  const opcoes = opcoesAtributos[origemId] || [];
  if (!opcoes.length) return;

  const inputOptions = opcoes.reduce((acc, opcao) => {
    acc[opcao] = opcao;
    return acc;
  }, {});

  const resultado = window.Swal
    ? await window.Swal.fire({
      icon: "info",
      theme: "dark",
      title: `Bloquear por ${nomesNodes[origemId]}`,
      text: "Escolha qual opção do atributo pai será responsável pelo bloqueio.",
      input: "select",
      inputOptions,
      inputPlaceholder: "Selecione a opção pai",
      showCancelButton: true,
      confirmButtonText: "Iniciar linha",
      cancelButtonText: "Cancelar",
      inputValidator: valor => !valor ? "Escolha uma opção para continuar." : null
    })
    : { isConfirmed: true, value: window.prompt(`Opção de ${nomesNodes[origemId]}:`) };

  if (!resultado?.isConfirmed || !resultado.value) return;
  iniciarLinhaBloqueio(stage, origemId, resultado.value);
}

function iniciarLinhaBloqueio(stage, origemId, valorPai) {
  const origem = stage.querySelector(`.proto-node[data-node="${origemId}"]`);
  if (!origem) return;

  bloqueioEmCriacao = { origemId, valorPai };
  pontoTemporario = document.createElement("div");
  pontoTemporario.style.cssText = "position:fixed;width:1px;height:1px;left:0;top:0;pointer-events:none;";
  document.body.appendChild(pontoTemporario);

  const origemRect = origem.getBoundingClientRect();
  pontoTemporario.style.left = `${origemRect.left + origemRect.width / 2}px`;
  pontoTemporario.style.top = `${origemRect.top + origemRect.height / 2}px`;

  if (window.LeaderLine) {
    linhaTemporaria = new LeaderLine(origem, pontoTemporario, {
      path: "fluid",
      color: "rgba(255, 88, 88, 0.78)",
      size: 2,
      startPlug: "disc",
      endPlug: "arrow3",
      startPlugSize: 1.45,
      endPlugSize: 1.45,
      dash: { len: 7, gap: 6, animation: true }
    });
  }

  stage.classList.add("is-blocking-line");

  const mover = event => {
    moverPontoTemporario(event);
    linhaTemporaria?.position?.();
    stage.querySelectorAll(".proto-node").forEach(node => {
      const permitido = bloqueioPermitido(origemId, node.dataset.node);
      const emCima = permitido && pontoDentroDoElemento(event.clientX, event.clientY, node);
      node.classList.toggle("is-target", emCima);
    });
  };

  const finalizar = event => {
    const destino = event.target.closest(".proto-node");
    if (!destino || !stage.contains(destino) || !bloqueioPermitido(origemId, destino.dataset.node)) {
      cancelarLinhaBloqueio(stage, mover, finalizar, cancelarEsc);
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const bloqueio = {
      id: `bloq_${Date.now()}`,
      origem: origemId,
      destino: destino.dataset.node,
      valorPai,
      valoresFilho: []
    };

    estadoAtual.bloqueios.push(bloqueio);
    cancelarLinhaBloqueio(stage, mover, finalizar, cancelarEsc);
    salvarEstado();
    redesenharLinhas();
    abrirEditorBloqueio(bloqueio.id, true);
  };

  const cancelarEsc = event => {
    if (event.key === "Escape") cancelarLinhaBloqueio(stage, mover, finalizar, cancelarEsc);
  };

  setTimeout(() => {
    document.addEventListener("mousemove", mover);
    document.addEventListener("click", finalizar, true);
    document.addEventListener("keydown", cancelarEsc);
  }, 80);
}

function cancelarLinhaBloqueio(stage, mover, finalizar, cancelarEsc) {
  document.removeEventListener("mousemove", mover);
  document.removeEventListener("click", finalizar, true);
  document.removeEventListener("keydown", cancelarEsc);
  stage.classList.remove("is-blocking-line");
  stage.querySelectorAll(".proto-node").forEach(node => node.classList.remove("is-target"));
  linhaTemporaria?.remove?.();
  linhaTemporaria = null;
  pontoTemporario?.remove?.();
  pontoTemporario = null;
  bloqueioEmCriacao = null;
}

function bloqueioPermitido(origem, destino) {
  return origem !== destino && Boolean(opcoesAtributos[origem]) && Boolean(opcoesAtributos[destino]) && relacaoPermitida(origem, destino);
}

function iniciarLinhaAtribuicao(stage, origemId) {
  const origem = stage.querySelector(`.proto-node[data-node="${origemId}"]`);
  if (!origem) return;

  pontoTemporario = document.createElement("div");
  pontoTemporario.style.cssText = "position:fixed;width:1px;height:1px;left:0;top:0;pointer-events:none;";
  document.body.appendChild(pontoTemporario);

  const origemRect = origem.getBoundingClientRect();
  pontoTemporario.style.left = `${origemRect.left + origemRect.width / 2}px`;
  pontoTemporario.style.top = `${origemRect.top + origemRect.height / 2}px`;

  if (window.LeaderLine) {
    linhaTemporaria = new LeaderLine(origem, pontoTemporario, {
      path: "fluid",
      color: "rgba(102, 205, 255, 0.86)",
      size: 2,
      startPlug: "disc",
      endPlug: "arrow3",
      startPlugSize: 1.45,
      endPlugSize: 1.45,
      dash: { len: 6, gap: 5, animation: true }
    });
  }

  stage.classList.add("is-specific-line");

  const mover = event => {
    moverPontoTemporario(event);
    linhaTemporaria?.position?.();
    stage.querySelectorAll(".proto-node").forEach(node => {
      const permitido = bloqueioPermitido(origemId, node.dataset.node);
      const emCima = permitido && pontoDentroDoElemento(event.clientX, event.clientY, node);
      node.classList.toggle("is-target", emCima);
    });
  };

  const finalizar = event => {
    const destino = event.target.closest(".proto-node");
    if (!destino || !stage.contains(destino) || !bloqueioPermitido(origemId, destino.dataset.node)) {
      cancelarLinhaAtribuicao(stage, mover, finalizar, cancelarEsc);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const regra = {
      id: `esp_${Date.now()}`,
      origem: origemId,
      destino: destino.dataset.node,
      valoresPai: []
    };
    estadoAtual.atribuicoesEspecificas.push(regra);

    cancelarLinhaAtribuicao(stage, mover, finalizar, cancelarEsc);
    salvarEstado();
    redesenharLinhas();
    abrirEditorAtribuicao(regra.id, true);
  };

  const cancelarEsc = event => {
    if (event.key === "Escape") cancelarLinhaAtribuicao(stage, mover, finalizar, cancelarEsc);
  };

  setTimeout(() => {
    document.addEventListener("mousemove", mover);
    document.addEventListener("click", finalizar, true);
    document.addEventListener("keydown", cancelarEsc);
  }, 80);
}

function cancelarLinhaAtribuicao(stage, mover, finalizar, cancelarEsc) {
  document.removeEventListener("mousemove", mover);
  document.removeEventListener("click", finalizar, true);
  document.removeEventListener("keydown", cancelarEsc);
  stage.classList.remove("is-specific-line");
  stage.querySelectorAll(".proto-node").forEach(node => node.classList.remove("is-target"));
  linhaTemporaria?.remove?.();
  linhaTemporaria = null;
  pontoTemporario?.remove?.();
  pontoTemporario = null;
}

function iniciarLinhaAtributoUnico(stage, origemId) {
  const origem = stage.querySelector(`.proto-node[data-node="${origemId}"]`);
  if (!origem) return;

  pontoTemporario = document.createElement("div");
  pontoTemporario.style.cssText = "position:fixed;width:1px;height:1px;left:0;top:0;pointer-events:none;";
  document.body.appendChild(pontoTemporario);

  const origemRect = origem.getBoundingClientRect();
  pontoTemporario.style.left = `${origemRect.left + origemRect.width / 2}px`;
  pontoTemporario.style.top = `${origemRect.top + origemRect.height / 2}px`;

  if (window.LeaderLine) {
    linhaTemporaria = new LeaderLine(origem, pontoTemporario, {
      path: "fluid",
      color: "rgba(190, 120, 255, 0.9)",
      size: 2,
      startPlug: "disc",
      endPlug: "arrow3",
      startPlugSize: 1.45,
      endPlugSize: 1.45,
      dash: { len: 6, gap: 5, animation: true }
    });
  }

  stage.classList.add("is-unique-line");

  const mover = event => {
    moverPontoTemporario(event);
    linhaTemporaria?.position?.();
    stage.querySelectorAll(".proto-node").forEach(node => {
      const permitido = bloqueioPermitido(origemId, node.dataset.node);
      const emCima = permitido && pontoDentroDoElemento(event.clientX, event.clientY, node);
      node.classList.toggle("is-target", emCima);
    });
  };

  const finalizar = event => {
    const destino = event.target.closest(".proto-node");
    if (!destino || !stage.contains(destino) || !bloqueioPermitido(origemId, destino.dataset.node)) {
      cancelarLinhaAtributoUnico(stage, mover, finalizar, cancelarEsc);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const regra = {
      id: `uni_${Date.now()}`,
      origem: origemId,
      destino: destino.dataset.node,
      valorPai: "",
      valorFilho: ""
    };

    estadoAtual.atributosUnicos.push(regra);
    cancelarLinhaAtributoUnico(stage, mover, finalizar, cancelarEsc);
    salvarEstado();
    redesenharLinhas();
    abrirEditorAtributoUnico(criarChave(regra.origem, regra.destino));
  };

  const cancelarEsc = event => {
    if (event.key === "Escape") cancelarLinhaAtributoUnico(stage, mover, finalizar, cancelarEsc);
  };

  setTimeout(() => {
    document.addEventListener("mousemove", mover);
    document.addEventListener("click", finalizar, true);
    document.addEventListener("keydown", cancelarEsc);
  }, 80);
}

function cancelarLinhaAtributoUnico(stage, mover, finalizar, cancelarEsc) {
  document.removeEventListener("mousemove", mover);
  document.removeEventListener("click", finalizar, true);
  document.removeEventListener("keydown", cancelarEsc);
  stage.classList.remove("is-unique-line");
  stage.querySelectorAll(".proto-node").forEach(node => node.classList.remove("is-target"));
  linhaTemporaria?.remove?.();
  linhaTemporaria = null;
  pontoTemporario?.remove?.();
  pontoTemporario = null;
}

function atualizarLinhaCorte(inicio, fim) {
  if (!corteAtual) return;

  const dx = fim.x - inicio.x;
  const dy = fim.y - inicio.y;
  const tamanho = Math.hypot(dx, dy);
  const angulo = Math.atan2(dy, dx) * 180 / Math.PI;

  corteAtual.style.width = `${tamanho}px`;
  corteAtual.style.left = `${inicio.x}px`;
  corteAtual.style.top = `${inicio.y}px`;
  corteAtual.style.transform = `rotate(${angulo}deg)`;
}

function destacarLinhasCortadas(stage, inicio, fim) {
  const chaves = obterLinhasCruzadas(stage, inicio, fim);

  linhasAtivas.forEach(item => {
    item.line?.setOptions?.({
      color: chaves.includes(item.chave) ? "#ff4d4d" : (item.chave === relacaoSelecionada ? "#efda38" : "#ee7722"),
      size: chaves.includes(item.chave) ? 4 : (item.chave === relacaoSelecionada ? 3 : 2)
    });
  });
}

function cortarLinhasCruzadas(stage, inicio, fim) {
  const chaves = obterLinhasCruzadas(stage, inicio, fim);
  if (!chaves.length) {
    redesenharLinhas();
    return;
  }

  chaves.forEach(chave => {
    delete estadoAtual.relacoes[chave];
  });

  if (chaves.includes(relacaoSelecionada)) {
    relacaoSelecionada = null;
    limparPainelRelacao();
  }

  salvarEstado();
  redesenharLinhas();
}

function obterLinhasCruzadas(stage, inicio, fim) {
  return Object.keys(estadoAtual.relacoes || {}).filter(chave => {
    const [origemId, destinoId] = chave.split("::");
    const origem = stage.querySelector(`.proto-node[data-node="${origemId}"]`);
    const destino = stage.querySelector(`.proto-node[data-node="${destinoId}"]`);
    if (!origem || !destino) return false;

    const a = centroRelativo(stage, origem);
    const b = centroRelativo(stage, destino);
    return segmentosCruzam(inicio, fim, a, b);
  });
}

function centroRelativo(stage, elemento) {
  const stageRect = stage.getBoundingClientRect();
  const rect = elemento.getBoundingClientRect();
  return {
    x: rect.left - stageRect.left + rect.width / 2,
    y: rect.top - stageRect.top + rect.height / 2
  };
}

function segmentosCruzam(a, b, c, d) {
  const o1 = orientacao(a, b, c);
  const o2 = orientacao(a, b, d);
  const o3 = orientacao(c, d, a);
  const o4 = orientacao(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;
  return false;
}

function orientacao(a, b, c) {
  const valor = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(valor) < 0.0001) return 0;
  return valor > 0 ? 1 : 2;
}

function carregarEstado() {
  const padrao = criarEstadoVazio();

  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const estado = {
      ...padrao,
      ...salvo,
      relacoes: salvo.relacoes || {},
      bloqueios: Array.isArray(salvo.bloqueios) ? salvo.bloqueios : [],
      atribuicoesEspecificas: Array.isArray(salvo.atribuicoesEspecificas) ? salvo.atribuicoesEspecificas : [],
      atributosUnicos: Array.isArray(salvo.atributosUnicos) ? salvo.atributosUnicos : [],
      imagensAnexadas: Array.isArray(salvo.imagensAnexadas) ? salvo.imagensAnexadas : [],
      materiaisPrincipais: Array.isArray(salvo.materiaisPrincipais) ? salvo.materiaisPrincipais : [],
      opcoesPersonalizadas: salvo.opcoesPersonalizadas && typeof salvo.opcoesPersonalizadas === "object" ? salvo.opcoesPersonalizadas : {},
      opcoesRemovidas: salvo.opcoesRemovidas && typeof salvo.opcoesRemovidas === "object" ? salvo.opcoesRemovidas : {},
      posicoes: salvo.posicoes || {}
    };
    estado.atribuicoesEspecificas = estado.atribuicoesEspecificas.map(regra => ({
      ...regra,
      valoresPai: Array.isArray(regra.valoresPai)
        ? regra.valoresPai
        : (regra.valorPai ? [regra.valorPai] : [])
    }));
    return estado;
  } catch {
    return padrao;
  }
}

function salvarEstado() {
  const novoSnapshot = criarSnapshotEstado();
  if (!restaurandoHistorico && ultimoSnapshotHistorico && novoSnapshot !== ultimoSnapshotHistorico) {
    historicoEstados.push(ultimoSnapshotHistorico);
    if (historicoEstados.length > 40) historicoEstados.shift();
    futuroEstados = [];
  }

  ultimoSnapshotHistorico = novoSnapshot;
  localStorage.setItem(STORAGE_KEY, novoSnapshot);
  atualizarResumo();
  atualizarSimulador();
  atualizarBotoesHistorico();
}

function criarSnapshotEstado() {
  return JSON.stringify(estadoAtual || {});
}

function restaurarSnapshotEstado(snapshot) {
  const stage = document.getElementById("protoStage");
  if (!stage || !snapshot) return;

  const novoEstado = JSON.parse(snapshot);
  localStorage.setItem(STORAGE_KEY, snapshot);
  restaurandoHistorico = true;
  estadoAtual = novoEstado;
  normalizarAtributosEstado();
  relacaoSelecionada = null;
  simuladorEscolhas = {};
  ultimoSnapshotHistorico = snapshot;

  removerLinhas();
  renderizarAtributosDinamicos(stage);
  removerAtributosNaoSalvos(stage);
  atualizarNodeMaterialPrincipal(stage);
  aplicarPosicoesSalvas(stage);
  atualizarMapasAtributos(stage);
  aplicarCameraStage(stage);
  configurarArrasteNodes(stage);
  configurarCriacaoLinhas(stage);
  configurarCliqueContadores(stage);
  configurarMenuBloqueio(stage);
  renderizarListaAdicionarAtributos(stage);
  limparPainelRelacao();
  redesenharLinhas();
  atualizarResumo();
  atualizarSimulador();
  atualizarBotoesHistorico();
  restaurandoHistorico = false;
}

function aplicarPosicoesSalvas(stage) {
  stage.querySelectorAll(".proto-node").forEach(node => {
    node.dataset.posicaoInicialLeft ??= node.style.left;
    node.dataset.posicaoInicialTop ??= node.style.top;
    const pos = estadoAtual.posicoes?.[node.dataset.node];
    node.style.left = pos ? `${pos.left}px` : node.dataset.posicaoInicialLeft;
    node.style.top = pos ? `${pos.top}px` : node.dataset.posicaoInicialTop;
  });
}

function configurarArrasteNodes(stage) {
  stage.querySelectorAll(".proto-node").forEach(node => {
    node.onpointerdown = event => {
      if (event.button !== 0) return;
      if (event.target.closest(".proto-node-handle")) return;

      event.preventDefault();
      node.setPointerCapture(event.pointerId);

      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = Number.isFinite(parseFloat(node.style.left)) ? parseFloat(node.style.left) : 0;
      const startTop = Number.isFinite(parseFloat(node.style.top)) ? parseFloat(node.style.top) : 0;

      const mover = moveEvent => {
        const left = startLeft + deltaCamera(moveEvent.clientX - startX);
        const top = startTop + deltaCamera(moveEvent.clientY - startY);

        node.style.left = `${left}px`;
        node.style.top = `${top}px`;
        estadoAtual.posicoes[node.dataset.node] = { left, top };
        aplicarCameraStage(stage);
      };

      const soltar = () => {
        node.onpointermove = null;
        node.onpointerup = null;
        node.onpointercancel = null;
        salvarEstado();
      };

      node.onpointermove = mover;
      node.onpointerup = soltar;
      node.onpointercancel = soltar;
    };
  });
}

function configurarCriacaoLinhas(stage) {
  stage.querySelectorAll(".proto-node-handle").forEach(handle => {
    handle.onpointerdown = event => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const origem = handle.closest(".proto-node");
      if (!origem) return;

      iniciarLinhaTemporaria(origem, event);

      const mover = moveEvent => moverLinhaTemporaria(stage, origem, moveEvent);
      const soltar = upEvent => {
        document.removeEventListener("pointermove", mover);
        document.removeEventListener("pointerup", soltar);
        finalizarLinhaTemporaria(stage, origem, upEvent);
      };

      document.addEventListener("pointermove", mover);
      document.addEventListener("pointerup", soltar, { once: true });
    };
  });
}

function iniciarLinhaTemporaria(origem, event) {
  pontoTemporario = document.createElement("div");
  pontoTemporario.style.cssText = "position:fixed;width:1px;height:1px;left:0;top:0;pointer-events:none;";
  document.body.appendChild(pontoTemporario);
  moverPontoTemporario(event);

  if (window.LeaderLine) {
    linhaTemporaria = new LeaderLine(origem, pontoTemporario, {
      path: "fluid",
      color: "#efda38",
      size: 2,
      startPlug: "disc",
      endPlug: "arrow3",
      startPlugSize: 1.45,
      endPlugSize: 1.45,
      dash: { animation: true }
    });
  }
}

function moverLinhaTemporaria(stage, origem, event) {
  moverPontoTemporario(event);
  linhaTemporaria?.position?.();

  stage.querySelectorAll(".proto-node").forEach(node => {
    const permitido = node !== origem && relacaoPermitida(origem.dataset.node, node.dataset.node);
    const emCima = permitido && pontoDentroDoElemento(event.clientX, event.clientY, node);
    node.classList.toggle("is-target", emCima);
  });

  stage.querySelectorAll(".proto-image-card").forEach(card => {
    const emCima = Boolean(opcoesAtributos[origem.dataset.node]) && pontoDentroDoElemento(event.clientX, event.clientY, card);
    card.classList.toggle("is-target", emCima);
  });
}

function finalizarLinhaTemporaria(stage, origem, event) {
  const imagemDestino = [...stage.querySelectorAll(".proto-image-card")]
    .find(card => pontoDentroDoElemento(event.clientX, event.clientY, card));

  if (imagemDestino) {
    stage.querySelectorAll(".proto-node, .proto-image-card").forEach(item => item.classList.remove("is-target"));
    linhaTemporaria?.remove?.();
    linhaTemporaria = null;
    pontoTemporario?.remove?.();
    pontoTemporario = null;
    if (bloqueioImagemEmCriacao?.atributoId === origem.dataset.node) {
      concluirBloqueioImagem(imagemDestino.dataset.imageId);
    } else {
      abrirModalVincularImagem(origem.dataset.node, imagemDestino.dataset.imageId);
    }
    return;
  }

  const destino = [...stage.querySelectorAll(".proto-node")]
    .find(node => node !== origem && relacaoPermitida(origem.dataset.node, node.dataset.node) && pontoDentroDoElemento(event.clientX, event.clientY, node));

  stage.querySelectorAll(".proto-node, .proto-image-card").forEach(node => node.classList.remove("is-target"));
  linhaTemporaria?.remove?.();
  linhaTemporaria = null;
  pontoTemporario?.remove?.();
  pontoTemporario = null;

  if (!destino) return;

  const chave = criarChave(origem.dataset.node, destino.dataset.node);
  if (!estadoAtual.relacoes[chave]) {
    estadoAtual.relacoes[chave] = [];
  }

  relacaoSelecionada = chave;
  salvarEstado();
  redesenharLinhas();
  abrirPainelRelacao(chave);
}

function moverPontoTemporario(event) {
  if (!pontoTemporario) return;
  pontoTemporario.style.left = `${event.clientX}px`;
  pontoTemporario.style.top = `${event.clientY}px`;
}

function relacaoPermitida(origem, destino) {
  if (origem === destino) return false;
  if (origem === "material-principal") return Boolean(opcoesAtributos[destino]);
  if (destino === "material-principal") return false;
  return Boolean(opcoesAtributos[origem]) && Boolean(opcoesAtributos[destino]);
}

function renderizarImagensAnexadas() {
  const stage = document.getElementById("protoStage");
  if (!stage) return;

  const mundo = stage.querySelector(".proto-world");
  mundo.querySelectorAll(".proto-image-card").forEach(card => card.remove());

  (estadoAtual.imagensAnexadas || []).forEach((imagem, indice) => {
    const card = document.createElement("div");
    const posicao = imagem.posicao || { left: 80 + indice * 34, top: 460 + indice * 28 };
    card.className = "proto-image-card";
    card.dataset.imageId = imagem.id;
    card.style.left = `${posicao.left}px`;
    card.style.top = `${posicao.top}px`;
    card.innerHTML = montarHtmlImagemAnexada(imagem);
    mundo.appendChild(card);
  });

  configurarArrasteImagens(stage);
  configurarAcoesImagens();
  aplicarCameraStage(stage);
}

function montarHtmlImagemAnexada(imagem) {
  const vinculos = (imagem.vinculos || []).map(vinculo => {
    const valores = vinculo.valores || [];
    const resumo = valores.length > 3
      ? `${valores.slice(0, 3).join(", ")}, +${valores.length - 3}`
      : valores.join(", ");
    return `<span title="${escapeHtml(valores.join(", "))}">${escapeHtml(nomesNodes[vinculo.atributo] || vinculo.atributo)}: ${escapeHtml(resumo)}</span>`;
  }).join("");
  const bloqueios = (imagem.bloqueios || []).map(bloqueio => {
    const valores = bloqueio.valores || [];
    const resumo = valores.length > 3
      ? `${valores.slice(0, 3).join(", ")}, +${valores.length - 3}`
      : valores.join(", ");
    return `<span class="is-blocked" title="${escapeHtml(valores.join(", "))}">Bloqueia ${escapeHtml(nomesNodes[bloqueio.atributo] || bloqueio.atributo)}: ${escapeHtml(resumo)}</span>`;
  }).join("");

  return `
    <div class="proto-image-card-head">
      <span><i class="fa-solid fa-image"></i> Imagem</span>
      <button type="button" data-remove-image="${escapeHtml(imagem.id)}" title="Remover imagem">×</button>
    </div>
    <div class="proto-image-preview">
      ${imagem.src ? `<img src="${escapeHtml(imagem.src)}" alt="${escapeHtml(imagem.nome || "Imagem anexada")}">` : `<i class="fa-regular fa-image"></i>`}
    </div>
    <div class="proto-image-info">
      <strong title="${escapeHtml(imagem.nome || "Imagem anexada")}">${escapeHtml(imagem.nome || "Imagem anexada")}</strong>
      <small>${vinculos || "Arraste uma linha de um atributo para reutilizar."}${bloqueios}</small>
    </div>
  `;
}

function configurarArrasteImagens(stage) {
  stage.querySelectorAll(".proto-image-card").forEach(card => {
    card.onpointerdown = event => {
      if (event.button !== 0) return;
      if (event.target.closest("button")) return;
      event.preventDefault();

      const inicioX = event.clientX;
      const inicioY = event.clientY;
      const leftInicial = Number.isFinite(parseFloat(card.style.left)) ? parseFloat(card.style.left) : 0;
      const topInicial = Number.isFinite(parseFloat(card.style.top)) ? parseFloat(card.style.top) : 0;
      let moveu = false;

      const mover = moveEvent => {
        if (Math.abs(moveEvent.clientX - inicioX) > 4 || Math.abs(moveEvent.clientY - inicioY) > 4) {
          moveu = true;
        }
        const left = leftInicial + deltaCamera(moveEvent.clientX - inicioX);
        const top = topInicial + deltaCamera(moveEvent.clientY - inicioY);
        card.style.left = `${left}px`;
        card.style.top = `${top}px`;
        aplicarCameraStage(stage);
      };

      const soltar = () => {
        document.removeEventListener("pointermove", mover);
        const imagem = (estadoAtual.imagensAnexadas || []).find(item => item.id === card.dataset.imageId);
        if (!imagem) return;
        imagem.posicao = {
          left: Number.isFinite(parseFloat(card.style.left)) ? parseFloat(card.style.left) : 0,
          top: Number.isFinite(parseFloat(card.style.top)) ? parseFloat(card.style.top) : 0
        };
        salvarEstado();
        if (!moveu) abrirModalEditarImagem(card.dataset.imageId);
      };

      document.addEventListener("pointermove", mover);
      document.addEventListener("pointerup", soltar, { once: true });
    };
  });
}

function configurarAcoesImagens() {
  document.querySelectorAll("[data-remove-image]").forEach(botao => {
    botao.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      estadoAtual.imagensAnexadas = (estadoAtual.imagensAnexadas || [])
        .filter(imagem => imagem.id !== botao.dataset.removeImage);
      salvarEstado();
      redesenharLinhas();
    };
  });
}

function redesenharLinhasImagens() {
  const stage = document.getElementById("protoStage");
  if (!stage || !window.LeaderLine) return;

  (estadoAtual.imagensAnexadas || []).forEach(imagem => {
    const card = stage.querySelector(`.proto-image-card[data-image-id="${cssEscape(imagem.id)}"]`);
    if (!card) return;

    (imagem.vinculos || []).forEach(vinculo => {
      const origem = stage.querySelector(`.proto-node[data-node="${cssEscape(vinculo.atributo)}"]`);
      if (!origem) return;

      const line = new LeaderLine(origem, card, {
        path: "fluid",
        color: "#efda38",
        size: 2,
        startPlug: "disc",
        endPlug: "arrow3",
        startPlugSize: 1.35,
        endPlugSize: 1.35,
        dash: { len: 8, gap: 6 }
      });
      linhasImagemAtivas.push({ id: imagem.id, atributo: vinculo.atributo, line });
    });
  });
}

function abrirModalAnexarImagem(atributoId) {
  abrirModalImagem({
    titulo: `Anexar imagem em ${nomesNodes[atributoId] || atributoId}`,
    atributoId,
    exigeArquivo: true,
    onConfirmar: ({ valores, arquivo }) => {
      const stage = document.getElementById("protoStage");
      const node = stage?.querySelector(`.proto-node[data-node="${cssEscape(atributoId)}"]`);
      const posicao = node
        ? { left: node.offsetLeft + 24, top: node.offsetTop + 160 }
        : { left: 80, top: 460 };

      estadoAtual.imagensAnexadas.push({
        id: `img_${Date.now()}`,
        nome: arquivo.nome,
        src: arquivo.src,
        posicao,
        vinculos: [{ atributo: atributoId, valores }]
      });
      salvarEstado();
      redesenharLinhas();
    }
  });
}

function abrirModalBloquearImagemAtributo(stage, atributoId) {
  abrirModalImagem({
    titulo: `Bloquear imagem para ${nomesNodes[atributoId] || atributoId}`,
    atributoId,
    exigeArquivo: false,
    texto: "Selecione quais opções deste atributo não devem usar a imagem escolhida. Depois confirme e arraste a linha até a imagem.",
    onConfirmar: ({ valores }) => {
      iniciarLinhaBloqueioImagem(stage, atributoId, valores);
    }
  });
}

function iniciarLinhaBloqueioImagem(stage, atributoId, valores) {
  const origem = stage.querySelector(`.proto-node[data-node="${cssEscape(atributoId)}"]`);
  if (!origem || !valores?.length) return;

  bloqueioImagemEmCriacao = { atributoId, valores };
  origem.classList.add("is-target");

  const mover = event => {
    if (!linhaTemporaria) iniciarLinhaTemporaria(origem, event);
    moverPontoTemporario(event);
    linhaTemporaria?.position?.();
    stage.querySelectorAll(".proto-image-card").forEach(card => {
      card.classList.toggle("is-target", pontoDentroDoElemento(event.clientX, event.clientY, card));
    });
  };

  const soltar = event => {
    document.removeEventListener("pointermove", mover);
    document.removeEventListener("pointerup", soltar);
    document.removeEventListener("click", clicar);
    stage.querySelectorAll(".proto-node, .proto-image-card").forEach(item => item.classList.remove("is-target"));
    const imagemDestino = [...stage.querySelectorAll(".proto-image-card")]
      .find(card => pontoDentroDoElemento(event.clientX, event.clientY, card));

    linhaTemporaria?.remove?.();
    linhaTemporaria = null;
    pontoTemporario?.remove?.();
    pontoTemporario = null;

    if (imagemDestino) concluirBloqueioImagem(imagemDestino.dataset.imageId);
    else bloqueioImagemEmCriacao = null;
  };

  const clicar = event => {
    const imagemDestino = event.target.closest(".proto-image-card");
    if (!imagemDestino || !stage.contains(imagemDestino)) return;
    event.preventDefault();
    event.stopPropagation();
    soltar(event);
  };

  document.addEventListener("pointermove", mover);
  document.addEventListener("pointerup", soltar, { once: true });
  document.addEventListener("click", clicar);
}

function concluirBloqueioImagem(imagemId) {
  const imagem = (estadoAtual.imagensAnexadas || []).find(item => item.id === imagemId);
  if (!imagem || !bloqueioImagemEmCriacao) {
    bloqueioImagemEmCriacao = null;
    return;
  }

  const bloqueios = imagem.bloqueios || [];
  const existente = bloqueios.find(item => item.atributo === bloqueioImagemEmCriacao.atributoId);
  if (existente) {
    existente.valores = [...new Set([...(existente.valores || []), ...bloqueioImagemEmCriacao.valores])];
  } else {
    bloqueios.push({
      atributo: bloqueioImagemEmCriacao.atributoId,
      valores: [...bloqueioImagemEmCriacao.valores]
    });
  }

  imagem.bloqueios = bloqueios;
  bloqueioImagemEmCriacao = null;
  salvarEstado();
  redesenharLinhas();
}

function abrirModalVincularImagem(atributoId, imagemId) {
  const imagem = (estadoAtual.imagensAnexadas || []).find(item => item.id === imagemId);
  if (!imagem) return;

  abrirModalImagem({
    titulo: `Vincular ${nomesNodes[atributoId] || atributoId} à imagem`,
    atributoId,
    exigeArquivo: false,
    onConfirmar: ({ valores }) => {
      const vinculos = imagem.vinculos || [];
      const existente = vinculos.find(vinculo => vinculo.atributo === atributoId);
      if (existente) {
        existente.valores = [...new Set([...(existente.valores || []), ...valores])];
      } else {
        vinculos.push({ atributo: atributoId, valores });
      }
      imagem.vinculos = vinculos;
      salvarEstado();
      redesenharLinhas();
    }
  });
}

function abrirModalEditarImagem(imagemId) {
  const imagem = (estadoAtual.imagensAnexadas || []).find(item => item.id === imagemId);
  if (!imagem) return;

  const vinculos = imagem.vinculos || [];
  const modal = document.createElement("div");
  modal.className = "proto-image-modal";
  modal.innerHTML = `
    <div class="proto-image-modal-card">
      <div class="proto-image-modal-head">
        <strong>Editar imagem anexada</strong>
        <button type="button" data-close-image-modal>×</button>
      </div>
      <p>Troque a imagem ou ajuste as opções vinculadas a esta referência.</p>
      <div class="proto-image-edit-preview" data-image-preview>
        ${imagem.src ? `<img src="${escapeHtml(imagem.src)}" alt="${escapeHtml(imagem.nome || "Imagem anexada")}">` : `<i class="fa-regular fa-image"></i>`}
        <small>${escapeHtml(imagem.nome || "Imagem anexada")}</small>
      </div>
      <label class="proto-image-upload">
        <span><i class="fa-solid fa-cloud-arrow-up"></i> Trocar imagem</span>
        <input type="file" accept="image/*" data-image-file>
      </label>
      <div class="proto-image-edit-groups">
        ${vinculos.map(vinculo => montarGrupoEdicaoImagem(vinculo)).join("") || `
          <div class="proto-options-empty">Nenhum atributo vinculado. Arraste uma linha de um atributo até esta imagem.</div>
        `}
      </div>
      <div class="proto-image-modal-actions">
        <button type="button" data-close-image-modal>Cancelar</button>
        <button type="button" data-confirm-image-edit>Salvar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let arquivoSelecionado = null;
  const fechar = () => modal.remove();

  modal.querySelectorAll("[data-close-image-modal]").forEach(botao => botao.addEventListener("click", fechar));
  modal.addEventListener("click", event => {
    if (event.target === modal) fechar();
  });
  modal.querySelector("[data-image-file]")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      arquivoSelecionado = { nome: file.name, src: String(reader.result || "") };
      const preview = modal.querySelector("[data-image-preview]");
      if (preview) {
        preview.innerHTML = `<img src="${escapeHtml(arquivoSelecionado.src)}" alt="${escapeHtml(file.name)}"><small>${escapeHtml(file.name)}</small>`;
      }
    };
    reader.readAsDataURL(file);
  });
  modal.querySelectorAll("[data-image-group-select-all]").forEach(botao => {
    botao.addEventListener("click", () => {
      botao.closest("[data-image-edit-group]")?.querySelectorAll("input[type='checkbox']").forEach(input => { input.checked = true; });
    });
  });
  modal.querySelectorAll("[data-image-group-clear-all]").forEach(botao => {
    botao.addEventListener("click", () => {
      botao.closest("[data-image-edit-group]")?.querySelectorAll("input[type='checkbox']").forEach(input => { input.checked = false; });
    });
  });
  modal.querySelector("[data-confirm-image-edit]")?.addEventListener("click", () => {
    const novosVinculos = [...modal.querySelectorAll("[data-image-edit-group]")]
      .map(grupo => ({
        atributo: grupo.dataset.imageEditGroup,
        valores: [...grupo.querySelectorAll("input[type='checkbox']:checked")].map(input => input.value)
      }))
      .filter(vinculo => vinculo.valores.length);

    imagem.vinculos = novosVinculos;
    if (arquivoSelecionado) {
      imagem.nome = arquivoSelecionado.nome;
      imagem.src = arquivoSelecionado.src;
    }
    salvarEstado();
    redesenharLinhas();
    fechar();
  });
}

function montarGrupoEdicaoImagem(vinculo) {
  const opcoes = opcoesAtributos[vinculo.atributo] || [];
  const selecionadas = new Set(vinculo.valores || []);

  return `
    <div class="proto-image-edit-group" data-image-edit-group="${escapeHtml(vinculo.atributo)}">
      <div class="proto-image-edit-group-head">
        <strong>${escapeHtml(nomesNodes[vinculo.atributo] || vinculo.atributo)}</strong>
        <span>
          <button type="button" data-image-group-select-all>Todos</button>
          <button type="button" data-image-group-clear-all>Limpar</button>
        </span>
      </div>
      <div class="proto-image-options">
        ${opcoes.map(opcao => `
          <label class="proto-check">
            <input type="checkbox" value="${escapeHtml(opcao)}" ${selecionadas.has(opcao) ? "checked" : ""}>
            <span>${escapeHtml(opcao)}</span>
          </label>
        `).join("") || `<div class="proto-options-empty">Nenhuma opção cadastrada para este atributo.</div>`}
      </div>
    </div>
  `;
}

function abrirModalImagem({ titulo, atributoId, exigeArquivo, texto, onConfirmar }) {
  const opcoes = opcoesAtributos[atributoId] || [];
  if (!opcoes.length) return;

  const modal = document.createElement("div");
  modal.className = "proto-image-modal";
  modal.innerHTML = `
    <div class="proto-image-modal-card">
      <div class="proto-image-modal-head">
        <strong>${escapeHtml(titulo)}</strong>
        <button type="button" data-close-image-modal>×</button>
      </div>
      <p>${escapeHtml(texto || "Selecione quais opções usam esta referência de imagem.")}</p>
      <div class="proto-option-tools">
        <button type="button" data-image-select-all><i class="fa-solid fa-check-double"></i> Selecionar tudo</button>
        <button type="button" data-image-clear-all><i class="fa-solid fa-eraser"></i> Remover tudo</button>
      </div>
      <div class="proto-image-options">
        ${opcoes.map(opcao => `
          <label class="proto-check">
            <input type="checkbox" value="${escapeHtml(opcao)}">
            <span>${escapeHtml(opcao)}</span>
          </label>
        `).join("")}
      </div>
      ${exigeArquivo ? `
        <label class="proto-image-upload">
          <span><i class="fa-solid fa-cloud-arrow-up"></i> Selecionar imagem</span>
          <input type="file" accept="image/*" data-image-file>
        </label>
        <div class="proto-image-upload-preview" data-image-preview>
          <i class="fa-regular fa-image"></i>
          <small>Nenhuma imagem selecionada</small>
        </div>
      ` : ""}
      <div class="proto-image-modal-actions">
        <button type="button" data-close-image-modal>Cancelar</button>
        <button type="button" data-confirm-image-modal>Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  let arquivoSelecionado = null;
  const fechar = () => modal.remove();

  modal.querySelectorAll("[data-close-image-modal]").forEach(botao => botao.addEventListener("click", fechar));
  modal.addEventListener("click", event => {
    if (event.target === modal) fechar();
  });
  modal.querySelector("[data-image-select-all]")?.addEventListener("click", () => {
    modal.querySelectorAll(".proto-image-options input").forEach(input => { input.checked = true; });
  });
  modal.querySelector("[data-image-clear-all]")?.addEventListener("click", () => {
    modal.querySelectorAll(".proto-image-options input").forEach(input => { input.checked = false; });
  });
  modal.querySelector("[data-image-file]")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      arquivoSelecionado = { nome: file.name, src: String(reader.result || "") };
      const preview = modal.querySelector("[data-image-preview]");
      if (preview) {
        preview.classList.remove("is-invalid");
        preview.innerHTML = `<img src="${escapeHtml(arquivoSelecionado.src)}" alt="${escapeHtml(file.name)}"><small>${escapeHtml(file.name)}</small>`;
      }
    };
    reader.readAsDataURL(file);
  });
  modal.querySelector("[data-confirm-image-modal]")?.addEventListener("click", () => {
    const valores = [...modal.querySelectorAll(".proto-image-options input:checked")].map(input => input.value);
    if (!valores.length) {
      modal.querySelector(".proto-image-options")?.classList.add("is-invalid");
      return;
    }
    if (exigeArquivo && !arquivoSelecionado) {
      modal.querySelector("[data-image-preview]")?.classList.add("is-invalid");
      return;
    }
    onConfirmar({ valores, arquivo: arquivoSelecionado });
    fechar();
  });
}

function criarChave(origem, destino) {
  return `${origem}::${destino}`;
}

function cssEscape(valor) {
  if (window.CSS?.escape) return CSS.escape(valor);
  return String(valor ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function pontoDentroDoElemento(x, y, elemento) {
  const rect = elemento.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function redesenharLinhas() {
  removerLinhas();

  Object.keys(estadoAtual.relacoes || {}).forEach(chave => {
    const [origemId, destinoId] = chave.split("::");
    const origem = document.querySelector(`.proto-node[data-node="${origemId}"]`);
    const destino = document.querySelector(`.proto-node[data-node="${destinoId}"]`);
    if (!origem || !destino || !window.LeaderLine) return;

    origem.classList.add("is-linked");
    destino.classList.add("is-linked");

    const line = new LeaderLine(origem, destino, {
      path: "fluid",
      color: chave === relacaoSelecionada ? "#efda38" : "#cfcfcf",
      size: chave === relacaoSelecionada ? 3 : 2,
      startPlug: "disc",
      endPlug: "arrow3",
      startPlugSize: 1.45,
      endPlugSize: 1.45
    });

    linhasAtivas.push({ chave, line });
  });

  redesenharBloqueios();
  redesenharAtribuicoesEspecificas();
  redesenharAtributosUnicos();
  renderizarImagensAnexadas();
  redesenharLinhasImagens();
  recortarLinhasAoQuadro();
}

function removerLinhas() {
  linhasAtivas.forEach(item => item.line?.remove?.());
  linhasBloqueioAtivas.forEach(item => item.line?.remove?.());
  linhasAtribuicaoAtivas.forEach(item => item.line?.remove?.());
  linhasAtributoUnicoAtivas.forEach(item => item.line?.remove?.());
  linhasImagemAtivas.forEach(item => item.line?.remove?.());
  linhasAtivas = [];
  linhasBloqueioAtivas = [];
  linhasAtribuicaoAtivas = [];
  linhasAtributoUnicoAtivas = [];
  linhasImagemAtivas = [];
  document.querySelectorAll(".proto-block-rule").forEach(item => item.remove());
  document.querySelectorAll(".proto-specific-rule").forEach(item => item.remove());
  document.querySelectorAll(".proto-unique-rule").forEach(item => item.remove());
  document.querySelectorAll(".proto-node").forEach(node => node.classList.remove("is-linked", "is-target"));
}

function redesenharBloqueios() {
  const stage = document.getElementById("protoStage");
  if (!stage) return;

  (estadoAtual.bloqueios || []).forEach(bloqueio => {
    const origem = stage.querySelector(`.proto-node[data-node="${bloqueio.origem}"]`);
    const destino = stage.querySelector(`.proto-node[data-node="${bloqueio.destino}"]`);
    if (!origem || !destino) return;

    const box = document.createElement("div");
    box.className = "proto-block-rule";
    box.dataset.id = bloqueio.id;
    box.innerHTML = montarHtmlBloqueio(bloqueio, false);
    document.body.appendChild(box);
    box.addEventListener("click", event => {
      event.stopPropagation();
      abrirEditorBloqueio(bloqueio.id, !box.classList.contains("expanded"));
    });

    if (window.LeaderLine) {
      const linhaOrigem = new LeaderLine(origem, box, {
        path: "fluid",
        color: "rgba(255, 88, 88, 0.66)",
        size: 2,
        startPlug: "disc",
        endPlug: "behind",
        startPlugSize: 1.45,
        dash: { len: 7, gap: 6 }
      });
      const linhaDestino = new LeaderLine(box, destino, {
        path: "fluid",
        color: "rgba(255, 88, 88, 0.66)",
        size: 2,
        startPlug: "behind",
        endPlug: "arrow3",
        endPlugSize: 1.45,
        dash: { len: 7, gap: 6 }
      });
      linhasBloqueioAtivas.push({ id: bloqueio.id, line: linhaOrigem });
      linhasBloqueioAtivas.push({ id: bloqueio.id, line: linhaDestino });
    }
  });

  posicionarCaixasBloqueio(stage);
  linhasBloqueioAtivas.forEach(item => item.line?.position?.());
}

function montarHtmlBloqueio(bloqueio, expandido) {
  const opcoes = opcoesAtributos[bloqueio.destino] || [];
  const selecionadas = new Set(bloqueio.valoresFilho || []);
  const total = selecionadas.size;

  return `
    <div class="proto-block-rule-title">
      <span>${escapeHtml(nomesNodes[bloqueio.origem])}: ${escapeHtml(bloqueio.valorPai)}</span>
      <button type="button" data-remove-block="${escapeHtml(bloqueio.id)}" title="Remover bloqueio">×</button>
    </div>
    <small>bloqueia ${total} em ${escapeHtml(nomesNodes[bloqueio.destino])}</small>
    ${expandido ? `
      <div class="proto-block-options">
        ${opcoes.map(opcao => `
          <label>
            <input type="checkbox" value="${escapeHtml(opcao)}" ${selecionadas.has(opcao) ? "checked" : ""}>
            <span>${escapeHtml(opcao)}</span>
          </label>
        `).join("")}
      </div>
    ` : ""}
  `;
}

function posicionarCaixasBloqueio(stage) {
  posicionarCaixasIntermediarias(stage);
}

function calcularOffsetBloqueio(a, b, indice) {
  if (!indice) return { x: 0, y: 0 };

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const comprimento = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / comprimento, y: dx / comprimento };
  const lado = indice % 2 ? 1 : -1;
  const camada = Math.ceil(indice / 2);
  const distancia = 72 * camada;

  return {
    x: normal.x * distancia * lado,
    y: normal.y * distancia * lado
  };
}

function posicionarCaixasIntermediarias(stage) {
  const caixasPorPar = new Map();
  const escala = cameraProto.escala;
  const stageRect = stage.getBoundingClientRect();

  document.querySelectorAll(".proto-block-rule, .proto-specific-rule, .proto-unique-rule").forEach(box => {
    const dados = obterDadosCaixaIntermediaria(box);
    if (!dados) return;

    const origem = stage.querySelector(`.proto-node[data-node="${dados.origem}"]`);
    const destino = stage.querySelector(`.proto-node[data-node="${dados.destino}"]`);
    if (!origem || !destino) return;

    const par = criarChave(dados.origem, dados.destino);
    if (!caixasPorPar.has(par)) caixasPorPar.set(par, []);
    caixasPorPar.get(par).push({ box, origem, destino });
  });

  caixasPorPar.forEach(caixas => {
    const primeira = caixas[0];
    const a = centroViewport(primeira.origem);
    const b = centroViewport(primeira.destino);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const comprimento = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / comprimento, y: dx / comprimento };
    const direcao = { x: dx / comprimento, y: dy / comprimento };
    const espacamento = escala * Math.max(
      118,
      ...caixas.map(({ box }) => {
        const larguraProjetada = Math.abs(normal.x) * box.offsetWidth;
        const alturaProjetada = Math.abs(normal.y) * box.offsetHeight;
        return larguraProjetada + alturaProjetada + 54;
      })
    );

    caixas.forEach(({ box }, indice) => {
      const slot = indice - (caixas.length - 1) / 2;
      const avanco = caixas.length > 1
        ? (indice % 2 ? 34 : -34) * escala
        : 0;
      const offset = {
        x: normal.x * espacamento * slot + direcao.x * avanco,
        y: normal.y * espacamento * slot + direcao.y * avanco
      };
      const left = (a.x + b.x) / 2 - box.offsetWidth / 2 + offset.x;
      const top = (a.y + b.y) / 2 - box.offsetHeight / 2 + offset.y;

      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.transform = `scale(${escala})`;
      atualizarVisibilidadeCaixaIntermediaria(stageRect, box, escala);
    });
  });
}

function atualizarVisibilidadeCaixaIntermediaria(stageRect, box, escala) {
  const boxRect = box.getBoundingClientRect();
  const dentroStage = boxRect.bottom > stageRect.top
    && boxRect.top < stageRect.bottom
    && boxRect.right > stageRect.left
    && boxRect.left < stageRect.right;

  box.classList.toggle("fora-stage", !dentroStage);
  if (dentroStage) recortarElementoQuadro(box, stageRect, boxRect, escala);
}

function centroViewport(elemento) {
  const rect = elemento.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function obterDadosCaixaIntermediaria(box) {
  if (box.classList.contains("proto-block-rule")) {
    const bloqueio = estadoAtual.bloqueios.find(item => item.id === box.dataset.id);
    return bloqueio ? { origem: bloqueio.origem, destino: bloqueio.destino } : null;
  }

  if (box.classList.contains("proto-specific-rule")) {
    const regra = estadoAtual.atribuicoesEspecificas.find(item => item.id === box.dataset.id);
    return regra ? { origem: regra.origem, destino: regra.destino } : null;
  }

  if (box.classList.contains("proto-unique-rule")) {
    const grupo = agruparAtributosUnicos().find(item => item.par === box.dataset.par);
    return grupo ? { origem: grupo.origem, destino: grupo.destino } : null;
  }

  return null;
}

function abrirEditorBloqueio(id, expandir) {
  const stage = document.getElementById("protoStage");
  const bloqueio = estadoAtual.bloqueios.find(item => item.id === id);
  const box = document.querySelector(`.proto-block-rule[data-id="${id}"]`);
  if (!stage || !bloqueio || !box) return;

  box.classList.toggle("expanded", expandir);
  box.innerHTML = montarHtmlBloqueio(bloqueio, expandir);
  posicionarCaixasBloqueio(stage);
  linhasBloqueioAtivas.forEach(item => item.line?.position?.());

  box.querySelector("[data-remove-block]")?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    estadoAtual.bloqueios = estadoAtual.bloqueios.filter(item => item.id !== id);
    salvarEstado();
    redesenharLinhas();
  });

  box.querySelectorAll("input[type='checkbox']").forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("change", () => {
      bloqueio.valoresFilho = [...box.querySelectorAll("input:checked")].map(item => item.value);
      salvarEstado();
      box.innerHTML = montarHtmlBloqueio(bloqueio, true);
      abrirEditorBloqueio(id, true);
    });
  });
}

function redesenharAtribuicoesEspecificas() {
  const stage = document.getElementById("protoStage");
  if (!stage) return;

  (estadoAtual.atribuicoesEspecificas || []).forEach(regra => {
    const origem = stage.querySelector(`.proto-node[data-node="${regra.origem}"]`);
    const destino = stage.querySelector(`.proto-node[data-node="${regra.destino}"]`);
    if (!origem || !destino) return;

    const box = document.createElement("div");
    box.className = "proto-specific-rule";
    box.dataset.id = regra.id;
    box.innerHTML = montarHtmlAtribuicao(regra, false);
    document.body.appendChild(box);
    box.addEventListener("click", event => {
      event.stopPropagation();
      abrirEditorAtribuicao(regra.id, !box.classList.contains("expanded"));
    });

    if (window.LeaderLine) {
      const linhaOrigem = new LeaderLine(origem, box, {
        path: "fluid",
        color: "rgba(102, 205, 255, 0.75)",
        size: 2,
        startPlug: "disc",
        endPlug: "behind",
        startPlugSize: 1.45,
        dash: { len: 6, gap: 5 }
      });
      const linhaDestino = new LeaderLine(box, destino, {
        path: "fluid",
        color: "rgba(102, 205, 255, 0.75)",
        size: 2,
        startPlug: "behind",
        endPlug: "arrow3",
        endPlugSize: 1.45,
        dash: { len: 6, gap: 5 }
      });
      linhasAtribuicaoAtivas.push({ id: regra.id, line: linhaOrigem });
      linhasAtribuicaoAtivas.push({ id: regra.id, line: linhaDestino });
    }
  });

  posicionarCaixasAtribuicao(stage);
  linhasAtribuicaoAtivas.forEach(item => item.line?.position?.());
}

function montarHtmlAtribuicao(regra, expandido) {
  const opcoes = opcoesAtributos[regra.origem] || [];
  const selecionadas = new Set(regra.valoresPai || []);
  const resumoSelecionadas = formatarResumoSelecionadas([...selecionadas]);

  return `
    <div class="proto-specific-rule-title">
      <span>${escapeHtml(nomesNodes[regra.origem])}</span>
      <button type="button" data-remove-specific="${escapeHtml(regra.id)}" title="Remover atribuição">×</button>
    </div>
    <small>Específicos: ${escapeHtml(resumoSelecionadas)}</small>
    <small>Aceita: ${escapeHtml(nomesNodes[regra.destino])}</small>
    ${expandido ? `
      <div class="proto-specific-options">
        ${opcoes.map(opcao => `
          <label>
            <input type="checkbox" value="${escapeHtml(opcao)}" ${selecionadas.has(opcao) ? "checked" : ""}>
            <span>${escapeHtml(opcao)}</span>
          </label>
        `).join("")}
      </div>
    ` : ""}
  `;
}

function formatarResumoSelecionadas(valores) {
  if (!valores.length) return "nenhuma opção selecionada";
  if (valores.length <= 3) return valores.join(", ");
  return `${valores.slice(0, 3).join(", ")}, +${valores.length - 3}`;
}

function abrirEditorAtribuicao(id, expandir) {
  const stage = document.getElementById("protoStage");
  const regra = estadoAtual.atribuicoesEspecificas.find(item => item.id === id);
  const box = document.querySelector(`.proto-specific-rule[data-id="${id}"]`);
  if (!stage || !regra || !box) return;

  box.classList.toggle("expanded", expandir);
  box.innerHTML = montarHtmlAtribuicao(regra, expandir);
  posicionarCaixasAtribuicao(stage);
  linhasAtribuicaoAtivas.forEach(item => item.line?.position?.());

  box.querySelector("[data-remove-specific]")?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    estadoAtual.atribuicoesEspecificas = estadoAtual.atribuicoesEspecificas.filter(item => item.id !== id);
    salvarEstado();
    redesenharLinhas();
  });

  box.querySelectorAll("input[type='checkbox']").forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("change", () => {
      regra.valoresPai = [...box.querySelectorAll("input:checked")].map(item => item.value);
      delete regra.valorPai;
      salvarEstado();
      box.innerHTML = montarHtmlAtribuicao(regra, true);
      abrirEditorAtribuicao(id, true);
    });
  });
}

function redesenharAtributosUnicos() {
  const stage = document.getElementById("protoStage");
  if (!stage) return;

  agruparAtributosUnicos().forEach(grupo => {
    const origem = stage.querySelector(`.proto-node[data-node="${grupo.origem}"]`);
    const destino = stage.querySelector(`.proto-node[data-node="${grupo.destino}"]`);
    if (!origem || !destino) return;

    const box = document.createElement("div");
    box.className = "proto-unique-rule";
    box.dataset.par = grupo.par;
    const expandido = grupo.regras.some(regra => !regra.valorPai || !regra.valorFilho);
    box.classList.toggle("expanded", expandido);
    box.innerHTML = montarHtmlAtributoUnicoGrupo(grupo, expandido);
    document.body.appendChild(box);

    configurarEventosAtributoUnico(box, grupo.par);

    if (window.LeaderLine) {
      const linhaOrigem = new LeaderLine(origem, box, {
        path: "fluid",
        color: "rgba(190, 120, 255, 0.82)",
        size: 2,
        startPlug: "disc",
        endPlug: "behind",
        startPlugSize: 1.45,
        dash: { len: 6, gap: 5 }
      });
      const linhaDestino = new LeaderLine(box, destino, {
        path: "fluid",
        color: "rgba(190, 120, 255, 0.82)",
        size: 2,
        startPlug: "behind",
        endPlug: "arrow3",
        endPlugSize: 1.45,
        dash: { len: 6, gap: 5 }
      });
      linhasAtributoUnicoAtivas.push({ id: grupo.par, line: linhaOrigem });
      linhasAtributoUnicoAtivas.push({ id: grupo.par, line: linhaDestino });
    }
  });

  posicionarCaixasAtributoUnico(stage);
  linhasAtributoUnicoAtivas.forEach(item => item.line?.position?.());
}

function agruparAtributosUnicos() {
  const grupos = new Map();

  (estadoAtual.atributosUnicos || []).forEach(regra => {
    const par = criarChave(regra.origem, regra.destino);
    if (!grupos.has(par)) {
      grupos.set(par, {
        par,
        origem: regra.origem,
        destino: regra.destino,
        regras: []
      });
    }
    grupos.get(par).regras.push(regra);
  });

  return [...grupos.values()];
}

function montarHtmlAtributoUnicoGrupo(grupo, expandido) {
  const opcoesPai = opcoesAtributos[grupo.origem] || [];
  const opcoesFilho = opcoesAtributos[grupo.destino] || [];

  if (!expandido && grupo.regras.every(regra => regra.valorPai && regra.valorFilho)) {
    return `
      <div class="proto-unique-rule-title">
        <span>Atributo único</span>
        <button type="button" data-remove-unique-group="${escapeHtml(grupo.par)}" title="Remover atributos únicos">×</button>
      </div>
      <div class="proto-unique-summary-grid">
        ${grupo.regras.map(regra => `
          <div class="proto-unique-summary">
            <strong>${escapeHtml(regra.valorPai)}</strong>
            <span>x</span>
            <strong>${escapeHtml(regra.valorFilho)}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  return `
    <div class="proto-unique-rule-title">
      <span>Atributo único</span>
      <button type="button" data-remove-unique-group="${escapeHtml(grupo.par)}" title="Remover atributos únicos">×</button>
    </div>
    <div class="proto-unique-edit-grid">
      ${grupo.regras.map(regra => `
        <div class="proto-unique-edit-item" data-unique-id="${escapeHtml(regra.id)}">
          <label>
            <small>${escapeHtml(nomesNodes[grupo.origem])}</small>
            <select data-unique-parent>
              <option value="">Pai...</option>
              ${opcoesPai.map(opcao => `<option value="${escapeHtml(opcao)}" ${regra.valorPai === opcao ? "selected" : ""}>${escapeHtml(opcao)}</option>`).join("")}
            </select>
          </label>
          <label>
            <small>${escapeHtml(nomesNodes[grupo.destino])}</small>
            <select data-unique-child>
              <option value="">Filho...</option>
              ${opcoesFilho.map(opcao => `<option value="${escapeHtml(opcao)}" ${regra.valorFilho === opcao ? "selected" : ""}>${escapeHtml(opcao)}</option>`).join("")}
            </select>
          </label>
          <button type="button" data-remove-unique="${escapeHtml(regra.id)}" title="Remover esta combinação">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `).join("")}
    </div>
  `;
}

function configurarEventosAtributoUnico(box, par) {
  const grupo = agruparAtributosUnicos().find(item => item.par === par);
  if (!grupo) return;

  box.addEventListener("click", event => {
    event.stopPropagation();
    if (!box.classList.contains("expanded") && !event.target.closest("[data-remove-unique-group]")) {
      abrirEditorAtributoUnico(par, true);
    }
  });
  box.querySelector("[data-remove-unique-group]")?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    estadoAtual.atributosUnicos = estadoAtual.atributosUnicos.filter(item => criarChave(item.origem, item.destino) !== par);
    salvarEstado();
    redesenharLinhas();
  });

  box.querySelectorAll("[data-remove-unique]").forEach(botao => {
    botao.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      estadoAtual.atributosUnicos = estadoAtual.atributosUnicos.filter(item => item.id !== botao.dataset.removeUnique);
      salvarEstado();
      redesenharLinhas();
    });
  });

  box.querySelectorAll(".proto-unique-edit-item").forEach(item => {
    const regra = estadoAtual.atributosUnicos.find(reg => reg.id === item.dataset.uniqueId);
    if (!regra) return;

    item.querySelector("[data-unique-parent]")?.addEventListener("change", event => {
      regra.valorPai = event.target.value;
      salvarEstado();
    });

    item.querySelector("[data-unique-child]")?.addEventListener("change", event => {
      regra.valorFilho = event.target.value;
      salvarEstado();
    });
  });
}

function abrirEditorAtributoUnico(par, expandir = true) {
  const stage = document.getElementById("protoStage");
  const grupo = agruparAtributosUnicos().find(item => item.par === par);
  const box = document.querySelector(`.proto-unique-rule[data-par="${cssEscape(par)}"]`);
  if (!stage || !grupo || !box) return;

  box.classList.toggle("expanded", expandir);
  box.innerHTML = montarHtmlAtributoUnicoGrupo(grupo, expandir);
  configurarEventosAtributoUnico(box, par);
  posicionarCaixasAtributoUnico(stage);
  linhasAtributoUnicoAtivas.forEach(item => item.line?.position?.());

  if (expandir) {
    box.querySelector("[data-unique-parent]")?.focus();
  }
}

function configurarRecolherAtributoUnico(stage) {
  if (atributoUnicoOutsideHandler) {
    document.removeEventListener("click", atributoUnicoOutsideHandler);
  }

  atributoUnicoOutsideHandler = event => {
    if (event.target.closest(".proto-unique-rule")) return;
    recolherAtributosUnicos(stage);
  };

  document.addEventListener("click", atributoUnicoOutsideHandler);
}

function recolherAtributosUnicos(stage) {
  document.querySelectorAll(".proto-unique-rule.expanded").forEach(box => {
    const grupo = agruparAtributosUnicos().find(item => item.par === box.dataset.par);
    if (!grupo || grupo.regras.some(regra => !regra.valorPai || !regra.valorFilho)) return;

    box.classList.remove("expanded");
    box.innerHTML = montarHtmlAtributoUnicoGrupo(grupo, false);
    configurarEventosAtributoUnico(box, grupo.par);
  });

  posicionarCaixasAtributoUnico(stage);
  linhasAtributoUnicoAtivas.forEach(item => item.line?.position?.());
}

function posicionarCaixasAtributoUnico(stage) {
  posicionarCaixasIntermediarias(stage);
}

function posicionarCaixasAtribuicao(stage) {
  posicionarCaixasIntermediarias(stage);
}

function abrirPainelRelacao(chave) {
  const titulo = document.getElementById("protoPanelTitulo");
  const conteudo = document.getElementById("protoPanelConteudo");
  if (!titulo || !conteudo) return;

  const [origem, destino] = chave.split("::");
  const opcoes = opcoesAtributos[destino] || [];
  const selecionadas = new Set(estadoAtual.relacoes[chave] || []);

  titulo.textContent = `${nomesNodes[origem]} → ${nomesNodes[destino]}`;
  conteudo.className = "proto-opcoes";
  conteudo.innerHTML = `
    <div class="proto-option-add">
      <input type="text" aria-label="Nova opção" placeholder="Nova opção" autocomplete="off" data-option-new>
      <button type="button" data-option-add title="Adicionar opção" aria-label="Adicionar opção">
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
    <div class="proto-option-tools">
      <button type="button" data-option-select-all>
        <i class="fa-solid fa-check-double"></i>
        Selecionar tudo
      </button>
      <button type="button" data-option-clear-all>
        <i class="fa-solid fa-eraser"></i>
        Remover tudo
      </button>
    </div>
    <div class="proto-options-list" data-options-list>
      ${montarHtmlCheckboxesRelacao(opcoes, selecionadas)}
    </div>
  `;

  conteudo.querySelector("[data-option-add]")?.addEventListener("click", () => {
    adicionarOpcaoAtributo(destino, conteudo.querySelector("[data-option-new]")?.value, chave);
  });

  conteudo.querySelector("[data-option-new]")?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    adicionarOpcaoAtributo(destino, event.target.value, chave);
  });

  conteudo.querySelector("[data-option-select-all]")?.addEventListener("click", () => {
    estadoAtual.relacoes[chave] = [...conteudo.querySelectorAll(".proto-options-list input[type='checkbox']")]
      .map(item => item.value);
    salvarEstado();
    abrirPainelRelacao(chave);
  });

  conteudo.querySelector("[data-option-clear-all]")?.addEventListener("click", () => {
    estadoAtual.relacoes[chave] = [];
    salvarEstado();
    abrirPainelRelacao(chave);
  });

  configurarCheckboxesRelacao(conteudo, chave);
}

function montarHtmlCheckboxesRelacao(opcoes, selecionadas) {
  const ordenadas = ordenarOpcoesAtributo(opcoes);
  return ordenadas.length
    ? ordenadas.map(opcao => `
      <div class="proto-check">
        <label class="proto-check-main">
          <input type="checkbox" value="${escapeHtml(opcao)}" ${selecionadas.has(opcao) ? "checked" : ""}>
          <span title="${escapeHtml(opcao)}">${escapeHtml(opcao)}</span>
        </label>
        <button type="button" class="proto-option-remove" data-option-remove="${escapeHtml(opcao)}" title="Remover opcao">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join("")
    : `<div class="proto-options-empty">Nenhuma opção cadastrada. Adicione a primeira opção acima.</div>`;
}

function configurarCheckboxesRelacao(conteudo, chave) {
  conteudo.querySelectorAll(".proto-options-list input[type='checkbox']").forEach(input => {
    input.addEventListener("change", () => {
      estadoAtual.relacoes[chave] = [...conteudo.querySelectorAll("input:checked")].map(item => item.value);
      salvarEstado();
    });
  });

  conteudo.querySelectorAll("[data-option-remove]").forEach(botao => {
    botao.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      removerOpcaoAtributo(chave.split("::")[1], botao.dataset.optionRemove, chave);
    });
  });
}

function adicionarOpcaoAtributo(destino, valor, chave) {
  const nome = String(valor || "").trim();
  if (!nome) return;

  if (!Array.isArray(estadoAtual.opcoesPersonalizadas[destino])) {
    estadoAtual.opcoesPersonalizadas[destino] = [];
  }
  if (!Array.isArray(estadoAtual.opcoesRemovidas[destino])) {
    estadoAtual.opcoesRemovidas[destino] = [];
  }

  const jaExiste = obterOpcoesAtributo(destino, nomesNodes[destino])
    .some(opcao => normalizarBusca(opcao) === normalizarBusca(nome));

  estadoAtual.opcoesRemovidas[destino] = estadoAtual.opcoesRemovidas[destino]
    .filter(opcao => normalizarBusca(opcao) !== normalizarBusca(nome));

  if (!jaExiste) {
    estadoAtual.opcoesPersonalizadas[destino].push(nome);
  }

  if (!Array.isArray(estadoAtual.relacoes[chave])) {
    estadoAtual.relacoes[chave] = [];
  }

  if (!estadoAtual.relacoes[chave].some(opcao => normalizarBusca(opcao) === normalizarBusca(nome))) {
    estadoAtual.relacoes[chave].push(nome);
  }

  atualizarMapasAtributos(document.getElementById("protoStage"));
  salvarEstado();
  abrirPainelRelacao(chave);
}

function removerOpcaoAtributo(idAtributo, valor, chaveAtual) {
  const normalizado = normalizarBusca(valor);
  if (!idAtributo || !normalizado) return;

  if (!Array.isArray(estadoAtual.opcoesRemovidas[idAtributo])) {
    estadoAtual.opcoesRemovidas[idAtributo] = [];
  }

  if (!estadoAtual.opcoesRemovidas[idAtributo].some(opcao => normalizarBusca(opcao) === normalizado)) {
    estadoAtual.opcoesRemovidas[idAtributo].push(valor);
  }

  if (Array.isArray(estadoAtual.opcoesPersonalizadas[idAtributo])) {
    estadoAtual.opcoesPersonalizadas[idAtributo] = estadoAtual.opcoesPersonalizadas[idAtributo]
      .filter(opcao => normalizarBusca(opcao) !== normalizado);
  }

  Object.entries(estadoAtual.relacoes || {}).forEach(([chave, opcoes]) => {
    const destino = chave.split("::")[1];
    if (destino !== idAtributo || !Array.isArray(opcoes)) return;
    estadoAtual.relacoes[chave] = opcoes.filter(opcao => normalizarBusca(opcao) !== normalizado);
  });

  estadoAtual.bloqueios = (estadoAtual.bloqueios || [])
    .map(regra => ({
      ...regra,
      valoresFilho: regra.destino === idAtributo
        ? (regra.valoresFilho || []).filter(opcao => normalizarBusca(opcao) !== normalizado)
        : regra.valoresFilho
    }))
    .filter(regra => !(regra.origem === idAtributo && normalizarBusca(regra.valorPai) === normalizado))
    .filter(regra => regra.destino !== idAtributo || (regra.valoresFilho || []).length);

  estadoAtual.atribuicoesEspecificas = (estadoAtual.atribuicoesEspecificas || [])
    .map(regra => ({
      ...regra,
      valoresPai: regra.origem === idAtributo
        ? (regra.valoresPai || []).filter(opcao => normalizarBusca(opcao) !== normalizado)
        : regra.valoresPai
    }))
    .filter(regra => regra.origem !== idAtributo || (regra.valoresPai || []).length);

  estadoAtual.atributosUnicos = (estadoAtual.atributosUnicos || []).filter(regra => {
    const removePai = regra.origem === idAtributo && normalizarBusca(regra.valorPai) === normalizado;
    const removeFilho = regra.destino === idAtributo && normalizarBusca(regra.valorFilho) === normalizado;
    return !removePai && !removeFilho;
  });

  estadoAtual.imagensAnexadas = (estadoAtual.imagensAnexadas || []).map(imagem => ({
    ...imagem,
    vinculos: limparOpcoesImagem(imagem.vinculos, idAtributo, normalizado),
    bloqueios: limparOpcoesImagem(imagem.bloqueios, idAtributo, normalizado)
  }));

  const stage = document.getElementById("protoStage");
  atualizarMapasAtributos(stage);
  salvarEstado();
  redesenharLinhas();
  abrirPainelRelacao(chaveAtual);
}

function limparOpcoesImagem(lista, idAtributo, normalizado) {
  return (lista || [])
    .map(item => ({
      ...item,
      valores: item.atributo === idAtributo
        ? (item.valores || []).filter(opcao => normalizarBusca(opcao) !== normalizado)
        : item.valores
    }))
    .filter(item => item.atributo !== idAtributo || (item.valores || []).length);
}

function limparPainelRelacao() {
  const titulo = document.getElementById("protoPanelTitulo");
  const conteudo = document.getElementById("protoPanelConteudo");

  if (titulo) {
    titulo.textContent = "Nenhuma ligação selecionada";
  }

  if (conteudo) {
    conteudo.className = "proto-panel-empty";
    conteudo.innerHTML = `
      <i class="fa-solid fa-diagram-project"></i>
      <p>Conecte dois cartões para configurar a ligação.</p>
    `;
  }
}

function baixarPrototipo() {
  const blob = new Blob([exportarPrototipoJson(estadoAtual)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const nome = normalizarIdAtributo(estadoAtual.materialBase).slice(0, 80);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome ? `prototipo-atributos-${nome}.json` : "prototipo-atributos.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function configurarImportacaoPrototipo() {
  const botao = document.getElementById("protoImportarJson");
  const entrada = document.getElementById("protoArquivoJson");
  botao.addEventListener("click", () => entrada.click());
  entrada.addEventListener("change", async () => {
    const arquivo = entrada.files[0];
    entrada.value = "";
    if (!arquivo) return;

    const stage = cameraStageConfigurada;
    botao.disabled = true;
    try {
      const conteudo = await arquivo.text();
      if (!stage || cameraStageConfigurada !== stage) return;
      const novo = JSON.stringify(lerPrototipoJson(conteudo));
      const anterior = criarSnapshotEstado();
      if (novo !== anterior) {
        restaurarSnapshotEstado(novo);
        historicoEstados.push(anterior);
        if (historicoEstados.length > 40) historicoEstados.shift();
        futuroEstados = [];
        atualizarBotoesHistorico();
      }
      enquadrarQuadro(stage);
      window.Swal?.fire({
        icon: "success", title: "Protótipo importado", toast: true,
        position: "top-end", timer: 1800, showConfirmButton: false
      });
    } catch (erro) {
      if (cameraStageConfigurada !== stage) return;
      const mensagem = erro.name === "QuotaExceededError"
        ? "O navegador está sem espaço para salvar esta configuração."
        : erro.message || "Não foi possível abrir o arquivo.";
      if (window.Swal) {
        window.Swal.fire({ icon: "error", title: "Não foi possível importar", text: mensagem });
      } else {
        window.alert(mensagem);
      }
    } finally {
      botao.disabled = false;
    }
  });
}

function configurarAcoes() {
  document.getElementById("protoDesfazer")?.addEventListener("click", desfazerAlteracao);
  document.getElementById("protoRefazer")?.addEventListener("click", refazerAlteracao);

  if (!atalhosHistoricoConfigurados) {
    document.addEventListener("keydown", event => {
      if (!event.ctrlKey || event.target.closest("input, textarea, select, .proto-simulator")) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        desfazerAlteracao();
      }
      if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        refazerAlteracao();
      }
    });
    atalhosHistoricoConfigurados = true;
  }

  document.getElementById("protoExportarJson")?.addEventListener("click", baixarPrototipo);
  configurarImportacaoPrototipo();

  document.getElementById("protoLimparTudo")?.addEventListener("click", async () => {
    const confirmar = window.Swal
      ? await window.Swal.fire({
      icon: "warning",
      theme: "dark",
      title: "Limpar protótipo?",
      text: "As conexões e escolhas salvas localmente serão apagadas.",
      showCancelButton: true,
      confirmButtonText: "Limpar",
      cancelButtonText: "Cancelar"
    })
      : { isConfirmed: window.confirm("Limpar conexões e escolhas do protótipo?") };

    if (confirmar && !confirmar.isConfirmed) return;

    estadoAtual = criarEstadoVazio();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoAtual));
    ultimoSnapshotHistorico = criarSnapshotEstado();
    historicoEstados = [];
    futuroEstados = [];
    relacaoSelecionada = null;
    restaurarSnapshotEstado(ultimoSnapshotHistorico);
    const stage = document.getElementById("protoStage");
    if (stage) enquadrarQuadro(stage);
  });

  atualizarBotoesHistorico();
}

function desfazerAlteracao() {
  if (!historicoEstados.length) return;
  const atual = criarSnapshotEstado();
  const anterior = historicoEstados.pop();
  futuroEstados.push(atual);
  restaurarSnapshotEstado(anterior);
}

function refazerAlteracao() {
  if (!futuroEstados.length) return;
  const atual = criarSnapshotEstado();
  const proximo = futuroEstados.pop();
  historicoEstados.push(atual);
  restaurarSnapshotEstado(proximo);
}

function atualizarBotoesHistorico() {
  const desfazer = document.getElementById("protoDesfazer");
  const refazer = document.getElementById("protoRefazer");
  if (desfazer) desfazer.disabled = !historicoEstados.length;
  if (refazer) refazer.disabled = !futuroEstados.length;
}

function atualizarResumo() {
  if (!estadoAtual) return;

  atualizarContadoresNodes();

  const total = calcularVariacoes();
  const totalEl = document.getElementById("protoTotalVariacoes");
  const resumoEl = document.getElementById("protoResumoJson");

  if (totalEl) {
    totalEl.textContent = `${total} variações possíveis`;
  }

  if (resumoEl) {
    resumoEl.value = JSON.stringify({
      materialBase: estadoAtual.materialBase,
      totalVariacoes: total,
      relacoes: estadoAtual.relacoes,
      bloqueios: estadoAtual.bloqueios,
      atribuicoesEspecificas: estadoAtual.atribuicoesEspecificas,
      atributosUnicos: estadoAtual.atributosUnicos,
      imagensAnexadas: estadoAtual.imagensAnexadas,
      materiaisPrincipais: estadoAtual.materiaisPrincipais,
      posicoes: estadoAtual.posicoes,
      atributosExtras: estadoAtual.atributosExtras,
      opcoesPersonalizadas: estadoAtual.opcoesPersonalizadas,
      opcoesRemovidas: estadoAtual.opcoesRemovidas
    }, null, 2);
  }
}

function atualizarContadoresNodes() {
  Object.keys(opcoesAtributos).forEach(nodeId => {
    const valores = new Set();

    Object.entries(estadoAtual.relacoes || {}).forEach(([chave, opcoes]) => {
      const destino = chave.split("::")[1];
      if (destino !== nodeId) return;
      (opcoes || []).forEach(opcao => valores.add(opcao));
    });

    const contador = document.querySelector(`[data-count-for="${nodeId}"]`);
    if (contador) {
      const texto = valores.size === 1 ? "selecionado" : "selecionados";
      contador.textContent = `${valores.size} ${texto}`;
    }
  });
}

function calcularVariacoes() {
  const totais = Object.keys(opcoesAtributos).map(nodeId => {
    const valores = new Set();
    Object.entries(estadoAtual.relacoes || {}).forEach(([chave, opcoes]) => {
      if (chave.split("::")[1] === nodeId) {
        (opcoes || []).forEach(opcao => valores.add(opcao));
      }
    });
    return valores.size || 1;
  });

  return totais.reduce((acc, valor) => acc * valor, 1);
}

function limitar(valor, min, max) {
  return Math.min(Math.max(valor, min), max);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
