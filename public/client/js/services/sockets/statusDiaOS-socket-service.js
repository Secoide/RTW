import { atualizarStatusDia } from "../../utils/dom/programacao-render.js";
import { mudarStatusProgramacaoDia } from "../../utils/dom/status-dia-ui.js";
import { atualizarUI } from "./socket-notifications.js";
import { carregarOSComColaboradores, carregarColaboradoresDisp } from "../../services/api/programacao-service.js";

export function handleMudarStatusProgDia(data) {
  atualizarUI(data);

  const painel = $(`.painelDia[data-dia="${data.dia}"]`);
  if (painel.length > 0) {
    atualizarStatusDia(painel);
    mudarStatusProgramacaoDia(data);
    Promise.all([
      carregarColaboradoresDisp(painel[0], false),
      carregarOSComColaboradores(painel[0])
    ]).catch((err) => {
      console.error("Erro ao recarregar painel apos status do dia:", err);
    });
  } else {
    console.warn("Painel do dia nao encontrado para:", data.dia);
  }
}
