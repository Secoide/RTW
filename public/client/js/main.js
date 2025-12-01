import { initLoginForm } from "./events/forms/handle-login-submit.js";
import { initMenuClick } from "./events/navigation/handle-menu-click.js";
import { initHome } from "./bootstrap/home-init.js";
import { conectarSocket } from "./services/sockets/socket-service.js";

$(document).ready(function () {
  if ($("#formLogin").length) {
    // 🟦 DEFINA AQUI SUA VERSÃO ATUAL DO SISTEMA
    const versaoSistema = "1.2.4";

    // Preenche o texto no popup
    $("#versaoAtual").text(versaoSistema);
    $(".versao").text(versaoSistema);

    // Versão salva no navegador
    const versaoVista = localStorage.getItem("versao_sistema_vista");

    // Se for diferente → mostrar popup
    if (versaoVista !== versaoSistema) {
      $("#popupAtualizacao").css("display", "flex");
    }

    // Botão OK
    $("#btnPopupOk").click(function () {
      $("#popupAtualizacao").fadeOut(200);
      localStorage.setItem("versao_sistema_vista", versaoSistema);
    });
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

  $(document).ready(function () {


});


});

