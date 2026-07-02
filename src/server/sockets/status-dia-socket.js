function formatarDataBR(dataIso) {
  const [ano, mes, dia] = String(dataIso).split("-");
  return `${dia}/${mes}/${ano}`;
}

function criarMensagemStatusDia(dia, statuss) {
  const diaFormatado = formatarDataBR(dia);
  return Number(statuss) === 1
    ? `Programação de ${diaFormatado} lançada.`
    : `Programação de ${diaFormatado} reaberta para ajustes.`;
}

function emitirStatusProgDia(wss, dia, statuss, remetenteWs = null) {
  const payload = {
    acao: "mudar_statusProgDia",
    dia,
    statuss,
    origem: "server",
    notificacao: criarMensagemStatusDia(dia, statuss)
  };

  console.log("[emitirStatusProgDia] broadcast iniciado", new Date().toISOString());

  wss.clients.forEach((cliente) => {
    if (cliente !== remetenteWs && cliente.readyState === 1) {
      cliente.send(JSON.stringify(payload));
    }
  });
}

module.exports = { emitirStatusProgDia, criarMensagemStatusDia };
