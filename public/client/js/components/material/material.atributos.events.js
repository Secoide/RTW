import { materialState as state } from "../../state/material.state.js";
import { renderAtributos } from "../../utils/dom/material.atributos.render.js";
import { adicionarAtributo } from "../../components/forms/material.modal.js";
// 🔥 helper
function normalizar(attr) {
  return attr?.replace(/"/g, "").trim().toLowerCase();
}

export function initMaterialAtributosModal() {

  // ==============================
  // ➕ ADICIONAR ATRIBUTO
  // ==============================
  $("#btnAddAtributo").on("click", function () {

    const attr = $("#selectAtributo").val();
    if (!attr) return;

    if (state.atributosSelecionados.includes(attr)) return;
    const existe = state.atributosSelecionados
      .map(a => normalizar(a))
      .includes(normalizar(attr));

    if (existe) return;

    adicionarAtributo(attr);
  });


  // ==============================
  // 🔍 AUTOCOMPLETE ATRIBUTOS
  // ==============================
  $(document).on("input", ".input-attr", function () {

    const attr = $(this).data("attr");
    const termo = ($(this).val() || "").toLowerCase();
    const box = $(`[data-box="${attr}"]`);

    box.empty().show();

    const lista = state.valoresCache[attr] || [];

    const filtrados = lista.filter(v =>
      v.toLowerCase().includes(termo)
    );

    if (!filtrados.length) {
      box.append(`
        <div class="item novo" data-value="${termo}">
          + Criar "${termo}"
        </div>
      `);
      return;
    }

    filtrados.slice(0, 20).forEach(v => {
      box.append(`
        <div class="item" data-value="${v}">
          ${v}
        </div>
      `);
    });

  });


  // ==============================
  // ❌ REMOVER ATRIBUTO (COM PRESERVAÇÃO)
  // ==============================
  $(document).on("click", ".chip-remove", function () {

    const attrRemover = $(this).closest(".chip").data("attr");

    // 🔥 1. salvar valores atuais
    const valores = {};

    $(".input-attr").each(function () {
      const attr = $(this).data("attr");
      valores[normalizar(attr)] = $(this).val();
    });

    // 🔥 2. remover do state
    state.atributosSelecionados = state.atributosSelecionados.filter(a => {
      return normalizar(a) !== normalizar(attrRemover);
    });

    // 🔥 3. renderizar novamente
    renderAtributos();

    // 🔥 4. restaurar valores
    setTimeout(() => {

      $(".input-attr").each(function () {

        const attr = $(this).data("attr");
        const key = normalizar(attr);

        if (valores[key]) {
          $(this).val(valores[key]);
        }

      });

    }, 0);

  });

}