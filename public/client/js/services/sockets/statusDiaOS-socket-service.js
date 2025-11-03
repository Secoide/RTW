import { atualizarStatusDia } from "../../utils/dom/programacao-render.js";
import { mudarStatusProgramacaoDia } from "../../utils/dom/status-dia-ui.js";
import { atualizarUI } from "./socket-notifications.js";
import { carregarOSComColaboradores, carregarColaboradoresDisp } from "../../services/api/programacao-service.js";

export function handleMudarStatusProgDia(data) {
  // `data.dia` vem do socket (data-dia)
  // Atualiza o painel específico
  const painel = $(`.painelDia[data-dia="${data.dia}"]`);
  if (painel.length > 0) {
    atualizarStatusDia(painel);
    mudarStatusProgramacaoDia(data);
    atualizarUI(data);
    Promise.all(
      [...document.querySelectorAll(".painelDia")].map(async painel => {
        await carregarColaboradoresDisp(painel, false);
        await carregarOSComColaboradores(painel);
      })
    );
  } else {
    console.warn("⚠️ Painel do dia não encontrado para:", data.dia);
  }
}