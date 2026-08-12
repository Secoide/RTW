import { initMaterialModal } from "../events/forms/material.modal.events.js";
import { initMaterialForm } from "../components/material/material.form.events.js";
import { initMaterialAutocompleteModal } from "../components/material/material.autocomplete.events.js";
import { initMaterialAtributosModal } from "../components/material/material.atributos.events.js";
import { initMaterialSave } from "../components/material/material.save.events.js";
import { carregarVariacoes } from "../services/api/material.api.js";
import { abrirModalMaterial, atualizarEstadoImagemMaterial, atualizarModoModalMaterial } from "../components/forms/material.modal.js";
import { materialState as state } from "../state/material.state.js";
import { renderAtributos } from "../utils/dom/material.atributos.render.js";
import { ATRIBUTOS_POR_MATERIAL } from "../utils/material/material.config.js";
import { normalizarAtributo, parseAtributos } from "../utils/material/material.utils.js";

const estadoMateriais = {
  pagina: 1,
  limite: 50,
  total: 0,
  busca: "",
  categoria: "",
  categorias: [],
  linhas: [],
  editando: null,
  timerBusca: null,
  ordenacao: {
    coluna: null,
    direcao: "asc"
  }
};

const COLUNAS_CATALOGO = {
  0: "id",
  1: "categoria",
  2: "imagem",
  3: "descricao",
  4: "codigo",
  5: "fabricante",
  6: "unidade",
  7: "valor_orcamento_atual",
  8: "media_fornecedor_ultimos5"
};

const moedaBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseValor(valor) {
  if (typeof valor === "number") return valor;
  const texto = String(valor || "").replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function formatarValor(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? moedaBR.format(numero) : "-";
}

function montarSrcImagemMaterial(item) {
  if (!item?.imagem) return "";

  const separador = String(item.imagem).includes("?") ? "&" : "?";
  const versao = item.versao_foto || Date.now();

  return `${item.imagem}${separador}v=${encodeURIComponent(versao)}`;
}

async function apiCatalogo(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || "Erro ao consultar materiais.");
  return data;
}

export async function initMateriais() {
  if (!el("materiaisCatalogo")) return;

  estadoMateriais.pagina = 1;
  estadoMateriais.busca = "";
  estadoMateriais.categoria = "";
  estadoMateriais.editando = null;

  initMaterialModal();
  initMaterialForm();
  initMaterialAutocompleteModal();
  initMaterialAtributosModal();
  initMaterialSave();

  el("materiaisCatalogoBusca")?.addEventListener("input", event => {
    clearTimeout(estadoMateriais.timerBusca);
    estadoMateriais.timerBusca = setTimeout(() => {
      estadoMateriais.busca = event.target.value.trim();
      estadoMateriais.pagina = 1;
      carregarMateriaisCatalogo();
    }, 250);
  });

  el("btnAtualizarMateriaisCatalogo")?.addEventListener("click", () => carregarMateriaisCatalogo());

  el("materiaisCatalogoCategoria")?.addEventListener("change", event => {
    estadoMateriais.categoria = event.target.value || "";
    estadoMateriais.pagina = 1;
    carregarMateriaisCatalogo();
  });

  el("materiaisCatalogoTabela")?.addEventListener("click", event => {
    const th = event.target.closest("th");
    if (th && th.parentElement?.parentElement?.tagName === "THEAD") {
      ordenarCatalogo(th);
      return;
    }

    const botao = event.target.closest("[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    if (botao.dataset.acao === "editar") editarLinha(id);
    if (botao.dataset.acao === "abrir-cadastro") abrirCadastroMaterial(id);
    if (botao.dataset.acao === "apagar") apagarMaterial(id);
    if (botao.dataset.acao === "cancelar") cancelarEdicao();
    if (botao.dataset.acao === "salvar") salvarLinha(id);
  });

  el("materiaisCatalogoPaginacao")?.addEventListener("click", event => {
    const botao = event.target.closest("[data-pagina]");
    if (!botao || botao.disabled) return;
    estadoMateriais.pagina = Number(botao.dataset.pagina);
    carregarMateriaisCatalogo();
  });

  await carregarVariacoes();
  window.carregarCatalogoMateriais = carregarMateriaisCatalogo;
  carregarMateriaisCatalogo();
}

async function carregarMateriaisCatalogo() {
  const tbody = el("materiaisCatalogoTabela")?.querySelector("tbody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="10" class="materiais-catalogo-empty">Carregando materiais...</td></tr>`;
  }

  try {
    const query = new URLSearchParams({
      pagina: estadoMateriais.pagina,
      limite: estadoMateriais.limite,
      busca: estadoMateriais.busca,
      categoria: estadoMateriais.categoria
    });

    const resposta = await apiCatalogo(`/api/materiais/catalogo?${query.toString()}`);
    estadoMateriais.linhas = resposta.dados || [];
    estadoMateriais.total = Number(resposta.total || 0);
    estadoMateriais.pagina = Number(resposta.pagina || estadoMateriais.pagina);
    estadoMateriais.categorias = resposta.categorias || estadoMateriais.categorias || [];
    renderFiltroCategoriasCatalogo();
    renderTabela();
    renderPaginacao();
  } catch (err) {
    console.error(err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="10" class="materiais-catalogo-empty erro">Não foi possível carregar os materiais.</td></tr>`;
    }
  }
}

function renderTabela() {
  const tbody = el("materiaisCatalogoTabela")?.querySelector("tbody");
  const resumo = el("materiaisCatalogoResumo");
  if (!tbody) return;

  const inicio = estadoMateriais.total ? ((estadoMateriais.pagina - 1) * estadoMateriais.limite) + 1 : 0;
  const fim = Math.min(estadoMateriais.pagina * estadoMateriais.limite, estadoMateriais.total);
  if (resumo) resumo.textContent = `${inicio}-${fim} de ${estadoMateriais.total} material(is)`;

  if (!estadoMateriais.linhas.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="materiais-catalogo-empty">Nenhum material encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = getLinhasCatalogoOrdenadas().map(item => {
    const editando = estadoMateriais.editando === Number(item.id);
    return `
      <tr data-id="${item.id}">
        <td class="materiais-catalogo-id">${item.id}</td>
        <td class="materiais-catalogo-categoria">${escapeHtml(item.categoria || "-")}</td>
        <td class="materiais-catalogo-foto">
          ${item.imagem
            ? `<img class="materiais-catalogo-img" src="${escapeHtml(montarSrcImagemMaterial(item))}" alt="${escapeHtml(item.descricao)}" loading="lazy" onerror="this.replaceWith(this.nextElementSibling)">
               <span class="materiais-catalogo-sem-img" hidden><i class="fa-solid fa-image"></i></span>`
            : `<span class="materiais-catalogo-sem-img"><i class="fa-solid fa-image"></i></span>`}
        </td>
        <td>
          <div class="materiais-catalogo-desc">
            <strong>${escapeHtml(item.descricao)}</strong>
            ${item.atributos ? `<small>${escapeHtml(item.atributos)}</small>` : ""}
          </div>
        </td>
        <td>${escapeHtml(item.codigo || "-")}</td>
        <td>${escapeHtml(item.fabricante || "-")}</td>
        <td>${editando ? `<input class="materiais-catalogo-input" data-campo="unidade" value="${escapeHtml(item.unidade || "")}" placeholder="Ex: un, m, kg">` : escapeHtml(item.unidade || "-")}</td>
        <td>${editando ? `<input class="materiais-catalogo-input" data-campo="valor_orcamento_atual" value="${escapeHtml(item.valor_orcamento_atual || "")}" inputmode="decimal" placeholder="0,00">` : `<strong class="materiais-catalogo-valor">${formatarValor(item.valor_orcamento_atual)}</strong>`}</td>
        <td>${renderMediaFornecedores(item)}</td>
        <td class="col-acoes">
          ${editando ? `
            <button type="button" class="materiais-catalogo-btn salvar" data-acao="salvar" data-id="${item.id}" title="Salvar alteração">
              <i class="fa-solid fa-floppy-disk"></i>
            </button>
            <button type="button" class="materiais-catalogo-btn cancelar" data-acao="cancelar" data-id="${item.id}" title="Cancelar edição">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : `
            <button type="button" class="materiais-catalogo-btn" data-acao="editar" data-id="${item.id}" title="Editar unidade e valor base">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="materiais-catalogo-btn" data-acao="abrir-cadastro" data-id="${item.id}" title="Abrir no cadastro completo">
              <i class="fa-solid fa-up-right-from-square"></i>
            </button>
            <button type="button" class="materiais-catalogo-btn apagar" data-acao="apagar" data-id="${item.id}" title="Apagar material">
              <i class="fa-solid fa-trash"></i>
            </button>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

function ordenarCatalogo(th) {
  const coluna = COLUNAS_CATALOGO[th.cellIndex];

  if (!coluna) return;

  if (estadoMateriais.ordenacao.coluna === coluna) {
    estadoMateriais.ordenacao.direcao = estadoMateriais.ordenacao.direcao === "asc" ? "desc" : "asc";
  } else {
    estadoMateriais.ordenacao.coluna = coluna;
    estadoMateriais.ordenacao.direcao = "asc";
  }

  el("materiaisCatalogoTabela")
    ?.querySelectorAll("th")
    .forEach(item => item.classList.remove("sort-asc", "sort-desc"));

  th.classList.add(estadoMateriais.ordenacao.direcao === "asc" ? "sort-asc" : "sort-desc");
  renderTabela();
}

function getLinhasCatalogoOrdenadas() {
  const { coluna, direcao } = estadoMateriais.ordenacao;

  if (!coluna) return estadoMateriais.linhas;

  return [...estadoMateriais.linhas].sort((a, b) => {
    let valA = a[coluna] ?? "";
    let valB = b[coluna] ?? "";
    const numA = Number(valA);
    const numB = Number(valB);

    if (valA !== "" && valB !== "" && !Number.isNaN(numA) && !Number.isNaN(numB)) {
      valA = numA;
      valB = numB;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return direcao === "asc" ? -1 : 1;
    if (valA > valB) return direcao === "asc" ? 1 : -1;
    return 0;
  });
}

function renderPaginacao() {
  const container = el("materiaisCatalogoPaginacao");
  if (!container) return;

  const totalPaginas = Math.max(Math.ceil(estadoMateriais.total / estadoMateriais.limite), 1);
  estadoMateriais.pagina = Math.min(Math.max(Number(estadoMateriais.pagina) || 1, 1), totalPaginas);

  const paginas = [];
  const inicio = Math.max(1, estadoMateriais.pagina - 2);
  const fim = Math.min(totalPaginas, estadoMateriais.pagina + 2);

  if (totalPaginas <= 1) {
    container.innerHTML = "";
    return;
  }

  paginas.push(`<button data-pagina="${estadoMateriais.pagina - 1}" ${estadoMateriais.pagina <= 1 ? "disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button>`);
  for (let i = inicio; i <= fim; i++) {
    paginas.push(`<button data-pagina="${i}" class="${i === estadoMateriais.pagina ? "ativo" : ""}">${i}</button>`);
  }
  paginas.push(`<button data-pagina="${estadoMateriais.pagina + 1}" ${estadoMateriais.pagina >= totalPaginas ? "disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button>`);

  container.innerHTML = paginas.join("");
}

function renderFiltroCategoriasCatalogo() {
  const select = el("materiaisCatalogoCategoria");
  if (!select) return;

  const atual = estadoMateriais.categoria || "";
  const categorias = [...new Set((estadoMateriais.categorias || [])
    .map(categoria => String(categoria || "").trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

  select.innerHTML = [
    `<option value="">Todas categorias</option>`,
    ...categorias.map(categoria => `<option value="${escapeHtml(categoria)}">${escapeHtml(categoria)}</option>`)
  ].join("");

  select.value = categorias.includes(atual) ? atual : "";
  if (atual && !categorias.includes(atual)) estadoMateriais.categoria = "";
}

function renderMediaFornecedores(item) {
  const media = Number(item.media_fornecedor_ultimos5);
  const quantidade = Number(item.media_fornecedor_qtd || 0);

  if (!Number.isFinite(media) || media <= 0 || quantidade <= 0) {
    return `<span class="materiais-catalogo-media vazio">Sem histórico</span>`;
  }

  return `
    <div class="materiais-catalogo-media">
      <strong>${formatarValor(media)}</strong>
      <small>${quantidade} orçamento(s)</small>
    </div>
  `;
}

function editarLinha(id) {
  estadoMateriais.editando = id;
  renderTabela();
}

function cancelarEdicao() {
  estadoMateriais.editando = null;
  renderTabela();
}

async function abrirCadastroMaterial(id) {
  const item = estadoMateriais.linhas.find(linha => Number(linha.id) === Number(id));
  if (!item) return;

  abrirModalMaterial();

  $("#nomeMaterial").val(item.descricao || "");
  $("#categoriaMaterial").val(item.categoria || "");
  $("#codigo").val(item.codigo || "");
  $("#fabricante").val(item.fabricante || "");
  $("#idMaterial").val(item.id);
  $("#imagemMaterialOrigemId").val("");
  $("#imagemMaterialOrigemTexto").text("");
  $("#materialImagemExistentePainel").prop("hidden", true);
  $("#buscaImagemMaterialExistente").val("");
  $("#modoEdicaoMaterial").val("1");
  $("#btnSalvarMaterial").text("Salvar edição");
  $("#materialEdicaoTexto").text("");
  $("#materialEdicaoPainel").prop("hidden", true).removeClass("editando").hide();
  $("#variacoesExistentes").addClass("somente-visualizacao");
  atualizarModoModalMaterial("edicao", "Editando material");
  atualizarEstadoImagemMaterial();

  const fotoURL = item.imagem ? `${item.imagem}?v=${Date.now()}` : null;
  $("#imagemmaterial")
    .off("error")
    .attr("src", fotoURL?.startsWith("http") ? fotoURL : "/imagens/imagemmaterial.webp")
    .on("error", function () {
      $(this).attr("src", "/imagens/imagemmaterial.webp");
    });

  preencherAtributosMaterial(item);
}

function preencherAtributosMaterial(item) {
  let atributosObj = {};
  try {
    atributosObj = parseAtributos(item.atributos || "");
  } catch (err) {
    console.warn("Erro ao carregar atributos do material:", err);
  }

  const nomeKey = String(item.descricao || "").toUpperCase();
  state.atributosSelecionados = ATRIBUTOS_POR_MATERIAL[nomeKey]
    ? [...ATRIBUTOS_POR_MATERIAL[nomeKey]]
    : [];

  Object.keys(atributosObj).forEach(attr => {
    const attrLimpo = normalizarAtributo(attr);
    const existe = state.atributosSelecionados
      .map(a => normalizarAtributo(a))
      .includes(attrLimpo);

    if (!existe) state.atributosSelecionados.push(attr.trim());
  });

  renderAtributos();

  setTimeout(() => {
    Object.entries(atributosObj).forEach(([attr, val]) => {
      const $input = $(`[data-attr="${attr}"]:visible`).last();
      if ($input.length) $input.val(val).trigger("input").trigger("change");
    });
  }, 50);
}

async function salvarLinha(id) {
  const linha = el("materiaisCatalogoTabela")?.querySelector(`tr[data-id="${id}"]`);
  if (!linha) return;

  const unidade = linha.querySelector('[data-campo="unidade"]')?.value.trim() || "";
  const valor = parseValor(linha.querySelector('[data-campo="valor_orcamento_atual"]')?.value);

  try {
    await apiCatalogo(`/api/materiais/catalogo/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        unidade,
        valor_orcamento_atual: valor
      })
    });

    estadoMateriais.editando = null;
    await carregarMateriaisCatalogo();
    Swal?.fire?.({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Material atualizado",
      showConfirmButton: false,
      timer: 1600
    });
  } catch (err) {
    console.error(err);
    Swal?.fire?.({ icon: "error", theme: "dark", title: "Não salvou", text: err.message });
  }
}

async function apagarMaterial(id) {
  const item = estadoMateriais.linhas.find(linha => Number(linha.id) === Number(id));
  const nome = item?.descricao || `ID ${id}`;

  const confirmacao = await Swal.fire({
    icon: "warning",
    theme: "dark",
    title: "Apagar material?",
    text: `Deseja realmente apagar "${nome}" do cadastro de materiais?`,
    showCancelButton: true,
    confirmButtonText: "Apagar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#9b3d36"
  });

  if (!confirmacao.isConfirmed) return;

  try {
    await apiCatalogo(`/api/materiais/variacoes/${id}`, {
      method: "DELETE"
    });

    estadoMateriais.editando = null;
    await carregarVariacoes();
    await carregarMateriaisCatalogo();

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Material apagado",
      showConfirmButton: false,
      timer: 1600
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      theme: "dark",
      title: "Material não apagado",
      text: err.message
    });
  }
}
