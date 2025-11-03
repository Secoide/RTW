// /public/client/js/events/contextmenu/handle-colaboradores-contextmenu.js
import { carregarColaboradoresDisp, carregarOSComColaboradores } from "../../services/api/programacao-service.js";
import { get_carregarPerfilUsuario } from "../click/handle-abrir-info-colab.js";
import { open_form_AnexarCurso } from "../forms/anexarCurso.js";
import { open_form_AnexarExame } from "../forms/anexarExame.js";
import { open_form_AnexarEPI } from "../forms/anexarEPI.js";
import { open_form_AnexarIntegracao } from "../forms/anexarIntegracao.js";

// ========================================================
// 🔧 Funções utilitárias globais
// ========================================================

function criarMenuContextual(e, opcoesMenu) {
  $(".menuMouseDir").remove();

  const menu = $('<div class="menuMouseDir"></div>').css({
    top: e.pageY,
    left: e.pageX,
    zIndex: 9999
  });

  const addSeparator = () => {
    menu.append(
      '<div class="menu-separador" style="color:#c0c0c0ff;font-size:8px;text-align:center;user-select:none;pointer-events:none;">────────────────────</div>'
    );
  };

  opcoesMenu.forEach(item => {
    if (!item) return;
    if (item === "SEPARADOR") return addSeparator();

    const option = $('<div class="opcao-menu"></div>').html(item.label);
    option.on("click", () => {
      item.action?.();
      menu.remove();
    });
    menu.append(option);
  });

  $("body").append(menu);
  setTimeout(() => $(document).one("click", () => menu.remove()), 0);
}

async function registrarFaltaIndevida($colab, funcID, dataDia, socket, osID, fnoID) {
  $colab.addClass("falta-indevida");

  try {
    await $.post("/api/colaboradores/atestar", {
      periodoinicial: dataDia,
      periodofinal: dataDia,
      atestado: "Falta-Indevida",
      descricaoatest: "",
      idColab: funcID
    });

    $colab.remove();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          acao: "excluir_colaboradorEmOS",
          osID,
          id: funcID,
          idNaOS: fnoID,
          data: dataDia
        })
      );
    }

    await Promise.all(
      [...document.querySelectorAll(".painelDia")].map(async painel => {
        await carregarColaboradoresDisp(painel, true);
        await carregarOSComColaboradores(painel);
      })
    );

    Swal.fire({
      toast: true,
      icon: "success",
      theme: "dark",
      title: "Falta indevida registrada",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  } catch {
    alert("Erro de comunicação com o servidor.");
  }
}

function removerDaOS($colab, socket, osID, funcID, fnoID, dataDia) {
  $colab.remove();
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        acao: "excluir_colaboradorEmOS",
        osID,
        id: funcID,
        idNaOS: fnoID,
        data: dataDia
      })
    );
  }
}

function abrirIntegracao(funcID) {
  get_carregarPerfilUsuario(funcID);
  setTimeout(() => {
    $('.cad a.bt_menu[data-target=".painel_integra"]').trigger("click");
  }, 400);
}

function removerSupervisor(osID, dataDia, $colab) {
  $.ajax({
    url: `/api/colaboradores/remover-supervisor/${osID}/${dataDia}`,
    method: "DELETE",
    success: () => $colab.removeClass("supervisor"),
    error: err => {
      console.error("❌ Erro ao remover supervisor:", err);
      alert("Erro ao remover supervisor.");
    }
  });
}

function definirSupervisor(fnoID, osID, dataDia, $painelOS, $colab) {
  $.ajax({
    url: `/api/colaboradores/setar-supervisor/${fnoID}`,
    method: "PUT",
    data: JSON.stringify({ osID, dataDia }),
    contentType: "application/json",
    success: () => {
      $painelOS.find(".p_colabs .colaborador").removeClass("supervisor");
      $colab.addClass("supervisor");
    },
    error: err => {
      console.error("❌ Erro ao definir supervisor:", err);
      alert("Erro ao definir supervisor.");
    }
  });
}

// ========================================================
// 🧩 Inicializador principal de menus
// ========================================================

export function initColaboradoresContextMenu(socket) {
  // --------------------------------------------------------
  // MENU: Colaboradores em OS
  // --------------------------------------------------------
  $(document).on("contextmenu", ".p_colabs .colaborador", function (e) {
    e.preventDefault();

    const $colab = $(this);
    const funcID = $colab.data("id");
    const fnoID = $colab.data("idnaos");
    const $painelOS = $colab.closest(".painel_OS");
    const osID = $painelOS.find(".p_infoOS").data("os");
    const dataDia = $painelOS.closest(".painelDia").attr("data-dia");
    const jaESupervisor = $colab.hasClass("supervisor");
    const precisaAttIntegracao =
      $colab.hasClass("status-integracao-vencido") ||
      $colab.hasClass("status-integracao-atenção");

    const opcoesMenu = [
      { label: "👤 Perfil", action: () => get_carregarPerfilUsuario(funcID) },
      "SEPARADOR",
      jaESupervisor
        ? { label: "⭐ Remover Supervisor", action: () => removerSupervisor(osID, dataDia, $colab) }
        : { label: "⭐ Tornar Supervisor", action: () => definirSupervisor(fnoID, osID, dataDia, $painelOS, $colab) },
      { label: "🚫 Marcar Falta Indevida", action: () => registrarFaltaIndevida($colab, funcID, dataDia, socket, osID, fnoID) },
      ...(precisaAttIntegracao
        ? [{ label: "📜 Verificar Integração", action: () => abrirIntegracao(funcID) }]
        : []),
      "SEPARADOR",
      { label: "❌ Remover da OS", action: () => removerDaOS($colab, socket, osID, funcID, fnoID, dataDia) }
    ];

    criarMenuContextual(e, opcoesMenu);
  });

  // --------------------------------------------------------
  // MENU: Colaboradores disponíveis
  // --------------------------------------------------------
  $(document).on("contextmenu", ".p_colabsDisp .colaborador", function (e) {
    e.preventDefault();

    const $colab = $(this);
    const funcID = $colab.data("id");
    const $painelDia = $colab.closest(".painelDia");
    const dataDia = $painelDia.attr("data-dia");

    const opcoesMenu = [
      { label: "👤 Perfil", action: () => get_carregarPerfilUsuario(funcID) },
      "SEPARADOR",
      {
        label: "🚫 Marcar Falta Indevida",
        action: () => registrarFaltaIndevida($colab, funcID, dataDia, socket)
      }
    ];

    criarMenuContextual(e, opcoesMenu);
  });

  // --------------------------------------------------------
  // MENU: RH tabela colaboradores
  // --------------------------------------------------------
  $(document).on("contextmenu", ".rh_tb_lin_colob", function (e) {
    e.preventDefault();

    const $colab = $(this);
    const funcID = $colab.data("id");

    const opcoesMenu = [
      { label: "👤 Perfil", action: () => get_carregarPerfilUsuario(funcID) },
      "SEPARADOR",
      { label: "🥾 Registrar EPI", action: () => open_form_AnexarEPI(funcID) },
      { label: "🩺 Anexar Exame", action: () => open_form_AnexarExame(funcID) },
      { label: "📚 Anexar Curso", action: () => open_form_AnexarCurso(funcID) },
      { label: "🗃️ Anexar Integração", action: () => open_form_AnexarIntegracao(funcID) },
      "SEPARADOR",
      {
        label: "🚫 Marcar Falta Indevida",
        action: () => {
          const $date = $('<input type="date" style="position:absolute;left:-9999px;">').appendTo("body");
          $date.on("change", function () {
            const dataSel = this.value;
            $colab.addClass("falta-indevida");

            $.post("/api/colaboradores/atestar", {
              periodoinicial: dataSel,
              periodofinal: dataSel,
              atestado: "Falta Indevida",
              descricaoatest: "",
              idColab: funcID
            })
              .done(res => res.sucesso
                ? alert("Falta indevida registrada!")
                : alert("Erro: " + res.mensagem))
              .fail(() => alert("Erro de comunicação."))
              .always(() => $date.remove());
          });
          $date.trigger("focus").trigger("click");
        }
      },
      "SEPARADOR",
      { label: "🏴 Desligar colaborador", action: () => open_form_AnexarExame(funcID, 3) }
    ];

    criarMenuContextual(e, opcoesMenu);
  });

  // --------------------------------------------------------
  // MENU: Painel de vencimento de exames
  // --------------------------------------------------------
  $(document).on("contextmenu", ".painel_vencimento_exames .bloco_exame", function (e) {
    e.preventDefault();

    const idColab = $("#idColaboradorPro").val();
    const idExame = $(this).data("idexame");
    const idFuncionarioExame = $(this).data("idfce");

    const opcoesMenu = [
      { label: "🔄 Atualizar Exame", action: () => open_form_AnexarExame(idColab, idExame) },
      {
        label: "🧾 Visualizar Exame",
        action: async () => {
          if (!idFuncionarioExame) return;
          try {
            const res = await fetch(`/api/exame/download/${idFuncionarioExame}`, { method: "HEAD", credentials: "include" });
            if (!res.ok) {
              let msg = "Erro ao visualizar exame.";
              if (res.status === 400) msg = "Nenhum PDF anexado para este exame.";
              if (res.status === 404) msg = "Exame ou arquivo não encontrado.";
              return Swal.fire({ icon: "warning", title: "Atenção", theme: "dark", text: msg });
            }
            window.open(`/api/exame/download/${idFuncionarioExame}`, "_blank");
          } catch (err) {
            Swal.fire({ icon: "error", title: "Erro", theme: "dark", text: err.message });
          }
        }
      },
      "SEPARADOR"
    ];

    criarMenuContextual(e, opcoesMenu);
  });

  // --------------------------------------------------------
  // MENU: Painel de vencimento de cursos
  // --------------------------------------------------------
  $(document).on("contextmenu", ".painel_vencimento_cursos .bloco_curso", function (e) {
    e.preventDefault();

    const idColab = $("#idColaboradorPro").val();
    const idCurso = $(this).data("idcurso");
    const idFuncionarioCurso = $(this).data("idfcc");

    const opcoesMenu = [
      { label: "🔄 Atualizar Curso", action: () => open_form_AnexarExame(idColab, idCurso) },
      {
        label: "🧾 Visualizar Curso",
        action: async () => {
          if (!idFuncionarioCurso) return;
          try {
            const res = await fetch(`/api/curso/download/${idFuncionarioCurso}`, { method: "HEAD", credentials: "include" });
            if (!res.ok) {
              let msg = "Erro ao visualizar curso.";
              if (res.status === 400) msg = "Nenhum PDF anexado para este curso.";
              if (res.status === 404) msg = "Curso ou arquivo não encontrado.";
              return Swal.fire({ icon: "warning", title: "Atenção", theme: "dark", text: msg });
            }
            window.open(`/api/curso/download/${idFuncionarioCurso}`, "_blank");
          } catch (err) {
            Swal.fire({ icon: "error", title: "Erro", theme: "dark", text: err.message });
          }
        }
      },
      "SEPARADOR"
    ];

    criarMenuContextual(e, opcoesMenu);
  });

  // --------------------------------------------------------
  // MENU: Painel de vencimento de integrações
  // --------------------------------------------------------
  $(document).on("contextmenu", ".painel_vencimento_integracoes .bloco_integracao", function (e) {
    e.preventDefault();

    const idColab = $("#idColaboradorPro").val();
    const idEmpresa = $(this).data("idempresa");
    const idFuncionarioIntegracao = $(this).data("idfci");

    const opcoesMenu = [
      { label: "🔄 Atualizar Integração", action: () => open_form_AnexarIntegracao(idColab, idEmpresa) },
      {
        label: "🧾 Visualizar Integração",
        action: async () => {
          if (!idFuncionarioIntegracao) return;
          try {
            const res = await fetch(`/api/integracao/download/${idFuncionarioIntegracao}`, { method: "HEAD", credentials: "include" });
            if (!res.ok) {
              let msg = "Erro ao visualizar integração.";
              if (res.status === 400) msg = "Nenhum PDF anexado para esta integração.";
              if (res.status === 404) msg = "Integração ou arquivo não encontrado.";
              return Swal.fire({ icon: "warning", title: "Atenção", theme: "dark", text: msg });
            }
            window.open(`/api/integracao/download/${idFuncionarioIntegracao}`, "_blank");
          } catch (err) {
            Swal.fire({ icon: "error", title: "Erro", theme: "dark", text: err.message });
          }
        }
      },
      "SEPARADOR"
    ];

    criarMenuContextual(e, opcoesMenu);
  });
}
