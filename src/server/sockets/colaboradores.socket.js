// ======================================================
// 📡 colaboradores.socket.js
// ======================================================

const WebSocket = require("ws");
const connection = require("../config/db");
const ColaboradoresService = require("../services/colaboradores.service");
const { emitirStatusProgDia } = require("./status-dia-socket.js");

// ======================================================
// 🔌 Inicialização do WebSocket
// ======================================================

function initColaboradoresSocket(wss) {
  wss.on("connection", (ws) => {
    console.log("👷 Cliente conectado no socket de colaboradores");

    ws.on("message", async (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch (err) {
        console.error("❌ Erro ao parsear mensagem:", msg);
        return;
      }

      switch (data.acao) {
        // ======================================================
        // 👷 COLABORADORES
        // ======================================================
        case "alocar_colaborador":
          await handleAlocarColaborador(wss, ws, data);
          break;

        case "remover_colaborador":
          await handleRemoverColaborador(wss, ws, data);
          break;

        case "confirmar_alocacao":
          await handleConfirmarAlocacao(wss, ws, data);
          break;

        case "excluir_colaboradorEmOS":
          await handleExcluirColaborador(wss, ws, data);
          break;

        // ======================================================
        // 🔁 PRIORIDADE OS
        // ======================================================
        case "atualizar_prioridade_os":
          await handleAtualizarPrioridadeOS(wss, ws, data);
          break;

        // ======================================================
        // 🔄 TRANSFERÊNCIAS
        // ======================================================
        case "transferir_colaboradores":
          await handleTransferirColaboradores(wss, ws, data);
          break;

        // ======================================================
        // 📅 STATUS DIA PROGRAMAÇÃO
        // ======================================================
        case "mudar_statusProgDia":
          await handleMudarStatusProgDia(wss, ws, data);
          break;

        // ======================================================
        // ⚠️ AÇÃO DESCONHECIDA
        // ======================================================
        default:
          console.warn("⚠️ Ação desconhecida em colaboradores.socket:", data.acao);
      }
    });

    ws.on("close", () => {
      console.log("👋 Cliente desconectado do socket de colaboradores");
    });
  });
}

// ======================================================
// 🧩 HANDLERS
// ======================================================
// ======================================================
// 🧩 HANDLER: ALOCAR COLABORADOR (com status de integração)
// ======================================================
async function handleAlocarColaborador(wss, ws, { osID, dataDia, nomes }) {
  try {
    const confirmacoes = await ColaboradoresService.alocarColaboradores(osID, dataDia, nomes);

    // broadcast básico
    broadcast(wss, ws, { acao: "alocar_colaborador", osID, dataDia, nomes });

    for (const { idNaOS, idfuncionario, id } of confirmacoes) {
      const idColab = idfuncionario || id;
      if (!idNaOS || !idColab) continue;

      const status_integracao = await ColaboradoresService.buscarStatusIntegracao(
        idColab,
        osID,
        dataDia
      );

      
      const payload = {
        acao: "confirmar_alocacao",
        osID,
        idfuncionario: idColab,
        idNaOS,
        status_integracao: status_integracao || "",
        dataDia // 🔥 ESSENCIAL
      };

      // envia para todos (inclusive quem enviou)
      wss.clients.forEach(cliente => {
        if (cliente.readyState === WebSocket.OPEN) {
          cliente.send(JSON.stringify(payload));
        }
      });
    }

  } catch (err) {
    sendError(ws, "Falha ao alocar colaborador", err);
  }
}



async function handleRemoverColaborador(wss, ws, { osID, id, dataDia }) {
  try {
    broadcast(wss, ws, { acao: "remover_colaborador", osID, id, dataDia });
  } catch (err) {
    sendError(ws, "Falha ao remover colaborador", err);
  }
}

async function handleConfirmarAlocacao(wss, ws, { osID, nome, idNaOS }) {
  try {
    broadcast(wss, ws, { acao: "confirmar_alocacao", osID, nome, idNaOS });
  } catch (err) {
    sendError(ws, "Falha ao confirmar alocação", err);
  }
}

async function handleExcluirColaborador(wss, ws, { osID, id, idNaOS, dataDia }) {
  try {
    await ColaboradoresService.excluirColaboradorEmOS(osID, id, idNaOS);
    broadcast(wss, ws, { acao: "remover_colaborador", osID, id, dataDia });
  } catch (err) {
    sendError(ws, "Falha ao excluir colaborador", err);
  }
}

async function handleTransferirColaboradores(wss, ws, { colaboradores, datas }) {
  try {
    for (const dia of datas) {
      for (const { idColab, idOS, nome } of colaboradores) {
        await ColaboradoresService.alocarColaboradores(idOS, dia, [{ id: idColab, nome }]);
      }
    }

    const payload = {
      acao: "transferencia_concluida",
      colaboradores, // [{ idColab, idOS, nome }]
      datas          // ["2025-09-30", "2025-10-01"]
    };

    // Inclui o remetente no broadcast
    wss.clients.forEach((cliente) => {
      if (cliente.readyState === WebSocket.OPEN) {
        cliente.send(JSON.stringify(payload));
      }
    });
  } catch (err) {
    sendError(ws, "Falha ao transferir colaboradores", err);
  }
}

async function handleMudarStatusProgDia(wss, ws, { statuss, dia }) {
  if (!dia || statuss === undefined) return;

  const sqlInsert = `
    INSERT INTO tb_programacaostatus (datadia, statuss)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE statuss = VALUES(statuss);
  `;

  try {
    await connection.query(sqlInsert, [dia, statuss]);
    emitirStatusProgDia(wss, dia, statuss, ws);
  } catch (err) {
    sendError(ws, `Erro ao alterar status do dia ${dia}`, err);
  }
}

async function handleAtualizarPrioridadeOS(wss, ws, { osID, prioridade }) {
  if (!osID) return;

  try {
    broadcast(wss, ws, {
      acao: "atualizar_prioridade_os",
      osID,
      prioridade
    });
  } catch (err) {
    sendError(ws, "Falha ao atualizar prioridade da OS", err);
  }
}

// ======================================================
// ⚙️ UTILS
// ======================================================

function broadcast(wss, ws, data) {
  wss.clients.forEach((cliente) => {
    if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
      cliente.send(JSON.stringify(data));
    }
  });
}

function sendError(ws, mensagem, err) {
  console.error(`❌ ${mensagem}:`, err);
  ws.send(JSON.stringify({ acao: "erro", mensagem: `${mensagem}: ${err.message}` }));
}

module.exports = { initColaboradoresSocket };
