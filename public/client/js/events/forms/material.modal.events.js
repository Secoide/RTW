import {
  abrirModalMaterial,
  fecharModalMaterial,
  adicionarAtributo
} from "../../components/forms/material.modal.js";

import {
  montarObjetoMaterial,
  montarObjetoVariacao,
  montarAtributos,
  validarMaterial
} from "../../utils/material.modal.utils.js";

import {
  criarOuBuscarMaterial,
  criarVariacao,
  adicionarAtributo as salvarAtributo
} from "../../services/api/material.modal.api.js";

import { carregarMateriais } from "../../services/api/material.api.js";

export function initMaterialModal() {

  // 🔥 abrir modal
  $("#btnCadastrarMaterial").on("click", abrirModalMaterial);

  // 🔥 fechar
  $("#btnFecharModal").on("click", fecharModalMaterial);

  // 🔥 adicionar atributo
  $("#btnAddAtributosss").on("click", function () {

    const atributo = $("#selectAtributo").val();

    if (!atributo) return;

    adicionarAtributo(atributo);

  });

  // 🔥 salvar material completo
  $("#btnSalvassrMaterial").on("click", async function () {

    if (!validarMaterial()) return;

    try {

      // 🔹 material
      const material = montarObjetoMaterial();
      const resMaterial = await criarOuBuscarMaterial(material);

      const idMaterial = resMaterial.id || resMaterial.insertId;

      // 🔹 variação
      const variacao = montarObjetoVariacao(idMaterial);
      const resVar = await criarVariacao(variacao);

      const idVariacao = resVar.insertId;

      // 🔹 atributos
      const atributos = montarAtributos(idVariacao);

      for (let attr of atributos) {
        await salvarAtributo(attr);
      }

      alert("Material cadastrado com sucesso");

      fecharModalMaterial();
      carregarMateriais();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar material");
    }

  });

}