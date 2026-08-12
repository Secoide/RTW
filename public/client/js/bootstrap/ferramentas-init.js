const TIPOS_DOCUMENTO = [
  ["PE", "PROJETO ELÉTRICO", "PRANCHAS DE PROJETO EM GERAL, ILUMINAÇÃO, TOMADAS ETC"],
  ["DE", "DIAGRAMA ELÉTRICO", "DIAGRAMAS ELÉTRICOS MULTIFILARES E UNIFILARES DOS QUADROS"],
  ["LM", "LISTA DE MATERIAIS", "LISTAS DE MATERIAIS"],
  ["EL", "ESTUDO LUMINOTÉCNICO", "ESTUDOS LUMINOTÉCNICOS SEM SOFTWARE PARA PROJETOS"],
  ["RL", "RELATÓRIO LUMINOTÉCNICO", "RELATÓRIOS DAS MEDIÇÕES COM LUXÍMETRO"],
  ["LS", "LAUDO SPDA", "LAUDOS DE SPDA EM GERAL"],
  ["PS", "PROJETO SPDA", "PROJETOS DE SPDA EM GERAL"],
  ["LA", "LAUDO ATERRAMENTO", "LAUDOS DE ATERRAMENTO EM GERAL"],
  ["LT", "LAUDO TERMOGRÁFICO", "LAUDOS DE TERMOGRAFIA EM GERAL"],
  ["MD", "MEMORIAL DESCRITIVO", "MEMORIAIS DESCRITIVOS DE PROJETO"],
  ["FD", "FOLHA DE DADOS", "FOLHA DAS DE DADOS (DATASHEETS) DOS EQUIPAMENTOS"],
  ["CF", "CRONOGRAMA FINANCEIRO", "CRONOGRAMA FINANCEIRO EM GERAL"],
  ["CE", "CRONOGRAMA EXECUTIVO", "CRONOGRAMA EXECUTIVO EM GERAL"],
  ["QC", "QUADRO DE CARGAS", "QUADRO DE CARGAS E PLANILHAS DE DIMENSIONAMENTO"],
  ["AR", "ANÁLISE DE RISCO", "ANÁLISE DE RISCO SPDA"],
  ["APR", "ANÁLISE PRELIMINAR DE RISCOS", "ANÁLISES PRELIMINARES DE RISCO"],
  ["ART", "ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA", "DOCUMENTO DA ART QUANDO SEPARADO DOS DEMAIS"],
  ["RTI", "RELATÓRIO TÉCNICO DAS INSPEÇÕES", "RELATÓRIO TÉCNICO DAS INSPEÇÕES NR10"],
  ["PIE", "PRONTUÁRIO DE INSTALAÇÕES ELÉTRICAS", "PRONTUÁRIO DE INSTALAÇÕES ELÉTRICAS NR10"],
  ["AB", "AS BUILT", "DESENHOS OU DIAGRAMAS DE AS BUILT"],
  ["SDAI", "SISTEMA DE DET. E ALARME DE INCÊNDIO", ""],
  ["LRI", "LAUDO DE RESISTÊNCIA DE ISOLAMENTO", "LAUDO DE RESISTÊNCIA DE ISOLAMENTO DE CABOS E OUTRAS ISOLAÇÕES"],
  ["FP", "FLUXOGRAMA DE PAINÉIS", "FLUXOGRAMA DE PAINÉIS ELÉTRICO"],
  ["AE", "ANÁLISE DE ENERGIA", "ANÁLISE DE ENERGIA ELÉTRICA"],
  ["PM", "PLANO DE MANUTENÇÃO", "PLANO DE MANUTENÇÃO E INSPEÇÃO"],
  ["IO", "LISTA DE IO'S", "LISTA DE IO'S"],
  ["RT", "RELATÓRIO TÉCNICO", "RELATÓRIO TÉCNICO DAS ATIVIDADES REALIZADAS"]
];

const state = {
  registros: [],
  paineis: [],
  clientes: [],
  responsaveis: [],
  paineisView: "lista",
  galeria: {
    imagens: [],
    indice: 0
  }
};

const API_PAINEIS = "/api/paineis-eletricos";

const PAINEL_DIMENSOES_BASE = [
  "300X200X200",
  "300X300X200",

  "400X300X200",
  "400X400X200",
  "400X500X200",

  "500X400X200",
  "500X600X200",

  "600X400X200",
  "600X500X200",

  "700X500X200",

  "800X600X200",
  "800X800X400",

  "900X600X200",

  "1000X700X200",
  "1000X800X200",
  "1000X800X300",
  "1000X1100X200",
  "1000X1200X200",

  "1200X800X200",
  "1200X800X300",
  "1200X1000X200",

  "1500X600X200",

  "1700(+100)X600X600",

  "1800X600X400",

  "1900X800X600",
  "1900X800X800",
  "1900+100X600X400",
  "1900+100X800X600",
  "1900+100X1000X600",

  "(1900+100)X(800+600+600)X600",

  "2000X800X600"
];

function byId(id) {
  return document.getElementById(id);
}

function normalizarCampo(valor) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_.'-]/gu, "")
    .toUpperCase();
}

function normalizarSequencia(valor) {
  const limpo = String(valor || "").replace(/\D/g, "");
  if (!limpo) return "";
  return limpo.padStart(2, "0").slice(-2);
}

function normalizarMesAno(valor) {
  const limpo = String(valor || "").replace(/[^\d]/g, "");
  if (limpo.length >= 6) return `${limpo.slice(0, 2)}.${limpo.slice(-4)}`;
  return String(valor || "").trim();
}

function getTipoSelecionado() {
  const sigla = byId("numdocTipo")?.value || "";
  return TIPOS_DOCUMENTO.find(([codigo]) => codigo === sigla) || [sigla, "", ""];
}

function montarResultado(dados = lerFormulario()) {
  const partes = [
    normalizarCampo(dados.os),
    normalizarCampo(dados.contratada),
    normalizarCampo(dados.contratante),
    normalizarCampo(dados.tipo)
  ];

  const sequencia = normalizarSequencia(dados.sequencia);
  if (sequencia) partes.push(sequencia);

  const area = normalizarCampo(dados.area);
  if (area) partes.push(area);

  partes.push(normalizarMesAno(dados.mesAno));
  partes.push(normalizarCampo(dados.rev || "REV00"));

  return partes.filter(Boolean).join("_");
}

function lerFormulario() {
  const contratanteSelect = byId("numdocContratante");
  const contratanteTexto = contratanteSelect?.selectedOptions?.[0]?.textContent || contratanteSelect?.value || "";
  const [tipo] = getTipoSelecionado();

  return {
    id: byId("numdocEditId")?.value || criarIdRegistro(),
    os: byId("numdocOs")?.value || "",
    contratada: byId("numdocContratada")?.value || "",
    contratante: contratanteTexto,
    tipo,
    sequencia: byId("numdocSequencia")?.value || "",
    area: byId("numdocArea")?.value || "",
    mesAno: byId("numdocMesAno")?.value || "",
    rev: byId("numdocRev")?.value || "",
    motivo: byId("numdocMotivo")?.value || ""
  };
}

function criarIdRegistro() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `numdoc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function preencherFormulario(registro) {
  byId("numdocEditId").value = registro.id;
  byId("numdocOs").value = registro.os;
  byId("numdocContratada").value = registro.contratada;
  byId("numdocTipo").value = registro.tipo;
  byId("numdocSequencia").value = registro.sequencia;
  byId("numdocArea").value = registro.area;
  byId("numdocMesAno").value = registro.mesAno;
  byId("numdocRev").value = registro.rev;
  byId("numdocMotivo").value = registro.motivo || "";

  const select = byId("numdocContratante");
  [...select.options].forEach(option => {
    option.selected = option.textContent === registro.contratante;
  });

  byId("numdocSubmitText").textContent = "Salvar edição";
  atualizarResultadoAtual();
}

function limparFormulario() {
  byId("numdocEditId").value = "";
  byId("formNumeracaoDocumento").reset();
  byId("numdocContratada").value = "RTW";
  byId("numdocMesAno").value = gerarMesAnoAtual();
  byId("numdocRev").value = "REV00";
  byId("numdocSequencia").value = "00";
  byId("numdocSubmitText").textContent = "Adicionar";
  atualizarResultadoAtual();
}

function gerarMesAnoAtual() {
  const agora = new Date();
  return `${String(agora.getMonth() + 1).padStart(2, "0")}.${agora.getFullYear()}`;
}

function atualizarResultadoAtual() {
  const input = byId("numdocResultado");
  if (input) input.value = montarResultado();
}

function popularTiposDocumento() {
  const select = byId("numdocTipo");
  select.innerHTML = '<option value="" disabled selected>Selecione...</option>';
  TIPOS_DOCUMENTO.forEach(([sigla, significado, descricao]) => {
    const option = document.createElement("option");
    option.value = sigla;
    option.textContent = `${sigla} - ${significado}`;
    option.title = descricao;
    select.appendChild(option);
  });
}

async function popularClientes() {
  const select = byId("numdocContratante");
  select.innerHTML = '<option value="" disabled selected>Selecione a contratante...</option>';

  try {
    const response = await fetch("/api/empresa", {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const clientes = await response.json();
    clientes.forEach(cliente => {
      const option = document.createElement("option");
      option.value = cliente.id || cliente.id_empresas || cliente.nome;
      option.textContent = cliente.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.warn("Não foi possível carregar contratantes cadastradas.", err);
    ["JTIp", "RTW"].forEach(nome => {
      const option = document.createElement("option");
      option.value = nome.toUpperCase();
      option.textContent = nome.toUpperCase();
      select.appendChild(option);
    });
  }
}

async function popularClientesPainel() {
  const select = byId("painelCliente");
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Carregando clientes...</option>';

  try {
    const clientes = await requestJson("/api/empresa");
    state.clientes = Array.isArray(clientes) ? clientes : [];
    select.innerHTML = '<option value="" disabled selected>Selecione o cliente...</option>';

    state.clientes.forEach(cliente => {
      const option = document.createElement("option");
      option.value = cliente.nome;
      option.textContent = cliente.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.warn("Não foi possível carregar clientes para painel.", err);
    select.innerHTML = '<option value="" disabled selected>Informe o cliente...</option>';
  }
}

async function popularResponsaveisPainel() {
  const select = byId("painelProjetista");
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Carregando responsáveis...</option>';

  try {
    const responsaveis = await requestJson("/api/colaboradores/responsavel/cbx");
    state.responsaveis = Array.isArray(responsaveis) ? responsaveis : [];
    select.innerHTML = '<option value="">Sem projetista definido</option>';

    state.responsaveis.forEach(responsavel => {
      const option = document.createElement("option");
      option.value = responsavel.nome;
      option.textContent = responsavel.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.warn("Não foi possível carregar responsáveis para painel.", err);
    select.innerHTML = '<option value="">Sem projetista definido</option>';
  }
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function boolValue(valor) {
  return valor === true || valor === 1 || valor === "1";
}

async function requestJson(url, options = {}) {
  const fetcher = window.apiFetch || fetch;
  const response = await fetcher(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.erro || data.error || data.mensagem || "Erro ao processar solicitação.");
  }

  return data;
}

function formatarData(valor) {
  if (!valor) return "-";
  const data = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR");
}

function toDateInput(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}

function normalizarAnoPainel() {
  const dataPainel = byId("painelData")?.value || "";
  const ano = dataPainel.slice(0, 4) || new Date().getFullYear();
  return String(ano).replace(/\D/g, "") || new Date().getFullYear();
}

function toast(icon, title) {
  if (window.Toast?.fire) Toast.fire({ icon, title });
}

function initFerramentasTabs() {
  const tabs = document.querySelectorAll("[data-tool-tab]");
  const panels = document.querySelectorAll("[data-tool-panel]");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      

      const target = tab.dataset.toolTab;

      tabs.forEach(item => item.classList.toggle("active", item === tab));
      panels.forEach(panel => panel.classList.toggle("active", panel.dataset.toolPanel === target));
    });
  });
}

function getSaasContextoFerramentas() {
  try {
    return JSON.parse(sessionStorage.getItem("saas_contexto") || "{}");
  } catch {
    return {};
  }
}

function podeUsarFerramenta(chave) {
  if (!chave) return true;

  const contexto = getSaasContextoFerramentas();
  if (!contexto.modo_saas || contexto.acesso_total) return true;

  return Array.isArray(contexto.recursos) && contexto.recursos.includes(chave);
}

function aplicarBloqueiosFerramentas() {
  const tabs = [...document.querySelectorAll("[data-tool-tab][data-feature]")];
  let primeiraLiberada = null;

  tabs.forEach(tab => {
    const bloqueada = !podeUsarFerramenta(tab.dataset.feature);
    tab.classList.toggle("locked", bloqueada);

    const lock = tab.querySelector(".fa-lock");
    if (bloqueada && !lock) {
      tab.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-lock"></i>');
    }

    const panel = document.querySelector(`[data-tool-panel="${tab.dataset.toolTab}"]`);
    if (panel) {
      panel.classList.toggle("saas-tool-locked", bloqueada);
      if (bloqueada && !panel.querySelector(".saas-tool-lock-overlay")) {
        panel.insertAdjacentHTML("afterbegin", `
          <div class="saas-tool-lock-overlay">
            <i class="fa-solid fa-lock"></i>
            <strong>Ferramenta não contratada</strong>
            <span>Esta opção aparece como prévia e pode ser liberada em outro pacote.</span>
          </div>
        `);
      }
    }

    if (!bloqueada && !primeiraLiberada) primeiraLiberada = tab;
  });

  const ativa = document.querySelector("[data-tool-tab].active");
  if (ativa?.classList.contains("locked") && primeiraLiberada) {
    primeiraLiberada.click();
  }
}

function ativarAbaFerramenta(nome) {
  const tab = document.querySelector(`[data-tool-tab="${nome}"]`);
  if (tab) tab.click();
}

function atualizarCampoDimensaoPersonalizada() {
  const select = byId("painelDimensoes");
  const wrap = byId("painelDimensoesCustomWrap");
  if (!select || !wrap) return;

  wrap.classList.toggle("active", select.value === "Personalizado");
  if (select.value !== "Personalizado") byId("painelDimensoesCustom").value = "";
}

function popularDimensoesPainel() {
  const select = byId("painelDimensoes");
  if (!select) return;

  const valorAtual = select.value;
  const dimensoes = new Set(PAINEL_DIMENSOES_BASE);
  state.paineis.forEach(painel => {
    if (painel.dimensoes) dimensoes.add(painel.dimensoes);
  });

  select.innerHTML = '<option value="">Selecione...</option>';
  [...dimensoes].sort().forEach(dimensao => {
    const option = document.createElement("option");
    option.value = dimensao;
    option.textContent = dimensao;
    select.appendChild(option);
  });

  const personalizado = document.createElement("option");
  personalizado.value = "Personalizado";
  personalizado.textContent = "Personalizado";
  select.appendChild(personalizado);

  if ([...select.options].some(option => option.value === valorAtual)) {
    select.value = valorAtual;
  }

  atualizarCampoDimensaoPersonalizada();
}

function selecionarOuAdicionarOpcao(select, valor) {
  if (!select || !valor) return;

  const existe = [...select.options].some(option => option.value === valor);
  if (!existe) {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = valor;
    select.appendChild(option);
  }

  select.value = valor;
}

function abrirQrPainel(link) {
  if (!link) return;

  const modal = byId("painelQrModal");
  const imagem = byId("painelQrImagem");
  const ancora = byId("painelQrLink");
  const status = byId("painelQrStatus");
  if (!modal || !imagem || !ancora) return;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;
  if (status) {
    status.textContent = "Gerando QR Code...";
    status.classList.remove("erro");
  }
  imagem.removeAttribute("hidden");
  imagem.onload = () => {
    if (status) status.textContent = "";
  };
  imagem.onerror = () => {
    imagem.setAttribute("hidden", "hidden");
    if (status) {
      status.textContent = "Não foi possível gerar a imagem do QR Code.";
      status.classList.add("erro");
    }
  };
  imagem.src = qrUrl;
  ancora.href = link;
  ancora.textContent = link;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function fecharQrPainel() {
  const modal = byId("painelQrModal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function getEtapasChecklist() {
  return [
    ["material_separado", "Material separado"],
    ["montagem_realizada", "Montagem realizada"],
    ["testado", "Testado"],
    ["embalado_envio", "Embalado para envio"]
  ];
}

function calcularProgressoPainel(painel) {
  const etapas = getEtapasChecklist();
  const concluidas = etapas.filter(([campo]) => boolValue(painel[campo])).length;
  return {
    total: etapas.length,
    concluidas,
    percentual: Math.round((concluidas / etapas.length) * 100)
  };
}

function getCorProgresso(percentual) {
  if (percentual >= 100) return "linear-gradient(90deg, #4ade80, #16a34a)";
  if (percentual >= 75) return "linear-gradient(90deg, #facc15, #22c55e)";
  if (percentual >= 50) return "linear-gradient(90deg, #fb923c, #facc15)";
  if (percentual >= 25) return "linear-gradient(90deg, #ef4444, #fb923c)";
  return "linear-gradient(90deg, #991b1b, #ef4444)";
}

function abrirGaleriaPainel(painel, indice = 0) {
  const imagens = Array.isArray(painel.imagens) ? painel.imagens : [];
  if (!imagens.length) return;

  state.galeria = {
    painelId: painel.id_painel,
    imagens,
    indice
  };

  atualizarGaleriaPainel();
  byId("painelGaleriaModal")?.classList.add("active");
  byId("painelGaleriaModal")?.setAttribute("aria-hidden", "false");
}

function fecharGaleriaPainel() {
  byId("painelGaleriaModal")?.classList.remove("active");
  byId("painelGaleriaModal")?.setAttribute("aria-hidden", "true");
}

function atualizarGaleriaPainel() {
  const { imagens, indice } = state.galeria;
  const imagem = imagens[indice];
  if (!imagem) return;

  byId("painelGaleriaImagem").src = imagem.imagem_url;
  byId("painelGaleriaAbrir").href = imagem.imagem_url;
  byId("painelGaleriaContador").textContent = `${indice + 1}/${imagens.length}`;
  byId("painelGaleriaExcluir").style.display = imagem.legado ? "none" : "inline-grid";
}

function navegarGaleriaPainel(direcao) {
  const total = state.galeria.imagens.length;
  if (!total) return;

  state.galeria.indice = (state.galeria.indice + direcao + total) % total;
  atualizarGaleriaPainel();
}

function renderTabela() {
  const tbody = byId("numdocTabelaBody");

  if (!state.registros.length) {
    tbody.innerHTML = '<tr class="numdoc-empty-row"><td colspan="11">Nenhum documento adicionado ainda.</td></tr>';
    return;
  }

  tbody.innerHTML = state.registros.map(registro => `
    <tr data-id="${registro.id}">
      <td>${escapeHtml(registro.os)}</td>
      <td>${escapeHtml(registro.contratada)}</td>
      <td>${escapeHtml(registro.contratante)}</td>
      <td>${escapeHtml(registro.tipo)}</td>
      <td>${escapeHtml(normalizarSequencia(registro.sequencia))}</td>
      <td>${escapeHtml(registro.area || "-")}</td>
      <td>${escapeHtml(normalizarMesAno(registro.mesAno))}</td>
      <td>${escapeHtml(registro.rev)}</td>
      <td>${escapeHtml(registro.motivo || "-")}</td>
      <td class="numdoc-result-cell">${escapeHtml(registro.resultado)}</td>
      <td>
        <div class="numdoc-row-actions">
          <button type="button" class="numdoc-icon-btn" data-action="copy" title="Copiar resultado">
            <i class="fa-solid fa-copy"></i>
          </button>
          <button type="button" class="numdoc-icon-btn" data-action="edit" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="numdoc-icon-btn delete" data-action="delete" title="Apagar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    if (window.Toast?.fire) {
      Toast.fire({ icon: "success", title: "Resultado copiado" });
    }
  } catch {
    const input = byId("numdocResultado");
    input.value = texto;
    input.select();
    document.execCommand("copy");
  }
}

function salvarRegistro(event) {
  event.preventDefault();
  const registro = lerFormulario();
  registro.sequencia = normalizarSequencia(registro.sequencia);
  registro.mesAno = normalizarMesAno(registro.mesAno);
  registro.rev = normalizarCampo(registro.rev || "REV00");
  registro.resultado = montarResultado(registro);

  const index = state.registros.findIndex(item => item.id === registro.id);
  if (index >= 0) state.registros[index] = registro;
  else state.registros.unshift(registro);

  renderTabela();
  atualizarResultadoAtual();
}

function lerFormularioPainel() {
  const dimensoesSelecionada = byId("painelDimensoes")?.value || "";
  const dimensoes = dimensoesSelecionada === "Personalizado"
    ? byId("painelDimensoesCustom")?.value || ""
    : dimensoesSelecionada;
  const mesAno = byId("painelData")?.value || "";

  return {
    cliente: byId("painelCliente")?.value || "",
    atuacao_painel: byId("painelAtuacao")?.value || "",
    art: byId("painelArt")?.value || "",
    numero_serie: byId("painelNumeroSerie")?.value || "",
    data_registro: mesAno ? `${mesAno}-01` : null,
    tensao: byId("painelTensao")?.value || "",
    frequencia: byId("painelFrequencia")?.value || "",
    dimensoes,
    ano: normalizarAnoPainel(),
    senha: byId("painelSenha")?.value || "",
    peso_kg: byId("painelPeso")?.value || "",
    projetista: byId("painelProjetista")?.value || "",
    montador: byId("painelMontador")?.value || "",
    link_externo: byId("painelLinkExterno")?.value || ""
  };
}

async function gerarNumeroSeriePainel() {
  const input = byId("painelNumeroSerie");
  if (!input) return;

  input.value = "Gerando...";
  try {
    const data = await requestJson(`${API_PAINEIS}/proximo-numero?ano=${encodeURIComponent(normalizarAnoPainel())}`);
    input.value = data.numero_serie || "";
  } catch (err) {
    input.value = "";
    toast("error", err.message);
  }
}

async function limparFormularioPainel() {
  byId("painelEditId").value = "";
  byId("formPainelEletrico")?.reset();
  byId("painelTensao").value = "380V";
  byId("painelFrequencia").value = "60Hz";
  const agora = new Date();
  byId("painelData").value = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  byId("painelDimensoes").value = "";
  atualizarCampoDimensaoPersonalizada();
  byId("painelSubmitText").textContent = "Salvar painel";
  await gerarNumeroSeriePainel();
}

function preencherFormularioPainel(painel) {
  byId("painelEditId").value = painel.id_painel;
  selecionarOuAdicionarOpcao(byId("painelCliente"), painel.cliente || "");
  byId("painelAtuacao").value = painel.atuacao_painel || "";
  byId("painelArt").value = painel.art || "";
  byId("painelNumeroSerie").value = painel.numero_serie || "";
  byId("painelData").value = toDateInput(painel.data_registro).slice(0, 7);
  byId("painelTensao").value = painel.tensao || "";
  byId("painelFrequencia").value = painel.frequencia || "";
  const dimensoesSelect = byId("painelDimensoes");
  const dimensoesExiste = [...dimensoesSelect.options].some(option => option.value === painel.dimensoes);
  dimensoesSelect.value = dimensoesExiste ? painel.dimensoes || "" : "Personalizado";
  byId("painelDimensoesCustom").value = dimensoesExiste ? "" : painel.dimensoes || "";
  atualizarCampoDimensaoPersonalizada();
  byId("painelSenha").value = painel.senha || "";
  byId("painelPeso").value = painel.peso_kg ?? "";
  selecionarOuAdicionarOpcao(byId("painelProjetista"), painel.projetista || "");
  byId("painelMontador").value = painel.montador || "";
  byId("painelLinkExterno").value = painel.link_externo || "";
  byId("painelSubmitText").textContent = "Salvar edição";
  byId("formPainelEletrico")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function carregarPaineis() {
  const tbody = byId("paineisTabelaBody");
  if (!tbody) return;

  tbody.innerHTML = '<tr class="numdoc-empty-row"><td colspan="17">Carregando painéis...</td></tr>';

  try {
    state.paineis = await requestJson(API_PAINEIS);
    popularDimensoesPainel();
    renderPaineis();
  } catch (err) {
    console.error("Erro ao carregar painéis elétricos:", err);
    tbody.innerHTML = `<tr class="numdoc-empty-row"><td colspan="17">${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderChecklistPainel(painel) {
  const etapas = getEtapasChecklist();
  const progresso = calcularProgressoPainel(painel);

  return `
    <div class="painel-checklist-wrap">
      <button type="button" class="painel-progress-btn" data-action="toggle-checklist" title="Abrir checklist">
        <span class="painel-progress-info">
          <strong>${progresso.percentual}%</strong>
          <small>${progresso.concluidas}/${progresso.total}</small>
        </span>
        <span class="painel-progress-bar">
          <span style="width: ${progresso.percentual}%; --painel-progress-color: ${getCorProgresso(progresso.percentual)}"></span>
        </span>
      </button>
      <div class="painel-checklist">
        ${etapas.map(([campo, label]) => `
          <label class="painel-check" title="${escapeHtml(label)}">
            <input type="checkbox" data-check="${campo}" ${boolValue(painel[campo]) ? "checked" : ""}>
            <span>${escapeHtml(label)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function renderImagemPainel(painel) {
  const total = Array.isArray(painel.imagens) ? painel.imagens.length : 0;
  const link = total
    ? `<button type="button" class="numdoc-icon-btn painel-image-link" data-action="view-gallery" title="Visualizar galeria">
        <i class="fa-solid fa-eye"></i>
      </button>
      <span class="painel-muted">${total} foto${total > 1 ? "s" : ""}</span>`
    : '<span class="painel-muted">Sem imagem</span>';

  return `
    <div class="painel-imagem-cell">
      ${link}
      <label class="painel-upload-btn" title="Adicionar imagens montadas">
        <i class="fa-solid fa-image"></i>
        <input type="file" accept="image/*" data-action="upload-image" multiple>
      </label>
    </div>
  `;
}

function getImagemPrincipalPainel(painel) {
  const imagens = Array.isArray(painel.imagens) ? painel.imagens : [];
  return imagens[0]?.imagem_url || painel.imagem_url || "";
}

function renderFotoCardPainel(painel) {
  const imagem = getImagemPrincipalPainel(painel);
  if (imagem) {
    return `<img src="${escapeHtml(imagem)}" alt="Foto do painel ${escapeHtml(painel.numero_serie || "")}" loading="lazy">`;
  }

  return `
    <div class="painel-card-placeholder" aria-hidden="true">
      <i class="fa-solid fa-image"></i>
    </div>
  `;
}

function renderLinkPainel(painel) {
  if (!painel.link_externo) return '<span class="painel-muted">Sem link</span>';

  return `
    <div class="painel-row-actions">
      <a class="numdoc-icon-btn" href="${escapeHtml(painel.link_externo)}" target="_blank" rel="noopener" title="Abrir link externo">
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
      <button type="button" class="numdoc-icon-btn" data-action="qr-link" title="Gerar QR Code do link">
        <i class="fa-solid fa-qrcode"></i>
      </button>
    </div>
  `;
}

function renderPainelCardInfo(label, valor) {
  const texto = valor || "-";
  return `
    <span class="painel-card-info" title="${escapeHtml(label)}: ${escapeHtml(texto)}">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(texto)}</strong>
    </span>
  `;
}

function renderPainelCard(painel) {
  const progresso = calcularProgressoPainel(painel);
  const totalFotos = Array.isArray(painel.imagens) ? painel.imagens.length : 0;
  const tooltipCard = [
    `Cliente: ${painel.cliente || "-"}`,
    `Atuacao: ${painel.atuacao_painel || "-"}`,
    `Serie: ${painel.numero_serie || "-"}`
  ].join(" | ");

  return `
    <article class="painel-card-registro" data-id="${painel.id_painel}" title="${escapeHtml(tooltipCard)}">
      <div class="painel-card-body">
        <header class="painel-card-header">
          <div>
            <span>${escapeHtml(painel.cliente || "Cliente não informado")}</span>
            <h4>${escapeHtml(painel.atuacao_painel || "Sem descrição informada")}</h4>
          </div>
          <span class="painel-card-serie">${escapeHtml(painel.numero_serie)}</span>
        </header>

        <div class="painel-card-progress">
          <span>
            <strong>${progresso.percentual}%</strong>
            <small>${progresso.concluidas}/${progresso.total} etapas</small>
          </span>
          <div class="painel-progress-bar">
            <span style="width: ${progresso.percentual}%; --painel-progress-color: ${getCorProgresso(progresso.percentual)}"></span>
          </div>
        </div>

        <div class="painel-card-grid">
          ${renderPainelCardInfo("Data", formatarData(painel.data_registro))}
          ${renderPainelCardInfo("Tensão", painel.tensao)}
          ${renderPainelCardInfo("Freq.", painel.frequencia)}
          ${renderPainelCardInfo("Dimensões", painel.dimensoes)}
          ${renderPainelCardInfo("Projetista", painel.projetista)}
          ${renderPainelCardInfo("Montador", painel.montador)}
          ${renderPainelCardInfo("ART", painel.art)}
          ${renderPainelCardInfo("Peso kg", painel.peso_kg ?? "-")}
        </div>

        <footer class="painel-card-actions">
          <div class="painel-card-links">
            ${painel.link_externo ? `
              <button type="button" class="numdoc-icon-btn" data-action="qr-link" title="Gerar QR Code">
                <i class="fa-solid fa-qrcode"></i>
              </button>
            ` : ""}
            ${totalFotos ? `
              <button type="button" class="numdoc-icon-btn" data-action="view-gallery" title="Visualizar galeria">
                <i class="fa-solid fa-eye"></i>
              </button>
            ` : ""}
          </div>
          <div class="painel-card-manage">
            <label class="painel-upload-btn" title="Adicionar imagens montadas">
              <i class="fa-solid fa-image"></i>
              <input type="file" accept="image/*" data-action="upload-image" multiple>
            </label>
            <button type="button" class="numdoc-icon-btn" data-action="edit-panel" title="Editar painel">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="numdoc-icon-btn delete" data-action="delete-panel" title="Excluir painel">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </footer>
      </div>
    </article>
  `;
}

function renderPaineisCards() {
  const cards = byId("paineisCards");
  if (!cards) return;

  if (!state.paineis.length) {
    cards.innerHTML = '<div class="painel-cards-empty">Nenhum painel cadastrado ainda.</div>';
    return;
  }

  cards.innerHTML = state.paineis.map(renderPainelCard).join("");
}

function aplicarVisualizacaoPaineis() {
  const mostrarCards = state.paineisView === "cards";
  byId("paineisCards")?.toggleAttribute("hidden", !mostrarCards);
  document.querySelector(".painel-table-wrap")?.toggleAttribute("hidden", mostrarCards);

  document.querySelectorAll(".painel-view-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.painelView === state.paineisView);
  });
}

function renderPaineis() {
  const tbody = byId("paineisTabelaBody");
  if (!tbody) return;

  if (!state.paineis.length) {
    tbody.innerHTML = '<tr class="numdoc-empty-row"><td colspan="17">Nenhum painel cadastrado ainda.</td></tr>';
    renderPaineisCards();
    aplicarVisualizacaoPaineis();
    return;
  }

  const focoPainel = sessionStorage.getItem("ferramentas_focus_painel");

  tbody.innerHTML = state.paineis.map(painel => `
    <tr data-id="${painel.id_painel}" class="${String(painel.id_painel) === focoPainel ? "painel-row-focus" : ""}">
      <td>${escapeHtml(painel.cliente)}</td>
      <td>${escapeHtml(painel.atuacao_painel || "-")}</td>
      <td>${escapeHtml(painel.art || "-")}</td>
      <td>${escapeHtml(painel.numero_serie)}</td>
      <td>${escapeHtml(formatarData(painel.data_registro))}</td>
      <td>${escapeHtml(painel.tensao || "-")}</td>
      <td>${escapeHtml(painel.frequencia || "-")}</td>
      <td>${escapeHtml(painel.dimensoes || "-")}</td>
      <td>${escapeHtml(painel.ano || "-")}</td>
      <td>${escapeHtml(painel.senha || "-")}</td>
      <td>${escapeHtml(painel.peso_kg ?? "-")}</td>
      <td>${escapeHtml(painel.projetista || "-")}</td>
      <td>${escapeHtml(painel.montador || "-")}</td>
      <td>${renderLinkPainel(painel)}</td>
      <td>${renderChecklistPainel(painel)}</td>
      <td>${renderImagemPainel(painel)}</td>
      <td>
        <div class="painel-row-actions">
          <button type="button" class="numdoc-icon-btn" data-action="edit-panel" title="Editar painel">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="numdoc-icon-btn delete" data-action="delete-panel" title="Excluir painel">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  renderPaineisCards();
  aplicarVisualizacaoPaineis();

  if (focoPainel) {
    const row = tbody.querySelector(`tr[data-id="${CSS.escape(focoPainel)}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setTimeout(() => row.classList.remove("painel-row-focus"), 6000);
    }
    sessionStorage.removeItem("ferramentas_focus_painel");
  }
}

async function salvarPainel(event) {
  event.preventDefault();

  const id = byId("painelEditId")?.value;
  const payload = lerFormularioPainel();
  const url = id ? `${API_PAINEIS}/${id}` : API_PAINEIS;
  const method = id ? "PUT" : "POST";

  try {
    await requestJson(url, {
      method,
      body: JSON.stringify(payload)
    });

    toast("success", id ? "Painel atualizado" : "Painel cadastrado");
    limparFormularioPainel();
    await carregarPaineis();
  } catch (err) {
    toast("error", err.message);
  }
}

async function atualizarChecklistPainel(row, input) {
  const id = row?.dataset.id;
  if (!id) return;

  const payload = {};
  row.querySelectorAll("input[data-check]").forEach(check => {
    payload[check.dataset.check] = check.checked;
  });

  try {
    const result = await requestJson(`${API_PAINEIS}/${id}/checklist`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });

    const index = state.paineis.findIndex(item => String(item.id_painel) === String(id));
    if (index >= 0) state.paineis[index] = result.painel;
    renderPaineis();
    toast("success", "Checklist atualizado");
  } catch (err) {
    input.checked = !input.checked;
    toast("error", err.message);
  }
}

async function enviarImagemPainel(row, input) {
  const id = row?.dataset.id;
  const files = [...(input.files || [])];
  if (!id || !files.length) return;

  const formData = new FormData();
  files.forEach(file => formData.append("imagens", file));

  try {
    const result = await requestJson(`${API_PAINEIS}/${id}/imagem`, {
      method: "POST",
      body: formData
    });

    const index = state.paineis.findIndex(item => String(item.id_painel) === String(id));
    if (index >= 0) state.paineis[index] = result.painel;
    renderPaineis();
    toast("success", files.length > 1 ? "Imagens adicionadas" : "Imagem adicionada");
  } catch (err) {
    toast("error", err.message);
  } finally {
    input.value = "";
  }
}

async function excluirImagemGaleriaAtual() {
  const imagem = state.galeria.imagens[state.galeria.indice];
  if (!imagem || imagem.legado) return;

  const confirmar = window.Swal
    ? await Swal.fire({
      title: "Excluir imagem?",
      text: "A foto será removida da galeria do painel.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ee7722"
    })
    : { isConfirmed: confirm("Excluir imagem do painel?") };

  if (!confirmar.isConfirmed) return;

  try {
    const result = await requestJson(`${API_PAINEIS}/imagem/${imagem.id_imagem}`, { method: "DELETE" });
    const index = state.paineis.findIndex(item => String(item.id_painel) === String(result.painel.id_painel));
    if (index >= 0) state.paineis[index] = result.painel;

    renderPaineis();

    if (!result.painel.imagens?.length) {
      fecharGaleriaPainel();
      return;
    }

    abrirGaleriaPainel(result.painel, Math.min(state.galeria.indice, result.painel.imagens.length - 1));
    toast("success", "Imagem excluída");
  } catch (err) {
    toast("error", err.message);
  }
}

async function excluirPainel(painel) {
  const confirmar = window.Swal
    ? await Swal.fire({
      title: "Excluir painel?",
      text: `O registro ${painel.numero_serie} será removido.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ee7722"
    })
    : { isConfirmed: confirm(`Excluir painel ${painel.numero_serie}?`) };

  if (!confirmar.isConfirmed) return;

  try {
    await requestJson(`${API_PAINEIS}/${painel.id_painel}`, { method: "DELETE" });
    state.paineis = state.paineis.filter(item => item.id_painel !== painel.id_painel);
    renderPaineis();
    toast("success", "Painel excluído");
  } catch (err) {
    toast("error", err.message);
  }
}

function initEventos() {
  byId("formNumeracaoDocumento")?.addEventListener("submit", salvarRegistro);
  byId("btnLimparNumeracao")?.addEventListener("click", limparFormulario);
  byId("btnCopiarResultadoAtual")?.addEventListener("click", () => copiarTexto(byId("numdocResultado").value));
  byId("formPainelEletrico")?.addEventListener("submit", salvarPainel);
  byId("btnLimparPainel")?.addEventListener("click", limparFormularioPainel);
  byId("painelDimensoes")?.addEventListener("change", atualizarCampoDimensaoPersonalizada);
  byId("painelData")?.addEventListener("change", () => {
    if (!byId("painelEditId")?.value) gerarNumeroSeriePainel();
  });
  byId("painelQrFechar")?.addEventListener("click", fecharQrPainel);
  byId("painelQrModal")?.addEventListener("click", (event) => {
    if (event.target.id === "painelQrModal") fecharQrPainel();
  });
  byId("painelGaleriaFechar")?.addEventListener("click", fecharGaleriaPainel);
  byId("painelGaleriaModal")?.addEventListener("click", (event) => {
    if (event.target.id === "painelGaleriaModal") fecharGaleriaPainel();
  });
  byId("painelGaleriaAnterior")?.addEventListener("click", () => navegarGaleriaPainel(-1));
  byId("painelGaleriaProxima")?.addEventListener("click", () => navegarGaleriaPainel(1));
  byId("painelGaleriaExcluir")?.addEventListener("click", excluirImagemGaleriaAtual);

  document.querySelectorAll(".painel-view-btn").forEach(button => {
    button.addEventListener("click", () => {
      state.paineisView = button.dataset.painelView || "lista";
      aplicarVisualizacaoPaineis();
    });
  });

  document.querySelectorAll("#formNumeracaoDocumento input, #formNumeracaoDocumento select").forEach(input => {
    input.addEventListener("input", atualizarResultadoAtual);
    input.addEventListener("change", atualizarResultadoAtual);
  });

  byId("numdocTabelaBody")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const row = button.closest("tr[data-id]");
    const registro = state.registros.find(item => item.id === row?.dataset.id);
    if (!registro) return;

    if (button.dataset.action === "copy") copiarTexto(registro.resultado);
    if (button.dataset.action === "edit") preencherFormulario(registro);
    if (button.dataset.action === "delete") {
      state.registros = state.registros.filter(item => item.id !== registro.id);
      renderTabela();
    }
  });

  const handlePainelClick = (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const container = button.closest("[data-id]");
    const painel = state.paineis.find(item => String(item.id_painel) === container?.dataset.id);
    if (!painel) return;

    if (button.dataset.action === "edit-panel") preencherFormularioPainel(painel);
    if (button.dataset.action === "delete-panel") excluirPainel(painel);
    if (button.dataset.action === "qr-link") abrirQrPainel(painel.link_externo);
    if (button.dataset.action === "view-gallery") abrirGaleriaPainel(painel);
    if (button.dataset.action === "toggle-checklist") {
      container.querySelector(".painel-checklist")?.classList.toggle("active");
    }
  };

  byId("paineisTabelaBody")?.addEventListener("click", handlePainelClick);
  byId("paineisCards")?.addEventListener("click", handlePainelClick);

  const handlePainelChange = (event) => {
    const check = event.target.closest("input[data-check]");
    const upload = event.target.closest("input[data-action='upload-image']");

    if (check) atualizarChecklistPainel(check.closest("[data-id]"), check);
    if (upload) enviarImagemPainel(upload.closest("[data-id]"), upload);
  };

  byId("paineisTabelaBody")?.addEventListener("change", handlePainelChange);
  byId("paineisCards")?.addEventListener("change", handlePainelChange);
}

export async function initFerramentas() {
  initFerramentasTabs();
  aplicarBloqueiosFerramentas();
  if (sessionStorage.getItem("ferramentas_focus_painel")) ativarAbaFerramenta("paineis");
  popularTiposDocumento();
  await Promise.all([
    popularClientes(),
    popularClientesPainel(),
    popularResponsaveisPainel()
  ]);
  limparFormulario();
  await limparFormularioPainel();
  renderTabela();
  initEventos();
  await carregarPaineis();
}
