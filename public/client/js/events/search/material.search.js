import { aplicarFiltros } from "../../services/filter/material.filter.js";
import { renderTabela } from "../../utils/dom/material-render.js";
import { atualizarResumo } from "../../utils/dom/material-resumo.js";

export function initMaterialSearch() {

    let timer;
    $("#searchMaterial").on("input", function () {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const lista = aplicarFiltros();
            renderTabela(lista);
            atualizarResumo(lista);
            // reaplica estado das imagens após render
            const mostrar = localStorage.getItem("mostrarImagemMaterial") === "true";
            $(".tb_imgMaterial").toggleClass("mostrar-imagens", mostrar);

        }, 150);
    });
}