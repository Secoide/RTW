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
  carregarOS
} from "../services/api/material.api.js";

export async function initMaterial() {

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
  await carregarOS();

  await carregarMateriaisCompleto(); 
}