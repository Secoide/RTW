const { initColaboradoresSocket } = require("./colaboradores.socket");
const initNotifySocket = require("./notify.socket");
const initChatSocket = require("./chat.socket");
const initUsuariosSocket = require("./usuarios.socket");

function initSockets(wss) {  
  initColaboradoresSocket(wss);
  initNotifySocket(wss);
  initChatSocket(wss);
  initUsuariosSocket(wss); // 👈 adiciona usuários online
}

module.exports = initSockets;
