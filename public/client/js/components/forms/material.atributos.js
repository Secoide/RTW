import { getValoresAtributo } from "../../services/api/material.autocomplete.api.js";

export async function carregarSugestoes(input, atributo) {

  const lista = await getValoresAtributo(atributo);

  const box = $(input).siblings(".autocomplete-box");

  box.html(lista.map(v => `
    <div class="item">${v}</div>
  `).join(""));

  box.show();
}