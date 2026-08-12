// /public/client/js/services/sockets/socket-notifications.js

const notifKey = "notificacoes_nao_lidas";
const PREF_PREFIX = "preferencias_usuario";
let notificacoes = normalizarNotificacoes(JSON.parse(localStorage.getItem(notifKey)) || []);
let notificacoesInicializadas = false;
let intervaloNotificacoes = null;

function normalizarNotificacoes(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((item) => typeof item === "string"
      ? { mensagem: item, origem: "local" }
      : item
    )
    .filter((item) => item?.mensagem);
}

function salvarLocal() {
  localStorage.setItem(notifKey, JSON.stringify(notificacoes));
}

function formatarData(dataIso) {
  if (!dataIso) return "";
  const [ano, mes, dia] = String(dataIso).split("-");
  return `${dia}/${mes}/${ano}`;
}

function mensagemDoEvento(data) {
  if (data?.notificacao) return data.notificacao;
  if (data?.dia) return `Programação de ${formatarData(data.dia)} lançada.`;
  return "";
}

function adicionarNotificacao(notificacao) {
  if (!notificacao?.mensagem) return;
  if (!notificacaoPermitida(notificacao)) return;

  const jaExiste = notificacoes.some((item) => {
    if (notificacao.id_notificacao && item.id_notificacao === notificacao.id_notificacao) return true;
    return item.mensagem === notificacao.mensagem && item.referencia === notificacao.referencia;
  });

  if (jaExiste) return;

  notificacoes.push({
    ...notificacao,
    criado_em: notificacao.criado_em || notificacao.criadoEm || new Date().toISOString()
  });
  if (notificacoes.length > 50) {
    notificacoes = notificacoes.slice(-50);
  }
}

function renderizarNotificacoes() {
  salvarLocal();

  const notificacoesVisiveis = notificacoes.filter(notificacaoPermitida);
  const count = notificacoesVisiveis.length;
  const countLabel = count > 99 ? "99+" : String(count);

  $(".menu_Perfil").toggleClass("tem-notificacao", count > 0);
  $("#notification-count, #perfil-notification-badge")
    .text(countLabel)
    .toggle(count > 0);

  const $list = $("#notification-list").empty();
  const $panel = $("<div>").addClass("notification-panel").appendTo($list);
  const $header = $("<div>").addClass("notification-header").appendTo($panel);

  $("<div>")
    .addClass("notification-title")
    .html(`
      <span>Central de notificações</span>
      <strong>${count} pendente${count === 1 ? "" : "s"}</strong>
    `)
    .appendTo($header);

  $("<button>")
    .attr("type", "button")
    .attr("id", "notification-clear")
    .prop("disabled", count === 0)
    .html(`<i class="fa-solid fa-check-double"></i> Limpar`)
    .appendTo($header);

  const $body = $("<div>").addClass("notification-body").appendTo($panel);

  if (!notificacoesVisiveis.length) {
    $("<div>")
      .addClass("notification-empty")
      .html(`
        <i class="fa-regular fa-bell"></i>
        <strong>Nenhuma notificação</strong>
        <span>Quando uma programação for lançada ou houver aviso importante, ele aparece aqui.</span>
      `)
      .appendTo($body);
    return;
  }

  [...notificacoesVisiveis].reverse().forEach((item) => {
    const meta = montarMetaNotificacao(item);
    const acoes = montarAcoesAprovacao(item);

    $("<div>")
      .addClass("notification-item")
      .addClass(`notification-${meta.tipo}`)
      .html(`
        <div class="notification-icon">
          <i class="fa-solid ${meta.icone}"></i>
        </div>
        <div class="notification-content">
          <strong>${escapeHtml(meta.titulo)}</strong>
          <span>${escapeHtml(item.mensagem)}</span>
          <small>${escapeHtml(meta.quando)}</small>
          ${acoes}
        </div>
      `)
      .appendTo($body);
  });
}

function prepararListaNotificacoes() {
  const lista = document.getElementById("notification-list");
  if (lista && lista.parentElement !== document.body) {
    document.body.appendChild(lista);
  }
}

function montarMetaNotificacao(item) {
  const tipo = String(item.tipo || "").toLowerCase();

  const meta = {
    tipo: "geral",
    titulo: "Notificação",
    icone: "fa-bell",
    quando: formatarQuando(item.criado_em)
  };

  if (tipo.includes("programacao")) {
    meta.tipo = "programacao";
    meta.titulo = "Programação";
    meta.icone = "fa-calendar-check";
  } else if (tipo.includes("chat") || tipo.includes("mencao")) {
    meta.tipo = "chat";
    meta.titulo = "Chat online";
    meta.icone = "fa-comments";
  } else if (tipo.includes("erro") || tipo.includes("alerta")) {
    meta.tipo = "alerta";
    meta.titulo = "Atenção";
    meta.icone = "fa-triangle-exclamation";
  } else if (tipo.includes("aprovacao_resultado") || tipo.includes("aprovacao_reprovada")) {
    meta.tipo = "aprovacao";
    meta.titulo = "Resultado da aprovação";
    meta.icone = "fa-user-check";
  } else if (tipo.includes("aprovacao")) {
    meta.tipo = "aprovacao";
    meta.titulo = "Aprovação pendente";
    meta.icone = "fa-user-check";
  }

  return meta;
}

function obterIdAprovacao(item) {
  const match = String(item.referencia || "").match(/^aprovacao:(\d+)$/);
  return match ? match[1] : null;
}

function montarAcoesAprovacao(item) {
  if (String(item.tipo || "").toLowerCase() !== "aprovacao_responsavel_os") {
    return "";
  }

  const idAprovacao = obterIdAprovacao(item);
  if (!idAprovacao) return "";

  return `
    <div class="notification-actions">
      <button type="button" class="notification-action-ok" data-aprovacao-id="${escapeHtml(idAprovacao)}" data-aprovacao-acao="aprovar">
        <i class="fa-solid fa-check"></i> Aprovar
      </button>
      <button type="button" class="notification-action-cancel" data-aprovacao-id="${escapeHtml(idAprovacao)}" data-aprovacao-acao="reprovar">
        <i class="fa-solid fa-xmark"></i> Reprovar
      </button>
    </div>
  `;
}

function getPreferenciasNotificacoes() {
  const usuarioKey = sessionStorage.getItem("id_usuario")
    || sessionStorage.getItem("nome_usuario")
    || localStorage.getItem("nome_usuario")
    || "local";

  try {
    const preferencias = JSON.parse(localStorage.getItem(`${PREF_PREFIX}_${usuarioKey}`) || "{}");

    return {
      notificacoesProgramacao: preferencias.notificacoesProgramacao !== false,
      notificacoesChat: preferencias.notificacoesChat !== false,
      notificacoesAlertas: preferencias.notificacoesAlertas !== false,
      notificacoesGerais: preferencias.notificacoesGerais !== false
    };
  } catch {
    return {
      notificacoesProgramacao: true,
      notificacoesChat: true,
      notificacoesAlertas: true,
      notificacoesGerais: true
    };
  }
}

function notificacaoPermitida(item) {
  const preferencias = getPreferenciasNotificacoes();
  const tipo = montarMetaNotificacao(item).tipo;

  if (tipo === "aprovacao") return true;
  if (tipo === "programacao") return preferencias.notificacoesProgramacao;
  if (tipo === "chat") return preferencias.notificacoesChat;
  if (tipo === "alerta") return preferencias.notificacoesAlertas;

  return preferencias.notificacoesGerais;
}

function formatarQuando(valor) {
  if (!valor) return "Agora";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Agora";

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function carregarNotificacoesServidor() {
  try {
    const res = await fetch("/api/notificacoes", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();
    (data.notificacoes || []).forEach((item) => {
      adicionarNotificacao({
        id_notificacao: item.id_notificacao,
        tipo: item.tipo,
        referencia: item.referencia,
        mensagem: item.mensagem,
        origem: "servidor"
      });
    });

    renderizarNotificacoes();
  } catch (err) {
    console.warn("Não foi possível carregar notificações:", err);
  }
}

async function limparNotificacoesServidor() {
  try {
    await fetch("/api/notificacoes/limpar", {
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    console.warn("Não foi possível marcar notificações como lidas:", err);
  }
}

export function atualizarUI(data) {
  if (data && Number(data.statuss) === 0) {
    renderizarNotificacoes();
    return;
  }

  const mensagem = mensagemDoEvento(data);
  if (mensagem) {
    adicionarNotificacao({
      tipo: data.tipo || "programacao_lancada",
      referencia: data.dia || data.referencia || null,
      mensagem,
      origem: "socket"
    });
  }

  renderizarNotificacoes();

  if (data?.dia) {
    mostrarNotificacao("Programação lançada!", mensagem);
  }
}

export function initNotificacoesSininho() {
  prepararListaNotificacoes();

  if (notificacoesInicializadas) {
    renderizarNotificacoes();
    carregarNotificacoesServidor();
    return;
  }

  notificacoesInicializadas = true;
  renderizarNotificacoes();
  carregarNotificacoesServidor();

  intervaloNotificacoes = setInterval(() => {
    carregarNotificacoesServidor();
  }, 60000);
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && notificacoesInicializadas) {
    carregarNotificacoesServidor();
  }
});

document.addEventListener("preferencias-usuario:alteradas", () => {
  if (notificacoesInicializadas) {
    renderizarNotificacoes();
  }
});

if (document.readyState !== "loading") {
  initNotificacoesSininho();
} else {
  document.addEventListener("DOMContentLoaded", initNotificacoesSininho, { once: true });
}

$(document).on("click", "#notification-container", async function (e) {
  e.preventDefault();
  e.stopPropagation();

  prepararListaNotificacoes();

  const $list = $("#notification-list");
  const estavaVisivel = $list.is(":visible");

  $list.toggle();

  if (!estavaVisivel) {
    renderizarNotificacoes();
  }
});

$(document).on("click", "#notification-clear", async function (e) {
  e.preventDefault();
  e.stopPropagation();

  notificacoes = [];
  salvarLocal();
  $("#notification-count, #perfil-notification-badge").hide();
  await limparNotificacoesServidor();
  renderizarNotificacoes();
});

$(document).on("click", "[data-aprovacao-acao]", async function (e) {
  e.preventDefault();
  e.stopPropagation();

  const idAprovacao = this.dataset.aprovacaoId;
  const acao = this.dataset.aprovacaoAcao;
  if (!idAprovacao || !acao) return;

  const $botao = $(this);
  $botao.prop("disabled", true);

  try {
    const res = await fetch(`/api/notificacoes/aprovacoes/${idAprovacao}/${acao}`, {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.sucesso === false) {
      throw new Error(data.mensagem || "Não foi possível concluir a aprovação.");
    }

    const referencia = `aprovacao:${idAprovacao}`;
    notificacoes = notificacoes.filter((item) => item.referencia !== referencia);
    salvarLocal();
    renderizarNotificacoes();

    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: acao === "aprovar" ? "success" : "info",
        title: acao === "aprovar" ? "Aprovado" : "Reprovado",
        text: data.mensagem || "Solicitação atualizada.",
        timer: 2200,
        showConfirmButton: false
      });
    }
  } catch (err) {
    $botao.prop("disabled", false);
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Não foi possível atualizar",
        text: err.message || "Tente novamente."
      });
    } else {
      alert(err.message || "Não foi possível atualizar.");
    }
  }
});

$(document).on("click", function (e) {
  if (
    !$(e.target).closest("#notification-container, #notification-list").length
  ) {
    $("#notification-list").hide();
  }
});
