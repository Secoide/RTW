
let tentativas = 0;
const MAX_TENTATIVAS = 5;

// Função para enviar o nome via WebSocket
// Quando o socket abrir, envia o nome salvo (se tiver)
let meuNome = localStorage.getItem("nome_usuario");
socket.onopen = function () {
    atualizarStatus("Conectado", "green");
    if (meuNome) {
        socket.send(JSON.stringify({
            acao: 'usuario_online',
            nome: meuNome
        }));
    }
};

function atualizarStatus(texto, cor) {
    $("#status").text(texto);
    $(".fa-server").css("color", cor);
}

function conectarWebSocket() {
    if (tentativas > 0) {
        socket = new WebSocket('wss://rtw.up.railway.app');
        socket.onopen = function () {
            carregarOSComColaboradores();
            setTimeout(() => {
                restaurarOSOcultas();
                restaurarOSPrioridade();
                restaurarOSFixadas();
                $('.painelDia').each(function () {
                    atualizarPainel($(this));
                });
            }, 200);
            setTimeout(() => {
                atualizarStatusColaboradoresOS();
                esconderPainelOSsemColab();
            }, 400);
            tentativas = 0;
            atualizarStatus("Conectado", "green");
            if (meuNome) {
                socket.send(JSON.stringify({
                    acao: 'usuario_online',
                    nome: meuNome
                }));
            } else {
                $('#overlay_nome, #box_nome_usuario').show(200);
            }
        };
    }
    socket.onclose = function () {
        if (desconectandoPorLogout) {
            // Logout: limpa e redireciona sem tentar reconectar
            sessionStorage.clear();
            window.location.href = 'login.html';
            return;
        }
        tentativas++;
        if (tentativas <= MAX_TENTATIVAS) {
            const mensagem = `Reconectando. Aguarde... (tentativa ${tentativas} de ${MAX_TENTATIVAS})`;
            atualizarStatus("Algum problema no servidor. " + mensagem, "orange");
            setTimeout(conectarWebSocket, 5000);
        } else {
            atualizarStatus("Falha ao reconectar. Reinicia a pagina ou contate o suporte.", "red");
        }
    };

    // ✅ AQUI você aplica todos os .onmessage/.onerror de novo
    registrarEventosSocket(socket);
}

// Inicia a conexão assim que a página carrega
$(document).ready(function () {
    conectarWebSocket();
});
