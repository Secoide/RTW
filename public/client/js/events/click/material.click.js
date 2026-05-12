import { carregarMateriais } from "../../services/api/material.api.js";
import { criarLinhaNova } from "../../components/inputs/material.input.js";
import { carregarMateriaisCompleto } from "../../bootstrap/material.load.js";
import { salvarNovoMaterial, atualizarMaterial } from "../../services/api/material.save.js";

export function initMaterialClicks() {

  $(document).on("click", "#btnReloadMaterial", carregarMateriais);
  // 🔥 SALVAR (NOVO OU EXISTENTE)
  $(document).on("click", ".save", async function () {

    const $tr = $(this).closest("tr");

    try {

      // 🔹 NOVO MATERIAL
      if ($tr.hasClass("novo-registro")) {

        await salvarNovoMaterial($tr);

        $tr.addClass("salvo");

        setTimeout(() => {
          $tr.removeClass("salvo");
        }, 600);

        await carregarMateriaisCompleto();
        criarLinhaNova();

        return;
      }

      // 🔹 EDIÇÃO
      if ($tr.hasClass("editando")) {

        await atualizarMaterial($tr);

        $tr.addClass("salvo");

        setTimeout(() => {
          $tr.removeClass("salvo");
        }, 600);

        await carregarMateriaisCompleto();

        return;
      }

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar material");
    }

  });



  // 🔥 NOVO MATERIAL
  $("#btnNovoMaterial").on("click", criarLinhaNova);

  // 🔥 reload
  $(document).on("click", "#btnReloadMaterial", carregarMateriaisCompleto);

  $(document).on("click", "[data-action='editar']", function () {

    const $tr = $(this).closest("tr");

    if ($tr.hasClass("editando")) return;

    $tr.addClass("editando");

    const nomeAtual = $tr.find(".col-material div").first().text().trim();
    const quantidadeAtual = $tr.find("td").eq(3).text().trim();

    // 🔥 MATERIAL
    $tr.find(".col-material").html(`
    <div class="autocomplete-container">
      <input 
        type="text" 
        class="autocomplete-material"
        value="${nomeAtual}"
        style="width:100%"
      >
    </div>
    <input type="hidden" data-field="id_variacao">
  `);

    // 🔥 QUANTIDADE
    $tr.find("td").eq(3).html(`
    <input data-field="quantidade" type="number" value="${quantidadeAtual}">
  `);

    // 🔥 TROCA BOTÕES
    $tr.find(".col-acoes").html(`
    <button class="save" title="Salvar">
      <i class="fa-solid fa-floppy-disk"></i>
    </button>

    <button class="cancel-edit" title="Cancelar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `);

  });

  $(document).on("click", ".cancel-edit", async function () {

    const $tr = $(this).closest("tr");

    // 🔥 remove modo edição
    $tr.removeClass("editando");

    // 🔥 recarrega a tabela inteira (mais simples e seguro)
    await carregarMateriaisCompleto();

  });


  $(document).on("click", ".cancel", async function () {
    // 🔥 recarrega a tabela inteira (mais simples e seguro)
    await carregarMateriaisCompleto();

  });


  // 🔥 apagar
  $(document).on("click", "[data-action='apagar']", async function () {

    const id = $(this).data("id");

    if (!confirm("Excluir material?")) return;

    await $.ajax({
      url: `/api/materiais/os/excluir/${id}`,
      method: "DELETE"
    });

    carregarMateriais();

  });

  $("#btnExportarLista").on("click", exportarExcel);

  function exportarExcel() {
    const tabela = document.getElementById("tableMaterial");

    let html = tabela.outerHTML;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "materiais.xls";
    a.click();

    URL.revokeObjectURL(url);
  }


}