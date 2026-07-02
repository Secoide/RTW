import { removerAcentos } from "../../utils/formatters/text-formatter.js";
import { atualizarPainel } from "../../utils/dom/atualizar-painel.js";

const filtrosAtivos = new Set();

function normalizar(valor) {
  return removerAcentos(String(valor || "").toLowerCase().trim());
}

function textoColaboradores($os) {
  return $os.find(".p_colabs .colaborador .nome")
    .map((_, el) => $(el).text())
    .get()
    .join(" ");
}

function dadosOS($os) {
  const $info = $os.find(".p_infoOS").first();
  const $status = $os.find(".status_daOSnaOS").first();

  return {
    os: normalizar($os.find(".lbl_OS").text()),
    descricao: normalizar($os.find(".lbl_descricaoOS").text()),
    cliente: normalizar($os.find(".lbl_clienteOS").text()),
    cidade: normalizar($info.data("cidade")),
    colaborador: normalizar(textoColaboradores($os)),
    status: normalizar($status.attr("title") || $status.attr("class")),
    total: $os.find(".p_colabs .colaborador").length,
    prioridade: $os.hasClass("prioridade-alta"),
    semResponsavel: $status.hasClass("semresponsavel")
  };
}

function camposAvancados() {
  const dados = {};
  $(".programacao-avancado-campo").each(function () {
    dados[$(this).data("campo")] = normalizar($(this).val());
  });
  return dados;
}

function existeFiltroAplicado(buscaGlobal, avancado) {
  return Boolean(
    buscaGlobal ||
    filtrosAtivos.size ||
    Object.values(avancado).some(Boolean)
  );
}

function atendeBuscaGlobal(dados, buscaGlobal) {
  if (!buscaGlobal) return true;
  return [
    dados.os,
    dados.descricao,
    dados.cliente,
    dados.cidade,
    dados.colaborador,
    dados.status
  ].some(valor => valor.includes(buscaGlobal));
}

function atendeBuscaAvancada(dados, avancado) {
  if (avancado.os && !dados.os.includes(avancado.os)) return false;
  if (avancado.cliente && !dados.cliente.includes(avancado.cliente)) return false;
  if (avancado.cidade && !dados.cidade.includes(avancado.cidade)) return false;
  if (avancado.colaborador && !dados.colaborador.includes(avancado.colaborador)) return false;
  if (avancado.status && !dados.status.includes(avancado.status)) return false;
  return true;
}

function atendeFiltrosRapidos($os, dados) {
  if (filtrosAtivos.has("prioridade") && !dados.prioridade) return false;
  if (filtrosAtivos.has("com-equipe") && dados.total <= 0) return false;
  if (filtrosAtivos.has("sem-equipe") && dados.total > 0) return false;
  if (filtrosAtivos.has("sem-responsavel") && !dados.semResponsavel) return false;
  return true;
}

function aplicarFiltrosProgramacao() {
  const buscaGlobal = normalizar($("#programacaoBuscaGlobal").val());
  const avancado = camposAvancados();
  const temFiltro = existeFiltroAplicado(buscaGlobal, avancado);

  $("#programacaoLimparBusca").toggle(Boolean(buscaGlobal));

  $(".painelDia").each(function () {
    const $painelDia = $(this);

    $painelDia.find(".painel_OS").each(function () {
      const $os = $(this);
      const dados = dadosOS($os);

      if (!temFiltro) {
        $os.removeClass("matchOsGlobal noMatchOsGlobal");
        return;
      }

      const encontrada =
        atendeBuscaGlobal(dados, buscaGlobal) &&
        atendeBuscaAvancada(dados, avancado) &&
        atendeFiltrosRapidos($os, dados);

      $os.toggleClass("matchOsGlobal", encontrada);
      $os.toggleClass("noMatchOsGlobal", !encontrada);
    });

    atualizarPainel($painelDia);
  });
}

function limparFiltrosProgramacao() {
  filtrosAtivos.clear();
  $(".programacao-filter-btn[data-filtro]").removeClass("ativo");
  $("#programacaoBuscaGlobal").val("");
  $(".programacao-avancado-campo").val("");
  aplicarFiltrosProgramacao();
}

export function initProgramacaoTopbar() {
  $(document).off(".programacaoTopbar");

  $(document).on("input.programacaoTopbar", "#programacaoBuscaGlobal", aplicarFiltrosProgramacao);

  $(document).on("click.programacaoTopbar", "#programacaoLimparBusca", function () {
    $("#programacaoBuscaGlobal").val("");
    aplicarFiltrosProgramacao();
    $("#programacaoBuscaGlobal").trigger("focus");
  });

  $(document).on("click.programacaoTopbar", ".programacao-filter-btn[data-filtro]", function () {
    const filtro = $(this).data("filtro");
    $(this).toggleClass("ativo");

    if ($(this).hasClass("ativo")) {
      filtrosAtivos.add(filtro);
    } else {
      filtrosAtivos.delete(filtro);
    }

    aplicarFiltrosProgramacao();
  });

  $(document).on("click.programacaoTopbar", "#programacaoBuscaAvancadaToggle", function (e) {
    e.stopPropagation();
    const $painel = $("#programacaoBuscaAvancada");
    const aberto = !$painel.prop("hidden");
    $painel.prop("hidden", aberto);
    $(this).toggleClass("ativo", !aberto);
  });

  $(document).on("input.programacaoTopbar change.programacaoTopbar", ".programacao-avancado-campo", aplicarFiltrosProgramacao);

  $(document).on("click.programacaoTopbar", "#programacaoLimparFiltros", limparFiltrosProgramacao);

  $(document).on("click.programacaoTopbar", function (e) {
    if (!$(e.target).closest("#programacaoBuscaAvancada, #programacaoBuscaAvancadaToggle").length) {
      $("#programacaoBuscaAvancada").prop("hidden", true);
      $("#programacaoBuscaAvancadaToggle").removeClass("ativo");
    }
  });

  document.removeEventListener("programacao:atualizada", aplicarFiltrosProgramacao);
  document.addEventListener("programacao:atualizada", aplicarFiltrosProgramacao);
}
