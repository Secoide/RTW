const STORAGE_PREFIX = "preferencias_usuario";

const DEFAULT_PREFERENCES = {
  tema: "sistema",
  densidade: "normal",
  animacoes: true,
  notificacoesOnline: true,
  notificacoesProgramacao: true,
  notificacoesChat: true,
  notificacoesAlertas: true,
  notificacoesGerais: true,
  abrirChatOnline: false,
  historicoChatDias: 10,
  silenciarChatGlobal: false
};

let listenersRegistrados = false;
const PASSWORD_STRENGTH = [
  { max: 0, label: "Digite sua nova senha", color: "#ee7722", width: "4%" },
  { max: 1, label: "Senha fraca", color: "#ef4444", width: "25%" },
  { max: 2, label: "Senha média", color: "#f59e0b", width: "55%" },
  { max: 5, label: "Senha forte", color: "#efda38", width: "100%" }
];

function getUsuarioKey() {
  return sessionStorage.getItem("id_usuario")
    || sessionStorage.getItem("nome_usuario")
    || localStorage.getItem("nome_usuario")
    || "local";
}

function getStorageKey() {
  return `${STORAGE_PREFIX}_${getUsuarioKey()}`;
}

function carregarPreferencias() {
  try {
    return {
      ...DEFAULT_PREFERENCES,
      ...JSON.parse(localStorage.getItem(getStorageKey()) || "{}")
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function salvarPreferencias(preferencias) {
  localStorage.setItem(getStorageKey(), JSON.stringify(preferencias));
}

function resolverTema(tema) {
  if (tema === "sistema") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return tema;
}

function atualizarIconeTema(temaResolvido) {
  const icon = document.querySelector("#toggle-theme i");
  if (icon) icon.className = temaResolvido === "dark" ? "fas fa-moon" : "fas fa-sun";
}

export function aplicarPreferenciasUsuario() {
  const preferencias = carregarPreferencias();
  const temaResolvido = resolverTema(preferencias.tema);

  document.documentElement.setAttribute("data-theme", temaResolvido);
  document.body?.classList.toggle("pref-compacta", preferencias.densidade === "compacta");
  document.body?.classList.toggle("pref-sem-animacao", !preferencias.animacoes);
  document.body?.classList.toggle("pref-sem-online-popup", !preferencias.notificacoesOnline);

  localStorage.setItem("tema", temaResolvido);
  atualizarIconeTema(temaResolvido);

  if (preferencias.abrirChatOnline) {
    setTimeout(() => {
      document.getElementById("online-chat-input")?.focus();
    }, 300);
  }

  document.dispatchEvent(new CustomEvent("preferencias-usuario:alteradas", {
    detail: { preferencias }
  }));
}

function criarSwitch(id, titulo, descricao, checked) {
  return `
    <label class="preferencia-row" for="${id}">
      <span>
        <strong>${titulo}</strong>
        <small>${descricao}</small>
      </span>
      <input id="${id}" type="checkbox" ${checked ? "checked" : ""}>
    </label>
  `;
}

function criarCampoSenha(id, label, autocomplete) {
  return `
    <label class="preferencia-field preferencias-password-field" for="${id}">
      <span>${label}</span>
      <div class="preferencias-password-wrap">
        <input id="${id}" type="password" autocomplete="${autocomplete}">
        <button type="button" class="preferencias-toggle-password" data-target="${id}" title="Mostrar senha">
          <i class="fa-solid fa-eye"></i>
        </button>
      </div>
    </label>
  `;
}

function criarModalSeNecessario() {
  if (document.getElementById("preferenciasUsuarioOverlay")) return;

  const modal = document.createElement("div");
  modal.id = "preferenciasUsuarioOverlay";
  modal.className = "preferencias-overlay";
  modal.innerHTML = `
    <div class="preferencias-box" role="dialog" aria-modal="true" aria-labelledby="preferenciasTitulo">
      <div class="preferencias-head">
        <div>
          <span>Configurações locais</span>
          <h2 id="preferenciasTitulo">Preferências do usuário</h2>
        </div>
        <button type="button" id="btnFecharPreferencias" title="Fechar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="preferencias-tabs" role="tablist" aria-label="Configurações do usuário">
        <button type="button" class="preferencias-tab active" data-pref-tab="geral">
          <i class="fa-solid fa-sliders"></i>
          <span>Geral</span>
        </button>
        <button type="button" class="preferencias-tab" data-pref-tab="seguranca">
          <i class="fa-solid fa-shield-halved"></i>
          <span>Segurança</span>
        </button>
        <button type="button" class="preferencias-tab" data-pref-tab="notificacoes">
          <i class="fa-solid fa-bell"></i>
          <span>Notificações</span>
        </button>
      </div>

      <div class="preferencias-tab-panel active" data-pref-panel="geral">
        <div class="preferencias-grid">
          <section class="preferencias-section">
            <h3>Aparência</h3>
            <label class="preferencia-field" for="prefTema">
              <span>Tema visual</span>
              <select id="prefTema">
                <option value="sistema">Automático do dispositivo</option>
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
              </select>
            </label>

            <label class="preferencia-field" for="prefDensidade">
              <span>Densidade da interface</span>
              <select id="prefDensidade">
                <option value="normal">Normal</option>
                <option value="compacta">Compacta</option>
              </select>
            </label>
          </section>

          <section class="preferencias-section">
            <h3>Conforto</h3>
            <div id="preferenciasConforto"></div>
          </section>

          <section class="preferencias-section">
            <h3>Online e avisos</h3>
            <div id="preferenciasAvisos"></div>
          </section>

        </div>
      </div>

      <div class="preferencias-tab-panel" data-pref-panel="seguranca">
        <div class="preferencias-security">
          <section class="preferencias-section preferencias-section-wide">
            <h3>Alterar senha</h3>
            <form id="formPreferenciasSenha" autocomplete="off">
              <input type="hidden" autocomplete="username" value="${sessionStorage.getItem("nome_usuario") || "usuario"}">
              <div class="preferencias-password-grid">
                ${criarCampoSenha("prefSenhaAntiga", "Senha atual", "current-password")}
                ${criarCampoSenha("prefNovaSenha", "Nova senha", "new-password")}
                ${criarCampoSenha("prefConfirmarSenha", "Confirmar nova senha", "new-password")}
              </div>

              <div class="preferencias-password-strength">
                <div class="preferencias-password-track">
                  <div id="prefPasswordBar"></div>
                </div>
                <span id="prefPasswordLabel">Digite sua nova senha</span>
              </div>

              <div class="preferencias-security-note">
                Use uma senha que você não utiliza em outros sistemas. Uma senha mais forte combina tamanho, números, letras e símbolos.
              </div>

              <div class="preferencias-security-actions">
                <button type="submit" id="btnSalvarSenhaPreferencias">
                  <i class="fa-solid fa-key"></i>
                  <span>Atualizar senha</span>
                </button>
              </div>
            </form>
          </section>

          <section class="preferencias-section preferencias-section-wide preferencias-session-box">
            <h3>Sessões conectadas</h3>
            <p>Encerre o acesso em outros navegadores ou computadores conectados com sua conta. Você também sairá deste dispositivo.</p>
            <button type="button" id="btnEncerrarTodasSessoes">
              <i class="fa-solid fa-right-from-bracket"></i>
              <span>Sair de todos os dispositivos</span>
            </button>
          </section>
        </div>
      </div>

      <div class="preferencias-tab-panel" data-pref-panel="notificacoes">
        <div class="preferencias-grid">
          <section class="preferencias-section preferencias-section-wide">
            <h3>Central de notificações</h3>
            <p class="preferencias-section-desc">
              Escolha quais avisos devem aparecer no sininho do perfil. As alterações ficam salvas apenas para este usuário e dispositivo.
            </p>
            <div id="preferenciasNotificacoes"></div>
          </section>
        </div>
      </div>

      <div class="preferencias-actions">
        <button type="button" id="btnResetPreferencias">Restaurar padrão</button>
        <button type="button" id="btnSalvarPreferencias">Salvar preferências</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function ativarAbaPreferencias(nomeAba) {
  document.querySelectorAll(".preferencias-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.prefTab === nomeAba);
  });

  document.querySelectorAll(".preferencias-tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.prefPanel === nomeAba);
  });
}

function preencherFormulario(preferencias) {
  document.getElementById("prefTema").value = preferencias.tema;
  document.getElementById("prefDensidade").value = preferencias.densidade;

  document.getElementById("preferenciasConforto").innerHTML = [
    criarSwitch("prefAnimacoes", "Animações suaves", "Mantém transições e movimentos visuais ativos.", preferencias.animacoes)
  ].join("");

  document.getElementById("preferenciasAvisos").innerHTML = [
    criarSwitch("prefNotificacoesOnline", "Avisos de usuários online", "Mostra entradas de usuario online.", preferencias.notificacoesOnline),
    //criarSwitch("prefAbrirChatOnline", "Abrir chat online automaticamente", "Mantém a aba de chat pronta ao entrar na home.", preferencias.abrirChatOnline),
    //criarSwitch("prefSilenciarChatGlobal", "Silenciar chat global", "Oculta avisos e contador de novas mensagens do Grupo geral.", preferencias.silenciarChatGlobal),
    /*`
      <label class="preferencia-field" for="prefHistoricoChatDias">
        <span>Histórico do chat</span>
        <select id="prefHistoricoChatDias">
          <option value="0">Desativado</option>
          <option value="5">5 dias</option>
          <option value="10">10 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
        </select>
      </label>
      <button type="button" id="btnLimparHistoricoChat" class="preferencias-inline-action">
        <i class="fa-solid fa-broom"></i>
        <span>Limpar histórico do chat agora</span>
      </button>
    `*/
  ].join("");

  //document.getElementById("prefHistoricoChatDias").value = String(preferencias.historicoChatDias ?? 10);

  document.getElementById("preferenciasNotificacoes").innerHTML = [
    criarSwitch("prefNotifProgramacao", "Programação", "Recebe avisos quando a programação do dia for lançada ou alterada.", preferencias.notificacoesProgramacao),
    //criarSwitch("prefNotifChat", "Chat online", "Recebe avisos de mensagens, menções e chamadas do chat.", preferencias.notificacoesChat),
    criarSwitch("prefNotifAlertas", "Alertas importantes", "Recebe avisos de atenção, falhas e alertas do sistema.", preferencias.notificacoesAlertas),
    criarSwitch("prefNotifGerais", "Notificações gerais", "Recebe comunicados e avisos que não se encaixam nas categorias acima.", preferencias.notificacoesGerais)
  ].join("");
}

function lerFormulario() {
  return {
    tema: document.getElementById("prefTema").value,
    densidade: document.getElementById("prefDensidade").value,
    animacoes: document.getElementById("prefAnimacoes").checked,
    notificacoesOnline: document.getElementById("prefNotificacoesOnline").checked,
    notificacoesProgramacao: document.getElementById("prefNotifProgramacao").checked,
    notificacoesChat: document.getElementById("prefNotifChat").checked,
    notificacoesAlertas: document.getElementById("prefNotifAlertas").checked,
    notificacoesGerais: document.getElementById("prefNotifGerais").checked,
    abrirChatOnline: document.getElementById("prefAbrirChatOnline").checked,
    historicoChatDias: Number(document.getElementById("prefHistoricoChatDias").value || 10),
    silenciarChatGlobal: document.getElementById("prefSilenciarChatGlobal").checked
  };
}

function abrirModalPreferencias() {
  criarModalSeNecessario();
  preencherFormulario(carregarPreferencias());
  ativarAbaPreferencias("geral");
  document.getElementById("preferenciasUsuarioOverlay").classList.add("active");
}

function fecharModalPreferencias() {
  document.getElementById("preferenciasUsuarioOverlay")?.classList.remove("active");
}

function calcularForcaSenha(senha) {
  let score = 0;
  if (senha.length >= 6) score++;
  if (senha.length >= 10) score++;
  if (/[A-Z]/.test(senha)) score++;
  if (/[0-9]/.test(senha)) score++;
  if (/[^A-Za-z0-9]/.test(senha)) score++;
  return score;
}

function atualizarForcaSenha() {
  const senha = document.getElementById("prefNovaSenha")?.value || "";
  const score = calcularForcaSenha(senha);
  const config = PASSWORD_STRENGTH.find(item => score <= item.max) || PASSWORD_STRENGTH[PASSWORD_STRENGTH.length - 1];
  const bar = document.getElementById("prefPasswordBar");
  const label = document.getElementById("prefPasswordLabel");

  if (bar) {
    bar.style.width = config.width;
    bar.style.background = config.color;
  }

  if (label) {
    label.textContent = config.label;
    label.style.color = config.color;
  }
}

function limparFormularioSenha() {
  document.getElementById("formPreferenciasSenha")?.reset();
  atualizarForcaSenha();
}

async function salvarSenhaPreferencias(event) {
  event.preventDefault();

  const idColab = sessionStorage.getItem("id_usuario");
  const senhaAntiga = document.getElementById("prefSenhaAntiga")?.value || "";
  const novaSenha = document.getElementById("prefNovaSenha")?.value || "";
  const confirmar = document.getElementById("prefConfirmarSenha")?.value || "";

  if (!idColab) {
    return Swal.fire({
      icon: "warning",
      title: "Sessão não encontrada",
      text: "Entre novamente para alterar sua senha.",
      theme: "dark"
    });
  }

  if (!senhaAntiga || !novaSenha || !confirmar) {
    return Swal.fire({
      icon: "warning",
      title: "Preencha todos os campos",
      text: "Informe a senha atual, a nova senha e a confirmação.",
      theme: "dark"
    });
  }

  if (novaSenha !== confirmar) {
    return Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "A confirmação da nova senha não confere.",
      theme: "dark"
    });
  }

  const botao = document.getElementById("btnSalvarSenhaPreferencias");
  botao.disabled = true;

  try {
    const requisicao = window.apiFetch || fetch;
    const response = await requisicao("/api/auth/alterar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idColab, senhaAntiga, novaSenha })
    });

    const res = await response.json();

    if (!response.ok || !res.sucesso) {
      throw new Error(res.mensagem || "Não foi possível alterar a senha.");
    }

    await Swal.fire({
      icon: "success",
      title: "Senha alterada",
      text: "Sua senha foi atualizada com sucesso.",
      theme: "dark"
    });

    limparFormularioSenha();
  } catch (err) {
    if (/401|sessao|session|nao autorizado|não autorizado/i.test(err.message || "")) return;

    Swal.fire({
      icon: "error",
      title: "Erro",
      text: err.message || "Erro ao processar a solicitação.",
      theme: "dark"
    });
  } finally {
    botao.disabled = false;
  }
}

async function encerrarTodasSessoes() {
  const confirmacao = await Swal.fire({
    icon: "warning",
    title: "Sair de todos os dispositivos?",
    text: "Todas as sessões abertas com sua conta serão encerradas, incluindo esta.",
    theme: "dark",
    showCancelButton: true,
    confirmButtonText: "Sim, encerrar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacao.isConfirmed) return;

  const botao = document.getElementById("btnEncerrarTodasSessoes");
  if (botao) botao.disabled = true;

  try {
    const requisicao = window.apiFetch || fetch;
    const response = await requisicao("/api/auth/logout-all", {
      method: "POST",
      credentials: "include"
    });
    const res = await response.json();

    if (!response.ok || !res.sucesso) {
      throw new Error(res.mensagem || "Não foi possível encerrar as sessões.");
    }

    sessionStorage.clear();

    await Swal.fire({
      icon: "success",
      title: "Sessões encerradas",
      text: "Entre novamente para continuar.",
      theme: "dark",
      confirmButtonText: "Ir para login"
    });

    window.location.href = "/login";
  } catch (err) {
    if (/401|sessao|session|nao autorizado|não autorizado/i.test(err.message || "")) return;

    Swal.fire({
      icon: "error",
      title: "Erro",
      text: err.message || "Não foi possível encerrar as sessões.",
      theme: "dark"
    });
  } finally {
    if (botao) botao.disabled = false;
  }
}

export function initPreferenciasUsuario() {
  aplicarPreferenciasUsuario();

  const botao = document.getElementById("btnPreferenciasUsuario");
  if (botao) {
    botao.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      abrirModalPreferencias();
    };
  }

  if (listenersRegistrados) return;
  listenersRegistrados = true;

  document.addEventListener("click", (event) => {
    const tab = event.target.closest(".preferencias-tab");
    if (tab) {
      ativarAbaPreferencias(tab.dataset.prefTab);
      return;
    }

    const toggleSenha = event.target.closest(".preferencias-toggle-password");
    if (toggleSenha) {
      const input = document.getElementById(toggleSenha.dataset.target);
      if (!input) return;

      const visivel = input.type === "text";
      input.type = visivel ? "password" : "text";
      toggleSenha.title = visivel ? "Mostrar senha" : "Ocultar senha";
      toggleSenha.querySelector("i").className = `fa-solid ${visivel ? "fa-eye" : "fa-eye-slash"}`;
      input.focus();
      return;
    }

    if (event.target.closest("#btnFecharPreferencias")) {
      fecharModalPreferencias();
      return;
    }

    if (event.target.id === "preferenciasUsuarioOverlay") {
      fecharModalPreferencias();
      return;
    }

    if (event.target.closest("#btnSalvarPreferencias")) {
      salvarPreferencias(lerFormulario());
      aplicarPreferenciasUsuario();
      fecharModalPreferencias();
      return;
    }

    if (event.target.closest("#btnResetPreferencias")) {
      salvarPreferencias({ ...DEFAULT_PREFERENCES });
      preencherFormulario({ ...DEFAULT_PREFERENCES });
      aplicarPreferenciasUsuario();
      return;
    }

    if (event.target.closest("#btnLimparHistoricoChat")) {
      document.dispatchEvent(new Event("chat-online:limpar-historico"));
      Swal.fire({
        icon: "success",
        title: "Histórico limpo",
        text: "As mensagens salvas neste navegador foram apagadas.",
        theme: "dark",
        timer: 1800,
        showConfirmButton: false
      });
      return;
    }

    if (event.target.closest("#btnEncerrarTodasSessoes")) {
      encerrarTodasSessoes();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target?.id === "prefNovaSenha") {
      atualizarForcaSenha();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target?.id === "formPreferenciasSenha") {
      salvarSenhaPreferencias(event);
    }
  });
}
