//nodemon server.js


// server.js
const http = require('http');
const WebSocket = require('ws');

// importa app (Express configurado com middlewares e rotas)
const app = require('./src/server/app');
const { port } = require('./src/server/config/env'); // importa do env.js

// cria servidor HTTP
const server = http.createServer(app);

// cria servidor WS
const wss = new WebSocket.Server({ server });

// 🔁 HEARTBEAT TCP (infraestrutura)
function heartbeat() {
  this.isAlive = true;
}

wss.on("connection", function (ws) {

  ws.isAlive = true;

  
  ws.on("pong", heartbeat);

  // 🔁 Protocolo JSON ping/pong
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.acao === "ping") {
      ws.send(JSON.stringify({ acao: "pong" }));
    }
  });

});


const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("❌ Cliente removido por timeout");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});



// inicializa sockets 
const initSockets = require('./src/server/sockets');
initSockets(wss);

// sobe servidor
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
