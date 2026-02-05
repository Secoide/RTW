// /public/client/js/events/dragdrop/handle-colaboradores-dragdrop.js
import {
  alocarColaboradores,
  removerColaboradores
} from "../../services/sockets/colaboradores-socket-service.js";

import { montarNomesParaEnviar, removerColaboradorDeOS }
  from "../../utils/dom/colaboradores-helpers.js";
// 🔎 você pode criar esse helpers.js ou ajustar conforme sua estrutura


export function initColaboradoresDragDrop() {
  // 🔁 remove todos os binds antigos antes de registrar novamente
  $(document).off(".colabDragDrop");
  const dragCounters = new WeakMap();
  let colaboradoresSelecionados = [];

  // dragstart
  $(document).on("dragstart.colabDragDrop", ".colaborador", function (e) {
    const id = $(this).attr("data-id");
    if (!id) {
      console.warn("⚠️ Nenhum ID encontrado no colaborador arrastado:", this);
      return;
    }

    let idsParaArrastar = [];

    if ($(this).hasClass("selecionado")) {
      idsParaArrastar = colaboradoresSelecionados.filter(Boolean);
    } else {
      idsParaArrastar = [id];
      colaboradoresSelecionados = [id];
      $(".colaborador").removeClass("selecionado");
      $(this).addClass("selecionado");
    }

    const origemPainelDia = $(this).closest(".painelDia");
    const dataOrigem = origemPainelDia.attr("data-dia");
    const dataOS = $(this).closest(".painel_OS").find(".p_infoOS").data("os");
    e.originalEvent.dataTransfer.setData("text/plain", JSON.stringify({
      ids: idsParaArrastar,
      dataOrigem: dataOrigem,
      osOrigem: dataOS
    }));

    $(".painelDia").each(function () {
      if ($(this).attr("data-dia") !== dataOrigem) {
        $(this).addClass("bloqueado");
      }
    });

    $(".p_colabs:visible").each(function () {
      dragCounters.set(this, 0);
      $(this).addClass("destino-highlight");
    });
  });

  // dragend
  $(document).on("dragend.colabDragDrop", ".colaborador", function () {
    resetDragVisual();
  });

  function resetDragVisual() {
    $(".painelDia").removeClass("bloqueado");
    $(".p_colabs")
      .removeClass("destino-highlight destino-validado");

    $(".colaborador").removeClass("selecionado");

    dragCounters.clear?.(); // se virar Map no futuro
  }





  // dragover
  $(document).on("dragover.colabDragDrop", ".p_colabs", e => e.preventDefault());

  // dragenter em .p_colabs
  $(document).on("dragenter.colabDragDrop", ".p_colabs", function () {
    let count = dragCounters.get(this) || 0;
    dragCounters.set(this, count + 1);
    $(this).addClass("destino-validado");
  });

  // dragleave em .p_colabs (controle por contador)
  $(document).on("dragleave.colabDragDrop", ".p_colabs", function () {
    let count = dragCounters.get(this) || 0;
    count = Math.max(0, count - 1);
    $(this).removeClass("destino-validado");

    if (count <= 0) {
      dragCounters.delete(this);
    } else {
      dragCounters.set(this, count);
    }
  });

  // dragenter em .painel_OS (abrir colabs ao arrastar)
  $(document).on("dragenter.colabDragDrop", ".painel_OS", function (e) {
    const $pColabs = $(this).find(".p_colabs")[0];
    let payload;

    try {
      payload = JSON.parse(e.originalEvent.dataTransfer.getData("text/plain"));
    } catch {
      payload = {};
    }

    const dataOrigem = payload?.dataOrigem;
    const dataDestino = $(this).closest(".painelDia").attr("data-dia");

    // ❌ não permite arrastar entre dias diferentes
    if (dataOrigem && dataOrigem !== dataDestino) return;

    // fecha outros abertos
    $(".p_colabs.aberta-por-hover").not($pColabs).each(function () {
      $(this).slideUp(150);
      $(this).removeClass("aberta-por-hover destino-highlight destino-validado");
      $(this).closest(".painel_OS").find(".icone-olho")
        .removeClass("fa-eye")
        .addClass("fa-eye-slash");
      dragCounters.delete(this);
    });

    $(".p_colabs").not($pColabs).removeClass("destino-validado");

    // abre o painel atual
    if (!$($pColabs).is(":visible")) {
      $($pColabs)
        .addClass("aberta-por-hover destino-highlight")
        .slideDown(150);
      $(this).find(".icone-olho")
        .removeClass("fa-eye-slash")
        .addClass("fa-eye");
    }

    $($pColabs).addClass("destino-validado");

    let count = dragCounters.get($pColabs) || 0;
    dragCounters.set($pColabs, count + 1);
  });

  // drop
  $(document).on("drop.colabDragDrop", ".p_colabs", function (e) {
    e.preventDefault();
    const payload = JSON.parse(e.originalEvent.dataTransfer.getData("text/plain"));

    $(".p_colabs").removeClass("destino-highlight destino-validado");

    const { ids, dataOrigem, osOrigem } = payload;

    const $destinoOS = $(this).closest(".painel_OS");
    const $painelDia = $(this).closest(".painelDia");
    const osID = $destinoOS.find(".lbl_OS").text().trim();
    const descOS = $destinoOS.find(".lbl_descricaoOS").text();
    const cliente = $destinoOS.find(".lbl_clienteOS").text();
    const dataDestino = $painelDia.attr("data-dia");
    const osDestino = $destinoOS.find(".p_infoOS").data("os");

    // 🛑 DROP NA MESMA ORIGEM → apenas reset visual
    if (!osDestino && !osOrigem) {
      resetDragVisual();
      return;
    }

    if (osDestino === osOrigem) {
      resetDragVisual();
      return;
    }
    if (dataOrigem !== dataDestino) {
      alert("Não é permitido mover colaboradores entre dias diferentes.");
      return;
    }

    ids.forEach(id => {
      // tenta achar o colaborador no painel do dia, em qualquer lugar
      let $colabBase = $painelDia.find(`.colaborador[data-id="${id}"]`).first();

      if ($colabBase.length) {
        const nome = $colabBase.find(".nome").text().trim();

        // mostra na área de disponíveis que ele está ocupado (se aplicável)
        const $colabDisp = $painelDia.find(`.p_colabsDisp .colaborador[data-id="${id}"]`);
        if ($colabDisp.length) {
          $colabDisp.find(".ocupadoEmOS")
            .html(`<div title="${descOS} - ${cliente}">${osID}</div>`);
          $colabDisp.addClass("colaboradorEmOS");
        }

        // se ele já estava em outra OS, remove de lá
        const $osOrigem = $painelDia.find(`.painel_OS .p_colabs .colaborador[data-id="${id}"]`).closest(".painel_OS");
        const idOSOrigem = $osOrigem.find(".p_infoOS").data("os");

        if ($osOrigem.length && idOSOrigem && idOSOrigem !== osID) {
          removerColaboradorDeOS(id, idOSOrigem, $painelDia);
          removerColaboradores(idOSOrigem, dataOrigem, [id]);
        }

        // adiciona ao destino se ainda não está
        const jaExiste = $destinoOS.find(`.p_colabs .colaborador[data-id="${id}"]`).length > 0;

        if (!jaExiste) {
          adicionarColaboradorNaOS(id, nome, $destinoOS, dataOrigem);
        }
      }
    });

    // 🔄 chamada via service (alocação na OS destino)
    const nomesParaEnviar = montarNomesParaEnviar(ids, $painelDia);
    alocarColaboradores(osID, dataDestino, nomesParaEnviar);

    colaboradoresSelecionados = [];
    $(".colaborador").removeClass("selecionado");
  });


}
