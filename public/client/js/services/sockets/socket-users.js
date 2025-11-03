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

  renderUsuariosOnline();
}

/**
 * Reaplica a última lista no DOM (se existir o container)
 * Útil quando a tela "Programação" é aberta depois da conexão
 */
export function renderUsuariosOnline() {
  const texto =
    ultimaListaUsuarios.length > 0
      ? ultimaListaUsuarios.join(", ")
      : "Nenhum usuário";

  const $lista = $("#lista_usuarios_online");
  $("#status").text('Conectado');
  $(".fa-server").css("color", 'green');
  if ($lista.length === 0) {
    return;
  }

  $lista.text(texto);
}
