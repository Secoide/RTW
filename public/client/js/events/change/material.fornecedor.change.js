import { materialState as state } from "../../state/material.state.js";
import { atualizarScoreTabela } from "../../utils/dom/score.render.js";

export function initFornecedorChange() {
  $(document)
    .off("change.materialFornecedorChange", ".forn-select")
    .on("change.materialFornecedorChange", ".forn-select", function () {
      const $tr = $(this).closest("tr");
      const selected = $(this).val();
      const fornecedor = state.listaFornecedores.find(f => f.id == selected);

      if (!fornecedor) return;

      $tr.find(".input-icms").val(
        fornecedor.icms != null ? fornecedor.icms : ""
      ).trigger("change");

      const $container = $tr.closest(".fornecedores-box");
      atualizarScoreTabela($container);
    });

  $(document)
    .off("input.materialFornecedorChange change.materialFornecedorChange", ".input-icms, .valor, .qtd-forn, .prazo, .material-ok")
    .on("input.materialFornecedorChange change.materialFornecedorChange", ".input-icms, .valor, .qtd-forn, .prazo, .material-ok", function () {
      const $container = $(this).closest(".fornecedores-box");
      atualizarScoreTabela($container);
    });
}
