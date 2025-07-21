
//ATUALIZA AUTOMATICAMENTE ALGUMA ALTERAÇÃO PARA OUTRO USuARIO
//const socket = new WebSocket('ws://localhost:3000');
let socket = new WebSocket('wss://rtw.up.railway.app');
registrarEventosSocket(socket);

function registrarEventosSocket(socket) {
    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const acao = data.acao;
        switch (acao) {
            case 'atualizar_usuarios_online':
                atualizarUsuariosOnline(data);
                break;

            case 'alocar_colaborador':
                alocarColaborador(data);
                break;

            case 'remover_colaborador':
                removerColaborador(data);
                break;

            case 'confirmar_alocacao':
                confirmarAlocacao(data);
                break;

            case 'atualizar_prioridade_os':
                atualizarPrioridadeOS(data);
                break;

            case 'mudar_statusProgDia':
                mudarStatusProgramacaoDia(data);
                break;
            case 'notificacao':
                atualizarUI(data);
                break;

            default:
                console.warn('Ação desconhecida:', acao);
        }
    };
}

function atualizarUsuariosOnline({ usuarios }) {
    const texto = usuarios.length > 0 ? usuarios.join(', ') : 'Nenhum usuário';
    $('#lista_usuarios_online').text(texto);
}

function alocarColaborador({ osID, nomes, data: dataDia }) {
    const $painelDia = $('.painelDia').filter(function () {
        return $(this).attr('data-dia') === dataDia;
    });

    const $destinoOS = $painelDia.find('.painel_OS').filter(function () {
        return $(this).find('.lbl_OS').text().trim() == osID;
    });

    nomes.forEach(({ id, nome }) => {
        const jaExiste = $destinoOS.find(".p_colabs .colaborador").filter(function () {
            return $(this).data('id') === id;
        }).length > 0;

        if (!jaExiste) {
            adicionarColaboradorNaOS(id, nome, $destinoOS);
        }

        const $colabBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
            return $(this).data('id') === id;
        }).first();

        if ($colabBase.length) {
            $colabBase.find('.ocupadoEmOS div').remove();
            $colabBase.find('.ocupadoEmOS').append(`<div>${osID}</div>`);
            $colabBase.addClass('colaboradorEmOS');
        }
    });
    atualizarPainel($painelDia);
}

function removerColaborador({ osID, id, data: dataDia }) {
    if (!osID) return;

    const $painelDia = $('.painelDia').filter(function () {
        return $(this).attr('data-dia') == dataDia;
    });

    const $os = $painelDia.find('.painel_OS').filter(function () {
        return $(this).find('.p_infoOS').data('os') == osID;
    });

    if ($os.length === 0) return;

    const $colabRemovido = $os.find('.p_colabs .colaborador').filter(function () {
        return $(this).data('id') == id;
    });

    if ($colabRemovido.length > 0) {
        $colabRemovido.remove();

        const total = $os.find('.p_colabs .colaborador').length;
        $os.find('.lbl_total').text(total);

        if (total === 0) {
            $os.find('.p_colabs').slideUp(150);
            $os.find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
        }

        const $colabsBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
            return $(this).data('id') == id;
        });

        $colabsBase.each(function () {
            const $colabBase = $(this);
            $colabBase.find('.ocupadoEmOS div').filter(function () {
                return $(this).text().trim() == osID;
            }).remove();

            if ($colabBase.find('.ocupadoEmOS div').length === 0) {
                $colabBase.removeClass('colaboradorEmOS');
            }
        });
    }
}

function confirmarAlocacao({ osID, nome, idNaOS }) {
    const $painel = $('.painel_OS').filter(function () {
        return $(this).find('.lbl_OS').text().trim() == osID;
    });

    const $colab = $painel.find('.colaborador').filter(function () {
        return $(this).find('.nome').text().trim() === nome;
    });

    $colab.attr('data-idnaos', idNaOS);
}

function atualizarPrioridadeOS({ osID, prioridade }) {
    const $os = $('.painel_OS').filter(function () {
        return $(this).find('.lbl_OS').text().trim() == osID;
    });

    const $icon = $os.find('.bt_prioridade');

    if (prioridade) {
        $os.addClass('prioridade-alta fixadaPorPrioridade');
        $icon.addClass('alta').attr('title', 'Prioridade: Alta');
        localStorage.setItem("prioridade_OS_" + osID, 'prioridade-alta');
    } else {
        $os.removeClass('prioridade-alta fixadaPorPrioridade');
        $icon.removeClass('alta').attr('title', 'Sem prioridade');
        localStorage.removeItem("prioridade_OS_" + osID);
    }

    $('.painelDia').each(function () {
        atualizarPainel($(this));
    });

    $os.addClass('shake');
    setTimeout(() => $os.removeClass('shake'), 800);
}

function mudarStatusProgramacaoDia({ statuss, dia }) {
    const $painel = $('.painelDia').filter(function () {
        return $(this).data('dia') == dia;
    });

    const diaSmena = formatarData(dia);
    let avisos = $('#aviso #mensagem-aviso').text();
    let novoAviso = "Programação de " + diaSmena + " liberada para lançamento!";

    if (statuss === 0) {
        if (avisos.toLowerCase().includes(novoAviso.toLowerCase())) {
            let escapedAviso = novoAviso.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            let regex = new RegExp(escapedAviso, 'gi');
            let novoTexto = avisos.replace(regex, '').replace(/\n{2,}/g, '\n').trim();
            $('#aviso #mensagem-aviso').text(novoTexto);
            $('#mensagem-aviso').text(novoTexto);
        }
    }

    if (statuss === 1) {
        avisos += '\n\n' + novoAviso;
        if (!avisos.toLowerCase().includes(novoAviso.toLowerCase())) {
            avisos += '\n\n' + novoAviso;
        }
        $('#form_aviso').load('../aviso.html', function () {
            mostrarAviso(avisos);
        });
    }

    $painel.find('.iconeStatusDia i').trigger('click', { programatico: true });
}

const notifKey = 'notificacoes_nao_lidas';
let notificacoes = JSON.parse(localStorage.getItem(notifKey)) || [];

function atualizarUI(data) {

    if (data && data.statuss === 0) {
        return;
    }else if(data && data.dia){
         notificacoes.push('Programação de ' + formatarData(data.dia) + ' liberada para lançamento.');
    }
   
    localStorage.setItem(notifKey, JSON.stringify(notificacoes));

    const count = notificacoes.length;
    $('#notification-count').text(count);
    $('#notification-count').toggle(count > 0); // esconde se 0

    const $list = $('#notification-list');
    $list.empty();

    notificacoes.forEach(msg => {
        $('<div>')
            .text(msg)
            .css({
                'padding': '5px',
                'border-bottom': '1px solid #eee'
            })
            .appendTo($list);
    });
    if(data && data.dia){
        mostrarNotificacao('Programação lançada!', 'Programação de ' + formatarData(data.dia) + ' liberada para lançamento.');
    }
}

// Ao iniciar a página, carrega notificações existentes
atualizarUI();

$('#notification-container').on('click', function () {
    const $list = $('#notification-list');
    const estavaVisivel = $list.is(':visible');

    $list.toggle(); // mostra/oculta a lista

    if (!estavaVisivel) {
        atualizarUI();
    } else {
        // se estava visível e agora vai ser fechado => limpa
        notificacoes = [];
        localStorage.setItem(notifKey, JSON.stringify([]));
        $('#notification-count').hide();
    }
});

// Esconde o dropdown se clicar fora
$(document).on('click', function (e) {
    if (!$(e.target).closest('#notification-container, #notification-list').length) {
        $('#notification-list').hide();
    }
});

