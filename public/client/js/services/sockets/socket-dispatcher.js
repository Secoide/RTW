import { atualizarUsuariosOnline } from "./socket-users.js";
import { atualizarUI } from "./socket-notifications.js";
import {
    handleAlocarColaborador,
    handleTransferenciaConcluida,
    handleRemoverColaborador,
    handleConfirmarAlocacao,
    handlePrioridadeOS
} from "./colaboradores-socket-service.js";
import { handleMudarStatusProgDia } from "./statusDiaOS-socket-service.js";

export function handleSocketMessage(data, socket) {
    switch (data.acao) {
        case "atualizar_usuarios_online":
            atualizarUsuariosOnline(data);
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
        case "notificacao":
            atualizarUI(data);
            break;
        case "ping":
            socket.send(JSON.stringify({ acao: "pong" }));
            break;
        default:
            console.warn("⚠️ Ação WS desconhecida:", data.acao);
    }
}
