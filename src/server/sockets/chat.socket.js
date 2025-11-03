// src/server/sockets/chat.socket.js
function initChatSocket(wss) {
  wss.on('connection', (ws) => {
    console.log('💬 Cliente conectado ao socket de chat');

    ws.on('message', (msg) => {
      const data = JSON.parse(msg);

      if (data.acao === 'mensagem_chat') {
        console.log(`📩 Mensagem no chat: ${data.texto}`);

        // reenvia para todos os clientes conectados
        wss.clients.forEach((cliente) => {
          if (cliente.readyState === ws.OPEN) {
            cliente.send(JSON.stringify({
              acao: 'mensagem_chat',
              usuario: data.usuario,
              texto: data.texto,
              hora: new Date().toLocaleTimeString()
            }));
          }
        });
      }
    });

    ws.on('close', () => {
      console.log('❌ Cliente saiu do chat');
    });
  });
}

module.exports = initChatSocket;
