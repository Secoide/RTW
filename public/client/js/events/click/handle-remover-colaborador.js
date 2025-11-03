import { excluirColaboradorDaOS } from "../../services/sockets/colaboradores-socket-service.js";

export function initRemoverColaboradorClick() {
  $(document).on("click", ".bt_tirarColab", function () {
    const colaboradorOS = $(this).closest(".colaborador");
    const painelOS = $(this).closest(".painel_OS");
    const painelDia = $(this).closest(".painelDia");
    const dataDestino = painelDia.attr("data-dia");

    const idColaborador = colaboradorOS.data("id");
    const osID = painelOS.find(".p_infoOS").data("os");
    const idNaOS = colaboradorOS.data("idnaos");

    // 🔄 via socket service
    excluirColaboradorDaOS(osID, idColaborador, idNaOS, dataDestino);

    // 🔽 UI: remover colaborador da OS
    colaboradorOS.remove();

    // atualizar contador
    const total = painelOS.find(".p_colabs .colaborador").length;
    painelOS.find(".lbl_total").text(total);

    // esconder se vazio
    if (total === 0) {
      painelOS.find(".p_colabs").slideUp(150);
      painelOS.find(".icone-olho").removeClass("fa-eye").addClass("fa-eye-slash");
      painelOS.addClass("os_semColab");
    }

    // atualizar colaborador no painelDia
    const $colabBase = painelDia.find(".p_colabsDisp .colaborador").filter(function () {
      return $(this).data("id") === idColaborador;
    }).first();

    if ($colabBase.length) {
      $colabBase.find(".ocupadoEmOS div").filter(function () {
        return $(this).text().trim() == osID;
      }).remove();

      if ($colabBase.find(".ocupadoEmOS div").length === 0) {
        $colabBase.removeClass("colaboradorEmOS");
      }
    }
  });
}
