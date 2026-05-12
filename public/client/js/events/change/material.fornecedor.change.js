import { materialState as state } from "../../state/material.state.js";
import { atualizarScoreTabela } from "../../utils/dom/score.render.js";

export function initFornecedorChange() {

  // 🔥 troca fornecedor
  $(document).on("change", ".forn-select", function () {

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

  // 🔥 alteração de valores
  $(document).on("input change", ".input-icms, .valor, .prazo, .material-ok", function () {

    const $container = $(this).closest(".fornecedores-box");
    
    atualizarScoreTabela($container);

  });
}