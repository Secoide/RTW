// src/server/sockets/chat.socket.js
const WebSocket = require("ws");

function initChatSocket(wss) {
  wss.on("connection", (ws) => {
    console.log("Cliente conectado ao socket de chat");

    ws.on("message", (msg) => {
      let data;

      try {
        data = JSON.parse(msg);
      } catch {
        return;
      }

      if (data.acao !== "mensagem_chat") return;

      const texto = String(data.texto || "").trim();
      if (!texto) return;

      const payload = {
        acao: "mensagem_chat",
        usuario: data.usuario || ws.usuario || "Usuario",
        texto: texto.slice(0, 300),
        hora: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      wss.clients.forEach((cliente) => {
        if (cliente.readyState === WebSocket.OPEN) {
          cliente.send(JSON.stringify(payload));
        }
      });
    });

    ws.on("close", () => {
      console.log("Cliente saiu do chat");
    });
  });
}

module.exports = initChatSocket;
