const INATIVIDADE_ATIVA = true;
const TEMPO_LIMITE = 5 * 60 * 60 * 1000;
const INTERVALO_STATUS = 60 * 1000;

let timerInatividade;
let timerStatus;
let sessaoEncerrada = false;
let ultimoReset = 0;

function usuarioLogado() {
  return !!sessionStorage.getItem("id_usuario");
}

function limparSessaoLocal() {
  sessionStorage.clear();
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function fecharConexaoTempoReal() {
  if (typeof window.fecharSocketTempoReal === "function") {
    window.fecharSocketTempoReal();
    return;
  }

  if (window.rtwSocket && window.rtwSocket.readyState !== WebSocket.CLOSED) {
    window.rtwSocket.close();
    window.rtwSocket = null;
  }
}

async function encerrarSessaoServidor() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    console.warn("Nao foi possivel encerrar a sessao no servidor.", err);
  }
}

function avisarERedirecionar(mensagem) {
  if (window.Swal) {
    Swal.fire({
      title: "",
      html: `
        <div class="sessao-expirada-modal">
          <img src="/logo_teste.png" alt="Logo do sistema" class="sessao-expirada-logo">
          <span class="sessao-expirada-tag">Sessao finalizada</span>
          <h2>Sessao encerrada</h2>
          <p>${escaparHtml(mensagem)}</p>
        </div>
      `,
      confirmButtonText: "Ir para login",
      allowOutsideClick: false,
      allowEscapeKey: false,
      buttonsStyling: false,
      customClass: {
        popup: "sessao-expirada-popup",
        htmlContainer: "sessao-expirada-html",
        confirmButton: "sessao-expirada-confirm"
      }
    }).then(() => {
      window.location.href = "/login";
    });
    return;
  }

  alert(mensagem);
  window.location.href = "/login";
}

async function encerrarSessaoPorInatividade() {
  if (sessaoEncerrada) return;
  sessaoEncerrada = true;

  clearTimeout(timerInatividade);
  clearInterval(timerStatus);

  fecharConexaoTempoReal();
  await encerrarSessaoServidor();
  limparSessaoLocal();
  avisarERedirecionar("Seu tempo de inatividade esgotou. Entre novamente para continuar.");
}

async function encerrarSessaoExpirada() {
  if (sessaoEncerrada) return;
  sessaoEncerrada = true;

  clearTimeout(timerInatividade);
  clearInterval(timerStatus);

  fecharConexaoTempoReal();
  limparSessaoLocal();
  avisarERedirecionar("Sua sessao expirou. Entre novamente para continuar.");
}

function resetarTimer() {
  if (!INATIVIDADE_ATIVA || !usuarioLogado() || sessaoEncerrada) return;

  const agora = Date.now();
  if (agora - ultimoReset < 1000) return;
  ultimoReset = agora;

  clearTimeout(timerInatividade);
  timerInatividade = setTimeout(encerrarSessaoPorInatividade, TEMPO_LIMITE);
}

async function verificarSessaoServidor() {
  if (!usuarioLogado() || sessaoEncerrada) return;

  try {
    const res = await fetch("/api/auth/status", {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });

    if (res.status === 401) {
      if (typeof window.tratarErro401 === "function") {
        await window.tratarErro401();
        return;
      }

      await encerrarSessaoExpirada();
    }
  } catch (err) {
    console.warn("Nao foi possivel validar a sessao.", err);
  }
}

function iniciarControleInatividade() {
  if (!INATIVIDADE_ATIVA || !usuarioLogado()) return;

  resetarTimer();
  clearInterval(timerStatus);
  timerStatus = setInterval(verificarSessaoServidor, INTERVALO_STATUS);
}

[
  "click",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "dragstart",
  "drop"
].forEach(evento => {
  document.addEventListener(evento, resetarTimer, { passive: true });
});

window.encerrarSessaoExpirada = encerrarSessaoExpirada;
window.encerrarSessaoPorInatividade = encerrarSessaoPorInatividade;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarControleInatividade);
} else {
  iniciarControleInatividade();
}
