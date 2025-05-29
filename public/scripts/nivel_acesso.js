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
});
