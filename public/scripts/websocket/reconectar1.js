
let tentativas = 0;
const MAX_TENTATIVAS = 5;

let desconectandoPorLogout = false;
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

async function conectarWebSocket() {
    if (tentativas > 0) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
        socket = new WebSocket('ws://localhost:3000'); // Não usar `let`

        socket.onopen = async function () {
            await Promise.all($('.painelDia').map(function () {
                return carregarColaboradoresDisp($(this));
            }).get());

            await carregarOSComColaboradores();
            await atualizarStatusColaboradoresOS();

            restaurarOSOcultas();
            restaurarOSPrioridade();
            restaurarOSFixadas();
            esconderPainelOSsemColab();

            $('.painelDia').each(function () {
                atualizarPainel($(this));
            });

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
            sessionStorage.clear();
            window.location.href = 'login';
            return;
        }

        tentativas++;
        if (tentativas <= MAX_TENTATIVAS) {
            const mensagem = `Reconectando. Aguarde... (tentativa ${tentativas} de ${MAX_TENTATIVAS})`;
            atualizarStatus("Algum problema no servidor. " + mensagem, "orange");
            setTimeout(conectarWebSocket, 5000);
        } else {
            atualizarStatus("Falha ao reconectar. Reinicia a página ou contate o suporte.", "red");
        }
    };

    registrarEventosSocket(socket);
}


// Inicia a conexão assim que a página carrega
$(document).ready(function () {
    conectarWebSocket();
});
