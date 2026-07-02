// public/js/api.js
const ERRO_401_REDIRECT_DELAY = 30000;
let erro401Ativo = false;
let ajax401Registrado = false;
const fetchOriginal = window.fetch.bind(window);
let timerContador401 = null;

function estaNaTelaLogin() {
  return window.location.pathname.includes("/login");
}

function limparDadosSessao401() {
  sessionStorage.clear();
}

function fecharSocket401() {
  if (typeof window.fecharSocketTempoReal === "function") {
    window.fecharSocketTempoReal();
    return;
  }

  if (window.rtwSocket && window.rtwSocket.readyState !== WebSocket.CLOSED) {
    window.rtwSocket.close();
    window.rtwSocket = null;
  }
}

function irParaLogin401() {
  window.location.href = "/login";
}

function iniciarRedirecionamento401() {
  setTimeout(() => {
    if (!estaNaTelaLogin()) {
      irParaLogin401();
    }
  }, ERRO_401_REDIRECT_DELAY);
}

function iniciarContador401() {
  const contador = document.getElementById("erro401Contador");
  if (!contador) return;

  let segundos = Math.ceil(ERRO_401_REDIRECT_DELAY / 1000);
  contador.textContent = `${segundos}s`;

  clearInterval(timerContador401);
  timerContador401 = setInterval(() => {
    segundos -= 1;
    contador.textContent = `${Math.max(segundos, 0)}s`;

    if (segundos <= 0) {
      clearInterval(timerContador401);
      timerContador401 = null;
    }
  }, 1000);
}

function mostrarModal401() {
  if (document.getElementById("erro401Overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "erro401Overlay";
  overlay.className = "erro-401-overlay";
  overlay.innerHTML = `
    <div class="erro-401-popup erro-401-popup-native" role="dialog" aria-modal="true" aria-labelledby="erro401Titulo">
      <div class="erro-401-html">
        <div class="erro-401-modal">
          <div class="erro-401-illustration" aria-hidden="true">
            <img src="/imagens/erro-401-sessao.png" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
            <div class="erro-401-fallback">
              <i class="fa-solid fa-lock"></i>
            </div>
          </div>
          <span class="erro-401-tag">Erro 401</span>
          <h2 id="erro401Titulo">Acesso expirado</h2>
          <p>
            O servidor respondeu <strong>401 - não autorizado</strong>.
            Isso normalmente acontece quando sua sessão expirou, o login foi encerrado
            ou o navegador perdeu a confirmação de acesso.
          </p>
          <small>Entre novamente para continuar com segurança.</small>
          <span class="erro-401-countdown">Retorno automatico em <strong id="erro401Contador">30s</strong></span>
        </div>
        <button type="button" class="erro-401-confirm" id="erro401LoginBtn">Ir para login</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.classList.add("erro-401-bloqueado");
  document.getElementById("erro401LoginBtn")?.addEventListener("click", irParaLogin401);
  iniciarContador401();
}

async function tratarErro401() {
  if (erro401Ativo || estaNaTelaLogin()) return;
  erro401Ativo = true;

  fecharSocket401();
  limparDadosSessao401();
  mostrarModal401();
  iniciarRedirecionamento401();
}

async function apiFetch(url, options = {}) {
  const response = await fetchOriginal(url, {
    ...options,
    credentials: "include",
  });

  if (response.status === 401 || (response.redirected && response.url.includes("/login"))) {
    await tratarErro401();
    throw new Error("Sessao expirada ou acesso nao autorizado");
  }

  return response;
}

function registrarAjax401() {
  if (ajax401Registrado || !window.jQuery) return;
  ajax401Registrado = true;

  window.jQuery(document).ajaxError((event, jqXHR) => {
    if (jqXHR?.status === 401) {
      tratarErro401();
    }
  });
}

registrarAjax401();
document.addEventListener("DOMContentLoaded", registrarAjax401);
setTimeout(registrarAjax401, 1000);

window.apiFetch = apiFetch;
window.tratarErro401 = tratarErro401;
