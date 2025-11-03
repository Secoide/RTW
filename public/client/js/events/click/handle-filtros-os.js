// /public/client/js/events/click/handle-filtro-foco.js

import { atualizarPainel } from "../../utils/dom/atualizar-painel.js";

let modoFocoAtivo = false;

export function initFiltros() {
    $(document).on("click", ".filtroFocar", function () {
        ativar_FiltroFoco($(this));
    });

    $(document).on("click", ".filtroPrioridade", function () {
        ativar_FiltroPrioridade($(this));
    });
    
    $(document).on("click", ".ocupadoEmOS", function () {
        ativar_FiltroColabEmOS($(this));
    });
}

function ativar_FiltroFoco($btn) {
    modoFocoAtivo = !modoFocoAtivo;
    const $icone = $btn.find("i");

    if (modoFocoAtivo) {
        $btn.addClass("ativo");
        $icone.attr("title", "Modo Foco Ativado");

        const $painelDia = $btn.closest(".painelDia");

        $painelDia.find(".painel_OS").each(function () {
            const temColaboradores = $(this).find(".p_colabs .colaborador").length > 0;
            const temPrioridade = $(this).hasClass("prioridade-alta");

            if (!temColaboradores && !temPrioridade) {
                $(this).hide();
            }
        });
    } else {
        $btn.removeClass("ativo");
        $icone.attr("title", "Ativar Modo Foco");
        $(".painel_OS").show();
    }
}

function ativar_FiltroPrioridade($btn) {
    const $botao = $btn;
    const $icone = $botao.find('i');
    const $painelDia = $botao.closest('.painelDia');

    const isAtivo = $botao.hasClass('ativo');

    if (isAtivo) {
        // Desativa o filtro
        $botao.removeClass('ativo');
        $icone.attr('title', 'Mostrando todas as OS');
        $painelDia.find('.painel_OS').show();
    } else {
        // Ativa o filtro
        $botao.addClass('ativo');
        $icone.attr('title', 'Mostrando apenas OS com prioridade Alta');

        $painelDia.find('.painel_OS').each(function () {
            const $os = $(this);
            if (!$os.hasClass('prioridade-alta')) {
                $os.hide();
            } else {
                $os.show(); // Garante que as OS com prioridade alta estejam visíveis
            }
        });
    }
}

let ultimaOSClicada;
function ativar_FiltroColabEmOS($btn){
    const divOS = $btn;
    const osClicado = divOS.text().trim().toLowerCase();
    const $painelDia = $btn.closest('.painelDia');

    const $todasOS = $painelDia.find('.painel_OS');

    // Se clicou na mesma OS que já estava selecionada, desfaz filtro
    if (osClicado === ultimaOSClicada && divOS.hasClass("matchOS")) {
        $todasOS.removeClass('matchOS noMatchOS');
        $painelDia.find(".ocupadoEmOS").removeClass("matchOS");

        // Recolhe colabs abertos por filtro
        $todasOS.each(function () {
            const $colabs = $(this).find('.p_colabs');
            if ($colabs.hasClass('aberta-por-filtro')) {
                $colabs.slideUp(150).removeClass('aberta-por-filtro');
                $(this).find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });

        ultimaOSClicada = null;
        atualizarPainel($painelDia);
        return;
    }

    // Marca a nova OS clicada
    ultimaOSClicada = osClicado;

    // Primeiro: limpa tudo
    $todasOS.removeClass('matchOS noMatchOS');
    $painelDia.find(".ocupadoEmOS").removeClass("matchOS");

    // Depois: aplica o filtro
    $todasOS.each(function () {
        const $painel = $(this);
        const osTexto = $painel.find('.lbl_OS').text().trim().toLowerCase();
        const $colabs = $painel.find('.p_colabs');

        if (osTexto.includes(osClicado)) {
            $painel.addClass('matchOS').removeClass('noMatchOS');

            // Se estiver recolhido, expande
            if (!$colabs.is(":visible")) {
                $colabs.slideDown(150).addClass('aberta-por-filtro');
                $painel.find('.icone-olho').removeClass('fa-eye-slash').addClass('fa-eye');
            }
        } else {
            $painel.addClass('noMatchOS').removeClass('matchOS');
        }
    });

    // Marca o divOS clicado também (opcional, para realce visual)
    divOS.addClass("matchOS");

    atualizarPainel($painelDia);
}