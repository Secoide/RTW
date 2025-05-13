

//FUNÇÕES DE CLICAR EM BOTÃO AÇÕES

//Ao clicar no botao COMENTARIO abre form
let osIDSelecionada = null;
$(document).on('click', '.bt_comentario', function () {
    const $os = $(this).closest('.painel_OS');
    osIDSelecionada = $os.find('.lbl_OS').text().trim();

    // Preenche comentário existente (se houver)
    const comentarioSalvo = localStorage.getItem("comentario_OS_" + osIDSelecionada);
    $('#comentario_texto').val(comentarioSalvo || '');

    $('#overlay_comentario').fadeIn(150);
    $('#box_comentario').fadeIn(200);
});
//Dentro do FORM COMENTARIO
$('#btn_salvar_comentario').on('click', function () {
    const texto = $('#comentario_texto').val().trim();
    if (osIDSelecionada) {
        localStorage.setItem("comentario_OS_" + osIDSelecionada, texto);

        // Adiciona destaque no ícone se houver comentário
        const $icon = $('.painel_OS').filter(function () {
            return $(this).find('.lbl_OS').text().trim() === osIDSelecionada;
        }).find('.bt_comentario');

        if (texto !== '') {
            $icon.addClass('comentario-ativo');
        } else {
            $icon.removeClass('comentario-ativo');
        }
    }

    $('#box_comentario').fadeOut(200);
    $('#overlay_comentario').fadeOut(150);
});
$('#btn_fechar_comentario').on('click', function () {
    $('#box_comentario').fadeOut(200);
    $('#overlay_comentario').fadeOut(150);
});


//Ao clicar no botao CHECKLIST abre form
let osIDChecklistAtual = null;
$(document).on('click', '.bt_checklist', function () {
    const $os = $(this).closest('.painel_OS');
    osIDChecklistAtual = $os.find('.lbl_OS').text().trim();

    carregarChecklist(osIDChecklistAtual);

    $('#overlay_checklist').fadeIn(150);
    $('#box_checklist').fadeIn(200);
});
//Dentro do FORM CHECKLIST
$('#btn_add_item').on('click', function () {
    const texto = $('#input_novo_item').val().trim();
    if (texto === '') return;

    const index = $('#checklist_itens .check-item').length;
    const $novo = $(`
<div class="check-item" data-index="${index}">
    <input type="checkbox">
    <span>${texto}</span>
    <i class="fa-solid fa-x remover"></i>
</div>
`);

    $('#checklist_itens').append($novo);
    $('#input_novo_item').val('');
    salvarChecklist(osIDChecklistAtual);
});
$(document).on('change', '#checklist_itens input[type="checkbox"]', function () {
    salvarChecklist(osIDChecklistAtual);
});
$(document).on('click', '.check-item .remover', function () {
    $(this).closest('.check-item').remove();
    salvarChecklist(osIDChecklistAtual);
});
$('#btn_fechar_checklist, #overlay_checklist').on('click', function () {
    $('#box_checklist, #overlay_checklist').fadeOut(150);
});


//Ao clicar no botao OLHO mostra/esconde colaboradores na OS
$(document).on('click', '.icone-olho', function () {
    const $icon = $(this);
    const $painel = $icon.closest('.painel_OS');
    const $colabs = $painel.find('.p_colabs');
    const os = $painel.find('.lbl_OS').text().trim();

    $colabs.slideToggle(200, function () {
        let osOcultas = JSON.parse(localStorage.getItem("osOcultas") || "[]");

        if ($colabs.is(':visible')) {
            // Painel está sendo mostrado -> remover do localStorage
            $icon.removeClass('fa-eye-slash').addClass('fa-eye');
            $colabs.show();
            osOcultas = osOcultas.filter(item => item !== os);
        } else {
            // Painel está sendo escondido -> adicionar ao localStorage
            $colabs.removeClass('aberta-por-hover');
            $icon.removeClass('fa-eye').addClass('fa-eye-slash');
            $colabs.hide();
            if (!osOcultas.includes(os)) {
                osOcultas.push(os);
            }
        }
        localStorage.setItem("osOcultas", JSON.stringify(osOcultas));
    });
});



//Ao clicar no botao FIXAR deixa o painel OS fixado acima
$(document).on('click', '.bt_fixar', function () {
    const osDiv = $(this).closest('.painel_OS');
    osDiv.toggleClass('fixado');
    const btFixar = $(this);
    if (btFixar.hasClass('fa-thumbtack')) {
        btFixar.removeClass('fa-thumbtack').addClass('fa-thumbtack-slash').removeClass('fixadoOS');
    } else {
        btFixar.removeClass('fa-thumbtack-slash').addClass('fa-thumbtack').toggleClass('fixadoOS');
    }
    atualizarOSFixadasLocalStorage();
    atualizarPainel();
});


//Ao clicar no botao PRIORIZAR deixa o painel OS com atençao 
$(document).on('click', '.bt_prioridade', function () {
    const $os = $(this).closest('.painel_OS');
    const osID = $os.find('.lbl_OS').text().trim();
    const $icon = $(this);

    const jaAlta = $os.hasClass('prioridade-alta');

    if (jaAlta) {
        $os.removeClass('prioridade-alta fixadaPorPrioridade');
        $icon.removeClass('alta').attr('title', 'Sem prioridade');
        localStorage.removeItem("prioridade_OS_" + osID);
    } else {
        $os.removeClass('prioridade-alta prioridade-media prioridade-baixa');
        $os.addClass('prioridade-alta fixadaPorPrioridade');
        $icon.addClass('alta').attr('title', 'Prioridade: Alta');
        localStorage.setItem("prioridade_OS_" + osID, 'prioridade-alta');
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            acao: 'atualizar_prioridade_os',
            osID: osID,
            prioridade: !jaAlta  // true = está marcando como alta
        }));
    }

    $('.painelDia').each(function () {
        atualizarPainel($(this));
    }); // 🟢 Reorganiza ao mudar a prioridade
});