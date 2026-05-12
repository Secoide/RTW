import { initDateChangeHandler } from "../events/change/handle-date-change.js";
import { initColaboradoresDragDrop } from "../events/dragdrop/handle-colaboradores-dragdrop.js";
import { initColaboradoresSearch } from "../events/search/handle-colaboradores-search.js";
import { initRemoverColaboradorClick } from "../events/click/handle-remover-colaborador.js";
import { initPesquisarOS } from "../events/controls/handle-pesquisar-os.js";
import { initAbrirOSClick } from "../events/click/handle-abrir-os.js";
import { getSocket } from "../services/sockets/socket-service.js";

import { initColaboradoresTransferencia } from "../events/transferencia/handle-colaboradores-transferencia.js";
import { initFiltros } from "../events/click/handle-filtros-os.js";
import { get_dadosColab } from "../services/api/colaboradores-api.js";
import { initExportarDados } from "../events/click/handle-exportar-dados.js";
import "../events/click/handle-status-dia.js";
import { atualizarProgramacao } from "../events/change/handle-date-change.js";

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

export async function initProgramacao() {
  try {
    

    const socket = getSocket(); // 🔗 cria ou retorna o mesmo socket
    initDateChangeHandler();
    const hoje = new Date().toISOString().split("T")[0];
    const seletor = document.getElementById("seletor_data");

    if (seletor) {
      seletor.value = "";
      seletor.value = hoje;
      seletor.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      console.warn("⚠️ Não encontrei #seletor_data no DOM");
    }


    // inicializa drag & drop de colaboradores
    initColaboradoresDragDrop();
    initColaboradoresSearch(socket);
    initRemoverColaboradorClick();
    initPesquisarOS();
    initAbrirOSClick();
    initColaboradoresTransferencia(socket);
    initFiltros();
    get_dadosColab();
    initExportarDados();

  } catch (err) {
    console.error("❌ Erro ao inicializar programação:", err);
  }

  $(document).on("click", "#bt_atualizarProgramacao", async function () {
    const dataSelecionada = new Date($("#seletor_data").val());
    atualizarProgramacao(dataSelecionada);
  });


  document.addEventListener("click", (ev) => {

    // Abrir modal novo aviso
    if (ev.target.id === "btnAdicionarAnotacao") {

      const texto = $('#anotacaoTexto').val().trim();

      if (!texto) return;

      const icone =
        $('#iconeAnotacao .ativo').data('icone') || '📝';

      const html = `
        <div class="item-anotacao">

            <div class="anotacao-info">
                <span class="anotacao-icone">${icone}</span>

                <span class="anotacao-texto">
                    ${texto}
                </span>
            </div>

            <button class="btn-remover-anotacao">
                ✖
            </button>

        </div>
    `;

      $('.lista-anotacoes').append(html);

      $('#anotacaoTexto').val('');
    }

    if (ev.target.classList.contains('btn-remover-anotacao')) {

      ev.target.closest('.item-anotacao').remove();
    }


    // Cancelar modal
    if (ev.target.id === "btnCancelarAnotacoes") {
      document.getElementById("modalAnotacao").style.display = "none";
      return;
    }

    // Salvar aviso
    if (ev.target.id === "btnSalvarAnotacoes") {
      salvarAnotacoesDia();
      return;
    }

  });


  // =======================================================
  // SELEÇÃO DE ÍCONES
  // =======================================================
  document.querySelectorAll("#iconeAnotacao span").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll("#iconeAnotacao span").forEach(s => s.classList.remove("ativo"));
      el.classList.add("ativo");
    });
  });

  async function salvarAnotacoesDia() {

    const dataDia =
        $('#datadiaAnot').val();

    const anotacoes = [];
    const icones = [];

    $('.item-anotacao').each(function () {

        const texto =
            $(this)
                .find('.anotacao-texto')
                .text()
                .trim();

        const icone =
            $(this)
                .find('.anotacao-icone')
                .text()
                .trim();

        if (texto) {

            anotacoes.push(
                `"${texto}"`
            );

            icones.push(
                `"${icone}"`
            );
        }
    });

    const anotacoesFormatadas =
        `{${anotacoes.join(';')}}`;

    const iconesFormatados =
        `{${icones.join(';')}}`;
    console.log(iconesFormatados);
    try {

        await $.ajax({

            url:
                '/api/os/anotacoes/salvar',

            method: 'POST',

            contentType:
                'application/json',

            data: JSON.stringify({

                datadia: dataDia,

                anotacoes:
                    anotacoesFormatadas,

                icone:
                    iconesFormatados
            })
        });
        Toast.fire({
                    icon: "success",
                    theme: 'dark',
                    title: "Anotações salvas"
                });
        const dataSelecionada = new Date($("#seletor_data").val());
    atualizarProgramacao(dataSelecionada);
        $('#modalAnotacao').hide();

    } catch (err) {

        console.error(err);
        Toast.fire({
                    icon: "error",
                    theme: 'dark',
                    title: "Falha ao salvar anotações."
                });
    }
}

}

