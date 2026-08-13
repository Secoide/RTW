import { getSocket } from "./socket-service.js";
import { atualizarPainel } from "../../utils/dom/atualizar-painel.js";

function notificarSessaoExpirada() {
  if (typeof window.encerrarSessaoExpirada === "function") {
    window.encerrarSessaoExpirada();
    return;
  }

  document.dispatchEvent(new CustomEvent("auth:session-expired"));
}

function notificarFalhaSocket(mensagem) {
  document.dispatchEvent(new CustomEvent("ws:action-failed", {
    detail: { mensagem }
  }));
}

async function sessaoAtiva() {
  try {
    const res = await fetch("/api/auth/status", {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    });

    if (res.status === 401) {
      if (typeof window.tratarErro401 === "function") {
        await window.tratarErro401();
        return false;
      }

      notificarSessaoExpirada();
      return false;
    }

    if (!res.ok) {
      notificarFalhaSocket("Nao foi possivel confirmar sua sessao. Atualize a pagina e tente novamente.");
      return false;
    }

    return true;
  } catch (err) {
    notificarFalhaSocket("Falha de conexao ao confirmar a sessao.");
    return false;
  }
}

// =============================
// ENVIO PARA O SERVIDOR
// =============================
export async function alocarColaboradores(osID, dataDia, nomes) {
  const socket = getSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    notificarFalhaSocket("Sem conexao com o servidor. A programacao nao foi salva.");
    return false;
  }

  const podeEnviar = await sessaoAtiva();
  if (!podeEnviar) return false;

  socket.send(JSON.stringify({
    acao: "alocar_colaborador",
    osID,
    dataDia,
    nomes,
  }));

  return true;
}

export async function transferirColaboradores(colaboradores, datas) {
  const socket = getSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    notificarFalhaSocket("Sem conexao com o servidor. A transferencia nao foi salva.");
    return false;
  }

  const podeEnviar = await sessaoAtiva();
  if (!podeEnviar) return false;

  socket.send(JSON.stringify({
    acao: "transferir_colaboradores",
    colaboradores, // [{ idColab, idOS, nome }]
    datas          // ["2025-10-01", "2025-10-02"]
  }));

  return true;
}

export async function removerColaboradores(osID, dataDia, ids) {
  const socket = getSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    notificarFalhaSocket("Sem conexao com o servidor. A remocao nao foi salva.");
    return false;
  }

  const podeEnviar = await sessaoAtiva();
  if (!podeEnviar) return false;

  ids.forEach((id) => {
    socket.send(JSON.stringify({
      acao: "remover_colaborador",
      osID,
      id,
      dataDia,   // 👈 padronizado
    }));
  });

  return true;
}

export async function excluirColaboradorDaOS(osID, idColaborador, idNaOS, dataDia) {
  const socket = getSocket();
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    notificarFalhaSocket("Sem conexao com o servidor. A exclusao nao foi salva.");
    return false;
  }

  const podeEnviar = await sessaoAtiva();
  if (!podeEnviar) return false;

  socket.send(JSON.stringify({
    acao: "excluir_colaboradorEmOS",
    osID,
    id: idColaborador,
    idNaOS,
    dataDia,   // 👈 padronizado
  }));

  return true;
}

// =============================
// RECEBIMENTO DO SERVIDOR
// =============================

function getPainelDia(dataDia) {
  return $(".painelDia").filter(function () {
    return $(this).attr("data-dia") == dataDia;
  });
}

function getPainelOS($painelDia, osID) {
  return $painelDia.find(".painel_OS").filter(function () {
    return $(this).find(".p_infoOS").data("os") == osID || $(this).find(".lbl_OS").text().trim() == osID;
  }).first();
}

function atualizarTotalColaboradoresOS($os) {
  const total = $os.find(".p_colabs .colaborador").length;
  $os.find(".lbl_total").text(total);

  if (total === 0) {
    $os.addClass("os_semColab");
    $os.find(".p_colabs").slideUp(150);
    $os.find(".icone-olho").removeClass("fa-eye").addClass("fa-eye-slash");
  } else {
    $os.removeClass("os_semColab");
    $os.find(".p_colabs").show();
    $os.find(".icone-olho").removeClass("fa-eye-slash").addClass("fa-eye");
  }
}

function atualizarOcupacaoColaboradorBase($painelDia, idColab, osID) {
  const $colabsBase = $painelDia
    .find(".painel_colaboradores .p_colabsDisp .colaborador")
    .filter(function () {
      return $(this).data("id") == idColab;
    });

  $colabsBase.each(function () {
    const $colabBase = $(this);
    const $ocupado = $colabBase.find(".ocupadoEmOS");
    $ocupado.find("div").remove();
    $ocupado.append(`<div>${osID}</div>`);
    $colabBase.addClass("colaboradorEmOS");
  });
}

function limparOcupacaoColaboradorBase($painelDia, idColab, osID) {
  const $colabsBase = $painelDia
    .find(".painel_colaboradores .p_colabsDisp .colaborador")
    .filter(function () {
      return $(this).data("id") == idColab;
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

function adicionarColaboradorNaOS(idColab, nome, $destinoOS) {
  if (!$destinoOS?.length) return $();

  const $painelDia = $destinoOS.closest(".painelDia");
  const $base = $painelDia
    .find(".painel_colaboradores .p_colabsDisp .colaborador")
    .filter(function () {
      return $(this).data("id") == idColab;
    })
    .first();

  let $novo;
  if ($base.length) {
    $novo = $base.clone(false, false);
    $novo.find(".ocupadoEmOS div").remove();
  } else {
    $novo = $(`
      <div class="colaborador areaRestrita" draggable="true" data-id="${idColab}" data-nome="${nome || ""}">
        <i class="exame_ok fa-solid fa-circle areaRestrita" title="Exames em dia"></i>
        <p class="nome areaRestrita" title="${nome || ""}">${nome || ""}</p>
        <i class="bt_tirarColab fa-solid fa-x areaRestrita"></i>
        <p class="ocupadoEmOS areaRestrita"></p>
      </div>
    `);
  }

  $novo
    .removeClass("colaboradorEmOS salvando selecionado")
    .removeAttr("data-loading")
    .attr("data-id", idColab)
    .attr("data-nome", nome || $novo.data("nome") || "");

  if (!$novo.find(".bt_tirarColab").length) {
    $novo.append('<i class="bt_tirarColab fa-solid fa-x areaRestrita"></i>');
  }

  const $lista = $destinoOS.find(".p_colabs").first();
  const $busca = $lista.find(".buscarColab").first();
  if ($busca.length) $novo.insertBefore($busca);
  else $lista.append($novo);

  atualizarTotalColaboradoresOS($destinoOS);
  return $novo;
}

export function handleAlocarColaborador({ osID, nomes, dataDia }) {
  const $painelDia = getPainelDia(dataDia);
  const $destinoOS = getPainelOS($painelDia, osID);

  nomes.forEach(({ id, nome }) => {
    const jaExiste = $destinoOS.find(".p_colabs .colaborador").filter(function () {
      return $(this).data("id") == id;
    }).length > 0;

    if (!jaExiste) {
      adicionarColaboradorNaOS(id, nome, $destinoOS);
    }

    atualizarOcupacaoColaboradorBase($painelDia, id, osID);
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

      atualizarOcupacaoColaboradorBase($painelDia, idColab, idOS);
    });

    atualizarPainel($painelDia);
  });
}

export function handleRemoverColaborador({ osID, id, dataDia }) {
  const $painelDia = getPainelDia(dataDia);
  const $os = getPainelOS($painelDia, osID);

  if ($os.length === 0) return;

  const $colabRemovido = $os.find(".p_colabs .colaborador").filter(function () {
    return $(this).data("id") == id;
  });

  if ($colabRemovido.length > 0) {
    $colabRemovido.remove();
    atualizarTotalColaboradoresOS($os);
  }

  limparOcupacaoColaboradorBase($painelDia, id, osID);
  atualizarPainel($painelDia);
}

export function handleConfirmarAlocacao({
  osID,
  idfuncionario,
  nome,
  idNaOS,
  status_integracao,
  dataDia
}) {

  const $painelDia = getPainelDia(dataDia);

  if ($painelDia.length === 0) return;

  const $painel = getPainelOS($painelDia, osID);

  if ($painel.length === 0) return;

  $painelDia.find(".painel_OS").not($painel).each(function () {
    const $os = $(this);
    const $colabsRemovidos = $os.find(`.p_colabs .colaborador[data-id="${idfuncionario}"]`);
    if (!$colabsRemovidos.length) return;

    $colabsRemovidos.remove();

    atualizarTotalColaboradoresOS($os);
  });

  let $colab = $painel.find(`.colaborador[data-id="${idfuncionario}"]`);
  const nomeConfirmado = nome || $painelDia
    .find(`.painel_colaboradores .p_colabsDisp .colaborador[data-id="${idfuncionario}"] .nome`)
    .first()
    .text()
    .trim();

  // 🔥 renderiza SOMENTE aqui (confirmado no banco)
  if ($colab.length === 0) {
    adicionarColaboradorNaOS(idfuncionario, nomeConfirmado, $painel);
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

  atualizarOcupacaoColaboradorBase($painelDia, idfuncionario, osID);
  atualizarTotalColaboradoresOS($painel);
  atualizarPainel($painelDia);
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
