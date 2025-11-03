import { initLoginForm } from "./events/forms/handle-login-submit.js";
import { initMenuClick } from "./events/navigation/handle-menu-click.js";
import { initHome } from "./bootstrap/home-init.js";
import { conectarSocket } from "./services/sockets/socket-service.js";

$(document).ready(function () {
  if ($("#formLogin").length) {
    initLoginForm();
  }

  if ($("#menu").length) {
    initMenuClick();
    initHome();

    // 🔌 Abre socket aqui usando o que já está salvo
    const nome = localStorage.getItem("nome_usuario");
    if (nome) {
      conectarSocket(nome);
    }

    $("#conteudo").addClass("visivel");
  }
});

