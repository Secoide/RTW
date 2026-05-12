
import { materialState as state } from "../../state/material.state.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { ATRIBUTOS_POR_MATERIAL } from "../../utils/material/material.config.js";
import { normalizarAtributo, parseAtributos } from "../../utils/material/material.utils.js";


export function initMaterialAutocompleteModal() {


    $(document).on("click", ".var-item", async  function () {

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

}