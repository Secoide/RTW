import { filtrarVariacoes } from "../../utils/material.autocomplete.utils.js";
import { materialState as state } from "../../state/material.state.js";

export function renderAutocomplete(input, lista) {

  const box = $(input).siblings(".autocomplete-box, .autocomplete-box-tabela");

  if (!lista.length) {
    box.hide();
    return;
  }

  box.html(lista.map(item => `
    <div class="item" data-id="${item.id}">
      <b>${item.nome}</b> ${item.codigo || ""}
      <small>${item.atributos || ""}</small>
    </div>
  `).join(""));

  box.show();
}

export function aplicarAutocomplete(input) {

  const termo = $(input).val();

  const lista = filtrarVariacoes(state.listaVariacoes, termo);

  renderAutocomplete(input, lista);
}