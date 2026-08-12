import { atualizarUsuariosOnline, atualizarListaOnline, receberMensagemChat, receberErroChat } from "./socket-users.js";
import { atualizarUI } from "./socket-notifications.js";
import {
    handleAlocarColaborador,
    handleTransferenciaConcluida,
    handleRemoverColaborador,
    handleConfirmarAlocacao,
    handlePrioridadeOS
} from "./colaboradores-socket-service.js";
import { handleMudarStatusProgDia } from "./statusDiaOS-socket-service.js";
import { registrarResultadoStatusProgDia } from "./status-dia-socket.js";

function tratarErroSocket(data) {
    document.dispatchEvent(new CustomEvent("ws:action-failed", {
        detail: {
            mensagem: data.mensagem || "Nao foi possivel salvar a alteracao.",
            codigo: data.codigo || "ACTION_FAILED",
            precisaSincronizar: data.precisaSincronizar === true
        }
    }));

    const seletor = document.getElementById("seletor_data");
    if (seletor && data.precisaSincronizar === true) {
        seletor.dispatchEvent(new Event("change", { bubbles: true }));
    }
}

export function handleSocketMessage(data, socket) {
    switch (data.acao) {
        case "atualizar_usuarios_online":
            atualizarUsuariosOnline(data);
            break;
        case "usuarios_online":
            atualizarListaOnline(data.lista);
            break;
        case "alocar_colaborador":
            handleAlocarColaborador(data);
            break;
        case "remover_colaborador":
            handleRemoverColaborador(data);
            break;
        case "confirmar_alocacao":
            handleConfirmarAlocacao(data);
            break;
        case "transferencia_concluida":
            handleTransferenciaConcluida(data);
            break;
        case "atualizar_prioridade_os":
            handlePrioridadeOS(data);
            break;
        case "mudar_statusProgDia":
            handleMudarStatusProgDia(data);
            break;
        case "mudar_statusProgDia_ok":
            registrarResultadoStatusProgDia(data);
            break;
        case "notificacao":
            atualizarUI(data);
            break;
        case "mensagem_chat":
            receberMensagemChat(data);
            break;
        case "erro_chat":
            receberErroChat(data);
            break;
        case "erro":
            registrarResultadoStatusProgDia({ ...data, sucesso: false });
            tratarErroSocket(data);
            break;
        default:
            console.warn("⚠️ Ação WS desconhecida:", data.acao);
    }
}
