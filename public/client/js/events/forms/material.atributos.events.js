import { carregarSugestoes } from "../../components/forms/material.atributos.js";

export function initMaterialAtributos() {

  $(document).on("input", ".input-atributo", function () {

    const atributo = $(this).data("atributo");

    carregarSugestoes(this, atributo);

  });

  $(document).on("click", ".autocomplete-box .item", function () {

    const valor = $(this).text();

    $(this).closest(".attr-row").find("input").val(valor);

    $(this).parent().hide();

  });

}