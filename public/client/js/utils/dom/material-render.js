import { escapeHtml, highlightTextoSeguro } from "../material.utils.js";


export function getTbody() {
  return $("#tableMaterial tbody");
}

// 🔥 render principal
export async function renderTabela(lista) {
  const tbody = getTbody();
  tbody.empty();

  $("#emptyMaterial").toggle(!lista.length);

  if (!lista.length) {
    tbody.append(`
      <tr class="material-empty-row">
        <td colspan="15">
          <div class="material-empty-state">
            <i class="fa-solid fa-box-open"></i>
            <strong>Nenhum material nesta lista</strong>
            <span>Use o botao Novo Material para adicionar itens ao fluxo.</span>
          </div>
        </td>
      </tr>
    `);
    reaplicarEstadoImagens();
    return;
  }

  lista.forEach(item => {
    tbody.append(renderLinha(item));
  });

  reaplicarEstadoImagens();
}

function reaplicarEstadoImagens() {
  const checkbox = $("#chkMostrarImagemMaterial");
  const valorSalvo = localStorage.getItem("mostrarImagemMaterial");
  const mostrar = checkbox.length
    ? checkbox.is(":checked")
    : valorSalvo === "true";

  $(".tb_imgMaterial").toggleClass("mostrar-imagens", mostrar);
}

// 🔥 render completo (SEU ORIGINAL ORGANIZADO)
export function renderLinha(item) {
  
  const termoBusca = $("#searchMaterial").val();
  const fornecedorSelecionado = (item.fornecedor_nome || "").toUpperCase();
  const fornecedorReferencia = fornecedorSelecionado || "";
  const fornecedorMenor = item.fornecedor_menor_nome || "";
  const iconeFornecedor = fornecedorSelecionado || fornecedorMenor
    ? `<i class="fa-solid fa-pen-to-square"></i>`
    : `<i class="fa-solid fa-coins"></i>`;

  const total = Number(item.quantidade || 0);
  const separado = Number(item.quantidade_separada || 0);
  const comprado = Number(item.quantidade_comprada || 0);
  const faltante = total - separado - comprado;

  const percS = total ? (separado / total) * 100 : 0;
  const percC = total ? (comprado / total) * 100 : 0;
  const percF = total ? (faltante / total) * 100 : 0;

  const tooltip = `
Separado: ${separado}
Comprado: ${comprado}
Faltante: ${faltante}
Total: ${total}
`.trim();

  const valorTotalporItem_MenorValor = (item.menor_valor || 0) * total;
  const valorTotalporItem_Escolhido = (item.valor_escolhido || 0) * total;
  const valorOrcadoUnitario = Number(item.valor_orcamento_atual || 0);
  const valorOrcadoTotal = valorOrcadoUnitario * total;

  const barra = `
    <td class="col-separacao">
      <div class="barra-wrapper" data-tooltip="${escapeHtml(tooltip)}">
        <div class="barra">
          <div class="barra-fill" style="
            --s:${percS};
            --c:${percC};
            --f:${percF};
          "></div>
        </div>
      </div>
    </td>
  `;
  const imgSrc = item.imagem 
        ? `${item.imagem}?v=${item.versao_foto || ""}` 
        : "/imagens/imagemmaterial.webp";
  return `
    <tr data-id="${item.id}">
      <td class="col-id">${item.id}</td>
      <td>${escapeHtml(item.categoria || "-")}</td>
      <td class="col-material">
          <img class="tb_imgMaterial"
                  src="${escapeHtml(imgSrc)}">
          </img>
          <div>
            <div> ${highlightTextoSeguro(item.nome, termoBusca)}</div>
            ${item.atributos
              ? `<div style="font-size: 11px; color: #aaa;">${escapeHtml(item.atributos)}</div>`
              : ""
            }
        </div>
        
      </td>

      <td>${highlightTextoSeguro(item.codigo, termoBusca)}</td>
      <td>${escapeHtml(item.fabricante || "-")}</td>
      <td>${total}</td>
      <td class="col-unidade">${escapeHtml(item.unidade || "-")}</td>
      <td class="col-observacao" title="${escapeHtml(item.observacao || "")}">
        ${escapeHtml(item.observacao || "-")}
      </td>
      <td class="col-orcado">
        ${valorOrcadoUnitario > 0
          ? `<span>${formatarMoeda(valorOrcadoUnitario)}</span><small>${formatarMoeda(valorOrcadoTotal)}</small>`
          : "-"
        }
      </td>

      ${barra}

      <td class="col-fornecedor">
        <div class="fornecedor-box">
          <span class="fornecedor-nome">
            ${escapeHtml(fornecedorReferencia || "-")}
          </span>

          <button class="fornecedores" data-id="${item.id}" title="Cotar fornecedores">
            ${iconeFornecedor}
          </button>
        </div>
      </td>

      <td class="col-preco">

        ${item.menor_valor
          ? `<span class="preco-menor">
              R$ ${Number(item.menor_valor).toFixed(2)}
            </span>`
          : "-"}

        ${item.valor_escolhido
          ? `<span class="preco-escolhido">
              | R$ ${Number(item.valor_escolhido).toFixed(2)}
            </span>`
          : ""}

      </td>

      <td class="col-total">
        ${item.menor_valor
          ? (
              item.valor_escolhido &&
              Number(item.valor_escolhido) === Number(item.menor_valor)
                ? `R$ ${Number(valorTotalporItem_Escolhido).toFixed(2)}`
                : `
                  <span class="preco-menor">
                    R$ ${Number(valorTotalporItem_MenorValor).toFixed(2)}
                  </span>
                  ${item.valor_escolhido
                    ? `<span class="preco-escolhido">
                        | R$ ${Number(valorTotalporItem_Escolhido).toFixed(2)}
                      </span>`
                    : ""
                  }
                `
            )
          : "-"
        }
      </td>

      <td class="col-oc">
        ${fornecedorSelecionado
          ? `<div class="material-oc-box">
              <input
                class="material-oc-input"
                data-id="${item.id}"
                value="${escapeHtml(item.oc || "")}"
                placeholder="N. OC"
              >
              <button class="material-oc-salvar" data-id="${item.id}" title="Salvar OC">
                <i class="fa-solid fa-floppy-disk"></i>
              </button>
            </div>`
          : `<span class="material-oc-vazio" title="Selecione um fornecedor para liberar a OC">-</span>`
        }
      </td>

      <td class="col-acoes">

        <button class="separar" data-id="${item.id}" title="Separar item">
          <i class="fa-solid fa-box"></i>
        </button>

        <button data-id="${item.id}" data-action="editar" title="Editar quantidade e observacao">
          <i class="fa-solid fa-pen"></i>
        </button>

        <button data-id="${item.id}" data-action="apagar" title="Apagar">
          <i class="fa-solid fa-trash"></i>
        </button>

      </td>
    </tr>
  `;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}


