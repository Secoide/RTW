// /public/client/js/services/sockets/socket-notifications.js

const notifKey = "notificacoes_nao_lidas";
let notificacoes = JSON.parse(localStorage.getItem(notifKey)) || [];

/**
 * Atualiza a UI de notificações a partir de um evento do servidor.
 */
export function atualizarUI(data) {
  if (data && data.statuss === 0) return;

  if (data?.dia) {
    notificacoes.push(
      `Programação de ${formatarData(data.dia)} liberada para lançamento.`
    );
  }

  localStorage.setItem(notifKey, JSON.stringify(notificacoes));

  const count = notificacoes.length;
  $("#notification-count").text(count).toggle(count > 0);

  const $list = $("#notification-list").empty();
  notificacoes.forEach((msg) =>
    $("<div>")
      .text(msg)
      .css({ padding: "5px", borderBottom: "1px solid #eee" })
      .appendTo($list)
  );

  if (data?.dia) {
    mostrarNotificacao(
      "Programação lançada!",
      `Programação de ${formatarData(data.dia)} liberada para lançamento.`
    );
  }
}

// 🔄 Inicializa UI ao carregar página
atualizarUI();

// Eventos de clique
$(document).on("click", "#notification-container", function () {
  const $list = $("#notification-list");
  const estavaVisivel = $list.is(":visible");

  $list.toggle();

  if (!estavaVisivel) {
    atualizarUI();
  } else {
    // limpar notificações ao fechar
    notificacoes = [];
    localStorage.setItem(notifKey, JSON.stringify([]));
    $("#notification-count").hide();
  }
});

// Esconde dropdown se clicar fora
$(document).on("click", function (e) {
  if (
    !$(e.target).closest("#notification-container, #notification-list").length
  ) {
    $("#notification-list").hide();
  }
});
