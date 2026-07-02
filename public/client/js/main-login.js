import { initLoginForm } from "./events/forms/handle-login-submit.js";
import { VERSAO_SISTEMA } from "./config/system-version.js";
import { initChristmasIcons, initNewYearFireworks } from "./services/ui/special-icons.js";
import { startWeatherEffects } from "./services/ui/clima-tempo-login.js";
import { startMotivationalPhrases } from "./services/ui/motivational-phrases.js";
import { initWorldCupDecorations } from "./services/ui/world-cup-decorations.js";

$(document).ready(function () {
  if ($("#formLogin").length) {
    initChristmasIcons();  // natal
    initNewYearFireworks();   // ano novo
    detectarClima();
    startMotivationalPhrases();
    initWorldCupDecorations();
    // 🟦 DEFINA AQUI SUA VERSÃO ATUAL DO SISTEMA
    const versaoSistema = VERSAO_SISTEMA;

    $(".versao").text('v' + versaoSistema);
    // Versão salva no navegador

    // Se for diferente → mostrar popup
    // Botão OK
    initLoginForm();
  }

  async function detectarClima() {

    try {

      const resp = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=-29&longitude=-52&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
      );

      const data = await resp.json();

      const climaAtual = data.current || {};
      const code = climaAtual.weather_code;
      atualizarInfoClimaLogin(climaAtual);

      const hour = new Date().getHours();

      if ([53,55, 61, 63, 65, 81, 82, 95].includes(code)) {

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

  function atualizarInfoClimaLogin(clima = {}) {
    const painel = document.getElementById("loginWeatherStatus");
    if (!painel) return;

    const temperatura = clima.temperature_2m;
    const vento = clima.wind_speed_10m;
    const umidade = clima.relative_humidity_2m;

    const tempEl = document.getElementById("loginWeatherTemp");
    const ventoEl = document.getElementById("loginWeatherWind");
    const umidadeEl = document.getElementById("loginWeatherHumidity");
    const umidadeWrap = document.getElementById("loginWeatherHumidityWrap");

    if (Number.isFinite(temperatura) && tempEl) {
      tempEl.textContent = `${Math.round(temperatura)}°C`;
    }

    if (Number.isFinite(vento) && ventoEl) {
      ventoEl.textContent = `${Math.round(vento)} km/h`;
    }

    if (Number.isFinite(umidade) && umidadeEl) {
      umidadeEl.textContent = `${Math.round(umidade)}%`;
      umidadeWrap?.removeAttribute("hidden");
    } else {
      umidadeWrap?.setAttribute("hidden", "hidden");
    }

    if (Number.isFinite(temperatura) || Number.isFinite(vento) || Number.isFinite(umidade)) {
      painel.classList.add("show");
    }
  }
});

