// src/server/sockets/chat.socket.js
const WebSocket = require("ws");
const { randomUUID } = require("crypto");
const REACOES_CHAT = new Set(["👍", "✅", "👀", ""]);

function enviar(cliente, payload) {
  if (cliente?.readyState === WebSocket.OPEN) {
    cliente.send(JSON.stringify(payload));
  }
}

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

      if (!data || typeof data !== "object") return;

      if (data.acao === "reacao_chat") {
        if (typeof data.mensagemId !== "string" || data.mensagemId.length > 100
          || !REACOES_CHAT.has(data.reacao) || !ws.usuario) return;

        const privado = data.tipo === "privado";
        if (privado && ws.usuario !== data.usuario && ws.usuario !== data.destinatario) return;

        const reacao = {
          acao: "reacao_chat",
          mensagemId: data.mensagemId,
          reacao: data.reacao
        };
        wss.clients.forEach((cliente) => {
          if (!privado || cliente.usuario === data.usuario || cliente.usuario === data.destinatario) {
            enviar(cliente, reacao);
          }
        });
        return;
      }

      if (data.acao !== "mensagem_chat") return;

      const texto = String(data.texto || "").trim();
      if (!texto) return;

      const tipo = data.tipo === "privado" ? "privado" : "global";
      const usuario = data.usuario || ws.usuario || "Usuario";
      const destinatario = String(data.destinatario || "").trim();

      const payload = {
        acao: "mensagem_chat",
        mensagemId: randomUUID(),
        criadoEm: Date.now(),
        tipo,
        usuario,
        destinatario: tipo === "privado" ? destinatario : "",
        texto: texto.slice(0, 300),
        hora: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      if (tipo === "privado") {
        if (!destinatario) {
          enviar(ws, {
            acao: "erro_chat",
            mensagem: "Selecione um usuario online para enviar mensagem privada."
          });
          return;
        }

        let entregou = false;

        wss.clients.forEach((cliente) => {
          if (cliente === ws || cliente.usuario === destinatario) {
            enviar(cliente, payload);
            if (cliente.usuario === destinatario) entregou = true;
          }
        });

        if (!entregou) {
          enviar(ws, {
            acao: "erro_chat",
            mensagem: `${destinatario} nao esta mais online.`
          });
        }

        return;
      }

      wss.clients.forEach((cliente) => enviar(cliente, payload));
    });

    ws.on("close", () => {
      console.log("Cliente saiu do chat");
    });
  });
}

module.exports = initChatSocket;
