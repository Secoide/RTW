import { initAbrirInfoColabClick } from "../events/click/handle-abrir-info-colab.js";
import "../events/click/handle-atestados.js";
import { initColaboradoresContextMenu } from "../events/contextmenu/handle-colaboradores-contextmenu.js";
import { fecharSocket, getSocket } from "../services/sockets/socket-service.js";
import { carregarAniversariantes } from "../services/api/aniversariantes.js";
import { reduzirNome } from "../utils/formatters/strings-format.js";
import { VERSAO_SISTEMA } from "../config/system-version.js";
import { carregarChangelog } from "../services/ui/changelog-loader.js";
import { initPreferenciasUsuario } from "../services/ui/user-preferences.js";
import { initNotificacoesSininho } from "../services/sockets/socket-notifications.js";

import { } from "../services/sockets/reconnect-service.js";
import { initSantaDropWalkWrapper } from "../services/ui/christmas-painel-inicio.js";
import { aplicarEasterEggTituloConquistas } from "../services/ui/EasterEgg/titulo-conquistas.js";
import { observarPermissoesPorRoles } from "../state/role.js";

// =======================================================
// VARIÁVEIS GLOBAIS
// =======================================================
let avisoIconeSelecionado = "\ud83d\udcc4";
let avisoEditandoId = null;

let nomeUsuario = sessionStorage.getItem("nome_usuario");
let changelogHomeCarregado = false;
let reconhecimentoSlideTimer = null;
let conquistasSlideHome = [];
let conquistaSlideIndiceHome = 0;
const TEMPO_SLIDE_RECONHECIMENTO_MS = 30000;

const CONQUISTAS_MANUAIS_HOME = {
  CIPA: { icone: "\u267b\ufe0f", nome: "Membro da CIPA", descricao: "Participa da Comiss\u00e3o Interna de Preven\u00e7\u00e3o de Acidentes." },
  BRIGADISTA: { icone: "\u26d1\ufe0f", nome: "Brigadista", descricao: "Integrante da Brigada de Emerg\u00eancia da empresa." },
  DESTAQUE_MES: { icone: "\ud83c\udfc5", nome: "Destaque do M\u00eas", descricao: "Reconhecimento mensal por desempenho, postura, entrega ou contribui\u00e7\u00e3o acima do esperado." },
  DESTAQUE_ANO: { icone: "\ud83c\udfc6", nome: "Destaque do Ano", descricao: "Reconhecimento anual para colaborador com grande impacto, const\u00e2ncia e contribui\u00e7\u00e3o para a equipe." },
  INOVADOR: { icone: "\ud83d\udca1", nome: "Inovador", descricao: "Concedida a colaboradores que criaram melhorias, automa\u00e7\u00f5es ou processos que geraram resultados positivos." },
  ESPIRITO_EQUIPE: { icone: "\ud83e\udd1d", nome: "Esp\u00edrito de Equipe", descricao: "Reconhece colabora\u00e7\u00e3o, respeito e apoio constante aos colegas." },
  HEROI_SEGURANCA: { icone: "\ud83d\udea8", nome: "Her\u00f3i da Seguran\u00e7a", descricao: "Concedida por atitudes relevantes de preven\u00e7\u00e3o de acidentes e promo\u00e7\u00e3o da seguran\u00e7a." },
  MENTOR: { icone: "\ud83c\udf93", nome: "Mentor", descricao: "Reconhece profissionais que compartilham conhecimento e desenvolvem outros colaboradores." },
  EMBAIXADOR: { icone: "\ud83c\udf0e", nome: "Embaixador", descricao: "Representa a empresa de forma exemplar perante clientes, fornecedores e parceiros." },
  CLIENTE_DESTAQUE: { icone: "\ud83d\udcac", nome: "Elogiado pelo Cliente", descricao: "Conquista recebida atrav\u00e9s de elogios e reconhecimentos formais dos clientes." },
  RESOLVE_TUDO: { icone: "\ud83e\udde9", nome: "Resolve Tudo", descricao: "Reconhece profissionais que encontram solu\u00e7\u00f5es para desafios complexos do dia a dia." },
  LIDERANCA: { icone: "\ud83d\udc54", nome: "Lideran\u00e7a Inspiradora", descricao: "Concedida a l\u00edderes que influenciam positivamente suas equipes pelo exemplo." },
  SUPERACAO: { icone: "\ud83c\udfd4\ufe0f", nome: "Supera\u00e7\u00e3o", descricao: "Reconhece colaboradores que superaram desafios importantes durante sua trajet\u00f3ria." },
  ORGULHO_RTW: { icone: "\u2764\ufe0f", nome: "Orgulho RTW", descricao: "Uma das maiores honrarias concedidas pela empresa." },
  SOLUCAO_INTELIGENTE: { icone: "\ud83e\udde0", nome: "Solu\u00e7\u00e3o Inteligente", descricao: "Reconhece solu\u00e7\u00f5es criativas e eficientes para problemas complexos." },
  CORUJA_RTW: { icone: "\ud83e\udd89", nome: "Coruja", descricao: "Reconhece dedica\u00e7\u00e3o excepcional em per\u00edodos noturnos, paradas de manuten\u00e7\u00e3o ou atendimentos fora do hor\u00e1rio convencional." },
  PRECISAO_RTW: { icone: "\ud83c\udfaf", nome: "Precis\u00e3o", descricao: "Concedida a profissionais com alto padr\u00e3o de qualidade, baixa incid\u00eancia de retrabalho e aten\u00e7\u00e3o aos detalhes." },
  ORGANIZACAO_EXEMPLAR: { icone: "\ud83d\udccb", nome: "Organiza\u00e7\u00e3o Exemplar", descricao: "Reconhece organiza\u00e7\u00e3o exemplar de documentos, materiais, ferramentas e informa\u00e7\u00f5es." },
  RESPOSTA_RAPIDA: { icone: "\u26a1", nome: "Resposta R\u00e1pida", descricao: "Concedida a profissionais \u00e1geis em demandas urgentes, emerg\u00eancias e situa\u00e7\u00f5es cr\u00edticas." },
  COMUNICADOR_RTW: { icone: "\ud83d\udce1", nome: "Comunicador", descricao: "Reconhece comunica\u00e7\u00e3o clara, objetiva e eficiente com clientes, colegas e lideran\u00e7as." },
  ALTA_PERFORMANCE: { icone: "\ud83e\udebe", nome: "Alta Performance", descricao: "Destinada aos profissionais com desempenho acima da m\u00e9dia e entregas consistentes." },
  PONTUALIDADE_OURO: { icone: "\u23f1\ufe0f", nome: "Pontualidade de Ouro", descricao: "Concedida aos colaboradores comprometidos com hor\u00e1rios, prazos e compromissos assumidos." },
  GUARDIAO_QUALIDADE: { icone: "\ud83d\udd10", nome: "Guardi\u00e3o da Qualidade", descricao: "Reconhece profissionais que contribuem continuamente para a excel\u00eancia dos servi\u00e7os." }
};

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

const msgInicial =
  document.getElementById(
    "is-msg-bot-inicio"
  );

const alertasBadge =
  document.getElementById(
    "ia-alertas-badge"
  );

const alertasMsg =
  document.getElementById(
    "ia-alertas-msg"
  );



// =======================================================
// FUNÇÕES BACK-END
// =======================================================


function selecionarIcone(icone) {
  // tenta imediatamente
  let spans = document.querySelectorAll("#iconeLista span");

  if (spans.length > 0) {
    spans.forEach(s => {
      s.classList.remove("ativo");
      if (s.dataset.icone === icone) s.classList.add("ativo");
    });

    avisoIconeSelecionado = icone;
    return;
  }

  // Se ainda não existe, tenta novamente até existir
  const interval = setInterval(() => {
    spans = document.querySelectorAll("#iconeLista span");

    if (spans.length > 0) {
      spans.forEach(s => {
        s.classList.remove("ativo");
        if (s.dataset.icone === icone) s.classList.add("ativo");
      });

      avisoIconeSelecionado = icone;
      clearInterval(interval);
    }
  }, 100);
}


export async function excluirAviso(id) {
  const result = await Swal.fire({
    title: "Excluir",
    text: `Deseja excluir este aviso?`,
    icon: "warning",
    theme: "dark",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, excluir!"
  });

  if (!result.isConfirmed) return;

  const resp = await fetch(`/api/comunicados/${id}`, {
    method: "DELETE",
    headers: {
      authorization: "Bearer " + sessionStorage.getItem("token")
    }
  });

  if (resp.ok) {
    Toast.fire({
      icon: "success",
      theme: 'dark',
      title: "Aviso excluído!"
    });
    carregarAvisos();
  } else {
    alert("Erro ao excluir.");
  }
}



export async function editarAviso(id) {
  const resp = await fetch(`/api/comunicados/item/${id}`, {
    headers: { "authorization": "Bearer " + sessionStorage.getItem("token") }
  });

  const aviso = await resp.json();

  avisoEditandoId = id;
  document.getElementById("modalTitulo").innerText = "Editar Aviso";
  document.getElementById("modalAviso").style.display = "flex";

  document.getElementById("avisoCategoria").value = aviso.categoria;
  document.getElementById("avisoTitulo").value = aviso.titulo;
  document.getElementById("avisoTexto").value = aviso.texto;

  selecionarIcone(aviso.icone);
}


async function salvarAviso() {
  const categoria = document.getElementById("avisoCategoria").value;
  const titulo = document.getElementById("avisoTitulo").value;
  const texto = document.getElementById("avisoTexto").value;

  if (!titulo || !texto) {
    Toast.fire({
      icon: "warning",
      theme: 'dark',
      title: "Preencha todos os campos!"
    });
    return;
  }

  const payload = {
    categoria,
    titulo,
    texto,
    icone: avisoIconeSelecionado
  };

  let url = "/api/comunicados";
  let method = "POST";
  let metodo = "cadastrado"

  if (avisoEditandoId !== null) {
    url = `/api/comunicados/${avisoEditandoId}`;
    method = "PUT";
    metodo = "alterado"
  }

  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "authorization": "Bearer " + sessionStorage.getItem("token")
    },
    body: JSON.stringify(payload)
  });

  if (resp.ok) {
    Toast.fire({
      icon: "success",
      theme: 'dark',
      title: `Aviso ${metodo}!`
    });
    carregarAvisos();
    document.getElementById("modalAviso").style.display = "none";
  } else {
    Toast.fire({
      icon: "error",
      theme: 'dark',
      title: "Erro ao salvar aviso!"
    });
  }
}


// =======================================================
// LISTAR AVISOS
// =======================================================
export async function carregarAvisos() {

  const usuarioId = sessionStorage.getItem("id_usuario");
  const usuarioNivel = Number(sessionStorage.getItem("nivel_acesso"));

  const categorias = [
    { nome: "rh", destino: ".panel-rh" },
    { nome: "treinamentos", destino: ".panel-treinamentos" },
    { nome: "seguranca", destino: ".panel-seguranca" }
  ];

  for (const cat of categorias) {
    try {
      const el = document.querySelector(cat.destino);
      if (!el) continue;

      const resp = await fetch(`/api/comunicados/${cat.nome}`, {
        headers: { "authorization": "Bearer " + sessionStorage.getItem("token") }
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const lista = await resp.json();
      el.innerHTML = "";

      lista.forEach(item => {

        // Permissao
        const podeEditarOuExcluir =
          usuarioId == item.criado_por ||
          usuarioNivel == 5 ||
          usuarioNivel == 99;
        el.innerHTML += `
          <div class="item-comunicado ${cat.nome}">
              <div class="item-icon">${item.icone || "\ud83d\udcc4"}</div>

              <div style="width:100%;">
                  <div class="item-titulo">${item.titulo}</div>
                  <div class="item-texto">${item.texto}</div>

                  <div class="painel-acoes">
                      
                      <!-- Botoes (apenas se tiver permissao) -->
                      <div style="${!podeEditarOuExcluir ? 'display:none;' : ''}">
                        <span class="btn-editar" title="Editar" data-id="${item.id}">&#9999;&#65039;</span>
                        <span class="btn-excluir" title="Apagar" data-id="${item.id}">&#128465;&#65039;</span>
                      </div>

                      <!-- Criado por -->
                      <p style="opacity: 0.7; font-size: 9px; text-align:right; margin:0;">
                        ${reduzirNome(item.criado_por_nome) || "Desconhecido"} &mdash;
                        <strong>${tempoRelativo(item.data_registro)}</strong>
                      </p>

                  </div>
              </div>
          </div>
        `;
      });

    } catch (err) {
      console.error("Erro ao carregar comunicados:", cat.nome, err);
    }
  }
  carregarAvisosExames();
}


async function carregarAvisosExames() {

  try {
    const resp = await fetch(`/api/comunicados/exames`, {
      headers: { "authorization": "Bearer " + sessionStorage.getItem("token") }
    });

    const lista = await resp.json();
    const el = document.querySelector(".panel-rh");
    if (!el) return;

    lista.forEach(item => {

      const agendaFormatada = item.agenda.replace(/\n/g, "<br>");

      el.innerHTML += `
        <div class="item-comunicado exame">
            <div class="item-icon">&#129658;</div>

            <div style="width:100%;">
                <div class="item-titulo">Exame Agendado</div>
                <div class="item-texto">
                    ${item.colaborador}<br>
                    ${agendaFormatada}
                </div>

                <div class="painel-acoes">
                    <p style="opacity:0.7;font-size:9px;text-align:right;margin:0;">
                      Sistema RH
                    </p>
                </div>
            </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("Erro ao carregar comunicados:", err);
  }
}




// =======================================================
// EVENTO GLOBAL PARA BOTÕES (DELEGAÇÃO)
// =======================================================
document.addEventListener("click", (ev) => {
  if (ev.target.closest("#homeVersaoBtn, #menuVersaoBtn")) {
    abrirDetalhesVersaoHome();
    return;
  }

  if (ev.target.id === "homeBtnPopupOk" || ev.target.id === "homePopupAtualizacao") {
    fecharDetalhesVersaoHome();
    return;
  }

  // Abrir modal novo aviso
  if (ev.target.id === "btnNovoAviso") {
    avisoEditandoId = null;
    document.getElementById("modalTitulo").innerText = "Novo Aviso";
    document.getElementById("modalAviso").style.display = "flex";
    return;
  }

  // Cancelar modal
  if (ev.target.id === "btnCancelarAviso") {
    document.getElementById("modalAviso").style.display = "none";
    return;
  }

  // Salvar aviso
  if (ev.target.id === "btnSalvarAviso") {
    salvarAviso();
    return;
  }

  // Excluir aviso
  if (ev.target.classList.contains("btn-excluir")) {
    excluirAviso(ev.target.dataset.id);
    return;
  }

  // Editar aviso
  if (ev.target.classList.contains("btn-editar")) {
    editarAviso(ev.target.dataset.id);
    return;
  }
});

async function iniciarVersaoHome(tentativas = 0) {
  const btnVersao = document.getElementById("homeVersaoBtn");
  const textoVersao = document.getElementById("homeVersaoAtual");
  const popup = document.getElementById("homePopupAtualizacao");

  if (!textoVersao || !popup) {
    if (tentativas < 20) {
      setTimeout(() => iniciarVersaoHome(tentativas + 1), 100);
    }
    return;
  }

  changelogHomeCarregado = false;
  if (btnVersao) btnVersao.textContent = VERSAO_SISTEMA;
  textoVersao.textContent = VERSAO_SISTEMA;

  await carregarDetalhesVersaoHome();

  if (localStorage.getItem("versao_sistema_vista") !== VERSAO_SISTEMA) {
    popup.style.display = "flex";
  }
}

async function abrirDetalhesVersaoHome() {
  garantirPopupVersaoHome();
  const popup = document.getElementById("homePopupAtualizacao");

  if (!popup) return;

  popup.style.display = "flex";
  await carregarDetalhesVersaoHome();
}

async function carregarDetalhesVersaoHome() {
  garantirPopupVersaoHome();
  const container = document.querySelector(".home-changelog-container");

  if (!container) return;

  if (changelogHomeCarregado) return;

  container.innerHTML = "<p class=\"home-changelog-loading\">Carregando detalhes...</p>";
  container.innerHTML = await carregarChangelog(VERSAO_SISTEMA);
  changelogHomeCarregado = true;
}

function fecharDetalhesVersaoHome() {
  const popup = document.getElementById("homePopupAtualizacao");
  if (popup) popup.style.display = "none";
  localStorage.setItem("versao_sistema_vista", VERSAO_SISTEMA);
}

function garantirPopupVersaoHome() {
  if (document.getElementById("homePopupAtualizacao")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="homePopupAtualizacao" class="atualizacao-overlay home-atualizacao-overlay">
      <div class="atualizacao-box home-atualizacao-box">
        <h2>&#128640; Nova atualização lançada!</h2>
        <p><strong>Versão:</strong> <span id="homeVersaoAtual">${VERSAO_SISTEMA}</span></p>
        <div class="home-changelog-container"></div>
        <button type="button" id="homeBtnPopupOk">OBRIGADO</button>
      </div>
    </div>
  `);
}


// =======================================================
// SELEÇÃO DE ÍCONES
// =======================================================
document.querySelectorAll("#iconeLista span").forEach(el => {
  el.addEventListener("click", () => {
    document.querySelectorAll("#iconeLista span").forEach(s => s.classList.remove("ativo"));
    el.classList.add("ativo");
    avisoIconeSelecionado = el.dataset.icone;
  });
});


// =======================================================
// MAIN
// =======================================================
export async function initHome() {

  const socket = getSocket();
  iniciarVersaoHome();
  observarPermissoesPorRoles();
  initColaboradoresContextMenu(socket);

  // Aguarda menu
  await fetch("menu.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menu").innerHTML = html;
    });

  // Aguarda menu perfil
  await fetch("menuPerfil.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menuperfil").innerHTML = html;
      document.getElementById("bt_perfilhome").innerText =
        sessionStorage.getItem("nome_usuario");

      initAbrirInfoColabClick();
      initPreferenciasUsuario();
      initNotificacoesSininho();
    });

  carregarFotoPerfil();
  // Só agora DOM está completo
  await carregarAniversariantes();
  await carregarAvisos();
  await carregarHallExperiencia();
  initSantaDropWalkWrapper();

  // ==========================================
  // SELEÇÃO DE ÍCONES -> AGORA FUNCIONA
  // ==========================================
  document.querySelectorAll("#iconeLista span").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll("#iconeLista span")
        .forEach(s => s.classList.remove("ativo"));

      el.classList.add("ativo");
      avisoIconeSelecionado = el.dataset.icone;
    });
  });

  document.getElementById("btnLogout").addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.warn("Nao foi possivel encerrar a sessao no servidor.", err);
    }

    fecharSocket();

    // limpa estado local
    localStorage.removeItem("nome_usuario");
    sessionStorage.clear();

    window.location.href = "/login";
  });

  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menuMobile");
  const overlay = document.getElementById("menuOverlay");
  const menuIcon = document.getElementById("menuIcon");
  const perfilMobileBtn = document.getElementById("perfilMobileBtn");
  const perfilOriginal = document.getElementById("bt_perfilhome");
  const avatarDesktop = document.getElementById("fotoavatarPerfil");
  const avatarMobile = document.getElementById("avatarMobile");

  if (avatarDesktop && avatarMobile) {
    avatarMobile.src = avatarDesktop.src;
  }
  function abrirFecharMenu() {
    menu.classList.toggle("open");
    overlay.classList.toggle("show");
    menuToggle.classList.toggle("open");

    if (menu.classList.contains("open")) {
      menuIcon.classList.replace("fa-bars", "fa-arrow-left");
    } else {
      menuIcon.classList.replace("fa-arrow-left", "fa-bars");
    }
  }

  function fecharMenu() {
    menu.classList.remove("open");
    overlay.classList.remove("show");
    menuToggle.classList.remove("open");
    menuIcon.classList.replace("fa-arrow-left", "fa-bars");
  }

  menuToggle.addEventListener("click", abrirFecharMenu);
  overlay.addEventListener("click", fecharMenu);

  document.querySelectorAll(".menu a").forEach(link => {
    link.addEventListener("click", fecharMenu);
  });

  perfilMobileBtn.addEventListener("click", () => {
    perfilOriginal.click();
  });

  document.querySelectorAll(".painel-comunicado").forEach(painel => {
    if (!painel.querySelector(".item-comunicado")) {
      painel.classList.add("oculto");
    }
  });





  const btn = document.getElementById("online-button");
  const panel = document.getElementById("online-panel");

  const onlineWidget = document.getElementById("online-widget");
  const iaWidget = document.getElementById("ia-widget");

  // ============================================================
  // ABRIR / FECHAR ONLINE
  // ============================================================

  btn.onclick = () => {

    panel.classList.toggle("active");

    // Move IA junto

    if (panel.classList.contains("active")) {

      document.getElementById("ia-chat")?.classList.remove("active");
      onlineWidget.classList.add("open-ia-space");
      requestAnimationFrame(() => {
        const alturaOnline = onlineWidget.getBoundingClientRect().height;
        const offset = Math.ceil(alturaOnline + 12);
        iaWidget?.style.setProperty("--online-widget-offset", `${offset}px`);
      });

    } else {

      onlineWidget.classList.remove("open-ia-space");
      iaWidget?.style.removeProperty("--online-widget-offset");

    }

    document.dispatchEvent(new Event("chat-online:visibilidade-alterada"));

  };

  // ============================================================
  // MENU PERFIL
  // ============================================================

  const menuPerfil = document.querySelector(".menu_Perfil");
  const avatar = document.getElementById("fotoavatarPerfil");

  // abrir/fechar ao clicar na foto

  avatar.addEventListener("click", (e) => {

    e.stopPropagation();

    menuPerfil.classList.toggle("aberto");

  });

  // clicar fora fecha

  document.addEventListener("click", (e) => {

    if (!menuPerfil.contains(e.target)) {

      menuPerfil.classList.remove("aberto");

    }

  });


  // ============================================================
  // CHAT IA ConnectPear
  // ============================================================


  const iaButton = document.getElementById("ia-button");
  const iaChat = document.getElementById("ia-chat");
  const iaClose = document.getElementById("ia-close");

  const iaInput = document.getElementById("ia-input");
  const iaSend = document.getElementById("ia-send");

  const iaMessages = document.getElementById("ia-messages");

  // ============================================================
  // ABRIR CHAT
  // ============================================================

  iaButton.addEventListener("click", () => {
    iaAlertIcon.style.display =
      "none";
    iaChat.classList.toggle("active");

  });


  // ============================================================
  // BOTÃO ENVIAR
  // ============================================================

  iaSend.addEventListener("click", enviarMensagem);

  // ============================================================
  // ENTER INPUT
  // ============================================================

  iaInput.addEventListener("keypress", (e) => {

    if (e.key === "Enter") {

      enviarMensagem();

    }

  });

  // ============================================================
  // FUNÇÃO PRINCIPAL
  // ============================================================

  async function enviarMensagem() {

    const texto = iaInput.value.trim();

    if (!texto) return;

    // ============================================================
    // MENSAGEM USUÁRIO
    // ============================================================

    adicionarMensagem(texto, "user");

    iaInput.value = "";

    // ============================================================
    // MENSAGEM LOADING
    // ============================================================

    const loadingDiv = document.createElement("div");

    loadingDiv.classList.add("ia-msg");
    loadingDiv.classList.add("ia-bot");

    // ============================================================
    // FRASES NORMAIS
    // ============================================================

    const mensagensNormais = [

      "\ud83d\udd0e Consultando sistema",
      "\ud83d\udcc2 Buscando informações",
      "\ud83e\udd16 Processando consulta",
      "\ud83d\udce1 Verificando programação",
      "\ud83e\udde0 Cruzando dados operacionais",
      "\ud83d\udcd1 Lendo OS cadastradas",
      "\ud83d\udc77 Procurando colaboradores",
      "\u26a1 Consultando programação da equipe",
      "\ud83d\udccb Organizando informações",
      "\ud83d\udd27 Sincronizando dados da engenharia",
      "\ud83d\udef0\ufe0f Acessando banco operacional",
      "\ud83d\udcca Analisando produtividade",
      "\ud83d\udee0\ufe0f Verificando disponibilidade",
      "\ud83c\udfed Consultando empresas vinculadas",
      "\ud83d\udcc5 Validando programação do dia",
      "\ud83e\uddfe Gerando resposta operacional"

    ];

    // ============================================================
    // FRASES ENGRACADAS
    // ============================================================

    const mensagensEngracadas = [

      "\u2615 O eletricista foi tomar café... buscando ele",
      "\ud83d\udd26 Procurando colaborador com lanterna",
      "\u26a0\ufe0f Tentando entender a letra da OS",
      "\ud83e\uddf0 Conferindo quem pegou as ferramentas",
      "\ud83d\udea7 Desviando dos cones da obra",
      "\ud83d\udd0c Reconectando neurônios da IA",
      "\ud83e\udde0 Perguntando pro estagiário",
      "\ud83e\udeab IA com baixa bateria emocional"

    ];

    // ============================================================
    // CHANCE DE FRASE ENGRAÇADA
    // ============================================================

    // 15% de chance

    const usarEngracada =
      Math.random() < 0.01;

    // ============================================================
    // ESCOLHER FRASE
    // ============================================================

    const listaEscolhida =
      usarEngracada
        ? mensagensEngracadas
        : mensagensNormais;

    const mensagem =
      listaEscolhida[
      Math.floor(
        Math.random() * listaEscolhida.length
      )
      ];

    // ============================================================
    // HTML
    // ============================================================

    loadingDiv.innerHTML = `
  <span class="ia-loading-text">
    ${mensagem}
  </span>

  <span class="ia-dots">
    <span>.</span>
    <span>.</span>
    <span>.</span>
  </span>
`;

    iaMessages.appendChild(loadingDiv);

    if (
      usuarioEstaNoFinal(
        iaMessages
      )
    ) {

      iaMessages.scrollTop =
        iaMessages.scrollHeight;

    }

    try {

      // ========================================================
      // CHAMADA IA
      // ========================================================

      const response =
        await fetch("/api/ia/chat", {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            pergunta: texto
          })

        });

      const data =
        await response.json();

      // remove loading

      loadingDiv.remove();

      // ========================================================
      // RESPOSTA IA
      // ========================================================

      adicionarMensagem(
        data.resposta || "Sem resposta.",
        "bot"
      );

    } catch (err) {

      console.error(err);

      loadingDiv.remove();

      adicionarMensagem(
        "\u274c Erro ao consultar IA.",
        "bot"
      );

    }

  }


  const helpBadge =
    document.getElementById(
      "ia-help-badge"
    );



  // ========================================================
  // ABRIR / FECHAR AJUDA
  // ========================================================

  if (
    helpBadge &&
    msgInicial
  ) {

    helpBadge.addEventListener(
      "click",
      () => {

        msgInicial.classList.toggle(
          "ia-hidden"
        );

      }
    );

  }

  // ========================================================
  // ABRIR / FECHAR ALERTAS
  // ========================================================

  if (
    alertasBadge &&
    alertasMsg
  ) {

    alertasBadge.addEventListener(
      "click",
      () => {

        alertasMsg.classList.toggle(
          "ia-hidden"
        );

      }
    );

  }
  function usuarioEstaNoFinal(
    elemento
  ) {

    const tolerancia = 120;

    return (

      elemento.scrollHeight
      - elemento.scrollTop
      - elemento.clientHeight

    ) < tolerancia;

  }
  // ============================================================
  // ADICIONAR MENSAGEM
  // ============================================================

  function adicionarMensagem(texto, tipo) {
    const estavaNoFinal =
      usuarioEstaNoFinal(
        iaMessages
      );
    const div =
      document.createElement("div");

    div.classList.add("ia-msg");

    if (tipo === "user") {

      div.classList.add("ia-user");

    } else {

      div.classList.add("ia-bot");

    }

    let html = texto;
    // ========================================================
    // REMOVE TAGS DE GRÁFICO DO HTML
    // ========================================================

    html = html.replace(
      /\[GRAFICO\][\s\S]*?\[\/GRAFICO\]/g,
      ""
    );
    // ========================================================
    // NOMES
    // ========================================================

    html = html.replace(
      /\$%(.*?)\$%/g,
      `<span class="ia-nome">$1</span>`
    );

    // ========================================================
    // EMPRESAS
    // ========================================================

    html = html.replace(
      /#%(.*?)#%/g,
      `<span class="ia-empresa">$1</span>`
    );

    // ========================================================
    // OS
    // ========================================================

    html = html.replace(
      /@%(.*?)@%/g,
      `<span class="ia-os-blue">$1</span>`
    );

    // ========================================================
    // DIAS
    // ========================================================

    html = html.replace(
      /X%(.*?)X%/g,
      `<span class="ia-dias">$1</span>`
    );

    // ========================================================
    // TITULOS
    // ========================================================

    html = html.replace(
      /^###\s+(.*)$/gm,
      `<div class="ia-title">$1</div>`
    );

    // ========================================================
    // NEGRITO
    // ========================================================

    html = html.replace(
      /\*\*(.*?)\*\*/g,
      `<strong>$1</strong>`
    );

    // ========================================================
    // LABELS
    // ========================================================

    html = html.replace(
      /(Descrição:|Empresa:|Supervisor:|Colaboradores:|Data:)/gi,
      `<span class="ia-label">$1</span>`
    );

    // ========================================================
    // LISTAS
    // ========================================================

    html = html.replace(
      /^\s*[*\u2022-]\s+(.*)$/gm,
      `<div class="ia-list-item">\u2022 $1</div>`
    );

    // ========================================================
    // QUEBRA DE LINHA INTELIGENTE
    // ========================================================

    html = html
      .split("\n")
      .map(linha => {

        // ==============================================
        // NÃO ADICIONAR <br> EM LISTAS
        // ==============================================

        if (
          linha.includes("ia-list-item")
        ) {

          return linha;

        }

        // ==============================================
        // TITULOS
        // ==============================================

        if (
          linha.includes("ia-title")
        ) {

          return linha;

        }

        return linha + "<br>";

      })
      .join("");



    // ========================================================
    // REMOVE <br> EXCESSIVOS
    // ========================================================

    html = html.replace(
      /(<br>\s*){3,}/g,
      ""
    );

    div.innerHTML = html;
    renderizarGraficos(
      div,
      texto
    );
    renderizarColaboradorIA(
      div,
      texto
    );
    iaMessages.appendChild(div);

    if (
      usuarioEstaNoFinal(
        iaMessages
      )
    ) {

      if (estavaNoFinal) {

        iaMessages.scrollTop =
          iaMessages.scrollHeight;

      }

    }

  }

  verificarAlertasIA();
}

const iaAlertIcon =
  document.getElementById(
    "ia-alert-icon"
  );

function mostrarInsightIA(
  icone = "\ud83d\udca1"
) {

  iaAlertIcon.innerText =
    icone;

  iaAlertIcon.style.display =
    "flex";

}

async function verificarAlertasIA() {

  try {

    const req =
      await fetch(
        "/api/ia/alertas"
      );

    const alertas =
      await req.json();

    if (
      !alertas.length
    ) {
      return;
    }
    if (
      alertas.length > 0
    ) {
      alertasBadge.classList.remove(
        "ia-hidden"
      );
      alertasMsg.innerHTML =
        `
<strong>
\ud83e\udde0 Central IA Operacional
</strong>
<br><br>
` +

        alertas.map(alerta => {

          return `

<div class="ia-list-item">

${alerta.icone}
${alerta.mensagem}

</div>

      `;

        }).join("");

    }

    // ================================================
    // MOSTRAR ÍCONE
    // ================================================

    mostrarInsightIA(
      alertas[0].icone
    );

    // ================================================
    // MENSAGEM AUTOMÁTICA
    // ================================================

    window.alertasIA =
      alertas;

  } catch (err) {

    console.error(err);

  }

}

// ======================================================
// RENDERIZAR GRÁFICOS IA
// ======================================================

function renderizarGraficos(
  container,
  textoOriginal
) {

  const regex =
    /\[GRAFICO\]([\s\S]*?)\[\/GRAFICO\]/g;

  const htmlOriginal =
    textoOriginal;

  const matches =
    [...htmlOriginal.matchAll(regex)];

  if (!matches.length) {

    return;

  }

  matches.forEach((match, index) => {

    try {

      const jsonTexto =
        match[1].trim();

      const grafico =
        JSON.parse(jsonTexto);

      // ==========================================
      // REMOVE TAG DO TEXTO
      // ==========================================

      container.innerHTML =
        container.innerHTML.replace(
          match[0],
          ""
        );

      // ==========================================
      // WRAPPER
      // ==========================================

      const wrapper =
        document.createElement("div");

      wrapper.className =
        "ia-chart-wrapper";

      // ==========================================
      // CANVAS
      // ==========================================

      const canvas =
        document.createElement("canvas");

      canvas.id =
        `ia-chart-${Date.now()}-${index}`;

      wrapper.appendChild(canvas);

      container.appendChild(wrapper);

      // ==========================================
      // CHART
      // ==========================================

      console.log(grafico.tipo);
      new Chart(canvas, {

        type:
          grafico.tipo || "bar",
        data: {

          labels:
            grafico.labels || [],

          datasets: [{

            label:
              "Dados",

            data:
              grafico.values || [],

            borderWidth: 2,
            borderRadius: 8

          }]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              display:
                grafico.tipo === "pie"

            }

          },
          scales: {

            x: {

              ticks: {

                maxRotation: 45,
                minRotation: 45,

                callback: function (value) {

                  const label =
                    this.getLabelForValue(value);

                  return label.length > 12
                    ? label.substring(0, 12) + "..."
                    : label;

                }

              }

            }

          }
        }

      });

    } catch (err) {

      console.error(
        "Erro gráfico IA:",
        err
      );

    }

  });

}

function carregarFotoPerfil() {
  const id = sessionStorage.getItem("id_usuario");;

  if (!id) {
    console.warn('ID do colaborador nao encontrado.');
    return;
  }

  $.ajax({
    url: `/api/colaboradores/${id}`,
    type: 'GET',
    contentType: 'application/json',

    success: function (res) {
      const dados = res;

      if (!dados || !dados.id) {
        console.warn("Colaborador nao encontrado.");
        return;
      }
      const fotoURL = montarUrlFotoPerfil(dados.fotoperfil, dados.versao_foto);
      atualizarAvatarPerfil(fotoURL);

      $('#fotoavatarPerfil, #avatarMobile').off('error.fotoPerfil').on('error.fotoPerfil', function () {
        console.warn("Foto do perfil não encontrada. Carregando padrão.");
        $(this).attr('src', '/imagens/user-default.webp');
      });
    },

    error: function (err) {
      if (err?.status === 401) {
        if (typeof window.tratarErro401 === "function") {
          window.tratarErro401();
        }
        return;
      }

      console.warn('Erro ao carregar foto do perfil.', err);
    }
  });
}

function montarUrlFotoPerfil(foto, versao) {
  const caminho = String(foto || "").trim();
  if (!caminho || caminho === "null" || caminho === "undefined") {
    return "/imagens/user-default.webp";
  }

  const separador = caminho.includes("?") ? "&" : "?";
  const cache = versao ? `${separador}v=${encodeURIComponent(versao)}` : "";

  if (/^https?:\/\//i.test(caminho) || caminho.startsWith("/")) {
    return `${caminho}${cache}`;
  }

  return `/${caminho.replace(/^\/+/, "")}${cache}`;
}

function atualizarAvatarPerfil(src) {
  const foto = src || "/imagens/user-default.webp";
  $('#fotoavatarPerfil').attr('src', foto);
  $('#avatarMobile').attr('src', foto);
}




function tempoRelativo(dataString) {
  const data = new Date(dataString);
  const agora = new Date();
  const diffMs = agora - data;

  const segundos = Math.floor(diffMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min${minutos > 1 ? "s" : ""}`;
  if (horas < 24) return `há ${horas} hora${horas > 1 ? "s" : ""}`;
  if (dias === 1) return "ontem";
  return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}

// =======================================================
// OBSERVADOR PARA ESPERAR O HTML DO MODAL CARREGAR
// =======================================================
const observer = new MutationObserver(() => {
  const lista = document.querySelectorAll("#iconeLista span");

  if (lista.length > 0) {

    lista.forEach(el => {
      el.addEventListener("click", () => {
        document.querySelectorAll("#iconeLista span").forEach(s => s.classList.remove("ativo"));
        el.classList.add("ativo");
        avisoIconeSelecionado = el.dataset.icone;
      });
    });

    // Deixa de observar após carregar
    observer.disconnect();
  }
});

// Observar mudanças no body (onde o HTML será injetado)
observer.observe(document.body, { childList: true, subtree: true });

// ======================================================
// RENDERIZAR CARD COLABORADOR
// ======================================================

function renderizarColaboradorIA(
  container,
  textoOriginal
) {
  // ======================================================
  // NÍVEL ACESSO
  // ======================================================

  const rawNivel =
    sessionStorage.getItem(
      "nivel_acesso"
    );

  const nivelAcesso =
    Number.isFinite(
      Number(rawNivel)
    )

      ? Number(rawNivel)

      : Number.POSITIVE_INFINITY;

  // ======================================================
  // PERMISSÃO DADOS SENSÍVEIS
  // ======================================================

  const podeVerSensivel =
    nivelAcesso >= 4;
  const regex =
    /(<br>\s*)?\[COLABORADOR\]([\s\S]*?)\[\/COLABORADOR\](<br>\s*)?/g;

  const matches =
    [...textoOriginal.matchAll(regex)];

  if (!matches.length) {
    return;
  }


  // remove texto bruto

  container.innerHTML =
    container.innerHTML.replace(
      regex,
      ""
    );

  matches.forEach(match => {

    try {

      const dados =
        JSON.parse(
          match[2].trim()
        );

      const iniciais =
        dados.nome
          ?.split(" ")
          .map(x => x[0])
          .slice(0, 2)
          .join("")
        || "\ud83d\udc64";

      const card =
        document.createElement("div");

      card.className =
        "ia-colaborador-card";

      const imgSrc = dados.fotoperfil
        ? `${dados.fotoperfil}?v=${dados.versao_foto || ""}`
        : "/imagens/user-default.webp";


      card.innerHTML = `<div class="ia-colab-topo">
                <div class="ia-colab-avatar">
                    <img
                        class="ia-colab-img"
                        src="${imgSrc}"
                    >
                </div>
                <div>
                    <div class="ia-colab-nome">
                        ${dados.nome || "-"}
                    </div>
                    <div class="ia-colab-cargo">
                        ${dados.cargo || "-"}
                    </div>
                </div>
            </div>
            <!-- ===================================================== -->
            <!-- DADOS SENSÍVEIS -->
            <!-- ===================================================== -->
            <div class="ia-colab-sensitive">
                ${!podeVerSensivel
          ?
          `<div
                class="ia-colab-lock"
                data-tooltip="
            Você não possui permissão
            para visualizar dados sensíveis.
            "
            >
                \ud83d\udd12
            </div>`
          :
          ""
        }
                <div class="ia-colab-sensitive-title" tooltip="
            Apenas usuários com permissão avançada
            podem visualizar os dados sensíveis.
            ">
                    \ud83d\udee1\ufe0f Dados Protegidos
                </div>
                <div class="ia-colab-sensitive-grid">

                    <div class="ia-colab-item">

                        <div class="ia-colab-label">
                            CPF
                        </div>

                        <div class="ia-colab-value">

                            ${podeVerSensivel
          ? (dados.cpf || "-")
          : "***.***.***-**"
        }
                        </div>

                    </div>

                    <div class="ia-colab-item">

                        <div class="ia-colab-label">
                            RG
                        </div>

                        <div class="ia-colab-value">

                            ${podeVerSensivel
          ? (dados.rg || "-")
          : "********"
        }

                        </div>

                    </div>

                    <div class="ia-colab-item">

                        <div class="ia-colab-label">
                            Telefone
                        </div>

                        <div class="ia-colab-value">

                            ${podeVerSensivel
          ? (dados.telefone || "-")
          : "(**) *****-****"
        }

                        </div>

                    </div>

                    <div class="ia-colab-item">

                        <div class="ia-colab-label">
                            E-mail
                        </div>

                        <div class="ia-colab-value">

                            ${podeVerSensivel
          ? (dados.mail || "-")
          : "*************"
        }

                        </div>

                    </div>

                </div>

            </div>

            <!-- ===================================================== -->
            <!-- DADOS GERAIS -->
            <!-- ===================================================== -->

            <div class="ia-colab-section-title">

                

            </div>

            <div class="ia-colab-grid">

                <div class="ia-colab-item">

                    <div class="ia-colab-label">
                        Empresa
                    </div>

                    <div class="ia-colab-value">
                        ${dados.empresa || "-"}
                    </div>

                </div>

                <div class="ia-colab-item">

                    <div class="ia-colab-label">
                        CNH
                    </div>

                    <div class="ia-colab-value">
                        ${dados.cnh || "-"}
                    </div>

                </div>

                <div class="ia-colab-item">

                    <div class="ia-colab-label">
                        Nascimento (Idade)
                    </div>

                    <div class="ia-colab-value">
                        ${dados.nascimento_idade || "-"}
                    </div>

                </div>

                <div class="ia-colab-item">

                    <div class="ia-colab-label">
                        Sexo
                    </div>

                    <div class="ia-colab-value">
                        ${dados.sexo || "-"}
                    </div>

                </div>

            </div>

            `;

      container.appendChild(card);

    } catch (err) {

      console.error(
        "Erro card colaborador:",
        err
      );

    }

  });

}

async function carregarHallExperiencia() {
  //return; //DESATIVADO por enquanto.
  const resp =
    await fetch(
      "/api/colaboradores/hall-experiencia",
      {
        headers: {
          authorization:
            "Bearer "
            + sessionStorage.getItem("token")
        }
      }
    );

  const lista =
    await resp.json();

  iniciarSlideConquistasManuais(lista);

  const div =
    document.getElementById(
      "hall-ranking"
    );

  div.innerHTML = "";

  lista.forEach((c, index) => {

    div.innerHTML += `

      <div class="
          card-experiencia
          ${index === 0 ? 'top1' : ''}
          ${c.classeCard || ''}
      ">

        <div
          class="foto-progress"
          style="
            --percent:${c.progresso}
          "
        >

          <img
            src="${c.fotoperfil}?v=${c.versao_foto}"
          >

        </div>

        <div class="medalha">

          ${index === 0
        ? "\ud83e\udd47"
        : index === 1
          ? "\ud83e\udd48"
          : index === 2
            ? "\ud83e\udd49"
            : `${index + 1}º`
      }
      
      </div>

        <div class="nome">
          ${c.nome}
        </div>

        <div class="titulo">
          ${c.titulo}
        </div>

        <div class="dias">

          ${c.diasRestantes}
          dias para

          ${c.proximoMarco}
          ${c.proximoMarco === 1 ? 'ano' : 'anos'}

        </div>
        <div class="medalhas">

            ${c.medalhas
        .map(m => `
                  <span
                    class="medalha-item"
                    data-tooltip="${m.titulo}"
                  >
                    ${m.icone}
                  </span>
                `)
        .join('')
      }

        </div>
      </div>
      
    `;

  });
  const hallRanking =
    document.getElementById(
      "hall-ranking"
    );

  let isDown = false;
  let startX;
  let scrollLeft;

  hallRanking.addEventListener(
    "mousedown",
    (e) => {

      isDown = true;

      hallRanking.classList.add(
        "dragging"
      );

      startX =
        e.pageX -
        hallRanking.offsetLeft;

      scrollLeft =
        hallRanking.scrollLeft;

    }
  );

  hallRanking.addEventListener(
    "mouseleave",
    () => {

      isDown = false;

      hallRanking.classList.remove(
        "dragging"
      );

    }
  );

  hallRanking.addEventListener(
    "mouseup",
    () => {

      isDown = false;

      hallRanking.classList.remove(
        "dragging"
      );

    }
  );

  hallRanking.addEventListener(
    "mousemove",
    (e) => {

      if (!isDown)
        return;

      e.preventDefault();

      const x =
        e.pageX -
        hallRanking.offsetLeft;

      const walk =
        (x - startX) * 2;

      hallRanking.scrollLeft =
        scrollLeft - walk;

    }
  );
}

function escaparHtmlHome(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarDataConquistaHome(valor, tipo) {
  const data = dataLocalHome(valor);
  if (!data) return "";

  if (tipo === "DESTAQUE_MES") {
    return data.toLocaleDateString("pt-BR", {
      month: "long"
    }).toUpperCase("pt-BR");
  }

  if (tipo === "DESTAQUE_ANO") {
    return String(data.getFullYear());
  }

  return data.toLocaleDateString("pt-BR");
}

function montarConquistasManuaisHome(colaboradores) {
  if (!Array.isArray(colaboradores)) return [];

  return colaboradores
    .flatMap(colaborador => {
      return String(colaborador?.conquistas || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => {
          const [tipo, data] = item.split("|");
          const meta = CONQUISTAS_MANUAIS_HOME[tipo];

          if (!meta) return null;

          return {
            tipo,
            data,
            dataObj: dataLocalHome(data),
            icone: meta.icone,
            medalha: meta.nome,
            descricao: meta.descricao || "",
            nome: colaborador.nome,
            foto: colaborador.fotoperfil
              ? `${colaborador.fotoperfil}?v=${colaborador.versao_foto || ""}`
              : "/imagens/user-default.webp"
          };
        })
        .filter(Boolean);
    })
    .sort((a, b) => {
      const dataA = a.dataObj ? a.dataObj.getTime() : 0;
      const dataB = b.dataObj ? b.dataObj.getTime() : 0;
      return dataB - dataA;
    });
}

function renderizarSlideConquistaHome(item, posicao, total) {
  const destino = document.getElementById("funcionario-mes-card");
  if (!destino || !item) return;

  destino.className = "funcionario-mes-card funcionario-medalha-slide";
  destino.innerHTML = `
    <div class="funcionario-medalha-icone" aria-hidden="true">${escaparHtmlHome(item.icone)}</div>
    <div class="funcionario-mes-foto">
      <img src="${escaparHtmlHome(item.foto)}" alt="Foto de ${escaparHtmlHome(item.nome)}">
    </div>
    <strong>${escaparHtmlHome(item.nome)}</strong>
    <p>${escaparHtmlHome(item.medalha)}</p>
    <div class="funcionario-medalha-data">
      ${escaparHtmlHome(formatarDataConquistaHome(item.data, item.tipo))}
    </div>
    <div class="funcionario-medalha-descricao">
      ${escaparHtmlHome(item.descricao)}
    </div>
    <div class="funcionario-slide-tempo">
      <div class="funcionario-slide-progresso" aria-label="Tempo para o próximo reconhecimento">
        <span></span>
      </div>
    </div>
  `;
}

function reiniciarTimerSlideReconhecimento() {
  if (reconhecimentoSlideTimer) {
    clearInterval(reconhecimentoSlideTimer);
    reconhecimentoSlideTimer = null;
  }

  if (conquistasSlideHome.length <= 1) return;

  reconhecimentoSlideTimer = setInterval(() => {
    alterarSlideReconhecimento(1, false);
  }, TEMPO_SLIDE_RECONHECIMENTO_MS);
}

function alterarSlideReconhecimento(direcao = 1, reiniciar = true) {
  if (!conquistasSlideHome.length) return;

  conquistaSlideIndiceHome =
    (conquistaSlideIndiceHome + direcao + conquistasSlideHome.length) %
    conquistasSlideHome.length;

  renderizarSlideConquistaHome(
    conquistasSlideHome[conquistaSlideIndiceHome],
    conquistaSlideIndiceHome,
    conquistasSlideHome.length
  );

  if (reiniciar) reiniciarTimerSlideReconhecimento();
}

function iniciarSlideConquistasManuais(colaboradores) {
  const destino = document.getElementById("funcionario-mes-card");
  if (!destino) return;

  aplicarEasterEggTituloConquistas();

  if (reconhecimentoSlideTimer) {
    clearInterval(reconhecimentoSlideTimer);
    reconhecimentoSlideTimer = null;
  }

  conquistasSlideHome = montarConquistasManuaisHome(colaboradores);
  conquistaSlideIndiceHome = 0;

  if (!conquistasSlideHome.length) {
    destino.className = "funcionario-mes-card vazio";
    destino.innerHTML = `
      <div class="funcionario-mes-foto">
        <img src="/imagens/user-default.webp" alt="Reconhecimento">
      </div>
      <strong>Nenhuma medalha encontrada</strong>
      <p>As conquistas adicionadas no perfil aparecem aqui.</p>
    `;
    return;
  }

  renderizarSlideConquistaHome(
    conquistasSlideHome[conquistaSlideIndiceHome],
    conquistaSlideIndiceHome,
    conquistasSlideHome.length
  );

  reiniciarTimerSlideReconhecimento();
}

function dataLocalHome(valor) {
  if (!valor) return null;

  const limpa = String(valor).split("T")[0];
  const [ano, mes, dia] = limpa.split("-").map(Number);

  if (!ano || !mes || !dia) return null;

  return new Date(ano, mes - 1, dia);
}

function obterMesAnteriorHome() {
  const data = new Date();
  data.setDate(1);
  data.setMonth(data.getMonth() - 1);

  return {
    mes: data.getMonth() + 1,
    ano: data.getFullYear(),
    nome: data.toLocaleDateString("pt-BR", { month: "long" })
  };
}

function temDestaqueMesAnterior(colaborador, referencia) {
  return String(colaborador?.conquistas || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .some(item => {
      const [tipo, data] = item.split("|");
      const dataConquista = dataLocalHome(data);

      return tipo === "DESTAQUE_MES"
        && dataConquista
        && dataConquista.getMonth() + 1 === referencia.mes
        && dataConquista.getFullYear() === referencia.ano;
    });
}

function calcularTempoEmpresaHome(dataEntrada) {
  const entrada = dataLocalHome(dataEntrada);
  if (!entrada) return "Tempo de empresa não informado";

  const hoje = new Date();
  let anos = hoje.getFullYear() - entrada.getFullYear();
  let meses = hoje.getMonth() - entrada.getMonth();

  if (hoje.getDate() < entrada.getDate()) meses -= 1;

  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }

  const partes = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? "mês" : "meses"}`);

  return partes.length
    ? `${partes.join(" e ")} de empresa`
    : "Menos de 1 mês de empresa";
}

function renderizarFuncionarioMesVazio(referencia) {
  const destino = document.getElementById("funcionario-mes-card");
  if (!destino) return;

  destino.className = "funcionario-mes-card vazio";
  destino.innerHTML = `
    <div class="funcionario-mes-foto">
      <img src="/imagens/user-default.webp" alt="Funcionário do mês">
    </div>
    <strong>Nenhum destaque encontrado</strong>
    <p>Sem registro para ${escaparHtmlHome(referencia.nome)}/${referencia.ano}.</p>
  `;
}

async function carregarFuncionarioMesAnterior() {
  const destino = document.getElementById("funcionario-mes-card");
  if (!destino) return;

  const referencia = obterMesAnteriorHome();

  try {
    const resp = await fetch("/api/colaboradores/hall-experiencia", {
      headers: { authorization: "Bearer " + sessionStorage.getItem("token") }
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const colaboradores = await resp.json();
    const destaque = Array.isArray(colaboradores)
      ? colaboradores.find(colab => temDestaqueMesAnterior(colab, referencia))
      : null;

    if (!destaque) {
      renderizarFuncionarioMesVazio(referencia);
      return;
    }

    const foto = destaque.fotoperfil
      ? `${destaque.fotoperfil}?v=${destaque.versao_foto || ""}`
      : "/imagens/user-default.webp";

    destino.className = "funcionario-mes-card";
    destino.innerHTML = `
      <div class="funcionario-mes-foto">
        <img src="${escaparHtmlHome(foto)}" alt="Foto de ${escaparHtmlHome(destaque.nome)}">
      </div>
      <strong>${escaparHtmlHome(destaque.nome)}</strong>
      <span class="funcionario-mes-tempo">
        ${escaparHtmlHome(calcularTempoEmpresaHome(destaque.data_experiencia || destaque.data_admissao))}
      </span>
    `;
  } catch (err) {
    console.warn("Erro ao carregar funcionário do mês anterior:", err);
    renderizarFuncionarioMesVazio(referencia);
  }
}

