import { materialState as state } from "../../state/material.state.js";

// 🔥 helper interno
function normalizar(attr) {
    return attr
        ?.replace(/"/g, "")  // remove aspas
        .trim()
        .toLowerCase();
}

export function renderAtributos() {

    const lista = Array.isArray(state.atributosSelecionados)
        ? state.atributosSelecionados
        : [];

    $("#listaAtributos").empty();
    $("#valoresAtributos").empty();

    const usados = [];

    lista.forEach(attr => {

        if (typeof attr !== "string") return;

        const attrLimpo = attr.replace(/"/g, "").trim();
        const key = normalizar(attr);

        // 🔥 evita duplicado
        if (usados.includes(key)) return;
        usados.push(key);

        $("#listaAtributos").append(`
      <div class="chip" data-attr="${attrLimpo}">
            <span class="chip-label">${attrLimpo}</span>
            <span class="chip-remove">&times;</span>
            </div>
    `);

        $("#valoresAtributos").append(`
      <div class="attr-row">
        <label>${attrLimpo}</label>
        <div class="autocomplete-container">
          <input data-attr="${attrLimpo}" class="input-attr">
        </div>
      </div>
    `);

    });

}