import { materialState as state } from "../../state/material.state.js";

export async function carregarVariacoes() {
  state.listaVariacoes = await $.get(`${state.BASE_URL}/materiais/variacoes`);
}

export async function carregarFornecedores() {
  state.listaFornecedores = await $.get(`${state.BASE_URL}/fornecedor`);
}

export async function carregarOS() {
  const lista = await $.get("/api/os");

  const $cbx = $("#cbxOS");
  $cbx.empty().append(`<option value="">Selecione uma OS</option>`);

  lista
    .filter(o => o.statuss != 4)
    .forEach(o => {
      $cbx.append(
        `<option value="${o.id_OSs}">OS ${o.id_OSs} - ${o.descricao}</option>`
      );
    });
}

export async function carregarMateriais() {
  
  if (!state.osSelecionada) return;
  const res = await $.get(`${state.BASE_URL}/materiais/os/${state.osSelecionada}`);

  state.listaMateriais = res;

  state.dados = res;
  state.listaFiltrada = [];
  return res;
}

export async function carregarCusto() {

  if (!state.osSelecionada) return;

  const res = await $.get(`/api/materiais/os/${state.osSelecionada}/custo`);

  $("#totalCusto").text("R$ " + Number(res.total).toFixed(2));
}