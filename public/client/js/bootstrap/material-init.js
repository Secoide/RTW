import { initMaterialClicks } from "../events/click/material.click.js";
import { initMaterialChange } from "../events/change/material.change.js";
import { initFornecedorClicks } from "../events/click/material.fornecedor.click.js";
import { initMaterialAutocomplete } from "../events/controls/material.autocomplete.events.js";
import { initMaterialAtributos } from "../events/forms/material.atributos.events.js";
import { initMaterialModal } from "../events/forms/material.modal.events.js";
import { carregarMateriaisCompleto } from "./material.load.js";
import { initMaterialSearch } from "../events/search/material.search.js";
import { initMaterialFilters } from "../events/programacao/material.filters.js";
import { initFornecedorChange } from "../events/change/material.fornecedor.change.js";
import { initMaterialForm } from "../components/material/material.form.events.js";
import { initMaterialAutocompleteModal } from "../components/material/material.autocomplete.events.js";
import { initMaterialAtributosModal } from "../components/material/material.atributos.events.js";
import { initMaterialSave } from "../components/material/material.save.events.js";

import {
  carregarVariacoes,
  carregarFornecedores,
  carregarResponsaveisLista,
  carregarOS
} from "../services/api/material.api.js";

export async function initMaterial() {

  initMostrarImagemMaterial();
  initAtalhosSetorMaterial();
  initMaterialClicks();
  initMaterialChange();
  initFornecedorClicks();
  initFornecedorChange();
  initMaterialAutocomplete();
  initMaterialAtributos();
  initMaterialModal();
  initMaterialSearch();  
  initMaterialFilters();
  initMaterialForm();
  initMaterialAutocompleteModal();
  initMaterialAtributosModal();
  initMaterialSave();

  await carregarVariacoes();
  await carregarFornecedores();
  await carregarResponsaveisLista();
  await carregarOS();

  await carregarMateriaisCompleto(); 
}

function initAtalhosSetorMaterial() {
  $(document)
    .off("click.materialAtalhosSetor", ".material-atalho-os")
    .on("click.materialAtalhosSetor", ".material-atalho-os", function () {
      const idOS = $(this).data("os");
      if (!idOS) return;

      const $cbxOS = $("#cbxOS");
      const idNormalizado = String(idOS);

      if (!$cbxOS.find(`option[value="${idNormalizado}"]`).length) {
        $cbxOS.append(`<option value="${idNormalizado}">OS ${idNormalizado}</option>`);
      }

      $cbxOS
        .val(idNormalizado)
        .trigger("change");
    });
}

function initMostrarImagemMaterial() {
  $(document)
    .off("click.materialImagem", "#chkMostrarImagemMaterial")
    .on("click.materialImagem", "#chkMostrarImagemMaterial", function () {
      const isChecked = $(this).is(":checked");

      $(".tb_imgMaterial").toggleClass("mostrar-imagens", isChecked);
      localStorage.setItem("mostrarImagemMaterial", isChecked);
    });
}
