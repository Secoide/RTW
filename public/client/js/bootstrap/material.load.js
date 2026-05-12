import { carregarMateriais } from "../services/api/material.api.js";
import { renderTabela } from "../utils/dom/material-render.js";
import { atualizarResumo } from "../utils/dom/material-resumo.js";

export async function carregarMateriaisCompleto() {

  const dados = await carregarMateriais();

  if (!dados) return;



  await renderTabela(dados);
  atualizarResumo(dados);
  
  const valorSalvo = localStorage.getItem("mostrarImagemMaterial");

  if (valorSalvo !== null) {
    const isChecked = valorSalvo === "true";

    $("#chkMostrarImagemMaterial").prop("checked", isChecked);
    $(".tb_imgMaterial").toggleClass("mostrar-imagens", isChecked);
  }

  $(document).on("click", "#chkMostrarImagemMaterial", function () {

    const isChecked = $(this).is(":checked");

    $(".tb_imgMaterial").toggleClass("mostrar-imagens", isChecked);

    // salva no localStorage
    localStorage.setItem("mostrarImagemMaterial", isChecked);
  });


}