$(function () {
    // Variáveis globais

    window.websocketCount = 1;
    window.ultimaMensagem = '';
    window.totalMensagensRecebidas = 0;

    $(socket).on('message', function (event) {
        window.ultimaMensagem = event.originalEvent.data;
        window.totalMensagensRecebidas++;
    });


    let intervalAtualizar = null;

    const SENHA_CORRETA = "52843541";

    // Login para mostrar painel
    $('#ws-auth-btn').on('click', function (e) {
        e.preventDefault();
        const senha = $('#ws-password').val();
        if (senha === SENHA_CORRETA) {
            $('#ws-debug-form').hide();
            $('#ws-info').show();
            atualizarInfoWebSocket();

            if (intervalAtualizar) clearInterval(intervalAtualizar);
            intervalAtualizar = setInterval(atualizarInfoWebSocket, 1000);
        } else {
            alert('Senha incorreta');
        }
    });

    // Enviar mensagem manual para servidor WebSocket
    $('#btn-enviar-msg').on('click', function () {
        const msg = $('#msg-enviar').val().trim();
        if (!msg) {
            alert('Digite uma mensagem para enviar.');
            return;
        }
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ tipo: msg }));
            $('#msg-status').text('Mensagem enviada: ' + msg).css('color', 'green');
            $('#msg-enviar').val('');
        } else {
            $('#msg-status').text('Socket não conectado.').css('color', 'red');
        }
    });

    // Função para atualizar as infos no painel
    function atualizarInfoWebSocket() {
        const estados = ["CONECTANDO", "ABERTO", "FECHANDO", "FECHADO"];

        // Atualiza valores básicos que você queira mostrar (ex: clientes do servidor via AJAX)
        $.ajax({
            url: '/ws-status', // Substitua pela rota que você usa para status do servidor WS
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                $('#clientes-conectados').text(data.clientesConectados);
                $('#total-sockets').text(data.totalSockets);
            },
            error: function () {
                $('#clientes-conectados').text('Erro');
                $('#total-sockets').text('Erro');
            }
        });

        // Exibe as infos do cliente WebSocket

        const info = {
            "URL da Conexão": socket.url || "N/A",
            "Estado do Socket": estados[socket.readyState],
            "Sockets Criados (desde reload)": window.websocketCount || 1,
            "Total de Mensagens Recebidas": window.totalMensagensRecebidas || 0,
            "Última Mensagem Recebida": '\n' + window.ultimaMensagem || '\n' +  "(nenhuma)"
        };

        let texto = "";
        const larguraChave = 35; // ajuste o valor conforme necessário

        $.each(info, function (chave, valor) {
            let linha = chave;
            const qtdPontos = Math.max(larguraChave - chave.length, 2);
            linha += '.'.repeat(qtdPontos) + valor + '\n';
            texto += linha;
        });

        $('#ws-info-output').css('white-space', 'pre').text(texto);
    }
});
