// /public/client/js/events/controls/handle-pesquisar-os.js
import { resetarPaginacaoOSProgramacao } from "../../utils/dom/atualizar-painel.js";
import { carregarOSComColaboradores } from "../../services/api/programacao-service.js";
import { mostrarErroUI }  from "../../utils/dom/error-handler.js";

const timersBuscaDia = new WeakMap();

export function initPesquisarOS() {
    const $input = $(".pesquisarOS");
    const $btn = $input.siblings(".clear-btn");

    // 🔎 mostra/esconde o botão X conforme o usuário digita
    $input.off("input.pesquisarOS");
    $input.on("input.pesquisarOS", function () {
        try {
            const input = this;
            const $inputAtual = $(input);
            const $painelDia = $inputAtual.closest(".painelDia");
            const termo = $inputAtual.val().trim();
            const timerAtual = timersBuscaDia.get(input);

            if (timerAtual) clearTimeout(timerAtual);

            if (termo.length) {
                $inputAtual.siblings(".clear-btn").show();
            } else {
                $inputAtual.siblings(".clear-btn").hide();
                resetarPaginacaoOSProgramacao($painelDia);
            }

            const novoTimer = setTimeout(async () => {
                await carregarOSComColaboradores($painelDia[0], { busca: termo, offset: 0 });
            }, 250);

            timersBuscaDia.set(input, novoTimer);
        } catch (err) {
            console.error("Erro em initPesquisarOS:", err);
            mostrarErroUI("Falha ao aplicar pesquisa. Tente novamente."); // exemplo de handler central
        }
    });

    // ❌ clique no X → limpa e atualiza
    $btn.off("click.pesquisarOS");
    $btn.on("click.pesquisarOS", function () {
        try {
            const $painelDia = $(this).closest(".painelDia");
            const $inputAtual = $(this).siblings(".pesquisarOS");
            const timerAtual = timersBuscaDia.get($inputAtual[0]);

            if (timerAtual) clearTimeout(timerAtual);

            $(this).hide();
            $inputAtual.val("");
            resetarPaginacaoOSProgramacao($painelDia);
            carregarOSComColaboradores($painelDia[0], { busca: "", offset: 0 });
        } catch (err) {
            console.error("Erro ao limpar pesquisa:", err);
            mostrarErroUI("Falha ao limpar busca.");
        }
    });
}
