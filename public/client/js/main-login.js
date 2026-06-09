import { initLoginForm } from "./events/forms/handle-login-submit.js";
import { carregarChangelog } from "./services/ui/changelog-loader.js";
import { initChristmasIcons, initNewYearFireworks } from "./services/ui/special-icons.js";
import { startWeatherEffects } from "./services/ui/clima-tempo-login.js";
import { startMotivationalPhrases } from "./services/ui/motivational-phrases.js";

$(document).ready(function () {
  if ($("#formLogin").length) {
    initChristmasIcons();  // natal
    initNewYearFireworks();   // ano novo
    detectarClima();
    startMotivationalPhrases();

    // 🟦 DEFINA AQUI SUA VERSÃO ATUAL DO SISTEMA
    const versaoSistema = "1.5.0";

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

  async function detectarClima() {

    try {

      const resp = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=-29&longitude=-52&current_weather=true"
      );

      const data = await resp.json();

      const code = data.current_weather.weathercode;

      const hour = new Date().getHours();

      if ([63, 65, 81, 82, 95].includes(code)) {

        startWeatherEffects("rain");
        
      } else {

        if (hour >= 18) {
          startWeatherEffects("stars");
        }

      }

    } catch (err) {

      console.log("Erro clima", err);

      startWeatherEffects("auto");

    }

  }
});

