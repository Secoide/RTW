import { initAbrirInfoColabClick } from "../events/click/handle-abrir-info-colab.js";
import "../events/click/handle-atestados.js";
import { initColaboradoresContextMenu } from "../events/contextmenu/handle-colaboradores-contextmenu.js";
import { getSocket } from "../services/sockets/socket-service.js";
import { carregarAniversariantes } from "../services/api/aniversariantes.js";
import { reduzirNome } from "../utils/formatters/strings-format.js";

import { } from "../services/sockets/reconnect-service.js";
import { initSantaDropWalkWrapper } from "../services/ui/christmas-painel-inicio.js";
import { observarPermissoesPorRoles } from "../state/role.js";

// =======================================================
// VARIÁVEIS GLOBAIS
// =======================================================
let avisoIconeSelecionado = "📄";
let avisoEditandoId = null;

let nomeUsuario = sessionStorage.getItem("nome_usuario");

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
    { nome: "diretoria", destino: ".panel-diretoria" },
    { nome: "seguranca", destino: ".panel-seguranca" }
  ];

  for (const cat of categorias) {
    try {
      const resp = await fetch(`/api/comunicados/${cat.nome}`, {
        headers: { "authorization": "Bearer " + sessionStorage.getItem("token") }
      });

      const lista = await resp.json();
      const el = document.querySelector(cat.destino);
      el.innerHTML = "";

      lista.forEach(item => {

        // 🔐 PERMISSÃO
        const podeEditarOuExcluir =
          usuarioId == item.criado_por ||
          usuarioNivel == 5 ||
          usuarioNivel == 99;
        el.innerHTML += `
          <div class="item-comunicado ${cat.nome}">
              <div class="item-icon">${item.icone || "📄"}</div>

              <div style="width:100%;">
                  <div class="item-titulo">${item.titulo}</div>
                  <div class="item-texto">${item.texto}</div>

                  <div class="painel-acoes">
                      
                      <!-- Botões (apenas se tiver permissão) -->
                      <div style="${!podeEditarOuExcluir ? 'display:none;' : ''}">
                        <span class="btn-editar" title="Editar" data-id="${item.id}">✏️</span>
                        <span class="btn-excluir" title="Apagar" data-id="${item.id}">🗑️</span>
                      </div>

                      <!-- Criado por -->
                      <p style="opacity: 0.7; font-size: 9px; text-align:right; margin:0;">
                        ${reduzirNome(item.criado_por_nome) || "Desconhecido"} —
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

    lista.forEach(item => {

      const agendaFormatada = item.agenda.replace(/\n/g, "<br>");

      el.innerHTML += `
        <div class="item-comunicado exame">
            <div class="item-icon">🩺</div>

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
    });

  carregarFotoPerfil();
  // Só agora DOM está completo
  await carregarAniversariantes();
  await carregarAvisos();
  await carregarHallExperiencia();
  initSantaDropWalkWrapper();
  // ==========================================
  // SELEÇÃO DE ÍCONES → AGORA FUNCIONA
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

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

    // limpa estado local
    //localStorage.clear();
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

  // ============================================================
  // ABRIR / FECHAR ONLINE
  // ============================================================

  btn.onclick = () => {

    panel.classList.toggle("active");

    // Move IA junto

    if (panel.classList.contains("active")) {

      onlineWidget.classList.add("open-ia-space");

    } else {

      onlineWidget.classList.remove("open-ia-space");

    }

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
  // CHAT IA RTW
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

      "🔎 Consultando sistema",
      "📂 Buscando informações",
      "🤖 Processando consulta",
      "📡 Verificando programação",
      "🧠 Cruzando dados operacionais",
      "📑 Lendo OS cadastradas",
      "👷 Procurando colaboradores",
      "⚡ Consultando programação da equipe",
      "📋 Organizando informações",
      "🔧 Sincronizando dados da engenharia",
      "🛰️ Acessando banco operacional",
      "📊 Analisando produtividade",
      "🛠️ Verificando disponibilidade",
      "🏭 Consultando empresas vinculadas",
      "📅 Validando programação do dia",
      "🧾 Gerando resposta operacional"

    ];

    // ============================================================
    // FRASES ENGRAÇADAS
    // ============================================================

    const mensagensEngracadas = [

      "☕ O eletricista foi tomar café... buscando ele",
      "🔦 Procurando colaborador com lanterna",
      "⚠️ Tentando entender a letra da OS",
      "🧰 Conferindo quem pegou as ferramentas",
      "🚧 Desviando dos cones da obra",
      "🔌 Reconectando neurônios da IA",
      "🧠 Perguntando pro estagiário",
      "🪫 IA com baixa bateria emocional"

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
        "❌ Erro ao consultar IA.",
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
      /^\s*[*•-]\s+(.*)$/gm,
      `<div class="ia-list-item">• $1</div>`
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
  icone = "💡"
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
🧠 Central IA Operacional
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
    alert('ID do colaborador não encontrado!');
    return reject("ID não encontrado");
  }

  $.ajax({
    url: `/api/colaboradores/${id}`,
    type: 'GET',
    contentType: 'application/json',

    success: function (res) {
      const dados = res;

      if (!dados || !dados.id) {
        alert("Colaborador não encontrado.");
        return reject("Colaborador não encontrado");
      }
      const fotoURL = dados.fotoperfil + "?v=" + dados.versao_foto;

      if (fotoURL && fotoURL.startsWith("http")) {
        $('#fotoavatarPerfil').attr('src', fotoURL);
      } else {
        $('#fotoavatarPerfil').attr('src', '/imagens/user-default.webp');
      }

      $('#fotoavatarPerfil').on('error', function () {
        console.warn("⚠️ Foto do perfil não encontrada. Carregando padrão.");
        $(this).attr('src', '/imagens/user-default.webp');
      });
    },

    error: function (err) {
      alert('Erro ao logar. Tente novamente.');
      reject(err);
    }
  });
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
        || "👤";

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
                🔒
            </div>`
          :
          ""
        }
                <div class="ia-colab-sensitive-title" tooltip="
            Apenas usuários com permissão avançada
            podem visualizar os dados sensíveis.
            ">
                    🛡️ Dados Protegidos
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
        ? "🥇"
        : index === 1
          ? "🥈"
          : index === 2
            ? "🥉"
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