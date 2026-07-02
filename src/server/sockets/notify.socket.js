// src/server/sockets/notify.socket.js
const WebSocket = require("ws");

function initNotifySocket(wss) {
  wss.on('connection', (ws) => {
    console.log('Cliente conectado no socket de notificações');
    
    ws.on('message', (msg) => {
      let data;

      try {
        data = JSON.parse(msg);
      } catch (err) {
        console.warn("Mensagem WS invalida ignorada no socket de notificacoes.");
        return;
      }

      if (data.acao === 'notificacao') {
        console.log('🔔 Nova notificação recebida:', data);
        // reenvia para todos os clientes
        wss.clients.forEach((cliente) => {
          if (cliente.readyState === WebSocket.OPEN) {
            cliente.send(JSON.stringify({
              acao: 'notificacao',
              mensagem: data.mensagem || 'Notificação recebida'
            }));
          }
        });
      }
    });

    ws.on('close', () => {
      console.log('Cliente saiu do socket de notificações');
    });
  });
}

module.exports = initNotifySocket;
