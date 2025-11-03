// /public/client/js/services/sockets/socket-service.js
import { handleSocketMessage } from "./socket-dispatcher.js";

let socket = null;
let usuarioAtual = null; // 🔹 guarda o nome do usuário para reenvio automático

function getWebSocketURL() {
  const protocol = location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${location.host}`;
}

export function conectarSocket(nomeUsuario) {
  // 🔹 se for passado um nome novo, atualiza o cache
  if (nomeUsuario) usuarioAtual = nomeUsuario;

  // 🔹 se já há socket conectado ou em conexão, apenas reutiliza
  if (socket && socket.readyState <= 1) {
    // Se já estiver aberto e o usuário foi definido depois (ex: pós-login), reenviar
    if (socket.readyState === WebSocket.OPEN && usuarioAtual) {
      socket.send(JSON.stringify({ acao: "usuario_online", nome: usuarioAtual }));
    }
    return socket;
  }

  // 🔹 cria a conexão nova
  const url = getWebSocketURL();
  socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    console.log("🟢 WebSocket conectado!");
    if (usuarioAtual) {
      socket.send(JSON.stringify({ acao: "usuario_online", nome: usuarioAtual }));
    }
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      handleSocketMessage(data, socket);
    } catch (err) {
      console.error("❌ Erro ao processar mensagem WS:", err);
    }
  });

  socket.addEventListener("close", () => {
    console.warn("⚠️ WebSocket desconectado");
  });

  socket.addEventListener("error", (err) => {
    console.error("❌ Erro no WebSocket:", err);
  });

  return socket;
}

export function getSocket() {
  if (!socket || socket.readyState > 1) {
    console.warn("⚠️ Socket não inicializado. Chamando conectarSocket().");
    conectarSocket();
  }
  return socket;
}
