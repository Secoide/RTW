import { aplicarPermissoesMenu_porRoles } from "../state/role.js";
import { initAbrirInfoColabClick } from "../events/click/handle-abrir-info-colab.js";
import "../events/click/handle-atestados.js";
import { initColaboradoresContextMenu } from "../events/contextmenu/handle-colaboradores-contextmenu.js";
import { conectarSocket } from "../services/sockets/socket-service.js";
import { carregarAniversariantes } from "../services/api/aniversariantes.js";
import { reduzirNome } from "../utils/formatters/strings-format.js";

import { initSantaDropWalkWrapper } from "../services/ui/christmas-painel-inicio.js";

// =======================================================
// VARIÁVEIS GLOBAIS
// =======================================================
let avisoIconeSelecionado = "📄";
let avisoEditandoId = null;

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
async function carregarAvisos() {

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
                        <span class="btn-editar" title="Editar" style="font-size:11px;" data-id="${item.id}">✏️</span>
                        <span class="btn-excluir" title="Apagar" style="font-size:11px;" data-id="${item.id}">🗑️</span>
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

  const socket = conectarSocket();
  initColaboradoresContextMenu(socket);

  // Aguarda menu
  await fetch("menu.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menu").innerHTML = html;
      aplicarPermissoesMenu_porRoles();
    });

  // Aguarda menu perfil
  await fetch("menuPerfil.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("menuperfil").innerHTML = html;
      document.getElementById("bt_perfilhome").innerText = sessionStorage.getItem("nome_usuario");
      initAbrirInfoColabClick();
    });

  // Só agora DOM está completo
  await carregarAniversariantes();
  await carregarAvisos();

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
