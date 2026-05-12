import { getSocket } from "./socket-service.js";
import { atualizarPainel } from "../../utils/dom/atualizar-painel.js";

// =============================
// ENVIO PARA O SERVIDOR
// =============================
export function alocarColaboradores(osID, dataDia, nomes) {
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      acao: "alocar_colaborador",
      osID,
      dataDia,   // 👈 padronizado
      nomes,
    }));
  }
}

export function transferirColaboradores(colaboradores, datas) {
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      acao: "transferir_colaboradores",
      colaboradores, // [{ idColab, idOS, nome }]
      datas          // ["2025-10-01", "2025-10-02"]
    }));
  }
}

export function removerColaboradores(osID, dataDia, ids) {
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    ids.forEach((id) => {
      socket.send(JSON.stringify({
        acao: "remover_colaborador",
        osID,
        id,
        dataDia,   // 👈 padronizado
      }));
    });
  }
}

export function excluirColaboradorDaOS(osID, idColaborador, idNaOS, dataDia) {
  const socket = getSocket();
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      acao: "excluir_colaboradorEmOS",
      osID,
      id: idColaborador,
      idNaOS,
      dataDia,   // 👈 padronizado
    }));
  }
}

// =============================
// RECEBIMENTO DO SERVIDOR
// =============================

export function handleAlocarColaborador({ osID, nomes, dataDia }) {
  const $painelDia = $(".painelDia").filter(function () {
    return $(this).attr("data-dia") === dataDia;
  });

  const $destinoOS = $painelDia.find(".painel_OS").filter(function () {
    return $(this).find(".lbl_OS").text().trim() == osID;
  });

  nomes.forEach(({ id, nome }) => {
    const jaExiste = $destinoOS.find(".p_colabs .colaborador").filter(function () {
      return $(this).data("id") === id;
    }).length > 0;

    if (!jaExiste) {
      adicionarColaboradorNaOS(id, nome, $destinoOS);
    }

    const $colabBase = $painelDia
      .find(".painel_colaboradores .p_colabsDisp .colaborador")
      .filter(function () {
        return $(this).data("id") === id;
      })
      .first();

    if ($colabBase.length) {
      $colabBase.find(".ocupadoEmOS div").remove();
      $colabBase.find(".ocupadoEmOS").append(`<div>${osID}</div>`);
      $colabBase.addClass("colaboradorEmOS");
    }
  });

  atualizarPainel($painelDia);
}

export function handleTransferenciaConcluida({ colaboradores, datas }) {
  datas.forEach((dia) => {
    const $painelDia = $(`.painelDia[data-dia="${dia}"]`);
    if ($painelDia.length === 0) return;

    colaboradores.forEach(({ idColab, idOS, nome }) => {
      const $os = $painelDia.find(`.p_infoOS[data-os="${idOS}"]`).closest(".painel_OS");
      if ($os.length === 0) return;

      const jaExiste = $os.find(`.p_colabs .colaborador[data-id="${idColab}"]`).length > 0;
      if (!jaExiste) {
        adicionarColaboradorNaOS(idColab, nome, $os);
      }

      const $colabBase = $painelDia.find(`.p_colabsDisp .colaborador[data-id="${idColab}"]`).first();
      if ($colabBase.length) {
        $colabBase.find(".ocupadoEmOS div").remove();
        $colabBase.find(".ocupadoEmOS").append(`<div>${idOS}</div>`);
        $colabBase.addClass("colaboradorEmOS");
      }
    });

    atualizarPainel($painelDia);
  });
}

export function handleRemoverColaborador({ osID, id, dataDia }) {
  const $painelDia = $(".painelDia").filter(function () {
    return $(this).attr("data-dia") == dataDia;
  });

  const $os = $painelDia.find(".painel_OS").filter(function () {
    return $(this).find(".p_infoOS").data("os") == osID;
  });

  if ($os.length === 0) return;

  const $colabRemovido = $os.find(".p_colabs .colaborador").filter(function () {
    return $(this).data("id") == id;
  });

  if ($colabRemovido.length > 0) {
    $colabRemovido.remove();

    const total = $os.find(".p_colabs .colaborador").length;
    $os.find(".lbl_total").text(total);

    if (total === 0) {
      $os.find(".p_colabs").slideUp(150);
      $os.find(".icone-olho").removeClass("fa-eye").addClass("fa-eye-slash");
    }

    const $colabsBase = $painelDia
      .find(".painel_colaboradores .p_colabsDisp .colaborador")
      .filter(function () {
        return $(this).data("id") == id;
      });

    $colabsBase.each(function () {
      const $colabBase = $(this);
      $colabBase.find(".ocupadoEmOS div").filter(function () {
        return $(this).text().trim() == osID;
      }).remove();

      if ($colabBase.find(".ocupadoEmOS div").length === 0) {
        $colabBase.removeClass("colaboradorEmOS");
      }
    });
  }
}

export function handleConfirmarAlocacao({
  osID,
  idfuncionario,
  nome,
  idNaOS,
  status_integracao,
  dataDia
}) {

  const $painelDia = $(".painelDia").filter(function () {
    return $(this).attr("data-dia") === dataDia;
  });

  if ($painelDia.length === 0) return;

  const $painel = $painelDia.find(".painel_OS").filter(function () {
    return $(this).find(".lbl_OS").text().trim() == osID;
  });

  if ($painel.length === 0) return;

  let $colab = $painel.find(`.colaborador[data-id="${idfuncionario}"]`);

  // 🔥 renderiza SOMENTE aqui (confirmado no banco)
  if ($colab.length === 0) {
    adicionarColaboradorNaOS(idfuncionario, nome, $painel);
  }

  // 🔥 remove loading apenas do dia correto
  $painelDia
    .find(`.colaborador[data-id="${idfuncionario}"][data-loading="true"]`)
    .removeClass("salvando")
    .removeAttr("data-loading");

  // 🔧 aplica idNaOS
  $colab = $painel.find(`.colaborador[data-id="${idfuncionario}"]`);
  if ($colab.length) {
    $colab.attr("data-idnaos", idNaOS);

    // limpar classes antigas
    $colab.removeClass(
      "status-integracao-integrado status-integracao-pendente status-integracao-vencido status-integracao-atenção"
    );

    if (status_integracao) {
      const classe = `status-integracao-${status_integracao.toLowerCase()}`;
      $colab.addClass(classe);
    }
  }
}



export function handlePrioridadeOS({ osID, prioridade }) {
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