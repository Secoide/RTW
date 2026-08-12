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

  $(document).off("change.materialCategoria", "#filtroCategoriaMaterial")
    .on("change.materialCategoria", "#filtroCategoriaMaterial", function () {
      state.filtroCategoriaAtual = $(this).val() || "";

      const lista = aplicarFiltros();

      renderTabela(lista);
      atualizarResumo(lista);
    });

  $(document).off("click.materialOrdenar", "#tableMaterial thead th")
    .on("click.materialOrdenar", "#tableMaterial thead th", function () {
      const index = $(this).index();
      const coluna = state.COLUNAS[index];

      if (!coluna) return;

      if (state.ordenacao.coluna === coluna) {
        state.ordenacao.direcao = state.ordenacao.direcao === "asc" ? "desc" : "asc";
      } else {
        state.ordenacao.coluna = coluna;
        state.ordenacao.direcao = "asc";
      }

      const lista = aplicarFiltros();

      renderTabela(lista);
      atualizarResumo(lista);

      $("#tableMaterial th").removeClass("sort-asc sort-desc");
      $(this).addClass(state.ordenacao.direcao === "asc" ? "sort-asc" : "sort-desc");
    });

}
