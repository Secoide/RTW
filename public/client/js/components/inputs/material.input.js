import { getTbody } from "../../utils/dom/material-render.js";

export function criarLinhaNova() {

  // 🔥 evita duplicar linha aberta
  if ($("#tableMaterial tbody tr.novo-registro").length) return;

  const tr = `
    <tr class="novo-registro">

      <td></td>

      <td>
        <div class="autocomplete-container">
          <input 
            type="text" 
            class="autocomplete-material"
            placeholder="Digite uma informação do material..."
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
      
      <td>—</td>

      <td>
        <input data-field="quantidade" type="number">
      </td>

      <td>—</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
      
      <td>—</td>
      <td>—</td>

      <td>

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

  // 🔥 foco no autocomplete
  setTimeout(() => {
    const $input = $(".novo-registro .autocomplete-material").first();
    $input.focus();
    $input.select();
  }, 50);

}