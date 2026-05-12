// /public/client/js/services/sockets/programacao-socket.js
import { getSocket } from "./socket-service.js";

let socket = null;

export function initProgramacaoSocket() {
  const socket = getSocket();
  if (!socket) return;
  socket.addEventListener("open", () => {
    console.log("🔌 WebSocket Programação conectado");
  });

  socket.addEventListener("close", () => {
    console.warn("⚠️ WS desconectado");

    // Evita reconectar se já houver tentativa pendente
    if (socket._reconnecting) return;
    socket._reconnecting = true;

    setTimeout(() => {
      socket._reconnecting = false;
      // limpa referência antes de criar novo
      socket = null;
      initProgramacaoSocket();
    }, 5000);
  });


  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      handleSocketMessage(data);
    } catch (err) {
      console.error("❌ Erro ao processar mensagem WS:", err);
    }
  });
}

export function getSocket() {
  return socket;
}

// =======================
// Emitir ações de programação
// =======================
export function enviarAlocarColaborador(osID, nomes, dataDia) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Sem conexão com servidor. Tente novamente.");
    return;
  }
  socket.send(JSON.stringify({ acao: "alocar_colaborador", osID, nomes, data: dataDia }));
}

export function enviarRemoverColaborador(osID, id, dataDia) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Sem conexão com servidor. Tente novamente.");
    return;
  }
  socket.send(JSON.stringify({ acao: "remover_colaborador", osID, id, data: dataDia }));
}

export function enviarAtualizarPrioridade(osID, prioridade) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Sem conexão com servidor. Tente novamente.");
    return;
  }
  socket.send(JSON.stringify({ acao: "atualizar_prioridade_os", osID, prioridade }));
}

export function enviarMudarStatusDia(dia, statuss) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Sem conexão com servidor. Tente novamente.");
    return;
  }
  console.log("➡️ ENVIANDO mudar_statusProgDia", { dia, statuss });
  socket.send(JSON.stringify({ acao: "mudar_statusProgDia", dia, statuss }));
}


// =======================
// Receber ações de programação
// =======================
function handleSocketMessage(data) {
  switch (data.acao) {
    case "alocar_colaborador":
      console.log("👷 Novo colaborador alocado:", data);
      break;

    case "remover_colaborador":
      console.log("❌ Colaborador removido:", data);
      break;

    case "atualizar_prioridade_os":
      console.log("⚡ Prioridade OS atualizada:", data);
      break;

    case "mudar_statusProgDia":
      console.log("📅 Status do dia alterado:", data);
      break;

    case "notificacao":
      console.log("🔔 Notificação recebida:", data);
      break;

    default:
      console.warn("Mensagem WS não tratada:", data);
  }
}
