import { materialState as state } from "../../state/material.state.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { atualizarCadastroMaterial } from "../../utils/dom/material-form-render.js";
import { limparRelacionadosMaterial } from "../material/material.relacionados.js";

export { atualizarCadastroMaterial };

export function abrirModalMaterial() {
  $("#imagemMaterialImportada").val("");
  $("#modalMaterial").removeClass("hidden").css("display", "flex");
  atualizarModoModalMaterial("novo");
  atualizarEstadoImagemMaterial();
  $("#buscarCadastroMaterial").trigger("input").trigger("focus");
}

export function fecharModalMaterial() {
  $("#modalMaterial").addClass("hidden").css("display", "none");
  resetModalMaterial();
}

export function resetModalMaterial() {

  
    // 🔹 inputs simples
    $("#nomeMaterial").val("");
    $("#buscarCadastroMaterial").val("");
    $("#idMaterial").val("");
    $("#materialUsoGenerico").prop("checked", false);
    $("#categoriaMaterial").val("");
    $("#codigo").val("");
    $("#fabricante").val("");
    $("#unidadeMaterial option[data-unidade-importada]").remove();
    $("#unidadeMaterial").val("un");
    $("#imagemMaterialOrigemId").val("");
    $("#imagemMaterialImportada").val("");
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
    $("#materialBuscarAtributo").val("").attr("aria-expanded", "false").removeAttr("aria-activedescendant");
    $("#materialOpcoesAtributo").prop("hidden", true).empty();
    limparRelacionadosMaterial();
    $("#valoresAtributos").empty();

    // 🔹 autocomplete / sugestões
    $("#autocompleteMaterial").empty().hide();
    $("#variacoesExistentes").empty().removeClass("somente-visualizacao");

    // 🔹 alertas
    $("#materialAvisoCadastro").removeData("validando").empty();
    $("#modalMaterial [aria-invalid]").removeAttr("aria-invalid");
    atualizarCadastroMaterial();
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
  const id = $("#idMaterial").val();
  const podeEditarFoto = Boolean(id && $("#modoEdicaoMaterial").val() === "1");
  $("#modalMaterial .variacao-imagem").toggleClass("imagem-bloqueada", !podeEditarFoto);
  $("#btn_uploadImagem, #btn_usarImagemExistente").prop({ disabled: !podeEditarFoto, hidden: !podeEditarFoto });
  $("#btnSalvarMaterialFoto").toggle(!id);
  atualizarCadastroMaterial();
}

export function adicionarAtributo(atributo) {
  if (state.atributosSelecionados.includes(atributo)) return;
  state.atributosSelecionados.push(atributo);
  renderAtributos();
  $("#valoresAtributos .input-attr").last().trigger("focus");
}
