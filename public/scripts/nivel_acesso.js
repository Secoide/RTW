$(document).ready(function () {
    const nivel = parseInt(sessionStorage.getItem("nivel_acesso"));
    const ocultarElementos = () => {
        $('#popup-novaos').hide();
        $('#popup-colaborador').hide();
        $('.exportBtn, .bt_transferirColabs, .bt_prioridade, .bt_exportDados').hide();
        $('.p_colabs .colaborador .bt_tirarColab').css("visibility", "hidden");
    };

    const mostrarElementos = () => {
        setTimeout(() => {
            $('#popup-novaos').show();
            $('#popup-colaborador').show();
            $('.exportBtn, .bt_transferirColabs, .bt_prioridade, .bt_exportDados').show();
            $('.p_colabs .colaborador .bt_tirarColab').css("visibility", "visible");
        }, 400);
    };
    setTimeout(() => {
        ocultarElementos();
    }, 400);

    switch (nivel) {
        case 0:
        case 1:
            // Impede interações em áreas restritas
            $(document).on('mousedown mouseup dblclick dragstart', '.areaRestrita', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
            // Impede interações em áreas restritas
            $(document).on('click', '.areaRestritaClick', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
            break;

        case 2:
        case 3:
            // Pode interagir com algumas áreas, mas não mostrar botões
            break;

        case 5:
        case 6:
        case 7:
        case 99:
            mostrarElementos();
            break;
    }
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// Função para exibir uma notificação
function mostrarNotificacao(titulo, corpo, tagdia) {
    const som = new Audio('../notifications/notification.mp3'); // som local
    if (Notification.permission === 'granted') {
        const notif = new Notification(titulo, {
            body: corpo,
            tag: tagdia,
            requireInteraction: true,
            data: { rota: '../programacaoOS.html' }
        });
        som.play().catch(e => {
            console.warn('Som bloqueado até interação do usuário');
        });

        notif.onclick = function (e) {
            window.focus();
            window.location.href = notif.data.rota;
        };
    }
}

