// /public/client/js/services/sockets/socket-users.js
import { reduzirNome } from "../../utils/formatters/strings-format.js";


let ultimaListaUsuarios = []; // mantém a última lista recebida

export function enviarUsuarioOnline(socket, nome) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ acao: "usuario_online", nome }));
  }
}

export function enviarLogout(socket) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ acao: "logout" }));
  }
}

export function atualizarUsuariosOnline({ usuarios }) {

  ultimaListaUsuarios = (usuarios || [])
    .filter((u) => u !== "Administrador")
    .map((u) => reduzirNome(u)); // 👈 reduz cada nome

}

let usuariosAtuais = [];

export function atualizarListaOnline(lista) {
  const container = document.getElementById("online-list");
  const badge = document.getElementById("online-count");
  if (!container && !badge) {
    return;
  }

  // Detecta novos usuários
  const novos = lista.filter(u => !usuariosAtuais.includes(u));

  container.innerHTML = "";

  lista.forEach(nome => {
    if (nome === "Administrador") return;
    const div = document.createElement("div");
    div.className = "online-user";
    div.textContent = "🟢 " + nome;
    container.appendChild(div);
  });

  badge.textContent = lista.length;

  // Se alguém entrou
  if (novos.length > 0) {
    mostrarPopupEntrada(novos[0]);
  }

  usuariosAtuais = lista;
}

function mostrarPopupEntrada(nome) {

  if (painelEstaAberto()) return; // 👈 não mostra se painel estiver aberto

  const popup = document.getElementById("online-popup");
  if (nome === localStorage.getItem("nome_usuario")) return;
  popup.textContent = `🟢 ${nome} entrou no sistema`;
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
  }, 5000);
}
 
function painelEstaAberto() {
  const panel = document.getElementById("online-panel");
  return panel.style.display === "flex";
}


