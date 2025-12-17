import { initLoginForm } from "./events/forms/handle-login-submit.js";
import { carregarChangelog } from "./services/ui/changelog-loader.js";
import { initChristmasIcons, initNewYearFireworks } from "./services/ui/special-icons.js";

$(document).ready(function () {
  if ($("#formLogin").length) {
    initChristmasIcons();  // natal
    initNewYearFireworks();   // ano novo

    // 🟦 DEFINA AQUI SUA VERSÃO ATUAL DO SISTEMA
    const versaoSistema = "1.3.0";

    // Preenche o texto no popup
    $("#versaoAtual").text(versaoSistema);
    $(".versao").text(versaoSistema);
    carregarChangelog(versaoSistema).then(html => {
      document.querySelector(".changelog-container").innerHTML = html;
    });
    // Versão salva no navegador
    const versaoVista = localStorage.getItem("versao_sistema_vista");

    // Se for diferente → mostrar popup
    if (versaoVista !== versaoSistema) {
      $("#popupAtualizacao").css("display", "flex");
    }
    $(".versao").click(function () {
      $("#popupAtualizacao").css("display", "flex");
    });

    // Botão OK
    $("#btnPopupOk").click(function () {
      $("#popupAtualizacao").fadeOut(200);
      localStorage.setItem("versao_sistema_vista", versaoSistema);
    });
    initLoginForm();
  }

});

