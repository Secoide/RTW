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

// inicializa sockets 
const initSockets = require('./src/server/sockets');
initSockets(wss);

// sobe servidor
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
