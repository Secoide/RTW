import { materialState as state } from "../../state/material.state.js";
import { aplicarFiltros } from "../../services/filter/material.filter.js";
import { renderTabela } from "../../utils/dom/material-render.js";
import { atualizarResumo } from "../../utils/dom/material-resumo.js";

export function initMaterialFilters() {

  $(document).on("click", ".filtros-status button", function () {

    $(".filtros-status button").removeClass("active");
    $(this).addClass("active");

    state.filtroStatusAtual = $(this).data("status") || "";

    const lista = aplicarFiltros();

    renderTabela(lista);
    atualizarResumo(lista);

  });

}