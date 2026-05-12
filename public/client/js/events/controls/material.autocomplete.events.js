import { materialState as state } from "../../state/material.state.js";
import { highlightTextoSeguro } from "../../utils/material.utils.js";

export function initMaterialAutocomplete() {

  // 🔍 DIGITAÇÃO
  $(document).on("input", ".autocomplete-material", function () {

    const termo = $(this).val().toLowerCase();
    const $input = $(this);
    const $linha = $input.closest("tr");

    // limpa seleção
    $linha.find("[data-field='id_variacao']").val("");

    // remove box antigo
    $input.parent().find(".autocomplete-box-tabela").remove();

    if (!termo) return;

    const termos = termo
      .split(" ")
      .filter(t => t.trim() !== "");

    const resultados = state.listaVariacoes.filter(m => {

      const texto = `
        ${m.nome || ""}
        ${m.atributos || ""}
        ${m.codigo || ""}
        ${m.fabricante || ""}
        ${m.imagem || ""}
        ${m.versao_foto || ""}
      `.toLowerCase();

      return termos.every(t => texto.includes(t));

    }).sort((a, b) => {

      const textoA = `${a.nome} ${a.atributos}`.toLowerCase();
      const textoB = `${b.nome} ${b.atributos}`.toLowerCase();

      const scoreA = termos.reduce((acc, t) => acc + (textoA.includes(t) ? 1 : 0), 0);
      const scoreB = termos.reduce((acc, t) => acc + (textoB.includes(t) ? 1 : 0), 0);

      return scoreB - scoreA;

    }).slice(0, 20);

    if (!resultados.length) return;

    const box = $("<div class='autocomplete-box-tabela'></div>");

    resultados.forEach(m => {

      const nomeHighlight = highlightTextoSeguro(m.nome || "", termo);
      const attrHighlight = highlightTextoSeguro(m.atributos || "", termo);
      const imgSrc = m.imagem 
        ? `${m.imagem}?v=${m.versao_foto || ""}` 
        : "/imagens/imagemmaterial.webp";
      box.append(`
        <div class="item" data-id="${m.id}">
        <div class="col-material">
          <img class="tb_imgMaterialAutocomplete" src="${imgSrc}"></img>
          <div>
            <strong>${nomeHighlight}</strong><br>
            <span style="color:#aaa">${attrHighlight}</span>
          </div>
        </div>
          
        </div>
      `);
    });

    $input.parent().append(box);

    // 🔥 seleção (ESSENCIAL)
    box.on("click", ".item", function () {

      const id = $(this).data("id");
      const material = state.listaVariacoes.find(m => m.id == id);

      $input.val(
        `${material.nome} ${material.atributos ? `(${material.atributos})` : ''}`
      );

      $linha.find("[data-field='id_variacao']").val(material.id);

      // atualiza colunas
      $linha.find("td").eq(4).text(material.codigo || "-");
      $linha.find("td").eq(5).text(material.fabricante || "-");

      box.remove();
    });

  });

  // 🖱 CLICK NA OPÇÃO
  $(document).on("click", ".autocomplete-box .item, .autocomplete-box-tabela .item", function () {

    const id = $(this).data("id");

    const item = state.listaVariacoes.find(v => v.id == id);

    const input = $(this).closest(".autocomplete-container, td").find("input");

    input.val(item.nome);

    $(this).parent().hide();

    // 🔥 guarda no input (importante)
    input.data("id-variacao", item.id);
  });

  // ⌨️ NAVEGAÇÃO
  $(document).on("keydown", ".autocomplete-material", function (e) {

    const box = $(this).siblings(".autocomplete-box, .autocomplete-box-tabela");
    const itens = box.find(".item");

    let ativo = box.find(".item.active");

    if (e.key === "ArrowDown") {
      e.preventDefault();

      if (!ativo.length) {
        itens.first().addClass("active");
      } else {
        ativo.removeClass("active").next().addClass("active");
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      if (!ativo.length) {
        itens.last().addClass("active");
      } else {
        ativo.removeClass("active").prev().addClass("active");
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();

      ativo.click();
    }

  });

  // 🔥 FECHAR AO CLICAR FORA
  $(document).on("click", function (e) {

    if (!$(e.target).closest(".autocomplete-container").length) {
      $(".autocomplete-box, .autocomplete-box-tabela").hide();
    }

  });

}