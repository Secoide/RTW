import { excluirColaboradorDaOS } from "../../services/sockets/colaboradores-socket-service.js";

export function initRemoverColaboradorClick() {
  $(document).off("click.removerColabOS", ".bt_tirarColab");
  $(document).on("click.removerColabOS", ".bt_tirarColab", async function () {
    const colaboradorOS = $(this).closest(".colaborador");
    const painelOS = $(this).closest(".painel_OS");
    const painelDia = $(this).closest(".painelDia");
    const dataDestino = painelDia.attr("data-dia");

    const idColaborador = colaboradorOS.data("id");
    const osID = painelOS.find(".p_infoOS").data("os");
    const idNaOS = colaboradorOS.data("idnaos");

    colaboradorOS.addClass("salvando").attr("data-loading", "true");

    const enviado = await excluirColaboradorDaOS(osID, idColaborador, idNaOS || null, dataDestino);
    if (!enviado) {
      colaboradorOS.removeClass("salvando").removeAttr("data-loading");
    }
  });
}
