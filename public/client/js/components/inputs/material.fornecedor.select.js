import { materialState as state } from "../../state/material.state.js";

export function montarSelectFornecedores() {

  return `
    <select class="forn-select">
      <option value="">Selecione</option>
      ${state.listaFornecedores.map(f => `
        <option value="${f.id}">${f.nome}</option>
      `).join("")}
    </select>
  `;
}