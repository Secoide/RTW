import { materialState as state } from "../../state/material.state.js";
import {
  carregarVariacoes,
  carregarFornecedores,
  carregarOS
} from "../../services/api/material.api.js";

export function abrirModalMaterial() {
  $("#modalMaterial").removeClass("hidden").css("display", "flex");
}

export function fecharModalMaterial() {
  $("#modalMaterial").addClass("hidden").css("display", "none");
  resetModalMaterial();
}

export function resetModalMaterial() {

  
    // 🔹 inputs simples
    $("#nomeMaterial").val("");
    $("#categoriaMaterial").val("");
    $("#codigo").val("");
    $("#fabricante").val("");

    // 🔹 atributos
    state.atributosSelecionados = [];
    $("#listaAtributos").empty();
    $("#valoresAtributos").empty();

    // 🔹 autocomplete / sugestões
    $("#autocompleteMaterial").empty().hide();
    $("#variacoesExistentes").empty();

    // 🔹 alertas
    $("#alertDuplicado").hide();
    carregarVariacoes();
}

export function adicionarAtributo(atributo) {
  console.log(state.atributosSelecionados);
  if (state.atributosSelecionados.includes(atributo)) return;

  state.atributosSelecionados.push(atributo);

  $("#listaAtributos").append(`
      <div class="chip" data-attr="${atributo}">
            <span class="chip-label">${atributo}</span>
            <span class="chip-remove">&times;</span>
            </div>
    `);

  $("#valoresAtributos").append(`
      <div class="attr-row">
        <label>${atributo}</label>
        <div class="autocomplete-container">
          <input data-attr="${atributo}" class="input-attr">
        </div>
      </div>
    `);
}