import { escapeHtml } from "../utils/material.utils.js";

const state = {
  listas: [],
  listasConferencia: [],
  listaAtual: null,
  materiais: [],
  conferencia: {
    lista: null,
    materiais: [],
    indice: 0
  },
  confirmacaoComprasAberta: false,
  listaConfirmacaoId: null,
  filtros: {
    listas: "",
    prioridade: "",
    ordenacao: "antigas",
    materiais: "",
    separacao: ""
  },
  ordenacaoMateriais: {
    campo: "categoria",
    direcao: "asc"
  }
};

export async function initEstoque() {
  initEstoqueEventos();
  try {
    await carregarEstoque();
  } catch (err) {
    renderErroEstoque(err);
  }
}

function initEstoqueEventos() {
  $(document)
    .off("click.estoqueAtualizar", "#btnAtualizarEstoque")
    .on("click.estoqueAtualizar", "#btnAtualizarEstoque", async function () {
      try {
        await carregarEstoque();
      } catch (err) {
        renderErroEstoque(err);
      }
    });

  $(document)
    .off("click.estoqueCard", ".estoque-lista-card")
    .on("click.estoqueCard", ".estoque-lista-card", async function (event) {
      event.preventDefault();
      event.stopPropagation();
      try {
        await selecionarListaEstoque(Number($(this).data("lista")));
      } catch (err) {
        renderErroEstoque(err);
      }
    });

  $(document)
    .off("click.estoqueConferenciaCard", ".estoque-conferencia-card")
    .on("click.estoqueConferenciaCard", ".estoque-conferencia-card", async function (event) {
      event.preventDefault();
      event.stopPropagation();
      await abrirConferenciaEstoque(Number($(this).data("lista")));
    });

  $(document)
    .off("click.estoqueSeparar", ".estoque-separar")
    .on("click.estoqueSeparar", ".estoque-separar", function () {
      abrirControleSeparacao($(this).closest("tr"));
    });

  $(document)
    .off("click.estoqueSepararAjuste", ".estoque-ajustar-separar")
    .on("click.estoqueSepararAjuste", ".estoque-ajustar-separar", function () {
      const $container = $(this).closest(".input-separar");
      const $input = $container.find(".estoque-qtd-separar");
      const total = Number($container.data("total") || 0);
      const step = Number($(this).data("step") || 0);

      $input.val(limitarSeparacao(Number($input.val() || 0) + step, total));
    });

  $(document)
    .off("click.estoqueSepararTotal", ".estoque-total-separar")
    .on("click.estoqueSepararTotal", ".estoque-total-separar", function () {
      const $container = $(this).closest(".input-separar");
      $container.find(".estoque-qtd-separar").val(Number($container.data("total") || 0));
    });

  $(document)
    .off("click.estoqueSepararCancelar", ".estoque-cancelar-separar")
    .on("click.estoqueSepararCancelar", ".estoque-cancelar-separar", function () {
      renderTabelaEstoque(getMateriaisFiltrados());
    });

  $(document)
    .off("input.estoqueBuscaListas", "#estoqueBuscaListas")
    .on("input.estoqueBuscaListas", "#estoqueBuscaListas", function () {
      state.filtros.listas = $(this).val() || "";
      sincronizarListasFiltradas();
    });

  $(document)
    .off("change.estoqueFiltroPrioridade", "#estoqueFiltroPrioridade")
    .on("change.estoqueFiltroPrioridade", "#estoqueFiltroPrioridade", function () {
      state.filtros.prioridade = $(this).val() || "";
      sincronizarListasFiltradas();
    });

  $(document)
    .off("change.estoqueOrdenacao", "#estoqueOrdenacao")
    .on("change.estoqueOrdenacao", "#estoqueOrdenacao", function () {
      state.filtros.ordenacao = $(this).val() || "antigas";
      sincronizarListasFiltradas();
    });

  $(document)
    .off("input.estoqueBuscaMateriais", "#estoqueBuscaMateriais")
    .on("input.estoqueBuscaMateriais", "#estoqueBuscaMateriais", function () {
      state.filtros.materiais = $(this).val() || "";
      renderTabelaEstoque(getMateriaisFiltrados());
    });

  $(document)
    .off("change.estoqueFiltroSeparacao", "#estoqueFiltroSeparacao")
    .on("change.estoqueFiltroSeparacao", "#estoqueFiltroSeparacao", function () {
      state.filtros.separacao = $(this).val() || "";
      renderTabelaEstoque(getMateriaisFiltrados());
    });

  $(document)
    .off("click.estoqueOrdenarMateriais", "#estoqueMaterialTable thead th[data-sort]")
    .on("click.estoqueOrdenarMateriais", "#estoqueMaterialTable thead th[data-sort]", function () {
      const campo = $(this).data("sort");

      if (state.ordenacaoMateriais.campo === campo) {
        state.ordenacaoMateriais.direcao = state.ordenacaoMateriais.direcao === "asc" ? "desc" : "asc";
      } else {
        state.ordenacaoMateriais = { campo, direcao: "asc" };
      }

      renderTabelaEstoque(getMateriaisFiltrados());
    });

  $(document)
    .off("click.estoqueLimparFiltros", "#btnLimparFiltrosEstoque")
    .on("click.estoqueLimparFiltros", "#btnLimparFiltrosEstoque", function () {
      state.filtros = {
        listas: "",
        prioridade: "",
        ordenacao: "antigas",
        materiais: "",
        separacao: ""
      };

      $("#estoqueBuscaListas").val("");
      $("#estoqueFiltroPrioridade").val("");
      $("#estoqueOrdenacao").val("antigas");
      $("#estoqueBuscaMateriais").val("");
      $("#estoqueFiltroSeparacao").val("");

      sincronizarListasFiltradas();
    });

  $(document)
    .off("click.estoqueExportarPDF", "#btnEstoqueExportarPDF")
    .on("click.estoqueExportarPDF", "#btnEstoqueExportarPDF", function (event) {
      event.preventDefault();
      event.stopPropagation();
      exportarPDFEstoque();
    });

  $(document)
    .off("click.estoqueSepararSalvar", ".estoque-salvar-separar")
    .on("click.estoqueSepararSalvar", ".estoque-salvar-separar", async function () {
      const $container = $(this).closest(".input-separar");
      const $tr = $(this).closest("tr");
      const total = Number($container.data("total") || 0);
      const valor = limitarSeparacao(Number($container.find(".estoque-qtd-separar").val() || 0), total);

      await salvarSeparacaoEstoque($tr.data("id"), valor);
    });

  $(document)
    .off("keypress.estoqueSeparar", ".estoque-qtd-separar")
    .on("keypress.estoqueSeparar", ".estoque-qtd-separar", function (event) {
      if (event.which === 13) {
        $(this).closest(".input-separar").find(".estoque-salvar-separar").trigger("click");
      }
    });

  $(document)
    .off("click.estoqueEnviarCompras", "#btnEstoqueEnviarCompras")
    .on("click.estoqueEnviarCompras", "#btnEstoqueEnviarCompras", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!state.listaAtual?.id) return;

      state.confirmacaoComprasAberta = true;
      state.listaConfirmacaoId = state.listaAtual.id;
      $("#modalConfirmacaoEstoque").prop("hidden", false);
    });

  $(document)
    .off("click.estoqueCancelarConfirmacao", "#btnCancelarConfirmacaoEstoque")
    .on("click.estoqueCancelarConfirmacao", "#btnCancelarConfirmacaoEstoque", function () {
      fecharConfirmacaoCompras();
    });

  $(document)
    .off("click.estoqueConfirmarCompras", "#btnConfirmarConfirmacaoEstoque")
    .on("click.estoqueConfirmarCompras", "#btnConfirmarConfirmacaoEstoque", async function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (!state.confirmacaoComprasAberta || !state.listaConfirmacaoId) return;

      const idLista = state.listaConfirmacaoId;

      await $.ajax({
        url: `/api/materiais/listas/${idLista}/avancar`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ confirmado: true, origem: "estoque" })
      });

      fecharConfirmacaoCompras();
      state.listaAtual = null;
      state.materiais = [];
      await carregarEstoque();
    });

  $(document)
    .off("click.estoqueFecharConferencia", "#btnFecharConferenciaEstoque")
    .on("click.estoqueFecharConferencia", "#btnFecharConferenciaEstoque", fecharConferenciaEstoque);

  $(document)
    .off("click.estoqueConferenciaNav", "#btnConferenciaAnterior, #btnConferenciaProximo")
    .on("click.estoqueConferenciaNav", "#btnConferenciaAnterior, #btnConferenciaProximo", function () {
      const direcao = this.id === "btnConferenciaAnterior" ? -1 : 1;
      navegarConferencia(direcao);
    });

  $(document)
    .off("click.estoqueConferenciaAcao", ".estoque-conferencia-acao")
    .on("click.estoqueConferenciaAcao", ".estoque-conferencia-acao", async function () {
      const status = $(this).data("status");
      const faltando = status === "faltando"
        ? Number($("#conferenciaFaltandoInput").val() || 0)
        : 0;

      await salvarConferenciaAtual(status, faltando);
    });
}

function fecharConfirmacaoCompras() {
  state.confirmacaoComprasAberta = false;
  state.listaConfirmacaoId = null;
  $("#modalConfirmacaoEstoque").prop("hidden", true);
}

async function carregarEstoque() {
  $("#estoqueListasPendentes").html(`<div class="estoque-empty">Carregando pendências...</div>`);
  $("#estoqueListasConferencia").html(`<div class="estoque-empty">Carregando conferências...</div>`);

  const [listas, listasConferencia] = await Promise.all([
    $.get("/api/materiais/listas/estoque/pendentes"),
    $.get("/api/materiais/listas/conferencia/finalizadas")
  ]);
  state.listas = listas || [];
  state.listasConferencia = listasConferencia || [];

  renderListasEstoque();
  renderListasConferencia();

  const listasVisiveis = getListasFiltradas();
  const focoConferencia = sessionStorage.getItem("estoque_conferencia_lista");
  if (focoConferencia) {
    sessionStorage.removeItem("estoque_conferencia_lista");
    setTimeout(() => abrirConferenciaEstoque(Number(focoConferencia)), 150);
  }

  if (state.listaAtual?.id && listasVisiveis.some(lista => Number(lista.id) === Number(state.listaAtual.id))) {
    await selecionarListaEstoque(state.listaAtual.id);
    return;
  }

  if (listasVisiveis.length) {
    await selecionarListaEstoque(listasVisiveis[0].id);
    return;
  }

  state.listaAtual = null;
  state.materiais = [];
  renderDetalheVazio();
}

function renderErroEstoque(err) {
  console.error("Erro ao carregar estoque:", err);
  state.listas = [];
  state.listasConferencia = [];
  state.listaAtual = null;
  state.materiais = [];

  $("#estoqueTotalPendencias").text("0 lista(s)");
  $("#estoqueTotalConferencia").text("0 lista(s)");
  $("#estoqueListasPendentes").html(`
    <div class="estoque-empty">
      Nao foi possivel carregar as listas do estoque.
    </div>
  `);
  $("#estoqueListasConferencia").html(`
    <div class="estoque-empty">
      Nao foi possivel carregar as listas para conferencia.
    </div>
  `);
  $("#estoqueListaTitulo").text("Erro ao carregar estoque");
  $("#estoqueListaResumo").text("Atualize a tela ou tente novamente em alguns instantes.");
  $("#btnEstoqueExportarPDF").prop("hidden", true);
  $("#btnEstoqueEnviarCompras").prop("hidden", true);
  $("#estoqueDetalheResumo").prop("hidden", true).empty();
  $("#estoqueMaterialTable tbody").html(`
    <tr>
      <td colspan="10" class="estoque-placeholder">Nenhum material carregado.</td>
    </tr>
  `);
}

async function selecionarListaEstoque(idLista) {
  const lista = state.listas.find(item => Number(item.id) === Number(idLista));
  if (!lista) return;

  state.listaAtual = lista;
  $(".estoque-lista-card").removeClass("is-active");
  $(`.estoque-lista-card[data-lista="${idLista}"]`).addClass("is-active");

  const materiais = await $.get(`/api/materiais/os/${lista.id_os}?id_lista=${encodeURIComponent(idLista)}`);
  state.materiais = normalizarMateriaisEstoque(materiais || []);
  renderDetalheLista(lista, state.materiais);
}

function renderListasEstoque() {
  const listas = getListasFiltradas();
  $("#estoqueTotalPendencias").text(`${listas.length}/${state.listas.length} lista(s)`);

  if (!state.listas.length) {
    $("#estoqueListasPendentes").html(`
      <div class="estoque-empty">
        Nenhuma lista está no estágio de Estoque.
      </div>
    `);
    return;
  }

  if (!listas.length) {
    $("#estoqueListasPendentes").html(`
      <div class="estoque-empty">
        Nenhuma lista encontrada com os filtros atuais.
      </div>
    `);
    return;
  }

  const html = listas.map(lista => {
    const resumo = calcularResumoLista(lista);
    const descricao = lista.os_descricao || lista.descricao || "Lista de materiais";
    const prioridade = normalizarPrioridade(lista.prioridade);

    return `
      <button type="button" class="estoque-lista-card" data-lista="${lista.id}">
        <i class="fa-solid fa-flag estoque-prioridade-flag estoque-prioridade-${prioridade}" title="Prioridade ${formatarPrioridade(prioridade)}"></i>
        <div class="estoque-card-top">
          <strong>OS ${escapeHtml(lista.id_os)}</strong>
          <span title="${escapeHtml(descricao)}">${escapeHtml(descricao)}</span>
        </div>
        <div class="estoque-card-progress">
          <b>${resumo.percentualSeparado.toFixed(0)}%</b>
          <span style="width:${resumo.percentualSeparado.toFixed(0)}%"></span>
        </div>
      </button>
    `;
  }).join("");

  $("#estoqueListasPendentes").html(html);

  if (state.listaAtual?.id) {
    $(`.estoque-lista-card[data-lista="${state.listaAtual.id}"]`).addClass("is-active");
  }
}

function renderListasConferencia() {
  const listas = getListasConferenciaFiltradas();
  $("#estoqueTotalConferencia").text(`${listas.length}/${state.listasConferencia.length} lista(s)`);

  if (!state.listasConferencia.length) {
    $("#estoqueListasConferencia").html(`
      <div class="estoque-empty">
        Nenhuma lista finalizada aguardando conferência.
      </div>
    `);
    return;
  }

  if (!listas.length) {
    $("#estoqueListasConferencia").html(`
      <div class="estoque-empty">
        Nenhuma conferência encontrada com os filtros atuais.
      </div>
    `);
    return;
  }

  const html = listas.map(lista => {
    const itens = Number(lista.itens || 0);
    const conferidos = Number(lista.itens_conferidos || 0);
    const faltando = Number(lista.itens_faltando || 0) + Number(lista.itens_nao_encontrados || 0);
    const percentual = itens ? (conferidos / itens) * 100 : 0;
    const descricao = lista.os_descricao || lista.descricao || "Lista de materiais";

    return `
      <button type="button" class="estoque-conferencia-card" data-lista="${lista.id}">
        <i class="fa-solid fa-clipboard-check estoque-conferencia-icone" title="Conferir lista"></i>
        <div class="estoque-card-top">
          <strong>OS ${escapeHtml(lista.id_os)}</strong>
          <span title="${escapeHtml(descricao)}">${escapeHtml(descricao)}</span>
        </div>
        <div class="estoque-card-progress">
          <b>${percentual.toFixed(0)}%</b>
          <span style="width:${percentual.toFixed(0)}%"></span>
        </div>
        ${faltando ? `<small class="estoque-conferencia-alerta">${faltando} item(ns) com falta</small>` : ""}
      </button>
    `;
  }).join("");

  $("#estoqueListasConferencia").html(html);
}

function renderDetalheLista(lista, materiais) {
  const resumo = calcularResumoMateriais(materiais);

  $("#estoqueListaTitulo").text(`OS ${lista.id_os} | ${lista.titulo || `Lista #${lista.id}`}`);
  $("#estoqueListaResumo").text(`${lista.cliente || "Cliente não informado"} | ${lista.os_descricao || lista.descricao || "Lista de materiais"}`);
  $("#btnEstoqueExportarPDF").prop("hidden", false);
  $("#btnEstoqueEnviarCompras").prop("hidden", false);

  $("#estoqueDetalheResumo").prop("hidden", false).html(`
    <div><span>Itens</span><strong>${resumo.itens}</strong></div>
    <div><span>Qtd. total</span><strong>${resumo.quantidade}</strong></div>
    <div><span>Separado</span><strong>${resumo.separada}</strong></div>
    <div><span>Faltante</span><strong>${resumo.faltante}</strong></div>
    <div class="estoque-resumo-progresso">
      <span>Progresso</span>
      <strong>${resumo.percentualSeparado.toFixed(0)}%</strong>
      <div><i style="width:${resumo.percentualSeparado.toFixed(0)}%"></i></div>
    </div>
  `);

  renderTabelaEstoque(getMateriaisFiltrados());
}

function renderDetalheVazio() {
  $("#estoqueListaTitulo").text("Nenhuma pendência");
  $("#btnEstoqueExportarPDF").prop("hidden", true);
  $("#estoqueListaResumo").text("Quando uma lista chegar no estágio de Estoque, ela aparecerá aqui.");
  $("#btnEstoqueEnviarCompras").prop("hidden", true);
  $("#estoqueDetalheResumo").prop("hidden", true).empty();
  $("#estoqueMaterialTable tbody").html(`
    <tr>
      <td colspan="10" class="estoque-placeholder">Nenhuma lista pendente para separação.</td>
    </tr>
  `);
}

async function abrirConferenciaEstoque(idLista) {
  const lista = state.listasConferencia.find(item => Number(item.id) === Number(idLista));
  if (!lista) return;

  const materiais = await $.get(`/api/materiais/os/${lista.id_os}?id_lista=${encodeURIComponent(idLista)}`);
  state.conferencia = {
    lista,
    materiais: (materiais || []).map(normalizarMaterialConferencia),
    indice: 0
  };

  const primeiroPendente = state.conferencia.materiais.findIndex(item => !item.conferencia_status);
  if (primeiroPendente >= 0) state.conferencia.indice = primeiroPendente;

  $("#modalConferenciaEstoque").prop("hidden", false);
  renderConferenciaAtual();
}

function fecharConferenciaEstoque() {
  $("#modalConferenciaEstoque").prop("hidden", true);
  state.conferencia = { lista: null, materiais: [], indice: 0 };
}

function navegarConferencia(direcao) {
  const total = state.conferencia.materiais.length;
  if (!total) return;

  state.conferencia.indice = Math.max(0, Math.min(total - 1, state.conferencia.indice + direcao));
  renderConferenciaAtual();
}

function renderConferenciaAtual() {
  const { lista, materiais, indice } = state.conferencia;
  const item = materiais[indice];

  if (!lista || !item) {
    $("#conferenciaTitulo").text("Conferência");
    $("#conferenciaResumo").text("Nenhum material encontrado para esta lista.");
    $("#conferenciaMaterialAtual").html(`<div class="estoque-empty">Nenhum material para conferir.</div>`);
    atualizarRodapeConferencia();
    return;
  }

  const imgSrc = item.imagem ? `${item.imagem}?v=${item.versao_foto || ""}` : "/imagens/imagemmaterial.webp";
  const statusLabel = getStatusConferenciaLabel(item);
  const faltando = Number(item.conferencia_faltando || 0);

  $("#conferenciaTitulo").text(`OS ${lista.id_os} | ${lista.titulo || `Lista #${lista.id}`}`);
  $("#conferenciaResumo").text(`${lista.cliente || "Cliente não informado"} | ${lista.os_descricao || lista.descricao || "Lista de materiais"}`);

  $("#conferenciaMaterialAtual").html(`
    <div class="estoque-conferencia-foto">
      <img src="${escapeHtml(imgSrc)}" alt="">
    </div>
    <div class="estoque-conferencia-info">
      <span class="estoque-conferencia-categoria">${escapeHtml(item.categoria || "-")}</span>
      <strong>${escapeHtml(item.nome || "-")}</strong>
      <p>${escapeHtml(item.atributos || "Sem descrição adicional")}</p>

      <div class="estoque-conferencia-grid">
        <div><span>Referência</span><b>${escapeHtml(item.codigo || "-")}</b></div>
        <div><span>Fabricante</span><b>${escapeHtml(item.fabricante || "-")}</b></div>
        <div><span>Quantidade</span><b>${Number(item.quantidade_original || item.quantidade || 0)} ${escapeHtml(item.unidade || "")}</b></div>
        <div><span>Status</span><b>${escapeHtml(statusLabel)}</b></div>
      </div>

      ${item.observacao ? `<div class="estoque-conferencia-obs"><i class="fa-solid fa-note-sticky"></i>${escapeHtml(item.observacao)}</div>` : ""}

      <div class="estoque-conferencia-actions">
        <button type="button" class="estoque-conferencia-acao conferencia-ok" data-status="ok" title="Material conferido">
          <i class="fa-solid fa-check"></i>
        </button>
        <label class="estoque-conferencia-faltando" title="Informar quantidade faltando">
          <input id="conferenciaFaltandoInput" type="number" min="0" value="${faltando || ""}" placeholder="Qtd.">
          <button type="button" class="estoque-conferencia-acao conferencia-falta" data-status="faltando">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </button>
        </label>
        <button type="button" class="estoque-conferencia-acao conferencia-nao-encontrado" data-status="nao_encontrado" title="Material não encontrado">
          <i class="fa-solid fa-magnifying-glass-minus"></i>
        </button>
      </div>
    </div>
  `);

  atualizarRodapeConferencia();
}

function atualizarRodapeConferencia() {
  const total = state.conferencia.materiais.length;
  const indice = state.conferencia.indice;
  const conferidos = state.conferencia.materiais.filter(item => item.conferencia_status).length;
  const percentual = total ? (conferidos / total) * 100 : 0;

  $("#conferenciaContador").text(total ? `Item ${indice + 1} de ${total} | ${conferidos} conferido(s)` : "Item 0 de 0");
  $("#conferenciaBarra").css("width", `${percentual.toFixed(0)}%`);
  $("#btnConferenciaAnterior").prop("disabled", indice <= 0);
  $("#btnConferenciaProximo").prop("disabled", !total || indice >= total - 1);
}

async function salvarConferenciaAtual(status, faltando = 0) {
  const item = state.conferencia.materiais[state.conferencia.indice];
  if (!item) return;

  if (status === "faltando" && (!faltando || faltando <= 0)) {
    alert("Informe a quantidade que está faltando.");
    return;
  }

  await $.ajax({
    url: `/api/materiais/os/conferencia/${item.id}`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({ status, faltando })
  });

  item.conferencia_status = status;
  item.conferencia_faltando = status === "faltando" ? faltando : null;
  item.conferencia_em = new Date().toISOString();

  const proximoPendente = state.conferencia.materiais.findIndex((material, index) => index > state.conferencia.indice && !material.conferencia_status);
  if (proximoPendente >= 0) {
    state.conferencia.indice = proximoPendente;
  } else if (state.conferencia.indice < state.conferencia.materiais.length - 1) {
    state.conferencia.indice += 1;
  }

  renderConferenciaAtual();
  await atualizarListasConferencia();
}

async function atualizarListasConferencia() {
  state.listasConferencia = await $.get("/api/materiais/listas/conferencia/finalizadas") || [];
  renderListasConferencia();
}

function normalizarMaterialConferencia(item) {
  return {
    ...item,
    quantidade_original: Number(item.quantidade || 0),
    conferencia_faltando: Number(item.conferencia_faltando || 0)
  };
}

function getStatusConferenciaLabel(item) {
  const status = item.conferencia_status;
  if (status === "ok") return "Conferido";
  if (status === "faltando") return `Faltando ${Number(item.conferencia_faltando || 0)}`;
  if (status === "nao_encontrado") return "Não encontrado";
  return "Pendente";
}

async function sincronizarListasFiltradas() {
  renderListasEstoque();
  renderListasConferencia();

  const listas = getListasFiltradas();
  const atualContinuaVisivel = state.listaAtual?.id
    && listas.some(lista => Number(lista.id) === Number(state.listaAtual.id));

  if (atualContinuaVisivel) return;

  if (listas.length) {
    await selecionarListaEstoque(listas[0].id);
    return;
  }

  state.listaAtual = null;
  state.materiais = [];
  renderDetalheVazio();
}

function renderTabelaEstoque(materiais) {
  atualizarCabecalhoOrdenacaoEstoque();
  if (!materiais.length) {
    $("#estoqueMaterialTable tbody").html(`
      <tr>
        <td colspan="10" class="estoque-placeholder">Esta lista ainda não possui materiais.</td>
      </tr>
    `);
    return;
  }

  const materiaisOrdenados = getMateriaisOrdenados(materiais);
  const html = materiaisOrdenados.map(item => {
    const total = Number(item.quantidade_estoque || 0);
    const separado = Number(item.quantidade_separada_estoque || 0);
    const percentual = total ? (separado / total) * 100 : 0;
    const imgSrc = item.imagem ? `${item.imagem}?v=${item.versao_foto || ""}` : "/imagens/imagemmaterial.webp";
    const observacao = item.observacao || item.obs || "";

    return `
      <tr data-id="${item.id}">
        <td>${escapeHtml(item.categoria || "-")}</td>
        <td>
          <img class="estoque-material-img" src="${escapeHtml(imgSrc)}" alt="">
        </td>
        <td class="estoque-material-desc">
          <strong>${escapeHtml(item.nome || "-")}</strong>
          <span>${escapeHtml(item.atributos || "Sem descrição adicional")}</span>
        </td>
        <td>${escapeHtml(item.codigo || "-")}</td>
        <td>${escapeHtml(item.fabricante || "-")}</td>
        <td class="estoque-material-observacao" title="${escapeHtml(observacao)}">${escapeHtml(observacao || "-")}</td>
        <td>${total}</td>
        <td>${escapeHtml(item.unidade || "-")}</td>
        <td>
          <div class="estoque-separacao-info">
            <span>${separado}/${total}</span>
            <div class="estoque-item-progress">
              <i style="width:${percentual.toFixed(0)}%"></i>
            </div>
          </div>
        </td>
        <td class="col-acoes">
          <button class="estoque-separar" data-id="${item.id}" title="Separar item">
            <i class="fa-solid fa-box-open"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  $("#estoqueMaterialTable tbody").html(html);
}

function atualizarCabecalhoOrdenacaoEstoque() {
  $("#estoqueMaterialTable thead th[data-sort]")
    .removeClass("sort-asc sort-desc")
    .filter(`[data-sort="${state.ordenacaoMateriais.campo}"]`)
    .addClass(state.ordenacaoMateriais.direcao === "asc" ? "sort-asc" : "sort-desc");
}

function getMateriaisOrdenados(materiais) {
  const { campo, direcao } = state.ordenacaoMateriais;
  const multiplicador = direcao === "desc" ? -1 : 1;

  const valorCampo = item => {
    if (campo === "quantidade") return Number(item.quantidade_estoque || 0);
    if (campo === "separacao") return Number(item.quantidade_separada_estoque || 0);
    if (campo === "observacao") return item.observacao || item.obs || "";
    return item[campo] || "";
  };

  return [...materiais].sort((a, b) => {
    const valorA = valorCampo(a);
    const valorB = valorCampo(b);

    if (typeof valorA === "number" || typeof valorB === "number") {
      return (Number(valorA || 0) - Number(valorB || 0)) * multiplicador;
    }

    return String(valorA || "").localeCompare(String(valorB || ""), "pt-BR", {
      numeric: true,
      sensitivity: "base"
    }) * multiplicador;
  });
}

function exportarPDFEstoque() {
  if (!state.listaAtual?.id) {
    alert("Selecione uma lista para exportar.");
    return;
  }

  const materiais = getMateriaisOrdenados(getMateriaisFiltrados());
  if (!materiais.length) {
    alert("Nenhum material visivel para exportar.");
    return;
  }

  const janela = window.open("", "_blank");
  if (!janela) {
    alert("Permita pop-ups para gerar o PDF.");
    return;
  }

  janela.document.write(montarHtmlPDFEstoque(materiais));
  janela.document.close();
  janela.focus();

  setTimeout(() => {
    janela.print();
  }, 500);
}

function montarHtmlPDFEstoque(materiais) {
  const lista = state.listaAtual || {};
  const resumo = calcularResumoMateriais(materiais);
  const titulo = `OS ${lista.id_os || "-"} | ${lista.titulo || `Lista #${lista.id || "-"}`}`;
  const subtitulo = `${lista.cliente || "Cliente não informado"} | ${lista.os_descricao || lista.descricao || "Lista de materiais"}`;

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Separação de estoque - ${escapeHtml(titulo)}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, sans-serif; color: #151515; }
          header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 10px; }
          h1 { margin: 0 0 4px; font-size: 15px; }
          p { margin: 0; font-size: 10px; color: #555; }
          .resumo { display: flex; gap: 8px; margin-bottom: 10px; }
          .resumo div { border: 1px solid #ccc; border-radius: 6px; padding: 6px 10px; min-width: 95px; }
          .resumo span { display: block; font-size: 9px; color: #666; text-transform: uppercase; }
          .resumo strong { font-size: 15px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border: 1px solid #bbb; padding: 4px; font-size: 8px; vertical-align: middle; overflow-wrap: anywhere; }
          th { background: #2f2f2f; color: #fff; text-transform: uppercase; }
          td img { width: 34px; height: 34px; object-fit: contain; display: block; margin: auto; }
          .descricao strong { display: block; font-size: 9px; }
          .descricao span { color: #555; }
          .campo-manual { height: 24px; border: 1px dashed #111; border-radius: 3px; background: #fff; }
          .campo-nao-tem { width: 20px; height: 20px; border: 1px solid #111; margin: auto; }
          .col-foto { width: 42px; }
          .col-qtd, .col-und, .col-manual { width: 44px; text-align: center; }
          .col-qtd { font-size: 12px; }
          .col-nao-tem { width: 45px; text-align: center; }
          .col-categoria, .col-ref, .col-fabricante { width: 70px; }
          .col-obs { width: 90px; }
          footer { margin-top: 8px; font-size: 9px; color: #666; text-align: right; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>${escapeHtml(titulo)}</h1>
            <p>${escapeHtml(subtitulo)}</p>
          </div>
          <p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
        </header>

        <section class="resumo">
          <div><span>Itens</span><strong>${resumo.itens}</strong></div>
          <div><span>Quantidade</span><strong>${resumo.quantidade}</strong></div>
          <div><span>Separado</span><strong>${resumo.separada}</strong></div>
          <div><span>Faltante</span><strong>${resumo.faltante}</strong></div>
        </section>

        <table>
          <thead>
            <tr>
              <th class="col-categoria">Categoria</th>
              <th class="col-foto">Foto</th>
              <th>Descricao</th>
              <th class="col-ref">Referencia</th>
              <th class="col-fabricante">Fabricante</th>
              <th class="col-obs">Observacao</th>
              <th class="col-qtd">Qtd.</th>
              <th class="col-und">Und</th>
              <th class="col-manual">Separou</th>
              <th class="col-manual">Faltou</th>
              <th class="col-nao-tem">Nao tem</th>
            </tr>
          </thead>
          <tbody>
            ${materiais.map(renderLinhaPDFEstoque).join("")}
          </tbody>
        </table>

        <footer>Controle de separação para preenchimento manual pelo Estoque.</footer>
      </body>
    </html>
  `;
}

function renderLinhaPDFEstoque(item) {
  const imgSrc = item.imagem ? `${item.imagem}?v=${item.versao_foto || ""}` : "/imagens/imagemmaterial.webp";
  const observacao = item.observacao || item.obs || "";

  return `
    <tr>
      <td>${escapeHtml(item.categoria || "-")}</td>
      <td><img src="${escapeHtml(imgSrc)}" alt=""></td>
      <td class="descricao">
        <strong>${escapeHtml(item.nome || "-")}</strong>
        <span>${escapeHtml(item.atributos || "")}</span>
      </td>
      <td>${escapeHtml(item.codigo || "-")}</td>
      <td>${escapeHtml(item.fabricante || "-")}</td>
      <td>${escapeHtml(observacao || "-")}</td>
      <td class="col-qtd">${Number(item.quantidade_estoque || 0)}</td>
      <td class="col-und">${escapeHtml(item.unidade || "-")}</td>
      <td><div class="campo-manual"></div></td>
      <td><div class="campo-manual"></div></td>
      <td><div class="campo-nao-tem"></div></td>
    </tr>
  `;
}

function abrirControleSeparacao($tr) {
  if ($tr.find(".input-separar").length) return;

  const id = Number($tr.data("id"));
  const item = state.materiais.find(material => Number(material.id) === id);
  if (!item) return;

  const total = Number(item.quantidade_estoque || 0);
  const atual = Number(item.quantidade_separada_estoque || 0);

  $tr.find(".col-acoes").html(`
    <div class="input-separar animar" data-total="${total}">
      <button class="estoque-ajustar-separar" data-step="-1" title="Diminuir separado">
        <i class="fa-solid fa-minus"></i>
      </button>
      <input class="estoque-qtd-separar" type="number" min="0" max="${total}" value="${atual}">
      <button class="estoque-ajustar-separar" data-step="1" title="Aumentar separado">
        <i class="fa-solid fa-plus"></i>
      </button>
      <button class="estoque-total-separar" title="Separar total">Total</button>
      <button class="estoque-salvar-separar material-separar-save" title="Salvar separação">
        <i class="fa-solid fa-floppy-disk"></i>
      </button>
      <button class="estoque-cancelar-separar material-separar-cancel" title="Cancelar">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `);

  $tr.find(".estoque-qtd-separar").focus().select();
}

async function salvarSeparacaoEstoque(idMaterialOS, valor) {
  const item = state.materiais.find(material => Number(material.id) === Number(idMaterialOS));
  if (!item) return;

  await $.ajax({
    url: `/api/materiais/os/editar/${idMaterialOS}`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({
      quantidade: Number(item.quantidade || 0),
      quantidade_separada: valor
    })
  });

  if (state.listaAtual?.id) {
    await selecionarListaEstoque(state.listaAtual.id);
    await atualizarCardListaAtual();
  }
}

async function atualizarCardListaAtual() {
  const listas = await $.get("/api/materiais/listas/estoque/pendentes");
  state.listas = listas || [];
  renderListasEstoque();

  if (state.listaAtual?.id) {
    $(`.estoque-lista-card[data-lista="${state.listaAtual.id}"]`).addClass("is-active");
  }
}

function getListasFiltradas() {
  const termo = normalizarTexto(state.filtros.listas);
  const prioridade = state.filtros.prioridade;

  const listas = state.listas.filter(lista => {
    const prioridadeLista = lista.prioridade || "normal";
    const textoLista = normalizarTexto([
      lista.id,
      lista.id_os,
      lista.titulo,
      lista.descricao,
      lista.os_descricao,
      lista.cliente,
      lista.responsavel_nome,
      prioridadeLista
    ].join(" "));

    const passouTexto = !termo || textoLista.includes(termo);
    const passouPrioridade = !prioridade || prioridadeLista === prioridade;

    return passouTexto && passouPrioridade;
  });

  return ordenarListas(listas);
}

function getListasConferenciaFiltradas() {
  const termo = normalizarTexto(state.filtros.listas);
  const prioridade = state.filtros.prioridade;

  const listas = state.listasConferencia.filter(lista => {
    const prioridadeLista = lista.prioridade || "normal";
    const textoLista = normalizarTexto([
      lista.id,
      lista.id_os,
      lista.titulo,
      lista.descricao,
      lista.os_descricao,
      lista.cliente,
      lista.responsavel_nome,
      prioridadeLista
    ].join(" "));

    const passouTexto = !termo || textoLista.includes(termo);
    const passouPrioridade = !prioridade || prioridadeLista === prioridade;

    return passouTexto && passouPrioridade;
  });

  return ordenarListas(listas);
}

function ordenarListas(listas) {
  const ordenacao = state.filtros.ordenacao;
  const copia = [...listas];

  return copia.sort((a, b) => {
    const resumoA = calcularResumoLista(a).percentualSeparado;
    const resumoB = calcularResumoLista(b).percentualSeparado;

    if (ordenacao === "progresso-asc") return resumoA - resumoB;
    if (ordenacao === "progresso-desc") return resumoB - resumoA;
    if (ordenacao === "os-desc") return Number(b.id_os || 0) - Number(a.id_os || 0);
    if (ordenacao === "os-asc") return Number(a.id_os || 0) - Number(b.id_os || 0);

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function getMateriaisFiltrados() {
  const termo = normalizarTexto(state.filtros.materiais);
  const separacao = state.filtros.separacao;

  return state.materiais.filter(item => {
    const total = Number(item.quantidade_estoque || 0);
    const separado = Number(item.quantidade_separada_estoque || 0);
    const textoItem = normalizarTexto([
      item.nome,
      item.atributos,
      item.codigo,
      item.fabricante,
      item.categoria,
      item.observacao,
      item.obs
    ].join(" "));

    const passouTexto = !termo || textoItem.includes(termo);
    const passouSeparacao = !separacao
      || (separacao === "pendente" && separado <= 0)
      || (separacao === "parcial" && separado > 0 && separado < total)
      || (separacao === "separado" && total > 0 && separado >= total);

    return passouTexto && passouSeparacao;
  });
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarPrioridade(prioridade) {
  const valor = normalizarTexto(prioridade);
  if (["baixa", "alta", "urgente"].includes(valor)) return valor;
  return "normal";
}

function formatarPrioridade(prioridade) {
  const nomes = {
    baixa: "baixa",
    normal: "normal",
    alta: "alta",
    urgente: "urgente"
  };

  return nomes[prioridade] || nomes.normal;
}

function calcularResumoLista(lista) {
  const quantidade = Number(lista.quantidade || 0);
  const separada = Number(lista.separada || 0);
  const comprada = Number(lista.comprada || 0);
  const itens = Number(lista.itens || 0);
  const itensSeparados = Number(lista.itens_separados || 0);
  const faltante = Math.max(0, quantidade - separada - comprada);

  return {
    itens,
    quantidade,
    separada,
    faltante,
    percentualSeparado: itens ? (itensSeparados / itens) * 100 : 0
  };
}

function calcularResumoMateriais(materiais) {
  const resumo = {
    itens: materiais.length,
    quantidade: 0,
    separada: 0,
    faltante: 0,
    percentualSeparado: 0
  };

  materiais.forEach(item => {
    resumo.quantidade += Number(item.quantidade_estoque || 0);
    resumo.separada += Number(item.quantidade_separada_estoque || 0);
  });

  resumo.faltante = Math.max(0, resumo.quantidade - resumo.separada);
  resumo.percentualSeparado = resumo.quantidade ? (resumo.separada / resumo.quantidade) * 100 : 0;

  return resumo;
}

function limitarSeparacao(valor, total) {
  if (Number.isNaN(valor) || valor < 0) return 0;
  if (valor > total) return total;
  return valor;
}

function normalizarMateriaisEstoque(materiais) {
  return materiais
    .map(item => {
      const quantidadeOriginal = Number(item.quantidade || 0);
      const comprado = Number(item.quantidade_comprada || 0);
      const separadoOriginal = Number(item.quantidade_separada || 0);
      const saldoEstoque = Math.max(0, quantidadeOriginal - comprado);
      const separadoEstoque = Math.min(separadoOriginal, saldoEstoque);

      return {
        ...item,
        quantidade_original: quantidadeOriginal,
        quantidade_estoque: saldoEstoque,
        quantidade_separada_estoque: separadoEstoque
      };
    })
    .filter(item => {
      const total = Number(item.quantidade_estoque || 0);

      return total > 0;
    });
}
