import { materialState as state } from "../../state/material.state.js";
import {
  carregarVariacoes,
  carregarFornecedores,
  carregarOS
} from "../../services/api/material.api.js";

export function abrirModalMaterial() {
  $("#modalMaterial").removeClass("hidden").css("display", "flex");
  atualizarModoModalMaterial("novo");
  atualizarEstadoImagemMaterial();
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
    $("#imagemMaterialOrigemId").val("");
    $("#imagemMaterialOrigemTexto").text("");
    $("#imagemmaterial").attr("src", "/imagens/imagemmaterial.webp");
    $("#materialImagemExistentePainel").prop("hidden", true);
    $("#buscaImagemMaterialExistente").val("");
    $("#modoEdicaoMaterial").val("0");
    $("#materialEdicaoPainel").prop("hidden", true).removeClass("editando").hide();
    $("#materialEdicaoTexto").text("Material existente selecionado.");
    $("#btnSalvarMaterial").text("Salvar");
    atualizarModoModalMaterial("novo");
    atualizarEstadoImagemMaterial();

    // 🔹 atributos
    state.atributosSelecionados = [];
    $("#listaAtributos").empty();
    $("#valoresAtributos").empty();

    // 🔹 autocomplete / sugestões
    $("#autocompleteMaterial").empty().hide();
    $("#variacoesExistentes").empty().removeClass("somente-visualizacao");

    // 🔹 alertas
    $("#alertDuplicado").hide();
    carregarVariacoes();
}

export function atualizarModoModalMaterial(modo = "novo", texto = "") {
  const $badge = $("#materialModoBadge");
  if (!$badge.length) return;

  const config = {
    novo: { classe: "novo", texto: texto || "Novo cadastro" },
    selecionado: { classe: "selecionado", texto: texto || "Material selecionado" },
    edicao: { classe: "edicao", texto: texto || "Editando material" },
    base: { classe: "base", texto: texto || "Usando como base" }
  };

  const item = config[modo] || config.novo;
  $badge
    .removeClass("novo selecionado edicao base")
    .addClass(item.classe)
    .text(item.texto);
}

export function atualizarEstadoImagemMaterial() {
  const possuiId = Boolean($("#idMaterial").val());
  $(".variacao-imagem").toggleClass("imagem-bloqueada", !possuiId);
  $("#btn_uploadImagem, #btn_usarImagemExistente").prop("disabled", !possuiId);
  $("#imagemMaterialBloqueadaTexto").prop("hidden", possuiId);
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
