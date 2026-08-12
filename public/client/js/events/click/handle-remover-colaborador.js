import { excluirColaboradorDaOS } from "../../services/sockets/colaboradores-socket-service.js";

export function initRemoverColaboradorClick() {
  $(document).on("click", ".bt_tirarColab", async function () {
    const colaboradorOS = $(this).closest(".colaborador");
    const painelOS = $(this).closest(".painel_OS");
    const painelDia = $(this).closest(".painelDia");
    const dataDestino = painelDia.attr("data-dia");

    const idColaborador = colaboradorOS.data("id");
    const osID = painelOS.find(".p_infoOS").data("os");
    const idNaOS = colaboradorOS.data("idnaos");

    if (!idNaOS) {
      document.dispatchEvent(new CustomEvent("ws:action-failed", {
        detail: {
          mensagem: "Nao foi possivel identificar o registro do colaborador na OS. Atualize a programacao e tente novamente.",
          codigo: "SYNC_REQUIRED",
          precisaSincronizar: true
        }
      }));
      return;
    }

    colaboradorOS.addClass("salvando").attr("data-loading", "true");

    const enviado = await excluirColaboradorDaOS(osID, idColaborador, idNaOS, dataDestino);
    if (!enviado) {
      colaboradorOS.removeClass("salvando").removeAttr("data-loading");
    }
  });
}
