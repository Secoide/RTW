export function emitirStatusProgDia(wss, dia, statuss, remetenteWs = null) {
  const payload = {
    acao: "mudar_statusProgDia",
    dia,
    statuss,
    origem: "server",
    notificacao: `Programação de ${dia} liberada para lançamento!`,
  };

  console.log("📤 [emitirStatusProgDia] broadcast iniciado", new Date().toISOString());

  wss.clients.forEach((cliente) => {
    // 🔹 Envia para todos os clientes conectados, exceto o que enviou a ação
    if (cliente !== remetenteWs && cliente.readyState === WebSocket.OPEN) {
      cliente.send(JSON.stringify(payload));
    }
  });
}
