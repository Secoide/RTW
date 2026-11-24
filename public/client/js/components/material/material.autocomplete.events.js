
import { materialState as state } from "../../state/material.state.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { parseAtributos } from "../../utils/material/material.utils.js";
import { atualizarEstadoImagemMaterial, atualizarModoModalMaterial } from "../forms/material.modal.js";
import { carregarRelacionadosMaterial } from "./material.relacionados.js";


export function initMaterialAutocompleteModal() {


    $(document)
        .off("click.materialAutocompleteModal", "#variacoesExistentes .var-item")
        .on("click.materialAutocompleteModal", "#variacoesExistentes .var-item", function () {
            const variacao = $(this).data("variacao");
            if (!variacao) return;

            $("#nomeMaterial").val(variacao.nome);
            $("#idMaterial").val(variacao.id);
            carregarRelacionadosMaterial(variacao.id);
            $("#modoEdicaoMaterial").val("0");
            $("#btnSalvarMaterial").text("Salvar");
            $("#imagemMaterialOrigemId, #imagemMaterialImportada").val("");
            $("#imagemMaterialOrigemTexto").text("");
            $("#categoriaMaterial").val(variacao.categoria || "");
            $("#codigo").val(variacao.codigo || "");
            $("#fabricante").val(variacao.fabricante || "");
            $("#unidadeMaterial").val(variacao.unidade || "un");
            $("#materialUsoGenerico").prop("checked", !variacao.codigo?.trim() || !variacao.fabricante?.trim());
            $("#materialEdicaoTexto").text("Selecionado: " + variacao.nome + ". Você pode usar como base ou editar este cadastro.");
            $("#materialEdicaoPainel").prop("hidden", false).removeClass("editando").show();
            atualizarModoModalMaterial("selecionado", "Material selecionado");

            const foto = variacao.imagem?.startsWith("http")
                ? variacao.imagem + "?v=" + variacao.versao_foto
                : "/imagens/imagemmaterial.webp";
            $("#imagemmaterial").off("error.materialCatalogo").one("error.materialCatalogo", function () {
                $(this).attr("src", "/imagens/imagemmaterial.webp");
            }).attr("src", foto);

            const atributos = parseAtributos(variacao.atributos);
            state.atributosSelecionados = Object.keys(atributos);
            renderAtributos(atributos);
            atualizarEstadoImagemMaterial();
        });

    $(document)
        .off("click.materialEditarExistente", "#btnEditarMaterialExistente")
        .on("click.materialEditarExistente", "#btnEditarMaterialExistente", function () {
        if (!$("#idMaterial").val()) {
            alert("Selecione um material existente para editar.");
            return;
        }

        $("#modoEdicaoMaterial").val("1");
        $("#btnSalvarMaterial").text("Salvar edição");
        $("#materialEdicaoPainel").addClass("editando").show();
        $("#materialEdicaoTexto").text("Modo edição ativo: ao salvar, este cadastro será atualizado.");
        atualizarModoModalMaterial("edicao", "Editando material");
        atualizarEstadoImagemMaterial();
    });

    $(document)
        .off("click.materialUsarBase", "#btnUsarMaterialComoBase")
        .on("click.materialUsarBase", "#btnUsarMaterialComoBase", function () {
        $("#modoEdicaoMaterial").val("0");
        $("#idMaterial").val("");
        $("#imagemMaterialOrigemId, #imagemMaterialImportada").val("");
        $("#imagemMaterialOrigemTexto").text("");
        $("#imagemmaterial").attr("src", "/imagens/imagemmaterial.webp");
        $("#btnSalvarMaterial").text("Salvar");
        $("#materialEdicaoPainel").prop("hidden", true).removeClass("editando").hide();
        atualizarModoModalMaterial("base", "Usando como base");
        atualizarEstadoImagemMaterial();
    });

}
