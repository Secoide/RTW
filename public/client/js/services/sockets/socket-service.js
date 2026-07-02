// /public/client/js/services/sockets/socket-service.js
import { handleSocketMessage } from "./socket-dispatcher.js";
let ultimoPong = Date.now();


let socket = null;
let usuarioAtual = null;
let reconnectTimeout = null;
let tentativas = 0;
const MAX_TENTATIVAS = 5;
let fechamentoManual = false;

let estado = "offline";
// offline | connecting | connected

function getWebSocketURL() {
  const protocol = location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${location.host}`;
}

function criarSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  fechamentoManual = false;

  if (socket) {
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
  }
  estado = "connecting";
  const url = getWebSocketURL();
  socket = new WebSocket(url);
  window.rtwSocket = socket;

  socket.addEventListener("open", () => {

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    tentativas = 0;
    estado = "connected";

    document.dispatchEvent(new Event("ws:connected")); // 🔥 ESSENCIAL

    if (usuarioAtual) {
      socket.send(JSON.stringify({
        acao: "usuario_online",
        nome: usuarioAtual
      }));
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
    estado = "offline";

    if (fechamentoManual) {
      return;
    }

    document.dispatchEvent(new Event("ws:disconnected"));
    tentarReconectar();
  });

  socket.addEventListener("error", (err) => {
    estado = "offline";
    console.warn("⚠️ Falha ao conectar com o servidor.");
    document.dispatchEvent(new Event("ws:disconnected"));

    if (socket) socket.close();
  });
}


function tentarReconectar() {

  if (reconnectTimeout) return; // 🔥 impede múltiplos timers

  if (tentativas >= MAX_TENTATIVAS) {
    document.dispatchEvent(new Event("ws:reconnect_failed"));
    return;
  }

  tentativas++;

  const delay = Math.min(5000 * tentativas, 15000);

  document.dispatchEvent(
    new CustomEvent("ws:reconnecting", {
      detail: { tentativa: tentativas }
    })
  );

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null; // 🔥 limpa antes de tentar
    criarSocket();
  }, delay);
}

export function conectarSocket(nomeUsuario) {
  if (nomeUsuario) usuarioAtual = nomeUsuario;
  fechamentoManual = false;

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  criarSocket();
  return socket;
}

export function getSocket() {
  return socket;
}

export function fecharSocket() {
  fechamentoManual = true;
  usuarioAtual = null;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ acao: "logout" }));
    }

    socket.close();
    socket = null;
  }

  window.rtwSocket = null;
  document.dispatchEvent(new Event("chat-online:limpar"));
}

window.fecharSocketTempoReal = fecharSocket;

window.addEventListener("offline", () => {
  console.warn("🌐 Internet perdida");
  document.dispatchEvent(new Event("ws:disconnected"));

  if (socket) socket.close();
});

window.addEventListener("online", () => {
  console.warn("🌐 Internet restaurada");

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  tentativas = 0;
  estado = "offline";

  criarSocket();
});
