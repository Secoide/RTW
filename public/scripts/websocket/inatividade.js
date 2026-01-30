const INATIVIDADE_ATIVA = false; // 👈 desligado por enquanto

const TEMPO_LIMITE = 30 * 60 * 1000; // 30 minutos
let timerInatividade;
let sessaoEncerrada = false;
let ultimoReset = 0;

function usuarioLogado() {
    return !!sessionStorage.getItem("id_usuario");
}

function resetarTimer() {
    if (!INATIVIDADE_ATIVA) return; // 🔴 DESLIGA AQUI

    if (!usuarioLogado() || sessaoEncerrada) return;

    const agora = Date.now();
    if (agora - ultimoReset < 2000) return;
    ultimoReset = agora;

    clearTimeout(timerInatividade);
    timerInatividade = setTimeout(encerrarSessao, TEMPO_LIMITE);
}
