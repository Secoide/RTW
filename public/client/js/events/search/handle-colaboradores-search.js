// /public/client/js/events/search/handle-colaboradores-search.js
import { removerAcentos } from "../../utils/formatters/text-formatter.js";

// Estado interno
let OS_FOCUS = null;
let indiceSelecionado2 = -1;

/**
 * Fecha sugestões visíveis e reseta índice
 */
function fecharSugestoes($input) {
    const $local = $input.closest(".buscarColab").find(".sugestoes");
    if ($local.length) $local.remove();
    $(".sugestoes:visible").remove();
    indiceSelecionado2 = -1;
}

/**
 * Inicializa eventos de busca/seleção de colaboradores
 */
export function initColaboradoresSearch(socket) {

    // Dentro de initColaboradoresSearch(socket)
    $(document).on("input", ".buscarColab input", function () {
        const input = $(this);
        const termoBruto = input.val();
        const termo = removerAcentos(termoBruto.toLowerCase());
        const painelDia = input.closest(".painelDia");

        $(".sugestoes").remove();
        indiceSelecionado2 = -1;

        if (termo.length < 1) return;

        const disponiveis = getColaboradoresDisponiveis(painelDia);

        let filtrados = [];
        const buscandoLider = termoBruto.trim().startsWith('#');
        const termoLider = removerAcentos(termoBruto.trim().substring(1).toLowerCase());

        if (buscandoLider) {
            filtrados = disponiveis.filter(colab => {
                const $colabEl = painelDia.find('.colaborador').filter(function () {
                    return $(this).data('id') === colab.id;
                }).first();
                return $colabEl.find('p.nome').hasClass('lider') &&
                    removerAcentos(colab.nome.toLowerCase()).includes(termoLider);
            });
        } else {
            filtrados = disponiveis.filter(colab => {
                const $colabEl = painelDia.find('.colaborador').filter(function () {
                    return $(this).data('id') === colab.id;
                }).first();
                return !$colabEl.find('p.nome').hasClass('lider') &&
                    removerAcentos(colab.nome.toLowerCase()).includes(termo);
            });
        }

        if (filtrados.length > 0) {
            const $lista = $('<div class="sugestoes"></div>');

            filtrados.forEach(({ id, nome }) => {
                const $colab = painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
                    return $(this).data('id') === id;
                }).first();

                if ($colab.length === 0) return;

                let cor = '#28a745';
                if ($colab.attr('data-status') === 'ferias'
                    || $colab.hasClass('saude')
                    || $colab.hasClass('paternidade')
                    || $colab.hasClass('falta-indevida')
                    || $colab.hasClass('afastamento')) {
                    cor = '#dc3545';
                } else if ($colab.find('.ocupadoEmOS div').length > 0) {
                    cor = '#ffc107';
                }

                $lista.append(`
                <div class="itemSugestao" data-id="${id}" data-nome="${nome}">
                    <i class="fa-solid fa-circle" style="color:${cor}; margin-right: 2px; font-size: 8px;"></i> ${nome}
                </div>
            `);
            });

            // → calcula posição absoluta do input
            const offset = input.offset();
            const largura = input.outerWidth();

            $lista.css({
                position: 'absolute',
                top: offset.top + input.outerHeight(),
                left: offset.left,
                width: largura,
                zIndex: 9999,
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '0 0 10px 10px',
                maxHeight: '250px',
                overflowY: 'auto',
                boxShadow: '0px 2px 6px rgba(0,0,0,0.2)'
            });

            $('body').append($lista); // renderiza no body

            if (filtrados.length === 1) {
                $lista.find('.itemSugestao').first().addClass('selecionado');
                indiceSelecionado2 = 0;
            }
        }
    });


    // Remover sugestões ao clicar fora
    $(document).on("click", function (e) {
        if (!$(e.target).closest(".sugestoes, .buscarColab input").length) {
            $(".sugestoes").remove();
        }
    });


    // Marca OS em foco
    $(document).on("focusin", ".painel_OS .buscarColab input", function () {
        OS_FOCUS = $(this).closest(".painel_OS");
        indiceSelecionado2 = -1;
    });

    // Clique em sugestão
    $(document).on("click", ".itemSugestao", function () {
        const id = $(this).data("id");
        const nome = $(this).data("nome");

        const $sugestoes = $(this).closest(".sugestoes");
        let osID = $sugestoes.attr("data-os") || $(this).data("os") || null;
        let dia = $sugestoes.attr("data-dia") || $(this).data("dia") || null;

        let $painelDia = dia ? $(`.painelDia[data-dia="${dia}"]`) : $();
        let $osNova = (osID && $painelDia.length)
            ? $painelDia.find(`.p_infoOS[data-os="${osID}"]`).closest(".painel_OS")
            : $();

        // Fallback para OS_FOCUS
        if (!$osNova.length && OS_FOCUS && OS_FOCUS.length) {
            $osNova = OS_FOCUS;
            if (!osID) osID = $osNova.find(".p_infoOS").data("os") || $osNova.find(".lbl_OS").text().trim();
            if (!dia) dia = $osNova.closest(".painelDia").attr("data-dia");
            $painelDia = $osNova.closest(".painelDia");
        }

        // Fallback global
        if ((!$osNova || !$osNova.length) && osID) {
            $osNova = $(`.p_infoOS[data-os="${osID}"]`).closest(".painel_OS");
            if ($osNova.length) {
                $painelDia = $osNova.closest(".painelDia");
                if (!dia) dia = $painelDia.attr("data-dia");
            }
        }

        if (!$osNova.length || !$painelDia.length || !dia || !osID) {
            console.warn("Falha ao resolver painelDia/OS.", {
                osIDTentado: osID,
                diaTentado: dia,
                existePainelDia: !!$painelDia.length,
                existeOSNova: !!$osNova.length,
                OS_FOCUS: !!(OS_FOCUS && OS_FOCUS.length),
                htmlItem: $(this).prop("outerHTML"),
                htmlSugestoes: $sugestoes.prop("outerHTML")
            });
            return false;
        }

        // Evita duplicar se já tem status
        const colaboradorComStatus = $painelDia.find(`.p_colabsDisp .colaborador[data-id="${id}"]`)
            .filter(function () { return $(this).attr("data-status") !== ""; });
        if (colaboradorComStatus.length > 0) return false;

        // Remove de outras OS no mesmo dia
        $painelDia.find(".painel_OS").each(function () {
            const $os = $(this);
            const idOS = $os.find(".lbl_OS").text().trim();
            if (idOS !== osID) {
                const $colabRemovido = $os.find(`.p_colabs .colaborador[data-id="${id}"]`);
                const destinoOS = $os.find(".p_infoOS").data("os") || idOS;

                if ($colabRemovido.length > 0) {
                    $colabRemovido.remove();

                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            acao: "remover_colaborador",
                            osID: destinoOS,
                            id,
                            dataDia: dia
                        }));
                    }

                    const total = $os.find(".p_colabs .colaborador").length;
                    $os.find(".lbl_total").text(total);
                    if (total === 0) {
                        $os.find(".p_colabs").slideUp(150);
                        $os.find(".icone-olho").removeClass("fa-eye").addClass("fa-eye-slash");
                    }
                }
            }
        });

        // Atualiza card base
        const $colabBase = $painelDia.find(`.painel_colaboradores .colaborador[data-id="${id}"]`).first();
        if ($colabBase.length) {
            $colabBase.find(".ocupadoEmOS div").remove();
            $colabBase.find(".ocupadoEmOS").append(`<div>${osID}</div>`);
            $colabBase.addClass("colaboradorEmOS");
        }

        // Adiciona na OS
        const jaExiste = $osNova.find(`.p_colabs .colaborador[data-id="${id}"]`).length > 0;
        if (!jaExiste) adicionarColaboradorNaOS(id, nome, $osNova);

        // Limpa sugestões
        $osNova.find(".buscarColab input").val("");
        $osNova.find(".sugestoes").remove();

        // WebSocket alocação
        if (socket && socket.readyState === WebSocket.OPEN) {
            dia = dia || $osNova.closest(".painelDia").attr("data-dia");
            socket.send(JSON.stringify({
                acao: "alocar_colaborador",
                osID,
                dataDia: dia,
                nomes: [{ nome, id }]
            }));
        }

        const $input = $(".buscarColab input:focus").length
            ? $(".buscarColab input:focus")
            : $(this).closest(".painel_OS").find(".buscarColab input").first();
        fecharSugestoes($input);
    });

// Navegação com teclado
$(document).on("keydown", ".buscarColab input", function (e) {
    const $input = $(this);
    let $sugestoes = $input.closest(".buscarColab").find(".sugestoes:visible");
    if (!$sugestoes.length) $sugestoes = $(".sugestoes:visible").last();

    const $itens = $sugestoes.find(".itemSugestao");
    if (!$itens.length) return;

    const selecionar = (idx) => {
        $itens.removeClass("selecionado");
        const $sel = $itens.eq(idx).addClass("selecionado");
        const top = $sel.position().top;
        $sugestoes.scrollTop(top + $sugestoes.scrollTop() - ($sugestoes.innerHeight() / 2 - $sel.outerHeight() / 2));
    };

    if (e.key === "ArrowDown") {
        indiceSelecionado2 = (indiceSelecionado2 < 0) ? 0 : (indiceSelecionado2 + 1) % $itens.length;
        selecionar(indiceSelecionado2);
        e.preventDefault();
    } else if (e.key === "ArrowUp") {
        indiceSelecionado2 = (indiceSelecionado2 < 0) ? ($itens.length - 1) : (indiceSelecionado2 - 1 + $itens.length) % $itens.length;
        selecionar(indiceSelecionado2);
        e.preventDefault();
    } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (indiceSelecionado2 < 0) indiceSelecionado2 = 0;
        const el = $itens.eq(indiceSelecionado2).get(0);
        if (el) el.click();
        indiceSelecionado2 = -1;
        fecharSugestoes($input);
        setTimeout(() => $input.focus(), 10); // <-- garante o foco após o evento
    } else if (e.key === "Escape") {
        $sugestoes.remove();
        indiceSelecionado2 = -1;
        fecharSugestoes($input);
        setTimeout(() => $input.focus(), 10); // <-- garante o foco após o evento
    }
});

// Hover com mouse atualiza índice
$(document).on("mouseenter", ".itemSugestao", function () {
    const $li = $(this);
    $li.addClass("selecionado").siblings().removeClass("selecionado");
    indiceSelecionado2 = $li.index();
});

// Clique em uma sugestão
$(document).on("click", ".itemSugestao", function () {
    const $input = $(this).closest(".buscarColab").find("input");
    fecharSugestoes($input);
    $input.focus(); // <-- foco volta para o input após clique
});

}
