import { materialState as state } from "../../state/material.state.js";
import { carregarMateriaisCompleto } from "../../bootstrap/material.load.js";

export function initMaterialChange() {

  $("#cbxOS").on("change", function () {
    state.osSelecionada = $(this).val();
    carregarMateriaisCompleto(); 
  });

}