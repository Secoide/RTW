// src/server/sockets/usuarios.socket.js
const WebSocket = require("ws");

const usuariosConectados = new Map();

/**
 * Manda para todos os clientes conectados a lista de usuários online
 */
function atualizarTodosUsuariosOnline(wss) {
  const nomes = [...new Set(usuariosConectados.values())].sort();

  wss.clients.forEach((cliente) => {
    if (cliente.readyState === WebSocket.OPEN) {
      cliente.send(
        JSON.stringify({
          acao: "atualizar_usuarios_online",
          usuarios: nomes,
        })
      );
    }
  });
}

/**
 * Registra o socket de usuários online
 */



const usuariosOnline = new Map();

function initUsuariosSocket(wss) {
  wss.on("connection", (ws) => {
    console.log("👤 Cliente conectado ao socket de usuários");

    ws.on("message", (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch {
        return;
      }

      if (data.acao === "usuario_online" && data.nome) {
        usuariosConectados.set(ws, data.nome);
        atualizarTodosUsuariosOnline(wss);
        ws.usuario = data.nome;
        usuariosOnline.set(data.nome, ws);
        broadcastUsuarios(wss);
      }
    });

    ws.on("close", () => {
      usuariosConectados.delete(ws);
      atualizarTodosUsuariosOnline(wss);
      usuariosOnline.delete(ws.usuario);
        broadcastUsuarios(wss);
    });
  });
}

function broadcastUsuarios(wss) {

  const lista = Array
    .from(usuariosOnline.keys())
    .filter(nome => nome !== "Administrador");

  wss.clients.forEach(cliente => {
    if (cliente.readyState === 1) {
      cliente.send(JSON.stringify({
        acao: "usuarios_online",
        lista
      }));
    }
  });
}




module.exports = initUsuariosSocket;
