
import { materialState as state } from "../../state/material.state.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { ATRIBUTOS_POR_MATERIAL } from "../../utils/material/material.config.js";
import { normalizarAtributo, parseAtributos } from "../../utils/material/material.utils.js";
import { atualizarEstadoImagemMaterial, atualizarModoModalMaterial } from "../forms/material.modal.js";


export function initMaterialAutocompleteModal() {


    $(document)
        .off("click.materialAutocompleteModal", ".var-item")
        .on("click.materialAutocompleteModal", ".var-item", async  function () {
        if ($(this).closest("#variacoesExistentes").hasClass("somente-visualizacao")) {
            return;
        }

        const nome = $(this).data("nome");
        const idmaterial = $(this).attr("data-idmaterialvar");
        let atributosRaw = $(this).attr("data-atributos");

        let atributosObj = {};
        try {
            atributosObj = parseAtributos(atributosRaw);
        } catch (e) {
            console.warn("Erro ao parsear atributos:", atributosRaw);
        }

        $("#nomeMaterial").val(nome);
        $("#idMaterial").val(idmaterial);
        $("#modoEdicaoMaterial").val("0");
        $("#materialEdicaoTexto").text(`Selecionado: ${nome}. Você pode usar como base ou editar este cadastro.`);
        $("#materialEdicaoPainel").prop("hidden", false).removeClass("editando").show();
        atualizarModoModalMaterial("selecionado", "Material selecionado");
        atualizarEstadoImagemMaterial();

        let material;
        try {
            material = await $.ajax({
                url: `/api/materiais/variacao/${idmaterial}`,
                method: "GET"
            });
        } catch (error) {
            console.error("Erro ao buscar material:", error);
            return;
        }

        const fotoURL = material?.imagem
            ? `${material.imagem}?v=${material.versao_foto}`
            : null;

        $('#imagemmaterial')
            .off('error')
            .attr('src', fotoURL?.startsWith('http')
                ? fotoURL
                : '/imagens/imagemmaterial.webp')
            .on('error', function () {
                $(this).attr('src', '/imagens/imagemmaterial.webp');
            });



        const nomeKey = nome.toUpperCase();

        state.atributosSelecionados = [];

        if (ATRIBUTOS_POR_MATERIAL[nomeKey]) {
            state.atributosSelecionados = [...ATRIBUTOS_POR_MATERIAL[nomeKey]];
        }

        Object.keys(atributosObj).forEach(attr => {

            const attrLimpo = normalizarAtributo(attr);

            const existe = state.atributosSelecionados
                .map(a => normalizarAtributo(a))
                .includes(attrLimpo);

            if (!existe) {
                state.atributosSelecionados.push(attr.trim());
            }

        });

        renderAtributos();

        // 🔥 preenche valores CORRETAMENTE
        setTimeout(() => {

            Object.entries(atributosObj).forEach(([attr, val]) => {

                const $input = $(`[data-attr="${attr}"]:visible`).last();

                if ($input.length) {
                    $input.val(val).trigger("input").trigger("change");
                }

            });

        }, 50);

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
        $("#btnSalvarMaterial").text("Salvar");
        $("#materialEdicaoPainel").prop("hidden", true).removeClass("editando").hide();
        atualizarModoModalMaterial("base", "Usando como base");
        atualizarEstadoImagemMaterial();
    });

}
