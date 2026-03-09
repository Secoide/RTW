// /public/client/js/events/contextmenu/handle-colaboradores-contextmenu.js
import { carregarColaboradoresDisp, carregarOSComColaboradores } from "../../services/api/programacao-service.js";
import { get_carregarPerfilUsuario } from "../click/handle-abrir-info-colab.js";
import { open_form_AnexarCurso } from "../forms/anexarCurso.js";
import { open_form_AnexarExame } from "../forms/anexarExame.js";
import { open_form_AgendarExame } from "../forms/agendarExame.js";
import { open_form_AnexarEPI } from "../forms/anexarEPI.js";
import { open_form_AnexarIntegracao } from "../forms/anexarIntegracao.js";
import { preencherTabelaColaboradoresRH } from "../../bootstrap/rh-init.js";
import { formatarTelefoneParaWhatsApp } from "../../utils/formatters/number-format.js";

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

    if (item === "SEPARADOR") {
      return addSeparator();
    }

    const option = $('<div class="opcao-menu"></div>')
      .html(item.label)
      .attr("data-roles", item.roles === "*" ? "*" : item.roles.join(","));

    option.on("click", () => {
      item.action?.();
      menu.remove();
    });

    menu.append(option);
  });

  $("body").append(menu);
  setTimeout(() => $(document).one("click", () => menu.remove()), 0);
}


const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});


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

async function abrirIntegracao(funcID) {
  await get_carregarPerfilUsuario(funcID);
  $('.cad a.bt_menu[data-target=".painel_integra"]').trigger("click");
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

function cancelarAgendamentoExame(idfce) {
  if (!idfce) {
    console.error("❌ ID do exame não informado.");
    return;
  }

  $.ajax({
    url: `/api/exame/cancelar-exame/${idfce}`,
    type: "DELETE",
    success: function (response) {
      Toast.fire({
        icon: "success",
        theme: "dark",
        title: "Agendamento de exame cancelado."
      });
      preencherTabelaColaboradoresRH();

      const botaoMenu = document.querySelector('.bt_menu[data-target=".painel_exames"]');
      if (botaoMenu) {
        botaoMenu.click();
      }
    },
    error: function (err) {
      Toast.fire({
        icon: "error",
        theme: "dark",
        title: "Não foi possível cancelar o agendamento de exame."
      });
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
      {
        label: "👤 Perfil",
        roles: "*", action: () => get_carregarPerfilUsuario(funcID)
      },
      "SEPARADOR",
      jaESupervisor
        ? {
          label: "⭐ Remover Supervisor",
          roles: [6, 7, 99], action: () => removerSupervisor(osID, dataDia, $colab)
        }
        : {
          label: "⭐ Tornar Supervisor",
          roles: [6, 7, 99], action: () => definirSupervisor(fnoID, osID, dataDia, $painelOS, $colab)
        },
      {
        label: "🚫 Marcar Falta Indevida",
        roles: [4, 6, 7, 99], action: () => registrarFaltaIndevida($colab, funcID, dataDia, socket, osID, fnoID)
      },
      ...(precisaAttIntegracao
        ? [{
          label: "📜 Verificar Integração",
          roles: "*", action: () => abrirIntegracao(funcID)
        }]
        : []),
      "SEPARADOR",
      {
        label: "❌ Remover da OS",
        roles: [6, 7, 99], action: () => removerDaOS($colab, socket, osID, funcID, fnoID, dataDia)
      }
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
      {
        label: "👤 Perfil",
        roles: "*", action: () => get_carregarPerfilUsuario(funcID)
      },
      "SEPARADOR",
      {
        label: "🚫 Marcar Falta Indevida",
        roles: [4, 6, 7, 99],
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
      {
        label: "👤 Perfil",
        roles: "*", action: () => get_carregarPerfilUsuario(funcID)
      },
      "SEPARADOR",
      {
        label: "🥾 Registrar EPI",
        roles: [5, 6, 7, 99], action: () => open_form_AnexarEPI(funcID)
      },
      {
        label: "🩺 Anexar Exame",
        roles: [4, 99], action: () => open_form_AnexarExame(funcID)
      },
      {
        label: "📚 Anexar Curso",
        roles: [4, 99], action: () => open_form_AnexarCurso(funcID)
      },
      "SEPARADOR",
      {
        label: "🚫 Marcar Falta Indevida",
        roles: [4, 5, 6, 7, 99],
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
      {
        label: "🏴 Desligar colaborador",
        roles: [4, 6, 7, 99], action: () => open_form_AnexarExame(funcID, 3)
      }
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
    const opcoesMenu = [];

    const jaEAgendado = $(this).hasClass("status-agendado");

    const confirmarExclusaoExame = async (idFuncionarioExame, idExame) => {
      if (!idFuncionarioExame) return;

      const isAdmissional = idExame === 1;

      const result = await Swal.fire({
        title: "Apagar?",
        text: isAdmissional
          ? "⚠️ Este é um exame ADMISSIONAL. Ao excluir, adicione o quanto antes um novo exame admissional para não gerar falhas nos processos do sistema."
          : "Deseja realmente apagar este exame?",
        icon: "warning",
        theme: "dark",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, apagar!",
        cancelButtonText: "Cancelar"
      });

      if (!result.isConfirmed) return;

      try {
        const res = await fetch(`/api/exame/excluir/colaborador/${idFuncionarioExame}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (!res.ok) {
          return Toast.fire({
            icon: "error",
            theme: "dark",
            title: "Não foi possível excluir o exame."
          });
        }

        preencherTabelaColaboradoresRH();
        document
          .querySelector('.bt_menu[data-target=".painel_exames"]')
          ?.click();

        Toast.fire({
          icon: "success",
          theme: "dark",
          title: isAdmissional
            ? "Exame admissional excluído. Não esqueça de cadastrar um novo!"
            : "Exame excluído!"
        });

      } catch (err) {
        Toast.fire({
          icon: "error",
          theme: "dark",
          title: err.message
        });
      }
    };


    const visualizarExame = async (idFuncionarioExame) => {
      if (!idFuncionarioExame) return;

      try {
        const res = await fetch(`/api/exame/download/${idFuncionarioExame}`, {
          method: "HEAD",
          credentials: "include"
        });

        if (!res.ok) {
          const mensagens = {
            400: "Nenhum PDF anexado para este exame.",
            404: "Exame ou arquivo não encontrado."
          };

          return Toast.fire({
            icon: "warning",
            theme: "dark",
            title: mensagens[res.status] || "Erro ao visualizar exame."
          });
        }

        window.open(`/api/exame/download/${idFuncionarioExame}`, "_blank");

      } catch (err) {
        Toast.fire({
          icon: "error",
          theme: "dark",
          title: err.message
        });
      }
    };

    // ---------- Montagem do menu ----------
    if (idExame !== 1) {
      opcoesMenu.push({
        label: "🔄 Atualizar Exame",
        roles: [4, 7, 99],
        action: () => open_form_AnexarExame(idColab, idExame)
      });
    }

    opcoesMenu.push(
      jaEAgendado
        ? {
          label: "✖️ Cancelar Exame",
          roles: [6, 7, 99], action: () => cancelarAgendamentoExame(idFuncionarioExame)
        }
        : {
          label: "🗓️ Agendar Exame",
          roles: [6, 7, 99], action: () => open_form_AgendarExame(idColab, idFuncionarioExame)
        },
      {
        label: "🧾 Visualizar Exame",
        roles: "*", // todos podem
        action: () => visualizarExame(idFuncionarioExame)
      },
      "SEPARADOR",
      {
        label: "❌ Apagar Exame",
        roles: [4, 7, 99],
        action: () => confirmarExclusaoExame(idFuncionarioExame, idExame)
      }
    );

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
      {
        label: "🔄 Atualizar Curso",
        roles: [4, 7, 99], action: () => open_form_AnexarExame(idColab, idCurso)
      },
      {
        label: "🧾 Visualizar Curso",
        roles: "*",
        action: async () => {
          if (!idFuncionarioCurso) return;
          try {
            const res = await fetch(`/api/curso/download/${idFuncionarioCurso}`, { method: "HEAD", credentials: "include" });
            if (!res.ok) {
              let msg = "Erro ao visualizar curso.";
              if (res.status === 400) msg = "Nenhum PDF anexado para este curso.";
              if (res.status === 404) msg = "Curso ou arquivo não encontrado.";
              return Toast.fire({
                icon: "warning",
                theme: 'dark',
                title: msg
              });
            }
            window.open(`/api/curso/download/${idFuncionarioCurso}`, "_blank");
          } catch (err) {
            Toast.fire({
              icon: "error",
              theme: 'dark',
              title: err.message
            });
          }
        }
      },
      "SEPARADOR",
      {
        label: "❌ Apagar Curso",
        roles: [4, 99],
        action: async () => {
          if (!idFuncionarioCurso) return;

          const result = await Swal.fire({
            title: "Apagar?",
            text: "Deseja realmente apagar este curso?",
            icon: "warning",
            theme: "dark",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, apagar!"
          });

          if (result.isConfirmed) {
            try {
              const res = await fetch(`/api/curso/excluir/colaborador/${idFuncionarioCurso}`, {
                method: "DELETE",
                credentials: "include"
              });

              if (res.ok) {

                preencherTabelaColaboradoresRH();
                document.querySelector('.bt_menu[data-target=".painel_cursos"]').click();
                Toast.fire({
                  icon: "success",
                  theme: 'dark',
                  title: "Curso excluído!"
                });
              } else {
                Toast.fire({
                  icon: "error",
                  theme: 'dark',
                  title: "Não foi possível excluir o curso."
                });
              }
            } catch (err) {
              Toast.fire({
                icon: "error",
                theme: 'dark',
                title: err.message
              });
            }
          }
        }
      }
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
      {
        label: "🔄 Atualizar Integração",
        roles: [4, 6, 7, 99], action: () => open_form_AnexarIntegracao(idColab, idEmpresa)
      },
      {
        label: "🧾 Visualizar Integração",
        roles: "*",
        action: async () => {
          if (!idFuncionarioIntegracao) return;
          try {
            const res = await fetch(`/api/integracao/download/${idFuncionarioIntegracao}`, { method: "HEAD", credentials: "include" });
            if (!res.ok) {
              let msg = "Erro ao visualizar integração.";
              if (res.status === 400) msg = "Nenhum PDF anexado para esta integração.";
              if (res.status === 404) msg = "Integração ou arquivo não encontrado.";
              return Toast.fire({
                icon: "warning",
                theme: 'dark',
                title: msg
              });
            }
            window.open(`/api/integracao/download/${idFuncionarioIntegracao}`, "_blank");
          } catch (err) {
            Toast.fire({
              icon: "error",
              theme: 'dark',
              title: err.mensagem
            });
          }
        }
      },
      "SEPARADOR", {
        label: "❌ Apagar Integração",
        roles: [4, 99],
        action: async () => {
          if (!idFuncionarioIntegracao) return;

          const result = await Swal.fire({
            title: "Apagar?",
            text: "Deseja realmente apagar esta integração?",
            icon: "warning",
            theme: "dark",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, apagar!"
          });

          if (result.isConfirmed) {
            try {
              const res = await fetch(`/api/integracao/excluir/${idFuncionarioIntegracao}`, {
                method: "DELETE",
                credentials: "include"
              });

              if (res.ok) {

                preencherTabelaColaboradoresRH();
                document.querySelector('.bt_menu[data-target=".painel_integra"]').click();
                Toast.fire({
                  icon: "success",
                  theme: 'dark',
                  title: "Integração excluída!"
                });
              } else {
                Toast.fire({
                  icon: "error",
                  theme: 'dark',
                  title: "Não foi possível excluir a integração."
                });
              }
            } catch (err) {
              Toast.fire({
                icon: "error",
                theme: 'dark',
                title: err.message
              });
            }
          }
        }
      }
    ];

    criarMenuContextual(e, opcoesMenu);
  });


  // --------------------------------------------------------
  // MENU: Painel de EPI
  // --------------------------------------------------------
  $(document).on("contextmenu", ".painel_epiGeral .status_EPI", function (e) {
    e.preventDefault();

    const idColab = $("#idColaboradorPro").val();
    const telefone = $("#telefone").val();
    const idFuncionarioEPI = $(this).data("idfcepi");
    const idEPI = $(this).data("idepi");

    // 🔹 Obtém o nome e formata (somente a primeira letra maiúscula)
    let epi = $(this).find(".nomeEPI").text().trim().toLowerCase();
    epi = epi.charAt(0).toUpperCase() + epi.slice(1);

    // 🔹 Define ícone conforme o tipo de EPI
    let icone = "🧤"; // padrão
    if ($(this).hasClass("status_fone")) icone = "🎧";
    else if ($(this).hasClass("status_capacete")) icone = "🪖";
    else if ($(this).hasClass("status_oculos")) icone = "👓";
    else if ($(this).hasClass("status_luva")) icone = "🧤";
    else if ($(this).hasClass("status_sapato")) icone = "🥾";
    else if ($(this).hasClass("status_mascara")) icone = "😷";
    else if ($(this).hasClass("status_colete")) icone = "🦺";
    else if ($(this).hasClass("status_calca")) icone = "👖";
    else if ($(this).hasClass("status_jaleco")) icone = "👕";

    // 🔹 Verifica o status do EPI (texto dentro do span .statusEPI)
    const statusTexto = $(this).find(".statusEPI").text().trim().toLowerCase();
    // 🔹 Define opções do menu conforme o status
    const opcoesMenu = [];

    if (statusTexto.includes("não entregue!")) {
      // Somente Registrar
      opcoesMenu.push({
        label: `${icone} Registrar ${epi}`,
        roles: [4, 5, 6, 7, 99],
        action: () => {
          open_form_AnexarEPI(idColab, idEPI);
        }
      });
    } else if (statusTexto.includes("realizar troca!") || statusTexto.includes("apto para uso!") || statusTexto.includes("avaliar!")) {
      // Somente Atualizar
      opcoesMenu.push({
        label: `${icone} Atualizar ${epi}`,
        roles: [4, 5, 6, 7, 99],
        action: () => {
          open_form_AnexarEPI(idColab, idEPI);
        }
      });
    } else {
      // Padrão — se surgir outro status, mostra ambos
      opcoesMenu.push(
        {
          label: `${icone} Registrar ${epi}`,
          roles: [4, 5, 6, 7, 99], action: () => {
            open_form_AnexarEPI(idColab, idEPI);
          }
        },
        {
          label: `🔄 Atualizar ${epi}`,
          roles: [4, 5, 6, 7, 99], action: () => {
            open_form_AnexarEPI(idColab, idEPI);
          }
        }
      );
    }

    // 🔹 Sempre mostra Visualizar e Apagar (se aplicável)
    if (statusTexto.includes("realizar troca!") || statusTexto.includes("apto para uso!") || statusTexto.includes("avaliar!")) {
      opcoesMenu.push(


        "SEPARADOR",
        {
          label: `✍🏻 Solicitar Assinatura`,
          action: async () => {

            if (!idFuncionarioEPI) {
              Toast.fire({
                icon: "warning",
                theme: 'dark',
                title: "ID do registro EPI não encontrado."
              });
              return;
            }

            // Gera a URL automática
            const r = await fetch(`/api/epi/gerar-token/${idFuncionarioEPI}`, { method: "POST" });
            const { token } = await r.json();

            const assinaturaURL = `${window.location.origin}/assinar-epi?idfcepi=${idFuncionarioEPI}&token=${token}`;



            // Copiar para a área de transferência
            try {
              await navigator.clipboard.writeText(assinaturaURL);
            } catch (err) {
              console.warn("Falha ao copiar automaticamente:", err);
            }

            // TELEFONE DO COLABORADOR
            const telefoneColaborador = formatarTelefoneParaWhatsApp(telefone);
            // formato: DDI + DDD + número (sem espaços)

            // Mensagem pronta para enviar pelo WhatsApp
            const mensagem = encodeURIComponent(
              `Olá! Por favor assine sua ficha de EPI no link abaixo:\n\n${assinaturaURL}`
            );

            const whatsappURL = `https://wa.me/${telefoneColaborador}?text=${mensagem}`;

            // Abre o WhatsApp
            //window.open(whatsappURL, "_blank");

            // Feedback visual
            Swal.fire({
              icon: "success",
              title: "Link criado!",
              html: `
                <p>Envie para o colaborador assinar digitalmente:</p>
                <p style="margin-top:10px; font-weight:bold; color:#4caf50">${assinaturaURL}</p>
              `,
              theme: "dark"
            });
          }
        }
        ,
        {
          label: `🧾 Visualizar Registros`,
          action: async () => {
            if (!idFuncionarioEPI) return;
            try {
              const res = await fetch(`/api/epi/download/${idFuncionarioEPI}`, {
                method: "HEAD",
                credentials: "include"
              });
              if (!res.ok) {
                let msg = "Erro ao visualizar EPI.";
                if (res.status === 400) msg = "Nenhum PDF anexado para esta EPI.";
                if (res.status === 404) msg = "EPI ou arquivo não encontrado.";
                return Toast.fire({
                  icon: "warning",
                  theme: 'dark',
                  title: msg
                });
              }
              window.open(`/api/epi/download/${idFuncionarioEPI}`, "_blank");
            } catch (err) {
              Toast.fire({
                icon: "error",
                theme: 'dark',
                title: err.message
              });
            }
          }
        },
        "SEPARADOR",
        {
          label: `❌ Apagar ${epi}`,
          action: async () => {
            if (!idFuncionarioEPI) return;

            const result = await Swal.fire({
              title: "Apagar?",
              text: `Deseja realmente apagar ${epi} do EPI?`,
              icon: "warning",
              theme: "dark",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Sim, apagar!"
            });

            if (result.isConfirmed) {
              try {
                const res = await fetch(`/api/epi/excluir/colaborador/${idFuncionarioEPI}`, {
                  method: "DELETE",
                  credentials: "include"
                });

                if (res.ok) {
                  preencherTabelaColaboradoresRH();
                  document.querySelector('.bt_menu[data-target=".painel_vestimentas"]').click();
                  Toast.fire({
                    icon: "success",
                    theme: 'dark',
                    title: "EPI excluído!"
                  });
                } else {
                  Toast.fire({
                    icon: "error",
                    theme: 'dark',
                    title: "Não foi possível excluir EPI."
                  });
                }
              } catch (err) {
                Toast.fire({
                  icon: "error",
                  theme: 'dark',
                  title: err.message
                });
              }
            }
          }
        }
      );
    }

    criarMenuContextual(e, opcoesMenu);
  });



}
