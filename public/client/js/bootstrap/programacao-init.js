import { initDateChangeHandler } from "../events/change/handle-date-change.js";
import { initColaboradoresDragDrop } from "../events/dragdrop/handle-colaboradores-dragdrop.js";
import { initColaboradoresSearch } from "../events/search/handle-colaboradores-search.js";
import { initRemoverColaboradorClick } from "../events/click/handle-remover-colaborador.js";
import { initPesquisarOS } from "../events/controls/handle-pesquisar-os.js";
import { initAbrirOSClick } from "../events/click/handle-abrir-os.js";
import { renderUsuariosOnline } from "../services/sockets/socket-users.js";
import { conectarSocket } from "../services/sockets/socket-service.js";

import { initColaboradoresTransferencia } from "../events/transferencia/handle-colaboradores-transferencia.js";
import { initFiltros } from "../events/click/handle-filtros-os.js";
import { get_dadosColab } from "../services/api/colaboradores-api.js";
import { initExportarDados } from "../events/click/handle-exportar-dados.js";
import "../events/click/handle-status-dia.js";
import { atualizarProgramacao } from "../events/change/handle-date-change.js";



export async function initProgramacao() {
  try {
    const socket = conectarSocket(window.usuarioLogado); // 🔗 cria ou retorna o mesmo socket
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
    renderUsuariosOnline();
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

}

