import { materialState as state } from "../../state/material.state.js";
import { atualizarCadastroMaterial } from "./material-form-render.js";

// 🔥 helper interno
function normalizar(attr) {
    return attr
        ?.replace(/"/g, "")  // remove aspas
        .trim()
        .toLowerCase();
}

export function renderAtributos(valores = null) {

    const lista = Array.isArray(state.atributosSelecionados)
        ? state.atributosSelecionados
        : [];

    const preenchidos = new Map(valores
        ? Object.entries(valores).map(([attr, valor]) => [normalizar(attr), valor])
        : $("#valoresAtributos .input-attr").toArray().map(input => [normalizar(input.dataset.attr), input.value]));
    $("#valoresAtributos").empty();

    const usados = [];

    lista.forEach(attr => {

        if (typeof attr !== "string") return;

        const attrLimpo = attr.replace(/"/g, "").trim();
        const key = normalizar(attr);

        // 🔥 evita duplicado
        if (usados.includes(key)) return;
        usados.push(key);

        const id = "material-atributo-" + usados.length;
        const remover = $("<button>").attr({type:"button","aria-label":"Remover " + attrLimpo, title:"Remover " + attrLimpo})
            .addClass("chip-remove").text("×");
        const campo = $("<input>").attr({id, "data-attr":attrLimpo}).prop("required", true)
            .addClass("input-attr").val(preenchidos.get(key) ?? "");
        const rotulo = $("<label>").attr("for", id).text(attrLimpo + " ")
            .append($("<span>").addClass("material-obrigatorio").attr("aria-hidden", "true").text("*"));
        $("#valoresAtributos").append($("<div>").addClass("attr-row")
            .append(rotulo, campo, remover));

    });
    atualizarCadastroMaterial();

}
