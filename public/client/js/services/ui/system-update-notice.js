import { VERSAO_SISTEMA } from "../../config/system-version.js";

let iniciado = false;
let verificando = false;
let ultimaVerificacao = 0;

export function versaoMaisNova(disponivel, atual) {
  if (!/^\d+(?:\.\d+)+$/.test(disponivel) || !/^\d+(?:\.\d+)+$/.test(atual)) return false;
  const nova = disponivel.split(".").map(Number);
  const anterior = atual.split(".").map(Number);
  for (let i = 0; i < Math.max(nova.length, anterior.length); i++) {
    const diferenca = (nova[i] || 0) - (anterior[i] || 0);
    if (diferenca !== 0) return diferenca > 0;
  }
  return false;
}

async function verificarAtualizacao() {
  if (verificando || document.hidden || document.getElementById("systemUpdateNotice")) return;
  if (Date.now() - ultimaVerificacao < 10000) return;
  ultimaVerificacao = Date.now();
  verificando = true;
  try {
    const response = await fetch(`/client/js/config/system-version.js?check=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin"
    });
    if (!response.ok) return;
    const arquivo = await response.text();
    const versao = arquivo.match(/export\s+const\s+VERSAO_SISTEMA\s*=\s*["'](\d+(?:\.\d+)+)["']/)?.[1];
    if (versao && versaoMaisNova(versao, VERSAO_SISTEMA)) mostrarAtualizacao(versao);
  } catch {
    // Falhas temporárias de rede serão verificadas novamente no próximo intervalo.
  } finally {
    verificando = false;
  }
}

function mostrarAtualizacao(versao) {
  if (document.getElementById("systemUpdateNotice")) return;
  const popup = document.createElement("aside");
  popup.id = "systemUpdateNotice";
  popup.className = "home-aviso-empresa-popup system-update-notice";
  popup.setAttribute("role", "status");
  popup.setAttribute("aria-live", "polite");
  popup.innerHTML = `
    <div class="home-aviso-empresa-icon"><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i></div>
    <div class="home-aviso-empresa-body">
      <strong>Nova versão lançada</strong>
      <p></p>
      <button type="button">Atualizar agora</button>
    </div>`;
  popup.querySelector("p").textContent = `A versão ${versao} já está disponível. Atualize a página para aproveitar as novidades. Salve suas alterações antes de atualizar.`;
  popup.querySelector("button").addEventListener("click", () => window.location.reload());
  document.body.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add("show"));
}

export function iniciarAvisoAtualizacao() {
  if (iniciado) return;
  iniciado = true;
  verificarAtualizacao();
  window.setInterval(verificarAtualizacao, 60000);
  document.addEventListener("visibilitychange", verificarAtualizacao);
  window.addEventListener("focus", verificarAtualizacao);
  window.addEventListener("online", verificarAtualizacao);
}
