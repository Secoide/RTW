


$(document).on('click', '.iconeStatusDia i', function (event, data) {
    if ((!(data && data.programatico) && sessionStorage.getItem('nivel_acesso') <= 5 )) {
        return false;
    }

    const $icon = $(this);
    if (!(data && data.programatico)) {
        if ($icon.hasClass('fa-file-signature')) {
            if (!confirm("Programação finalizada para lançamento?")) {
                return false;
            }
        } else if ($icon.hasClass('fa-file-circle-check')) {
            if (!confirm("Modificar programação novamente?")) {
                return false;
            }
        }
    }
    const $wrapper = $icon.parent();
    const painelDia = $icon.closest('.painelDia');
    let status = 0;

    //animação shaike
    if ($icon.hasClass('fa-file-zipper')) {
        $wrapper.addClass('shake');
        setTimeout(function () {
            $wrapper.removeClass('shake');
        }, 300);
        return false;
    }

    // Sobe 40px
    $wrapper.animate({ top: '-=40px' }, 150, function () {
        // Adiciona rotação
        $wrapper.addClass('rotate');

        // Troca ícone no meio da rotação
        setTimeout(function () {
            if ($icon.hasClass('fa-file-signature')) {
                status = 1;
                $icon.removeClass('fa-file-signature').addClass('fa-file-circle-check');
                painelDia.addClass('iluminar_verde');
            } else {
                painelDia.removeClass('iluminar_verde');
                $icon.removeClass('fa-file-circle-check').addClass('fa-file-signature');
            }
        }, 150);

        // Remove rotação e desce de volta
        setTimeout(function () {
            $wrapper.removeClass('rotate');

            $wrapper.animate({ top: '+=40px' }, 150, function () {
                if (!(data && data.programatico)) {
                    alterar_status_progDia($icon, status);
                }
            });
        }, 300);
    });
});



