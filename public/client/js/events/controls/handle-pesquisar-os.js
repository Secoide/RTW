// /public/client/js/events/controls/handle-pesquisar-os.js
import { removerAcentos } from "../../utils/formatters/text-formatter.js";
import { atualizarPainel } from "../../utils/dom/atualizar-painel.js";
import { mostrarErroUI }  from "../../utils/dom/error-handler.js";

export function initPesquisarOS() {
    const $input = $(".pesquisarOS");
    const $btn = $input.siblings(".clear-btn");

    // 🔎 mostra/esconde o botão X conforme o usuário digita
    $input.on("input", function () {
        try {
            if ($(this).val().length) {
                $btn.show();
            } else {
                $btn.hide();
            }

            const termo = removerAcentos($(this).val().toLowerCase());
            const $painelDia = $(this).closest(".painelDia");

            $painelDia.find(".painel_OS").each(function () {
                const $painel = $(this);
                const osTexto = $painel.find(".lbl_OS").text().toLowerCase();
                const descricaoOS = $painel.find(".lbl_descricaoOS").text().toLowerCase();
                const clienteOS = $painel.find(".lbl_clienteOS").text().toLowerCase();

                if (termo.length === 0) {
                    $painel.removeClass("matchOS noMatchOS");
                    if ($painel.find(".p_colabs .colaborador").length == 0) {
                        $painel.find(".p_colabs").hide();
                    }
                } else if (osTexto.includes(termo)) {
                    $painel.find(".p_colabs").show();
                    $painel.addClass("matchOS").removeClass("noMatchOS os_semColab");
                } else if (removerAcentos(descricaoOS).includes(termo)) {
                    $painel.addClass("matchOS").removeClass("noMatchOS os_semColab");
                } else if (removerAcentos(clienteOS).includes(termo)) {
                    $painel.addClass("matchOS").removeClass("noMatchOS os_semColab");
                } else {
                    if ($painel.find(".p_colabs .colaborador").length == 0) {
                        $painel.find(".p_colabs").hide();
                    }
                    $painel.addClass("noMatchOS").removeClass("matchOS");
                }
            });
            atualizarPainel($painelDia);
        } catch (err) {
            console.error("Erro em initPesquisarOS:", err);
            mostrarErroUI("Falha ao aplicar pesquisa. Tente novamente."); // exemplo de handler central
        }
    });

    // ❌ clique no X → limpa e atualiza
    $btn.on("click", function () {
        try {
            $btn.hide();
            $input.val("").trigger("input");
            $(".painelDia").each(function () {
                atualizarPainel($(this));
            });
        } catch (err) {
            console.error("Erro ao limpar pesquisa:", err);
            mostrarErroUI("Falha ao limpar busca.");
        }
    });
}
