// /public/client/js/utils/dom/preencher-tabela-atestar.js

import { formatarDataISO } from "../formatters/date-format.js";

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusNormalizado(registro) {
  return String(registro?.status || "aprovado").trim().toLowerCase();
}

function statusHtml(registro) {
  const status = statusNormalizado(registro);

  if (status === "avaliar" || status === "pendente") {
    return '<span class="atestar-status"><i class="fa-solid fa-hourglass-half"></i> Em análise</span>';
  }

  if (status === "reprovado") {
    return '<span class="atestar-status atestar-status-reprovado"><i class="fa-solid fa-xmark"></i> Reprovado</span>';
  }

  return '<span class="atestar-status atestar-status-confirmado"><i class="fa-solid fa-check"></i> Confirmado</span>';
}

function limparTabela($tbody, mensagem) {
  $tbody.html(`<tr><td class="atestar-vazio" colspan="5">${mensagem}</td></tr>`);
}

function montarLinha(registro, { pendente = false } = {}) {
  const motivo = escaparHtml(registro.motivo || "Registro");
  const inicio = escaparHtml(formatarDataISO(registro.datainicio));
  const fim = escaparHtml(formatarDataISO(registro.datafinal));
  const descricao = escaparHtml(registro.descricao || "Sem descrição");
  const anexo = !pendente && registro.anexo_pdf
    ? `<a class="link-anexo-atestado" href="/api/colaboradores/atestado-anexo/${encodeURIComponent(registro.id_funcInterrups)}" target="_blank" rel="noopener" title="Visualizar atestado em PDF" aria-label="Visualizar atestado em PDF"><i class="fa-solid fa-file-pdf"></i></a>`
    : "";
  const acao = pendente
    ? `
        <div class="atestar-pendente-acoes" role="group" aria-label="Ações para o atestado pendente">
          <button type="button" class="atestar-pendente-acao atestar-pendente-nao-justificado" data-atestar-acao="nao-justificado" data-aprovacao-id="${escaparHtml(registro.id_aprovacao || '')}" title="Marcar como não justificada" aria-label="Marcar como não justificada">
            <i class="fa-solid fa-circle-xmark"></i>
          </button>
          <button type="button" class="atestar-pendente-acao atestar-pendente-com-atestado" data-atestar-acao="com-atestado" data-aprovacao-id="${escaparHtml(registro.id_aprovacao || '')}" title="Anexar atestado em PDF" aria-label="Anexar atestado em PDF">
            <i class="fa-solid fa-file-circle-check"></i>
          </button>
          <button type="button" class="atestar-pendente-acao atestar-pendente-excluir" data-atestar-acao="excluir" data-interrupcao-id="${escaparHtml(registro.id_funcInterrups)}" title="Excluir pendência" aria-label="Excluir pendência">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `
    : `${statusNormalizado(registro) === "reprovado" ? statusHtml(registro) : ""} <i class="fa-solid fa-trash-can bt_excluirHistoricoAtestar" title="Excluir registro" aria-label="Excluir registro"></i>`;

  return `
    <tr data-idatestar="${escaparHtml(registro.id_funcInterrups)}">
      <td>${motivo}</td>
      <td>${inicio}</td>
      <td>${fim}</td>
      <td title="${descricao}">${descricao}${anexo}</td>
      <td>${acao}</td>
    </tr>
  `;
}

export function preencherTabelaAtestar(id) {
  const $historico = $("#tb_historico_atestar tbody");
  const $pendentes = $("#tb_pendentes_atestar tbody");
  const $secaoPendentes = $("#atestar-pendentes-secao");

  $historico.empty();
  $pendentes.empty();
  $secaoPendentes.prop("hidden", true);
  $("#atestar-historico-count").text("0");
  $("#atestar-pendentes-count").text("0");

  if (!id) {
    limparTabela($historico, "Selecione um colaborador para carregar o histórico.");
    return;
  }

  $.ajax({
    url: `/api/colaboradores/historico-atestar/${encodeURIComponent(id)}`,
    type: "GET",
    dataType: "json",
    success: function (data) {
      const registros = Array.isArray(data)
        ? data
        : [...(data?.historico || []), ...(data?.pendentes || [])];
      const pendentes = registros.filter(registro => ["avaliar", "pendente"].includes(statusNormalizado(registro)));
      const historico = registros.filter(registro => !["avaliar", "pendente"].includes(statusNormalizado(registro)));

      $("#atestar-historico-count").text(String(historico.length));
      $("#atestar-pendentes-count").text(String(pendentes.length));

      if (pendentes.length) {
        $pendentes.html(pendentes.map(registro => montarLinha(registro, { pendente: true })).join(""));
        $secaoPendentes.prop("hidden", false);
      }

      if (historico.length) {
        $historico.html(historico.map(registro => montarLinha(registro)).join(""));
      } else {
        limparTabela($historico, "Nenhum registro confirmado encontrado.");
      }
    },
    error: function (xhr) {
      limparTabela($historico, "Não foi possível carregar o histórico.");
      const mensagem = xhr.responseJSON?.mensagem || "Erro no carregamento do histórico.";
      $("#atestar-form-status").text(mensagem);
    }
  });
}
