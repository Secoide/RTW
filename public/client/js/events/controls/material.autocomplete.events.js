import { materialState as state } from "../../state/material.state.js";
import { highlightTextoSeguro } from "../../utils/material.utils.js";

export function initMaterialAutocomplete() {

  // 🔍 DIGITAÇÃO
  $(document).off("input.materialAutocompleteTabela", ".autocomplete-material")
    .on("input.materialAutocompleteTabela", ".autocomplete-material", function () {

    const termo = $(this).val().toLowerCase();
    const medidaBusca = extrairMedida(termo);
    const $input = $(this);
    const $linha = $input.closest("tr");

    // limpa seleção
    $linha.find("[data-field='id_variacao']").val("");

    // remove box antigo
    $input.parent().find(".autocomplete-box-tabela").remove();

    if (!termo) return;

    const termoSemMedida = medidaBusca
      ? termo.replace(medidaBusca.matchOriginal, " ")
      : termo;

    const termos = termoSemMedida
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

      return termos.every(t => texto.includes(t)) && materialCombinaMedida(m, medidaBusca);

    }).sort((a, b) => {

      const textoA = `${a.nome} ${a.atributos}`.toLowerCase();
      const textoB = `${b.nome} ${b.atributos}`.toLowerCase();

      const scoreA = termos.reduce((acc, t) => acc + (textoA.includes(t) ? 1 : 0), 0);
      const scoreB = termos.reduce((acc, t) => acc + (textoB.includes(t) ? 1 : 0), 0);
      const medidaA = materialCombinaMedida(a, medidaBusca) ? 2 : 0;
      const medidaB = materialCombinaMedida(b, medidaBusca) ? 2 : 0;

      return (scoreB + medidaB) - (scoreA + medidaA);

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

    box.find(".item").first().addClass("active");
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
      $linha.find("td").eq(1).text(material.categoria || "-");
      $linha.find("td").eq(3).text(material.codigo || "-");
      $linha.find("td").eq(4).text(material.fabricante || "-");
      $linha.find("td").eq(6).text(material.unidade || "-");
      $linha.find("td").eq(8).html(renderValorOrcado(material, $linha));

      box.remove();
      setTimeout(() => {
        $linha.find("[data-field='quantidade']").trigger("focus").trigger("select");
      }, 0);
    });

  });

  // 🖱 CLICK NA OPÇÃO
  $(document).off("click.materialAutocompleteTabelaItem", ".autocomplete-box .item, .autocomplete-box-tabela .item")
    .on("click.materialAutocompleteTabelaItem", ".autocomplete-box .item, .autocomplete-box-tabela .item", function () {

    const id = $(this).data("id");

    const item = state.listaVariacoes.find(v => v.id == id);

    const input = $(this).closest(".autocomplete-container, td").find("input");

    input.val(item.nome);

    $(this).parent().hide();

    // 🔥 guarda no input (importante)
    input.data("id-variacao", item.id);
  });

  // ⌨️ NAVEGAÇÃO
  $(document).off("keydown.materialAutocompleteTabela", ".autocomplete-material")
    .on("keydown.materialAutocompleteTabela", ".autocomplete-material", function (e) {

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

    if (e.key === "Enter" || (e.key === "Tab" && itens.length)) {
      e.preventDefault();

      (ativo.length ? ativo : itens.first()).click();
    }

  });

  // 🔥 FECHAR AO CLICAR FORA
  $(document).off("click.materialAutocompleteTabelaFechar")
    .on("click.materialAutocompleteTabelaFechar", function (e) {

    if (!$(e.target).closest(".autocomplete-container").length) {
      $(".autocomplete-box, .autocomplete-box-tabela").hide();
    }

  });

}

function renderValorOrcado(material, $linha) {
  const valor = Number(material.valor_orcamento_atual || 0);
  const quantidade = Number($linha?.find("[data-field='quantidade']").val() || 0);
  const total = quantidade > 0 ? valor * quantidade : 0;

  if (!valor || valor <= 0) return "-";

  return `
    <span>${formatarMoeda(valor)}</span>
    <small>${total > 0 ? formatarMoeda(total) : "Total: -"}</small>
  `;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function extrairMedida(termo) {
  const match = String(termo || "").match(/(\d+(?:[,.]\d+)?)\s*(?:mm)?\s*[xX]\s*(\d*(?:[,.]\d*)?)(?:\s*mm)?/);

  if (!match) return null;

  return {
    largura: normalizarNumeroMedida(match[1]),
    altura: normalizarNumeroMedida(match[2]),
    matchOriginal: match[0]
  };
}

function materialCombinaMedida(material, medidaBusca) {
  if (!medidaBusca) return true;

  const texto = normalizarTextoMedida(`
    ${material?.nome || ""}
    ${material?.atributos || ""}
    ${material?.codigo || ""}
    ${material?.fabricante || ""}
  `);

  const largura = medidaBusca.largura;
  const altura = medidaBusca.altura;

  if (!largura) return true;

  if (combinaMedidaComposta(texto, largura, altura)) {
    return true;
  }

  const larguraTexto = valorAtributoComecaCom(texto, "largura", largura);
  const larguraAbrev = valorAtributoComecaCom(texto, "l", largura);

  if (!altura) {
    return larguraTexto || larguraAbrev;
  }

  const alturaTexto = valorAtributoComecaCom(texto, "altura", altura);
  const alturaAbrev = valorAtributoComecaCom(texto, "a", altura);

  return (larguraTexto || larguraAbrev) && (alturaTexto || alturaAbrev);
}

function combinaMedidaComposta(texto, larguraBusca, alturaBusca) {
  const medidas = [...texto.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:mm)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:mm)?\b/g)];

  return medidas.some(match => {
    const larguraItem = normalizarNumeroMedida(match[1]);
    const alturaItem = normalizarNumeroMedida(match[2]);

    return medidaComecaCom(larguraItem, larguraBusca) &&
      (!alturaBusca || medidaComecaCom(alturaItem, alturaBusca));
  });
}

function valorAtributoComecaCom(texto, atributo, busca) {
  const regex = new RegExp(`\\b${escapeRegex(atributo)}\\s*[:=-]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:mm)?\\b`);
  const match = texto.match(regex);

  return match ? medidaComecaCom(normalizarNumeroMedida(match[1]), busca) : false;
}

function medidaComecaCom(valorItem, valorBusca) {
  return String(valorItem || "").startsWith(String(valorBusca || ""));
}

function normalizarNumeroMedida(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === "") return "";

  const numero = Number(String(valor || "").replace(",", "."));
  if (!Number.isFinite(numero)) return "";
  return String(numero).replace(/\.0+$/, "");
}

function normalizarTextoMedida(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");
}

function escapeRegex(valor) {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
