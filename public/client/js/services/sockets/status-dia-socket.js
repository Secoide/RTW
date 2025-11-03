import { getSocket } from "./socket-service.js";

export function alterarStatusProgDia(iconeClick, status) {
  const painelDia = iconeClick.closest('.painelDia');
  const dataOrigem = painelDia.attr('data-dia');
  const socket = getSocket();

  if (socket && socket.readyState === WebSocket.OPEN) {
    const payload = {
      acao: 'mudar_statusProgDia',
      dia: dataOrigem,
      statuss: status,
      origem: 'local' // 👈 marca a origem local
    };
    socket.send(JSON.stringify(payload));
  }
}
