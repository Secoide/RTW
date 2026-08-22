import { criarLinhaNova } from "../../components/inputs/material.input.js";
import { carregarMateriaisCompleto } from "../../bootstrap/material.load.js";
import { salvarNovoMaterial, atualizarMaterial } from "../../services/api/material.save.js";
import { materialState as state } from "../../state/material.state.js";
import {
  avancarListaMaterialOS,
  atualizarListaMaterialOS,
  criarListaMaterialOS,
  duplicarListaMaterialOS,
  excluirListaMaterialOS,
  listarHistoricoListaMaterialOS,
  moverListaMaterialOS,
  voltarListaMaterialOSComMotivo
} from "../../services/api/material.api.js";
import { getFornecedoresMaterial } from "../../services/api/material.fornecedor.api.js";
import { calcularValorRS } from "../../utils/material.utils.js";

export function initMaterialClicks() {

  // 🔥 SALVAR (NOVO OU EXISTENTE)
  $(document).off("click.materialSalvarItem", "#listaMaterial .save")
    .on("click.materialSalvarItem", "#listaMaterial .save", async function () {

    const $btn = $(this);

    if ($btn.prop("disabled") || $btn.data("salvando")) return;

    $btn.prop("disabled", true).data("salvando", true);

    const $tr = $(this).closest("tr");

    try {

      // 🔹 NOVO MATERIAL
      if ($tr.hasClass("novo-registro")) {

        await salvarNovoMaterial($tr);

        $tr.addClass("salvo");

        setTimeout(() => {
          $tr.removeClass("salvo");
        }, 600);

        await carregarMateriaisCompleto();
        criarLinhaNova();

        return;
      }

      // 🔹 EDIÇÃO
      if ($tr.hasClass("editando")) {

        await atualizarMaterial($tr);

        $tr.addClass("salvo");

        setTimeout(() => {
          $tr.removeClass("salvo");
        }, 600);

        await carregarMateriaisCompleto();

        return;
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar material");
      $btn.prop("disabled", false).removeData("salvando");
    }

  });



  // 🔥 NOVO MATERIAL
  $(document).off("click.materialNovoItem", "#btnNovoMaterial")
    .on("click.materialNovoItem", "#btnNovoMaterial", criarLinhaNova);

  // 🔥 reload
  $(document).off("click.materialReload", "#btnReloadMaterial")
    .on("click.materialReload", "#btnReloadMaterial", carregarMateriaisCompleto);

  $(document).off("click.materialKanban", ".material-lista-open")
    .on("click.materialKanban", ".material-lista-open", async function () {
      state.listaSelecionada = $(this).closest(".material-lista-card").data("lista");
      state.modoVisualizacao = "detalhe";
      await carregarMateriaisCompleto();
    });

  $(document).off("click.materialVoltarKanban", "#btnVoltarKanbanMaterial")
    .on("click.materialVoltarKanban", "#btnVoltarKanbanMaterial", async function () {
      state.modoVisualizacao = "kanban";
      state.listaSelecionada = null;
      await carregarMateriaisCompleto();
    });

  $(document).off("click.materialNovaLista", "#btnNovaListaMaterial")
    .on("click.materialNovaLista", "#btnNovaListaMaterial", function () {
      abrirModalListaMaterial();
    });

  $(document).off("click.materialEditarLista", ".material-lista-editar")
    .on("click.materialEditarLista", ".material-lista-editar", function (e) {
      e.stopPropagation();
      const id = $(this).data("id");
      const lista = state.listasOS.find(item => Number(item.id) === Number(id));
      abrirModalListaMaterial(lista);
    });

  $(document).off("click.materialExcluirLista", ".material-lista-excluir")
    .on("click.materialExcluirLista", ".material-lista-excluir", async function (e) {
      e.stopPropagation();
      const id = $(this).data("id");

      const confirmado = await confirmarAcaoMaterial({
        titulo: "Excluir lista de materiais",
        mensagem: "Esta lista será removida se não possuir materiais vinculados.",
        tipo: "danger",
        confirmar: "Excluir"
      });

      if (!confirmado) return;

      try {
        await excluirListaMaterialOS(id);
        if (Number(state.listaSelecionada) === Number(id)) state.listaSelecionada = null;
        state.modoVisualizacao = "kanban";
        await carregarMateriaisCompleto();
      } catch (err) {
        alert(err.responseJSON?.erro || "Nao foi possivel excluir esta lista.");
      }
    });

  $(document).off("click.materialAvancarLista", ".material-lista-avancar")
    .on("click.materialAvancarLista", ".material-lista-avancar", async function (e) {
      e.stopPropagation();
      const id = $(this).data("id");

      const confirmado = await confirmarAcaoMaterial({
        titulo: "Confirmar etapa",
        mensagem: "A lista será enviada para o próximo estágio do fluxo.",
        tipo: "success",
        confirmar: "Enviar"
      });

      if (!confirmado) return;

      await avancarListaMaterialOS(id);
      await carregarMateriaisCompleto();
    });

  $(document).off("click.materialVoltarLista", ".material-lista-voltar")
    .on("click.materialVoltarLista", ".material-lista-voltar", async function (e) {
      e.stopPropagation();
      const id = $(this).data("id");

      const confirmado = await confirmarAcaoMaterial({
        titulo: "Voltar estágio",
        mensagem: "A lista retornará para o estágio anterior do fluxo. Informe o motivo para manter o histórico claro.",
        tipo: "warning",
        confirmar: "Voltar",
        pedirMotivo: true,
        motivoObrigatorio: true
      });

      if (!confirmado) return;

      await voltarListaMaterialOSComMotivo(id, confirmado.motivo);
      await carregarMateriaisCompleto();
    });

  $(document).off("click.materialDuplicarLista", ".material-lista-duplicar")
    .on("click.materialDuplicarLista", ".material-lista-duplicar", async function (e) {
      e.stopPropagation();
      const id = $(this).data("id");

      const confirmado = await confirmarAcaoMaterial({
        titulo: "Duplicar lista",
        mensagem: "Será criada uma nova lista com os mesmos materiais, sem separação ou compra registrada.",
        tipo: "warning",
        confirmar: "Duplicar"
      });

      if (!confirmado) return;

      await duplicarListaMaterialOS(id);
      await carregarMateriaisCompleto();
    });

  $(document).off("click.materialMoverListaOS", ".material-lista-mover-os")
    .on("click.materialMoverListaOS", ".material-lista-mover-os", async function (e) {
      e.stopPropagation();
      const id = $(this).data("id");
      const lista = state.listasOS.find(item => Number(item.id) === Number(id));
      const dados = await abrirModalMoverListaOS(lista);

      if (!dados) return;

      const confirmado = await confirmarAcaoMaterial({
        titulo: dados.modo === "transferir" ? "Transferir lista" : "Copiar lista",
        mensagem: dados.modo === "transferir"
          ? "A lista sairá desta OS e passará a pertencer à OS selecionada."
          : "Será criada uma nova lista na OS selecionada, mantendo a lista atual nesta OS.",
        tipo: dados.modo === "transferir" ? "warning" : "success",
        confirmar: dados.modo === "transferir" ? "Transferir" : "Copiar"
      });

      if (!confirmado) return;

      try {
        await moverListaMaterialOS(id, dados);
        state.modoVisualizacao = "kanban";
        state.listaSelecionada = null;
        await carregarMateriaisCompleto();
      } catch (err) {
        console.error(err);
        alert(err.responseJSON?.erro || "Nao foi possivel copiar ou transferir a lista.");
      }
    });

  $(document).off("click.materialHistoricoLista", ".material-lista-historico")
    .on("click.materialHistoricoLista", ".material-lista-historico", async function (e) {
      e.stopPropagation();
      const id = $(this).data("id");
      const historico = await listarHistoricoListaMaterialOS(id);
      renderHistoricoListaMaterial(historico);
      $("#modalHistoricoListaMaterial").prop("hidden", false);
    });

  $(document).off("click.materialConferirLista", ".material-lista-conferir")
    .on("click.materialConferirLista", ".material-lista-conferir", function (e) {
      e.stopPropagation();
      const id = $(this).data("id");
      sessionStorage.setItem("estoque_conferencia_lista", String(id));
      document.querySelector('.bt_menuP[data-pagina="/client/pages/estoque.html"]')?.click();
    });

  $(document).off("click.materialFecharHistoricoLista", "#btnFecharHistoricoListaMaterial")
    .on("click.materialFecharHistoricoLista", "#btnFecharHistoricoListaMaterial", function () {
      $("#modalHistoricoListaMaterial").prop("hidden", true);
    });

  $(document).off("click.materialFecharModalLista", "#btnFecharModalListaMaterial, #btnCancelarListaMaterial")
    .on("click.materialFecharModalLista", "#btnFecharModalListaMaterial, #btnCancelarListaMaterial", fecharModalListaMaterial);

  $(document).off("click.materialSalvarLista", "#btnSalvarListaMaterial")
    .on("click.materialSalvarLista", "#btnSalvarListaMaterial", async function () {
      const id = $("#listaMaterialId").val();
      const payload = {
        id_os: state.osSelecionada,
        titulo: $("#listaMaterialTituloInput").val().trim(),
        descricao: $("#listaMaterialDescricaoInput").val().trim() || null,
        origem_setor: $("#listaMaterialOrigemInput").val(),
        observacao_rapida: $("#listaMaterialObservacaoRapidaInput").val().trim() || null,
        responsavel_id: $("#listaMaterialResponsavelInput").val() || null,
        prioridade: $("#listaMaterialPrioridadeInput").val() || "normal",
        sem_prazo: $("#listaMaterialSemPrazoInput").is(":checked") ? 1 : 0,
        prazo: $("#listaMaterialSemPrazoInput").is(":checked") ? null : ($("#listaMaterialPrazoInput").val() || null)
      };

      if (!state.osSelecionada) {
        alert("Selecione uma OS antes de criar a lista.");
        return;
      }

      if (!payload.titulo) {
        alert("Informe o nome da lista.");
        return;
      }

      if (id) {
        await atualizarListaMaterialOS(id, payload);
      } else {
        payload.status = payload.origem_setor;
        const nova = await criarListaMaterialOS(payload);
        state.listaSelecionada = nova.insertId;
      }

      fecharModalListaMaterial();
      state.modoVisualizacao = "kanban";
      await carregarMateriaisCompleto();
    });

  $(document).off("change.materialListaSemPrazo", "#listaMaterialSemPrazoInput")
    .on("change.materialListaSemPrazo", "#listaMaterialSemPrazoInput", function () {
      const semPrazo = $(this).is(":checked");
      $("#listaMaterialPrazoInput").prop("disabled", semPrazo);
      if (semPrazo) $("#listaMaterialPrazoInput").val("");
    });

  $(document).off("click.materialOcSalvar", ".material-oc-salvar")
    .on("click.materialOcSalvar", ".material-oc-salvar", async function () {
      const $btn = $(this);
      const $box = $btn.closest(".material-oc-box");
      const id = $btn.data("id");
      const oc = String($box.find(".material-oc-input").val() || "").trim();

      $box.find("button, input").prop("disabled", true);

      try {
        await $.ajax({
          url: `/api/materiais/os/editar/${id}`,
          method: "PUT",
          contentType: "application/json",
          data: JSON.stringify({ oc })
        });

        const item = state.dados.find(registro => Number(registro.id) === Number(id));
        if (item) item.oc = oc;

        $box.addClass("salvo");
        setTimeout(() => $box.removeClass("salvo"), 900);
      } catch (err) {
        console.error(err);
        alert("Erro ao salvar OC do material.");
      } finally {
        $box.find("button, input").prop("disabled", false);
      }
    });

  $(document).off("keypress.materialOcInput", ".material-oc-input")
    .on("keypress.materialOcInput", ".material-oc-input", function (e) {
      if (e.which === 13) {
        e.preventDefault();
        $(this).closest(".material-oc-box").find(".material-oc-salvar").trigger("click");
      }
    });

  $(document).off("click.materialSeparar", ".separar")
    .on("click.materialSeparar", ".separar", function () {
      const $btn = $(this);
      const $tr = $btn.closest("tr");

      if ($tr.find(".input-separar").length) return;

      const itemId = $btn.data("id");
      const item = state.dados.find(i => i.id == itemId);

      if (!item) return;

      const atual = Number(item.quantidade_separada || 0);
      const total = Number(item.quantidade || 0);

      const input = `
        <div class="input-separar animar" data-total="${total}">
          <button class="ajustar-separar" data-step="-1" title="Diminuir separado">
            <i class="fa-solid fa-minus"></i>
          </button>
          <input
            type="number"
            min="0"
            max="${total}"
            class="qtd-separar"
            value="${atual}"
            title="Digite e pressione Enter para salvar"
          >
          <button class="ajustar-separar" data-step="1" title="Aumentar separado">
            <i class="fa-solid fa-plus"></i>
          </button>
          <button class="total-separar" title="Separar total">
            Total
          </button>
          <button class="salvar-separar material-separar-save" title="Salvar separação">
            <i class="fa-solid fa-floppy-disk"></i>
          </button>
          <button class="cancelar-separar material-separar-cancel" title="Cancelar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;

      $btn.before(input);
      $tr.addClass("separando-material");
      $tr.find("[data-action='editar'], [data-action='apagar']").addClass("material-separar-hidden");

      const $input = $tr.find(".qtd-separar");
      $input.focus();
      $input.select();
    });

  $(document).off("click.materialSepararAjuste", ".ajustar-separar")
    .on("click.materialSepararAjuste", ".ajustar-separar", async function () {
      const $container = $(this).closest(".input-separar");
      const $input = $container.find(".qtd-separar");
      const total = Number($container.data("total") || 0);
      const step = Number($(this).data("step") || 0);
      const valor = limitarSeparacao(Number($input.val() || 0) + step, total);

      $input.val(valor);
    });

  $(document).off("click.materialSepararTotal", ".total-separar")
    .on("click.materialSepararTotal", ".total-separar", function () {
      const $container = $(this).closest(".input-separar");
      const total = Number($container.data("total") || 0);

      $container.find(".qtd-separar").val(total);
    });

  $(document).off("click.materialSepararSalvar", ".salvar-separar")
    .on("click.materialSepararSalvar", ".salvar-separar", async function () {
      const $container = $(this).closest(".input-separar");
      const $input = $container.find(".qtd-separar");
      const total = Number($container.data("total") || 0);
      const valor = limitarSeparacao(Number($input.val() || 0), total);

      $input.val(valor);
      await salvarSeparacaoMaterial($container, valor);
    });

  $(document).off("click.materialSepararCancelar", ".cancelar-separar")
    .on("click.materialSepararCancelar", ".cancelar-separar", function () {
      const $tr = $(this).closest("tr");

      $(this).closest(".input-separar").remove();
      $tr.removeClass("separando-material");
      $tr.find("[data-action='editar'], [data-action='apagar']").removeClass("material-separar-hidden");
    });

  $(document).off("keypress.materialSeparar", ".qtd-separar")
    .on("keypress.materialSeparar", ".qtd-separar", async function (e) {
      if (e.which !== 13) return;

      const $container = $(this).closest(".input-separar");
      const total = Number($container.data("total") || 0);
      const valor = limitarSeparacao(Number($(this).val() || 0), total);

      $(this).val(valor);
      $container.find(".salvar-separar").trigger("click");
    });

  $(document).off("keydown.materialSeparar", ".qtd-separar")
    .on("keydown.materialSeparar", ".qtd-separar", function (e) {
      if (e.key === "Escape") {
        const $tr = $(this).closest("tr");

        $(this).closest(".input-separar").remove();
        $tr.removeClass("separando-material");
        $tr.find("[data-action='editar'], [data-action='apagar']").removeClass("material-separar-hidden");
      }
    });

  $(document).off("click.materialEditarItem", "#listaMaterial [data-action='editar']")
    .on("click.materialEditarItem", "#listaMaterial [data-action='editar']", function () {

    const $tr = $(this).closest("tr");

    if ($tr.hasClass("editando")) return;

    $tr.addClass("editando");

    const quantidadeAtual = $tr.find("td").eq(5).text().trim();
    const observacaoAtual = $tr.find("td").eq(7).text().trim();

    // 🔥 MATERIAL
    // 🔥 QUANTIDADE
    $tr.find("td").eq(5).html(`
    <input
      data-field="quantidade"
      type="number"
      min="0"
      step="1"
      value="${quantidadeAtual}"
      title="Editar quantidade"
    >
  `);

    $tr.find("td").eq(7).html(`
    <input
      data-field="observacao"
      type="text"
      maxlength="255"
      value="${escapeHtmlInput(observacaoAtual === "-" ? "" : observacaoAtual)}"
      placeholder="Obs."
      title="Editar observacao"
    >
  `);

    // 🔥 TROCA BOTÕES
    $tr.find(".col-acoes").html(`
    <button class="save" title="Salvar">
      <i class="fa-solid fa-floppy-disk"></i>
    </button>

    <button class="cancel-edit" title="Cancelar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `);

  });

  $(document).off("click.materialCancelarEdicao", "#listaMaterial .cancel-edit")
    .on("click.materialCancelarEdicao", "#listaMaterial .cancel-edit", async function () {

    const $tr = $(this).closest("tr");

    // 🔥 remove modo edição
    $tr.removeClass("editando");

    // 🔥 recarrega a tabela inteira (mais simples e seguro)
    await carregarMateriaisCompleto();

  });


  $(document).off("click.materialCancelarNovo", "#listaMaterial .cancel")
    .on("click.materialCancelarNovo", "#listaMaterial .cancel", async function () {
    // 🔥 recarrega a tabela inteira (mais simples e seguro)
    await carregarMateriaisCompleto();

  });


  // 🔥 apagar
  $(document).off("click.materialApagarItem", "#listaMaterial [data-action='apagar']")
    .on("click.materialApagarItem", "#listaMaterial [data-action='apagar']", async function () {

    const id = $(this).data("id");

    const confirmado = await confirmarAcaoMaterial({
      titulo: "Excluir material",
      mensagem: "Este material será removido da lista atual.",
      tipo: "danger",
      confirmar: "Excluir"
    });

    if (!confirmado) return;

    await $.ajax({
      url: `/api/materiais/os/excluir/${id}`,
      method: "DELETE"
    });

    await carregarMateriaisCompleto();

  });

  $(document)
    .off("click.materialExportExcel", "#btnExportarLista")
    .on("click.materialExportExcel", "#btnExportarLista", exportarExcel);

  $(document)
    .off("click.materialExportPDF", "#btnExportarListaPDF")
    .on("click.materialExportPDF", "#btnExportarListaPDF", function (event) {
      event.preventDefault();
      event.stopPropagation();
      abrirMenuPDFMaterial($(this));
    });

  $(document)
    .off("click.materialExportPDFOpcao", "#menuExportarListaPDF [data-pdf-modo]")
    .on("click.materialExportPDFOpcao", "#menuExportarListaPDF [data-pdf-modo]", function (event) {
      event.preventDefault();
      event.stopPropagation();
      const modo = $(this).data("pdfModo") || "completo";
      fecharMenuPDFMaterial();
      exportarPDF(modo);
    });

  $(document)
    .off("click.materialExportPDFOutside")
    .on("click.materialExportPDFOutside", function (event) {
      if ($(event.target).closest("#btnExportarListaPDF, #menuExportarListaPDF").length) return;
      fecharMenuPDFMaterial();
    });

  $(document)
    .off("click.materialFornecedoresInfo", "#btnInfoFornecedoresLista")
    .on("click.materialFornecedoresInfo", "#btnInfoFornecedoresLista", async function () {
      const $btn = $(this);
      const $resumo = $("#resumoFornecedoresSelecionados");

      if (!$resumo.prop("hidden") && $resumo.hasClass("ativo")) {
        $resumo.removeClass("ativo").prop("hidden", true);
        $btn.removeClass("ativo");
        return;
      }

      try {
        $btn.prop("disabled", true).addClass("carregando");
        const fornecedores = await carregarResumoFornecedoresLista();

        if (!fornecedores.length) {
          alert("Nenhum fornecedor adicionado nesta lista.");
          return;
        }

        renderInfoFornecedoresLista(fornecedores);
        $resumo.addClass("ativo").prop("hidden", false);
        $btn.addClass("ativo");
      } catch (err) {
        console.error("Erro ao carregar resumo de fornecedores:", err);
        alert("Erro ao carregar informaÃ§Ãµes dos fornecedores.");
      } finally {
        $btn.prop("disabled", false).removeClass("carregando");
      }
    });

  async function carregarResumoFornecedoresLista() {
    const dados = state.dados || [];
    const itensFiltrados = state.listaSelecionada
      ? dados.filter(item => String(item.id_lista || "") === String(state.listaSelecionada || ""))
      : dados;
    const itens = itensFiltrados.length ? itensFiltrados : dados;

    if (!itens.length) {
      return [];
    }

    const respostas = await Promise.all(
      itens.map(async item => ({
        item,
        fornecedores: await getFornecedoresMaterial(item.id)
      }))
    );

    const resumo = new Map();

    respostas.forEach(({ item, fornecedores }) => {
      const quantidadeMaterial = Number(item.quantidade || 0);

      (fornecedores || []).forEach(fornecedor => {
        const idFornecedor = String(fornecedor.id_fornecedor || fornecedor.nome_fornecedor || "sem-id");
        const valorUnitario = calcularValorRS(Number(fornecedor.valor || 0), fornecedor.icms);
        const quantidade = Number(fornecedor.quantidade || quantidadeMaterial || 0);
        const total = valorUnitario * quantidade;
        const selecionado = Boolean(fornecedor.selecionado);
        const atual = resumo.get(idFornecedor) || {
          nome: fornecedor.nome_fornecedor || "Fornecedor sem nome",
          itens: 0,
          quantidade: 0,
          total: 0,
          totalSelecionado: 0,
          quantidadeSelecionada: 0,
          selecionados: 0,
          ok: 0
        };

        atual.itens += 1;
        atual.quantidade += quantidade;
        atual.total += total;
        atual.totalSelecionado += selecionado ? total : 0;
        atual.quantidadeSelecionada += selecionado ? quantidade : 0;
        atual.selecionados += selecionado ? 1 : 0;
        atual.ok += fornecedor.material_ok ? 1 : 0;

        resumo.set(idFornecedor, atual);
      });
    });

    return [...resumo.values()].sort((a, b) => b.total - a.total);
  }

  function renderInfoFornecedoresLista(fornecedores) {
    const $resumo = $("#resumoFornecedoresSelecionados");
    const cores = ["#ee7722", "#efda38", "#22c55e", "#60a5fa", "#a78bfa", "#94a3b8"];
    const totalGeral = fornecedores.reduce((total, fornecedor) => total + fornecedor.total, 0);
    const itensGeral = fornecedores.reduce((total, fornecedor) => total + fornecedor.itens, 0);
    const quantidadeGeral = fornecedores.reduce((total, fornecedor) => total + fornecedor.quantidade, 0);
    const totalSelecionadoGeral = fornecedores.reduce((total, fornecedor) => total + fornecedor.totalSelecionado, 0);
    const quantidadeSelecionadaGeral = fornecedores.reduce((total, fornecedor) => total + fornecedor.quantidadeSelecionada, 0);
    const fornecedoresOrdenados = [...fornecedores].sort(ordenarFornecedoresPorTotal);
    const fornecedorPrincipal = obterFornecedorPrincipal(fornecedoresOrdenados);
    const ticketMedio = itensGeral ? totalGeral / itensGeral : 0;
    const selecionados = fornecedoresOrdenados.reduce((total, fornecedor) => total + fornecedor.selecionados, 0);
    const materiaisOk = fornecedoresOrdenados.reduce((total, fornecedor) => total + fornecedor.ok, 0);
    const pizza = montarGraficoPizzaFornecedores(fornecedoresOrdenados, cores, totalGeral);
    const cards = fornecedoresOrdenados.map((fornecedor, index) => {
      const percentual = totalGeral ? (fornecedor.total / totalGeral) * 100 : 0;
      const cor = cores[index % cores.length];

      return `
        <div class="materiais-fornecedor-card" style="--fornecedor-cor:${cor}">
          <span>${escapeHtmlLocal(fornecedor.nome)}</span>
          <strong>${formatarMoedaPDF(fornecedor.totalSelecionado)}</strong>
          <small>Selecionado: ${formatarMoedaPDF(fornecedor.totalSelecionado)} | Qtd. ${fornecedor.quantidadeSelecionada}</small>
          <small>Cotado: ${formatarMoedaPDF(fornecedor.total)} | Qtd. ${fornecedor.quantidade}</small>
          <small>${fornecedor.itens} cotacao(oes) | Qtd. ${fornecedor.quantidade}</small>
          <small>${fornecedor.selecionados} selecionado(s) | ${fornecedor.ok} OK</small>
          <em>${percentual.toFixed(0)}%</em>
        </div>
      `;
    }).join("");

    $resumo.html(`
      <div class="materiais-fornecedores-total">
        <div class="materiais-fornecedores-pizza" style="${pizza}" title="Participacao por valor cotado"></div>
        <div>
          <span>Total cotado por fornecedores</span>
          <strong>${formatarMoedaPDF(totalGeral)}</strong>
          <small>${fornecedores.length} fornecedor(es) | ${itensGeral} cotacao(oes) | Qtd. ${quantidadeGeral}</small>
          <small>Selecionado: ${formatarMoedaPDF(totalSelecionadoGeral)} | Qtd. ${quantidadeSelecionadaGeral}</small>
        </div>
      </div>
      <div class="materiais-fornecedores-insights">
        <div>
          <span>Maior volume cotado</span>
          <strong>${escapeHtmlLocal(fornecedorPrincipal.texto)}</strong>
          <small>${fornecedorPrincipal.total ? formatarMoedaPDF(fornecedorPrincipal.total) : "R$ 0,00"}</small>
        </div>
        <div>
          <span>Ticket medio por cotacao</span>
          <strong>${formatarMoedaPDF(ticketMedio)}</strong>
          <small>Ajuda a comparar concentracao por fornecedor</small>
        </div>
        <div>
          <span>Materiais validados</span>
          <strong>${materiaisOk}/${itensGeral}</strong>
          <small>Marcacoes OK nas cotacoes</small>
        </div>
      </div>
      <div class="materiais-fornecedores-cards">
        ${cards}
      </div>
    `);
  }

  function montarGraficoPizzaFornecedores(fornecedores, cores, totalGeral) {
    if (!totalGeral) return "background: rgba(255,255,255,0.08);";

    let acumulado = 0;
    const partes = fornecedores.map((fornecedor, index) => {
      const inicio = acumulado;
      const fatia = (fornecedor.total / totalGeral) * 100;
      acumulado += fatia;

      return `${cores[index % cores.length]} ${inicio.toFixed(2)}% ${acumulado.toFixed(2)}%`;
    });

    return `background: conic-gradient(${partes.join(", ")});`;
  }

  function ordenarFornecedoresPorTotal(a, b) {
    const diferenca = Number(b.total || 0) - Number(a.total || 0);
    if (Math.abs(diferenca) > 0.01) return diferenca;

    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  }

  function obterFornecedorPrincipal(fornecedores) {
    if (!fornecedores.length) {
      return { texto: "-", total: 0 };
    }

    const maiorTotal = Number(fornecedores[0].total || 0);
    const empatados = fornecedores.filter(f =>
      Math.abs(Number(f.total || 0) - maiorTotal) < 0.01
    );

    if (empatados.length > 1) {
      return {
        texto: `Empate: ${empatados.map(f => f.nome).join(", ")}`,
        total: maiorTotal
      };
    }

    return {
      texto: fornecedores[0].nome || "-",
      total: maiorTotal
    };
  }

  function exportarExcel() {
    const tabela = document.getElementById("tableMaterial");

    let html = tabela.outerHTML;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "materiais.xls";
    a.click();

    URL.revokeObjectURL(url);
  }

  function abrirMenuPDFMaterial($botao) {
    const menuExistente = $("#menuExportarListaPDF");

    if (menuExistente.length) {
      fecharMenuPDFMaterial();
      return;
    }

    const offset = $botao.offset();
    const top = (offset?.top || 0) + $botao.outerHeight() + 6;
    const left = Math.max(8, (offset?.left || 0) + $botao.outerWidth() - 220);

    const $menu = $(`
      <div id="menuExportarListaPDF" class="material-pdf-menu">
        <button type="button" data-pdf-modo="completo">
          <i class="fa-solid fa-file-lines"></i>
          <span>Dados completo</span>
        </button>
        <button type="button" data-pdf-modo="cliente">
          <i class="fa-solid fa-user-tie"></i>
          <span>Somente lista cliente</span>
        </button>
      </div>
    `);

    $menu.css({ top, left });
    $("body").append($menu);
  }

  function fecharMenuPDFMaterial() {
    $("#menuExportarListaPDF").remove();
  }

  function exportarPDF(modo = "completo") {
    const itens = state.dados || [];

    if (!state.osSelecionada || !itens.length) {
      alert("Selecione uma OS com materiais para exportar em PDF.");
      return;
    }

    const janela = window.open("", "_blank", "width=1200,height=900");

    if (!janela) {
      alert("O navegador bloqueou a janela do PDF. Libere pop-ups para gerar o relatório.");
      return;
    }

    janela.document.open();
    janela.document.write(modo === "cliente" ? montarHtmlPDFMateriaisCliente(itens) : montarHtmlPDFMateriais(itens));
    janela.document.close();
  }

  function montarHtmlPDFMateriais(itens) {
    const optionOS = $("#cbxOS option:selected").text().trim();
    const listaAtual = state.listasOS.find(lista => Number(lista.id) === Number(state.listaSelecionada));
    const tituloLista = listaAtual?.titulo || $("#materialDetalheTitulo").text().trim() || "Lista de materiais";
    const resumoTela = $("#materialDetalheResumo").text().trim();
    const dataExportacao = new Date().toLocaleString("pt-BR");
    const totais = calcularTotaisPDF(itens);
    const linhas = itens.map(renderLinhaPDFMaterial).join("");

    return `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Lista de materiais - OS ${escapeHtmlLocal(state.osSelecionada)}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #171717;
            background: #fff;
            font-size: 10px;
          }
          .pdf-head {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #202020;
          }
          .pdf-head h1 {
            margin: 0 0 4px;
            font-size: 18px;
            letter-spacing: 0;
          }
          .pdf-head strong,
          .pdf-head span {
            display: block;
          }
          .pdf-head span,
          .pdf-meta span {
            color: #555;
            line-height: 1.35;
          }
          .pdf-meta {
            text-align: right;
          }
          .pdf-resumo {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
            margin: 10px 0;
          }
          .pdf-card {
            border: 1px solid #d7d7d7;
            border-radius: 6px;
            padding: 6px;
            background: #f7f7f7;
          }
          .pdf-card span {
            display: block;
            color: #666;
            font-size: 8px;
            text-transform: uppercase;
          }
          .pdf-card strong {
            display: block;
            margin-top: 2px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th {
            background: #242424;
            color: #fff;
            font-size: 8px;
            text-transform: uppercase;
          }
          th,
          td {
            border: 1px solid #d5d5d5;
            padding: 4px;
            vertical-align: middle;
            overflow-wrap: anywhere;
          }
          tbody tr:nth-child(even) {
            background: #f4f4f4;
          }
          .col-img { width: 46px; text-align: center; }
          .col-material { width: 19%; }
          .col-observacao { width: 12%; }
          .col-qtd { width: 45px; text-align: center; }
          .col-sep { width: 70px; text-align: center; }
          .col-valor { width: 70px; text-align: right; }
          .col-oc { width: 58px; text-align: center; }
          .material-img {
            width: 34px;
            height: 34px;
            object-fit: cover;
            border-radius: 5px;
            border: 1px solid #d0d0d0;
            background: #eee;
          }
          .material-nome {
            font-weight: 700;
            font-size: 10px;
          }
          .material-attr {
            margin-top: 2px;
            color: #555;
            font-size: 8px;
          }
          .pdf-foot {
            margin-top: 8px;
            color: #666;
            font-size: 8px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <header class="pdf-head">
          <div>
            <h1>Lista de materiais</h1>
            <strong>${escapeHtmlLocal(optionOS || `OS ${state.osSelecionada}`)}</strong>
            <span>${escapeHtmlLocal(tituloLista)}</span>
            <span>${escapeHtmlLocal(resumoTela)}</span>
          </div>
          <div class="pdf-meta">
            <strong>Relatório completo</strong>
            <span>Exportado em ${escapeHtmlLocal(dataExportacao)}</span>
            <span>OS: ${escapeHtmlLocal(state.osSelecionada)}</span>
            <span>Lista: ${escapeHtmlLocal(state.listaSelecionada || "-")}</span>
          </div>
        </header>

        <section class="pdf-resumo">
          <div class="pdf-card"><span>Itens</span><strong>${totais.itens}</strong></div>
          <div class="pdf-card"><span>Qtd. total</span><strong>${totais.quantidade}</strong></div>
          <div class="pdf-card"><span>Separado</span><strong>${totais.separado}</strong></div>
          <div class="pdf-card"><span>Comprado</span><strong>${totais.comprado}</strong></div>
          <div class="pdf-card"><span>Faltante</span><strong>${totais.faltante}</strong></div>
          <div class="pdf-card"><span>Total estimado</span><strong>${formatarMoedaPDF(totais.valorTotal)}</strong></div>
        </section>

        <table>
          <thead>
            <tr>
              <th class="col-img">Img</th>
              <th class="col-material">Material</th>
              <th>Categoria</th>
              <th class="col-qtd">Qtd.</th>
              <th class="col-observacao">Obs.</th>
              <th>Código</th>
              <th>Fabricante</th>
              <th class="col-sep">Separação</th>
              <th>Fornecedor</th>
              <th class="col-valor">Preço</th>
              <th class="col-valor">Total</th>
              <th class="col-oc">OC</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>

        <div class="pdf-foot">
          As imagens são carregadas diretamente dos links cadastrados no material. Caso algum servidor externo bloqueie impressão, a imagem pode não aparecer no PDF.
        </div>

        <script>
          window.addEventListener("load", function () {
            setTimeout(function () {
              window.print();
            }, 700);
          });
        </script>
      </body>
      </html>
    `;
  }

  function renderLinhaPDFMaterial(item) {
    const quantidade = Number(item.quantidade || 0);
    const separado = Number(item.quantidade_separada || 0);
    const comprado = Number(item.quantidade_comprada || 0);
    const faltante = Math.max(0, quantidade - separado - comprado);
    const preco = Number(item.valor_escolhido || item.menor_valor || 0);
    const total = quantidade * preco;
    const imgSrc = item.imagem
      ? `${item.imagem}?v=${item.versao_foto || ""}`
      : "/imagens/imagemmaterial.webp";

    return `
      <tr>
        <td class="col-img">
          <img class="material-img" src="${escapeHtmlLocal(imgSrc)}" crossorigin="anonymous" alt="">
        </td>
        <td class="col-material">
          <div class="material-nome">${escapeHtmlLocal(item.nome || "-")}</div>
          <div class="material-attr">${escapeHtmlLocal(item.atributos || "-")}</div>
        </td>
        <td>${escapeHtmlLocal(item.categoria || "-")}</td>
        <td class="col-qtd">${quantidade}</td>
        <td class="col-observacao">${escapeHtmlLocal(item.observacao || "-")}</td>
        <td>${escapeHtmlLocal(item.codigo || "-")}</td>
        <td>${escapeHtmlLocal(item.fabricante || "-")}</td>
        <td class="col-sep">${separado}/${quantidade}<br><small>Falta ${faltante}</small></td>
        <td>${escapeHtmlLocal(item.fornecedor_nome || item.fornecedor_menor_nome || "-")}</td>
        <td class="col-valor">${preco ? formatarMoedaPDF(preco) : "-"}</td>
        <td class="col-valor">${preco ? formatarMoedaPDF(total) : "-"}</td>
        <td class="col-oc">${escapeHtmlLocal(item.oc || "-")}</td>
      </tr>
    `;
  }

  function montarHtmlPDFMateriaisCliente(itens) {
    const optionOS = $("#cbxOS option:selected").text().trim();
    const listaAtual = state.listasOS.find(lista => Number(lista.id) === Number(state.listaSelecionada));
    const tituloLista = listaAtual?.titulo || $("#materialDetalheTitulo").text().trim() || "Lista de materiais";
    const resumoTela = $("#materialDetalheResumo").text().trim();
    const dataExportacao = new Date().toLocaleString("pt-BR");
    const linhas = itens.map(renderLinhaPDFMaterialCliente).join("");

    return `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Lista de Materiais - OS ${escapeHtmlLocal(state.osSelecionada)}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #171717;
            background: #fff;
            font-size: 10px;
          }
          .pdf-head {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #202020;
          }
          .pdf-head h1 {
            margin: 0 0 4px;
            font-size: 17px;
            letter-spacing: 0;
          }
          .pdf-head strong,
          .pdf-head span {
            display: block;
          }
          .pdf-head span,
          .pdf-meta span {
            color: #555;
            line-height: 1.35;
          }
          .pdf-meta {
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 10px;
          }
          th {
            background: #242424;
            color: #fff;
            font-size: 8px;
            text-transform: uppercase;
          }
          th,
          td {
            border: 1px solid #d5d5d5;
            padding: 5px;
            vertical-align: middle;
            overflow-wrap: anywhere;
          }
          tbody tr:nth-child(even) {
            background: #f4f4f4;
          }
          .col-img { width: 48px; text-align: center; }
          .col-material { width: 28%; }
          .col-codigo { width: 9%; }
          .col-fabricante { width: 11%; }
          .col-qtd,
          .col-und { width: 48px; text-align: center; }
          .col-obs { width: 24%; }
          .material-img {
            width: 36px;
            height: 36px;
            object-fit: cover;
            border-radius: 5px;
            border: 1px solid #d0d0d0;
            background: #eee;
          }
          .material-nome {
            font-weight: 700;
            font-size: 10px;
          }
          .material-attr {
            margin-top: 2px;
            color: #555;
            font-size: 8px;
          }
          .pdf-foot {
            margin-top: 8px;
            color: #666;
            font-size: 8px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <header class="pdf-head">
          <div>
            <h1>Lista de materiais</h1>
            <strong>${escapeHtmlLocal(optionOS || `OS ${state.osSelecionada}`)}</strong>
            <span>${escapeHtmlLocal(tituloLista)}</span>
            <span>${escapeHtmlLocal(resumoTela)}</span>
          </div>
          <div class="pdf-meta">
            <strong>Lista para cliente</strong>
            <span>Exportado em ${escapeHtmlLocal(dataExportacao)}</span>
            <span>OS: ${escapeHtmlLocal(state.osSelecionada)}</span>
            <span>Lista: ${escapeHtmlLocal(state.listaSelecionada || "-")}</span>
          </div>
        </header>

        <table>
          <thead>
            <tr>
              <th class="col-img">Foto</th>
              <th class="col-material">Descrição</th>
              <th class="col-codigo">Código</th>
              <th class="col-fabricante">Fabricante</th>
              <th class="col-obs">Observação</th>
              <th class="col-qtd">Qtde</th>
              <th class="col-und">Unidade</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>

        <div class="pdf-foot" style="color: #750000;">
          A lista de materiais contempla os principais componentes previstos para a execução. Pequenos insumos, acessórios e detalhes complementares deverão ser verificados em campo e incluídos, se necessário, durante a elaboração do orçamento.
        </div>

        <script>
          window.addEventListener("load", function () {
            setTimeout(function () {
              window.print();
            }, 700);
          });
        </script>
      </body>
      </html>
    `;
  }

  function renderLinhaPDFMaterialCliente(item) {
    const quantidade = Number(item.quantidade || 0);
    const imgSrc = item.imagem
      ? `${item.imagem}?v=${item.versao_foto || ""}`
      : "/imagens/imagemmaterial.webp";

    return `
      <tr>
        <td class="col-img">
          <img class="material-img" src="${escapeHtmlLocal(imgSrc)}" crossorigin="anonymous" alt="">
        </td>
        <td class="col-material">
          <div class="material-nome">${escapeHtmlLocal(item.nome || "-")}</div>
          <div class="material-attr">${escapeHtmlLocal(item.atributos || "-")}</div>
        </td>
        <td class="col-codigo">${escapeHtmlLocal(item.codigo || "-")}</td>
        <td class="col-fabricante">${escapeHtmlLocal(item.fabricante || "-")}</td>
        <td class="col-obs">${escapeHtmlLocal(item.observacao || "-")}</td>
        <td class="col-qtd">${quantidade}</td>
        <td class="col-und">${escapeHtmlLocal(item.unidade || "-")}</td>
      </tr>
    `;
  }

  function calcularTotaisPDF(itens) {
    return itens.reduce((acc, item) => {
      const quantidade = Number(item.quantidade || 0);
      const separado = Number(item.quantidade_separada || 0);
      const comprado = Number(item.quantidade_comprada || 0);
      const valor = Number(item.valor_escolhido || item.menor_valor || 0);

      acc.itens += 1;
      acc.quantidade += quantidade;
      acc.separado += separado;
      acc.comprado += comprado;
      acc.faltante += Math.max(0, quantidade - separado - comprado);
      acc.valorTotal += quantidade * valor;

      return acc;
    }, {
      itens: 0,
      quantidade: 0,
      separado: 0,
      comprado: 0,
      faltante: 0,
      valorTotal: 0
    });
  }

  function formatarMoedaPDF(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function limitarSeparacao(valor, total) {
    if (Number.isNaN(valor) || valor < 0) return 0;
    if (valor > total) return total;
    return valor;
  }

  function escapeHtmlInput(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function salvarSeparacaoMaterial($container, valor) {
    const $tr = $container.closest("tr");
    const id = $tr.data("id");
    const item = state.dados.find(i => i.id == id);

    if (!item) return;

    $container.find("button, input").prop("disabled", true);

    try {
      await $.ajax({
        url: `/api/materiais/os/editar/${id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
          quantidade: Number(item.quantidade || 0),
          quantidade_separada: valor
        })
      });

      await carregarMateriaisCompleto();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar separação do material");
      $container.find("button, input").prop("disabled", false);
    }
  }

  function abrirModalListaMaterial(lista = null) {
    $("#listaMaterialId").val(lista?.id || "");
    $("#listaMaterialTituloInput").val(lista?.titulo || "");
    $("#listaMaterialDescricaoInput").val(lista?.descricao || "");
    $("#listaMaterialOrigemInput").val(lista?.origem_setor || "orcamento");
    $("#listaMaterialObservacaoRapidaInput").val(lista?.observacao_rapida || "");
    $("#listaMaterialPrioridadeInput").val(lista?.prioridade || "normal");
    $("#listaMaterialResponsavelInput").html(renderOptionsResponsaveis(lista?.responsavel_id));
    $("#listaMaterialPrazoInput").val(String(lista?.prazo || "").slice(0, 10));
    $("#listaMaterialSemPrazoInput").prop("checked", Boolean(Number(lista?.sem_prazo || 0)));
    $("#listaMaterialPrazoInput").prop("disabled", Boolean(Number(lista?.sem_prazo || 0)));
    $("#modalListaMaterialTitulo").text(lista ? "Editar lista" : "Nova lista");
    $("#modalListaMaterial").prop("hidden", false);
    $("#listaMaterialTituloInput").focus();
  }

  function fecharModalListaMaterial() {
    $("#modalListaMaterial").prop("hidden", true);
  }

  function abrirModalMoverListaOS(lista = null) {
    return new Promise(resolve => {
      const listaId = lista?.id || "";
      const osAtual = String(lista?.id_os || state.osSelecionada || "");
      const opcoesOS = renderOptionsOSDestino(osAtual);

      if (!opcoesOS) {
        alert("Nenhuma OS de destino disponivel.");
        resolve(false);
        return;
      }

      $("#modalMoverListaMaterial").remove();

      const html = `
        <div id="modalMoverListaMaterial" class="modal-confirmacao-material" role="dialog" aria-modal="true">
          <div class="modal-confirmacao-material-box modal-mover-lista-material-box is-info">
            <div class="modal-confirmacao-material-icone">
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
            </div>
            <h3>Copiar ou transferir lista</h3>
            <p>${escapeHtmlLocal(lista?.titulo || `Lista #${listaId}`)}</p>

            <div class="modal-mover-lista-material-grid">
              <label>
                <span>Ação</span>
                <select id="modalMoverListaMaterialModo">
                  <option value="transferir">Transferir para outra OS</option>
                  <option value="copiar">Copiar para outra OS</option>
                </select>
              </label>

              <label>
                <span>OS de destino</span>
                <select id="modalMoverListaMaterialDestino">
                  ${opcoesOS}
                </select>
              </label>
            </div>

            <small class="modal-mover-lista-material-info">
              Transferir corrige lista criada na OS errada. Copiar cria uma nova lista na OS escolhida.
            </small>

            <div class="modal-confirmacao-material-actions">
              <button type="button" id="btnCancelarMoverListaMaterial" class="bt_padrao bt_cancelar">Cancelar</button>
              <button type="button" id="btnConfirmarMoverListaMaterial" class="bt_padrao bt_cad">Continuar</button>
            </div>
          </div>
        </div>
      `;

      $("body").append(html);

      const fechar = resposta => {
        $("#modalMoverListaMaterial").remove();
        $(document).off(".materialMoverListaModal");
        resolve(resposta);
      };

      $("#btnCancelarMoverListaMaterial").on("click.materialMoverListaModal", () => fechar(false));
      $("#btnConfirmarMoverListaMaterial").on("click.materialMoverListaModal", () => {
        const modo = $("#modalMoverListaMaterialModo").val();
        const idOSDestino = $("#modalMoverListaMaterialDestino").val();

        if (!idOSDestino) {
          $("#modalMoverListaMaterialDestino").focus();
          return;
        }

        if (modo === "transferir" && String(idOSDestino) === osAtual) {
          alert("Escolha uma OS diferente para transferir.");
          $("#modalMoverListaMaterialDestino").focus();
          return;
        }

        fechar({
          modo,
          id_os_destino: Number(idOSDestino)
        });
      });

      $("#modalMoverListaMaterial").on("click.materialMoverListaModal", event => {
        if (event.target.id === "modalMoverListaMaterial") fechar(false);
      });

      $(document).on("keydown.materialMoverListaModal", event => {
        if (event.key === "Escape") fechar(false);
      });

      $("#modalMoverListaMaterialDestino").focus();
    });
  }

  function confirmarAcaoMaterial({ titulo, mensagem, tipo = "default", confirmar = "Confirmar", pedirMotivo = false, motivoObrigatorio = false }) {
    return new Promise(resolve => {
      const $modal = $("#modalConfirmacaoMaterial");
      const $confirmar = $("#btnConfirmarConfirmacaoMaterial");
      const $cancelar = $("#btnCancelarConfirmacaoMaterial");
      const $motivoWrap = $("#modalConfirmacaoMaterialMotivoWrap");
      const $motivo = $("#modalConfirmacaoMaterialMotivo");

      $modal
        .removeClass("is-danger is-success is-warning")
        .addClass(`is-${tipo}`);

      $("#modalConfirmacaoMaterialTitulo").text(titulo);
      $("#modalConfirmacaoMaterialMensagem").text(mensagem);
      $confirmar.text(confirmar);
      $motivo.val("");
      $motivoWrap.prop("hidden", !pedirMotivo);
      $modal.prop("hidden", false);
      if (pedirMotivo) $motivo.focus();

      const fechar = resposta => {
        $modal.prop("hidden", true);
        $confirmar.off(".materialConfirmacao");
        $cancelar.off(".materialConfirmacao");
        $modal.off(".materialConfirmacao");
        resolve(resposta);
      };

      $confirmar.on("click.materialConfirmacao", () => {
        const motivo = $motivo.val().trim();
        if (motivoObrigatorio && !motivo) {
          $motivo.focus();
          return;
        }
        fechar(pedirMotivo ? { confirmado: true, motivo } : true);
      });
      $cancelar.on("click.materialConfirmacao", () => fechar(false));
      $modal.on("click.materialConfirmacao", event => {
        if (event.target === $modal[0]) fechar(false);
      });
    });
  }

  function renderHistoricoListaMaterial(historico = []) {
    const html = historico.length
      ? historico.map(item => `
        <div class="historico-lista-material-item">
          <strong>${formatarAcaoHistorico(item)}</strong>
          <span>${item.usuario_nome || "Sistema"} - ${formatarDataHistorico(item.criado_em)}</span>
          ${item.motivo ? `<p>${escapeHtmlLocal(item.motivo)}</p>` : ""}
        </div>
      `).join("")
      : `<div class="historico-lista-material-vazio">Nenhum histórico registrado.</div>`;

    $("#historicoListaMaterialConteudo").html(html);
  }

  function formatarAcaoHistorico(item) {
    const origem = item.status_origem ? ` de ${item.status_origem}` : "";
    const destino = item.status_destino ? ` para ${item.status_destino}` : "";
    return `${item.acao || "acao"}${origem}${destino}`;
  }

  function formatarDataHistorico(valor) {
    if (!valor) return "";
    return new Date(valor).toLocaleString("pt-BR");
  }

  function escapeHtmlLocal(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderOptionsResponsaveis(valorSelecionado) {
    const selecionado = String(valorSelecionado || "");
    const opcoes = [`<option value="">Sem responsavel</option>`];

    (state.listaResponsaveis || []).forEach(responsavel => {
      const id = String(responsavel.id || "");
      opcoes.push(`
        <option value="${escapeHtmlLocal(id)}" ${id === selecionado ? "selected" : ""}>
          ${escapeHtmlLocal(responsavel.nome || "")}
        </option>
      `);
    });

    return opcoes.join("");
  }

  function renderOptionsOSDestino(osAtual) {
    const opcoes = [];

    (state.listaOSDisponiveis || [])
      .filter(os => os.statuss != 4)
      .forEach(os => {
        const id = String(os.id_OSs || "");
        if (!id) return;

        const descricao = os.descricao ? ` - ${os.descricao}` : "";
        const atual = id === String(osAtual) ? " (OS atual)" : "";

        opcoes.push(`
          <option value="${escapeHtmlLocal(id)}">
            OS ${escapeHtmlLocal(id)}${escapeHtmlLocal(descricao)}${escapeHtmlLocal(atual)}
          </option>
        `);
      });

    return opcoes.join("");
  }


}
