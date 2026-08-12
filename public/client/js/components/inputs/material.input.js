import { getTbody } from "../../utils/dom/material-render.js";

export function criarLinhaNova() {
  if ($("#tableMaterial tbody tr.novo-registro").length) return;

  const tr = `
    <tr class="novo-registro">
      <td class="col-id">Novo</td>
      <td>-</td>

      <td class="col-material">
        <div class="autocomplete-container">
          <input
            type="text"
            class="autocomplete-material"
            placeholder="Digite uma informacao do material..."
            style="
              width: 100%;
              padding: 4px 6px;
              background: var(--input-bg);
              color: var(--texto-principal);
              border: 1px solid rgb(85, 85, 85);
              border-radius: 4px;
              font-size: 12px;
            "
          >
        </div>
        <input type="hidden" data-field="id_variacao">
      </td>

      <td>-</td>
      <td>-</td>
      <td>
        <input data-field="quantidade" type="number" min="1" placeholder="Qtd.">
      </td>
      <td class="col-unidade">-</td>
      <td>
        <input data-field="observacao" type="text" maxlength="255" placeholder="Obs.">
      </td>
      <td class="col-orcado">-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td class="col-oc"><span class="material-oc-vazio">-</span></td>

      <td class="col-acoes">
        <button class="save" title="Salvar">
          <i class="fa-solid fa-floppy-disk"></i>
        </button>

        <button class="cancel" title="Cancelar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </td>
    </tr>
  `;

  getTbody().prepend(tr);

  setTimeout(() => {
    const $input = $(".novo-registro .autocomplete-material").first();
    $input.focus();
    $input.select();
  }, 50);
}
