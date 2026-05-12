import { highlightTextoSeguro } from "../material.utils.js";


export function getTbody() {
  return $("#tableMaterial tbody");
}

// 🔥 render principal
export async function renderTabela(lista) {
  const tbody = getTbody();
  tbody.empty();

  lista.forEach(item => {
    tbody.append(renderLinha(item));
  });
}

// 🔥 render completo (SEU ORIGINAL ORGANIZADO)
export function renderLinha(item) {
  
  const termoBusca = $("#searchMaterial").val();
  const iconeFornecedor = item.fornecedor_nome
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

  const barra = `
    <td class="col-separacao">
      <div class="barra-wrapper" data-tooltip="${tooltip}">
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
      <td>${item.id}</td>
      <td class="col-material">
          <img class="tb_imgMaterial"
                  src="${imgSrc}">
          </img>
          <div>
            <div> ${highlightTextoSeguro(item.nome, termoBusca)}</div>
            ${item.atributos
              ? `<div style="font-size: 11px; color: #aaa;">${item.atributos}</div>`
              : ""
            }
        </div>
        
      </td>

      <td>${item.categoria || "-"}</td>
      <td>${total}</td>
      <td>${highlightTextoSeguro(item.codigo, termoBusca)}</td>
      <td>${item.fabricante || "-"}</td>

      ${barra}

      <td class="col-fornecedor">
        <div class="fornecedor-box">
          <span class="fornecedor-nome">
            ${item.fornecedor_nome || "—"}
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

      <td>
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

      <td class="col-acoes">

        <button class="separar" data-id="${item.id}" title="Separar item">
          <i class="fa-solid fa-box"></i>
        </button>

        <button data-id="${item.id}" data-action="editar" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>

        <button data-id="${item.id}" data-action="apagar" title="Apagar">
          <i class="fa-solid fa-trash"></i>
        </button>

      </td>
    </tr>
  `;
}


