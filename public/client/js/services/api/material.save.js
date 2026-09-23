import { materialState as state } from "../../state/material.state.js";


// ==============================
// 🔥 SALVAR NOVO MATERIAL
// ==============================
export async function salvarNovoMaterial($tr) {

  const id_variacao = $tr.find("[data-field='id_variacao']").val();
  const descricaoLivre = $tr.find(".autocomplete-material").val()?.trim() || "";
  const quantidade = Number($tr.find("[data-field='quantidade']").val());
  const observacao = $tr.find("[data-field='observacao']").val()?.trim() || null;

  if (!id_variacao && !descricaoLivre) {
    alert("Selecione um material ou informe uma descrição específica");
    throw new Error("Material nao informado");
  }

  if (!quantidade || quantidade <= 0) {
    alert("Informe a quantidade");
    throw new Error("Quantidade inválida");
  }

  if (!state.osSelecionada) {
    alert("Selecione uma OS antes de adicionar material");
    throw new Error("OS não selecionada");
  }

  const payload = {
    id_os: state.osSelecionada,
    id_lista: state.listaSelecionada,
    quantidade,
    observacao
  };

  if (id_variacao) {
    payload.id_variacao = id_variacao;
  } else {
    payload.material_livre = 1;
    payload.material_livre_descricao = descricaoLivre;
  }

  return await $.post("/api/materiais/os/cadastrar", payload);
}


// ==============================
// 🔥 ATUALIZAR MATERIAL EXISTENTE
// ==============================
export async function atualizarMaterial($tr) {

  const id = $tr.data("id");

  const quantidade = Number($tr.find("[data-field='quantidade']").val());
  const id_variacao = $tr.find("[data-field='id_variacao']").val();
  const observacao = $tr.find("[data-field='observacao']").val()?.trim() || null;

  if (!id) {
    alert("ID do material não encontrado");
    throw new Error("ID inválido");
  }

  if (!quantidade || quantidade <= 0) {
    alert("Quantidade inválida");
    throw new Error("Quantidade inválida");
  }

  const payload = {
    quantidade,
    observacao,
    id_os: state.osSelecionada // 🔥 ESSENCIAL
  };


  // 🔥 só envia se usuário realmente alterou o material
  if (id_variacao) {
    payload.id_variacao = id_variacao;
  }

  return await $.ajax({
    url: `/api/materiais/os/editar/${id}`,
    type: "PUT",
    data: payload
  });
}
