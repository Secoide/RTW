import { formatarData } from "../formatters/date-format.js";
import { atualizarProgramacao, criarDataLocalProgramacao } from "../../events/change/handle-date-change.js";

const TEMPO_ILUMINAR_STATUS_MS = 3000;

export function destacarStatusDia($painel) {
  if (!$painel || !$painel.length) return;

  clearTimeout($painel.data("timerIluminarVerde"));
  $painel.removeClass("iluminar_verde");

  requestAnimationFrame(() => {
    $painel.addClass("iluminar_verde");
    const timer = setTimeout(() => {
      $painel.removeClass("iluminar_verde");
      $painel.removeData("timerIluminarVerde");
    }, TEMPO_ILUMINAR_STATUS_MS);

    $painel.data("timerIluminarVerde", timer);
  });
}

export function limparDestaqueStatusDia(escopo = document) {
  $(escopo).find(".painelDia.iluminar_verde").each(function () {
    const $painel = $(this);
    clearTimeout($painel.data("timerIluminarVerde"));
    $painel.removeClass("iluminar_verde");
    $painel.removeData("timerIluminarVerde");
  });
}

/**
 * Atualiza o ícone e os avisos de programação do dia
 * @param {{ statuss: number, dia: string, origem?: string }} param0
 */
export function mudarStatusProgramacaoDia({ statuss, dia, origem }) {
  // se a atualização veio do próprio cliente local, não precisa refazer nada
  if (origem === "local") return;

  const $painel = $(".painelDia").filter(function () {
    return $(this).attr("data-dia") == dia;
  });

  if ($painel.length === 0) {
    console.debug("📭 Painel não encontrado para o dia:", dia);
    return;
  }

  const $icone = $painel.find(".iconeStatusDia i");
  const diaFormatado = formatarData(dia);
  let avisos = $("#aviso #mensagem-aviso").text();
  const novoAviso = `Programação de ${diaFormatado} liberada para lançamento!`;

  // Atualiza avisos
  if (statuss === 0) {
    if (avisos.toLowerCase().includes(novoAviso.toLowerCase())) {
      const escaped = novoAviso.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      const novoTexto = avisos.replace(regex, "").replace(/\n{2,}/g, "\n").trim();
      $("#aviso #mensagem-aviso").text(novoTexto);
      $("#mensagem-aviso").text(novoTexto);
    }
  } else if (statuss === 1) {
    if (!avisos.toLowerCase().includes(novoAviso.toLowerCase())) {
      avisos += `\n\n${novoAviso}`;
      $("#form_aviso").load("../aviso.html", function () {
        mostrarAviso(avisos);
        const dataSelecionada = criarDataLocalProgramacao($("#seletor_data").val());
        atualizarProgramacao(dataSelecionada);
      });
    }
  }

  // ✅ Atualiza visualmente o ícone e o painel sem disparar o click
  if (statuss === 1) {
    $icone.removeClass("fa-file-signature").addClass("fa-file-circle-check");
    destacarStatusDia($painel);
  } else {
    $icone.removeClass("fa-file-circle-check").addClass("fa-file-signature");
    limparDestaqueStatusDia($painel);
  }
}
