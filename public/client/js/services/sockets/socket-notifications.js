// /public/client/js/services/sockets/socket-notifications.js

const notifKey = "notificacoes_nao_lidas";
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

  const jaExiste = notificacoes.some((item) => {
    if (notificacao.id_notificacao && item.id_notificacao === notificacao.id_notificacao) return true;
    return item.mensagem === notificacao.mensagem && item.referencia === notificacao.referencia;
  });

  if (jaExiste) return;

  notificacoes.push(notificacao);
  if (notificacoes.length > 50) {
    notificacoes = notificacoes.slice(-50);
  }
}

function renderizarNotificacoes() {
  salvarLocal();

  const count = notificacoes.length;
  const countLabel = count > 99 ? "99+" : String(count);

  $(".menu_Perfil").toggleClass("tem-notificacao", count > 0);
  $("#notification-count, #perfil-notification-badge")
    .text(countLabel)
    .toggle(count > 0);

  const $list = $("#notification-list").empty();
  if (!notificacoes.length) {
    $("<div>")
      .addClass("notification-empty")
      .text("Nenhuma notificação.")
      .appendTo($list);
    return;
  }

  notificacoes.forEach((item) => {
    $("<div>")
      .addClass("notification-item")
      .text(item.mensagem)
      .appendTo($list);
  });
}

function prepararListaNotificacoes() {
  const lista = document.getElementById("notification-list");
  if (lista && lista.parentElement !== document.body) {
    document.body.appendChild(lista);
  }
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
  } else {
    notificacoes = [];
    salvarLocal();
    $("#notification-count").hide();
    await limparNotificacoesServidor();
    renderizarNotificacoes();
  }
});

$(document).on("click", function (e) {
  if (
    !$(e.target).closest("#notification-container, #notification-list").length
  ) {
    $("#notification-list").hide();
  }
});
