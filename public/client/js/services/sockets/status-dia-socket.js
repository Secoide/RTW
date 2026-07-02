import { getSocket } from "./socket-service.js";

const pendentesStatusDia = new Map();

function gerarRequestId() {
  return `status-dia-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function registrarResultadoStatusProgDia(data) {
  const requestId = data?.requestId;
  if (!requestId || !pendentesStatusDia.has(requestId)) return false;

  const pendente = pendentesStatusDia.get(requestId);
  clearTimeout(pendente.timeout);
  pendentesStatusDia.delete(requestId);

  if (data.sucesso === false) {
    pendente.reject(new Error(data.mensagem || "Não foi possível salvar o status do dia."));
    return true;
  }

  pendente.resolve(data);
  return true;
}

export function alterarStatusProgDia(iconeClick, status) {
  const painelDia = iconeClick.closest(".painelDia");
  const dataOrigem = painelDia.attr("data-dia");
  const socket = getSocket();

  if (!dataOrigem) {
    return Promise.reject(new Error("Dia da programação não encontrado."));
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error("Conexão em tempo real indisponível. Tente novamente em instantes."));
  }

  const requestId = gerarRequestId();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendentesStatusDia.delete(requestId);
      reject(new Error("Tempo esgotado aguardando confirmação do servidor."));
    }, 8000);

    pendentesStatusDia.set(requestId, { resolve, reject, timeout });

    socket.send(JSON.stringify({
      acao: "mudar_statusProgDia",
      dia: dataOrigem,
      statuss: status,
      origem: "local",
      requestId
    }));
  });
}
