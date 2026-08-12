import { materialState as state } from "../../state/material.state.js";

export async function carregarVariacoes() {
  state.listaVariacoes = await $.get(`${state.BASE_URL}/materiais/variacoes`);
  return state.listaVariacoes;
}

export async function carregarFornecedores() {
  state.listaFornecedores = await $.get(`${state.BASE_URL}/fornecedor`);
  return state.listaFornecedores;
}

export async function carregarResponsaveisLista() {
  try {
    state.listaResponsaveis = await $.get(`${state.BASE_URL}/colaboradores/responsavel/cbx`);
  } catch (err) {
    console.warn("Nao foi possivel carregar responsaveis da lista.", err);
    state.listaResponsaveis = [];
  }

  return state.listaResponsaveis;
}

export async function carregarOS() {
  const lista = await $.get("/api/os");
  const osFoco = sessionStorage.getItem("material_focus_os");

  const $cbx = $("#cbxOS");
  $cbx.empty().append(`<option value="">Selecione uma OS</option>`);

  lista
    .filter(os => os.statuss != 4)
    .forEach(os => {
      $cbx.append(
        `<option value="${os.id_OSs}">OS ${os.id_OSs} - ${os.descricao}</option>`
      );
    });

  if (osFoco && $cbx.find(`option[value="${osFoco}"]`).length) {
    state.osSelecionada = osFoco;
    $cbx.val(osFoco);
    sessionStorage.removeItem("material_focus_os");
  }

  return lista;
}

export async function carregarListasMateriaisOS() {
  if (!state.osSelecionada) {
    state.listasOS = [];
    return [];
  }

  const res = await $.get(`${state.BASE_URL}/materiais/listas/os/${state.osSelecionada}`);
  state.listasOS = res || [];
  return state.listasOS;
}

export async function carregarMateriais() {
  if (!state.osSelecionada) return null;

  const queryLista = state.listaSelecionada
    ? `?id_lista=${encodeURIComponent(state.listaSelecionada)}`
    : "";

  const res = await $.get(`${state.BASE_URL}/materiais/os/${state.osSelecionada}${queryLista}`);
  state.listaMateriais = res || [];
  state.dados = res || [];
  state.listaFiltrada = [];

  return state.dados;
}

export async function carregarCusto() {
  if (!state.osSelecionada) return null;

  const res = await $.get(`${state.BASE_URL}/materiais/os/${state.osSelecionada}/custo`);
  $("#totalCusto").text("R$ " + Number(res.total || 0).toFixed(2));

  return res;
}

export function criarListaMaterialOS(payload) {
  return $.ajax({
    url: `${state.BASE_URL}/materiais/listas`,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload)
  });
}

export function atualizarListaMaterialOS(id, payload) {
  return $.ajax({
    url: `${state.BASE_URL}/materiais/listas/${id}`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(payload)
  });
}

export function avancarListaMaterialOS(id) {
  return $.ajax({
    url: `${state.BASE_URL}/materiais/listas/${id}/avancar`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({ confirmado: true, origem: "materiais" })
  });
}

export function voltarListaMaterialOS(id) {
  return $.ajax({
    url: `${state.BASE_URL}/materiais/listas/${id}/voltar`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({})
  });
}

export function voltarListaMaterialOSComMotivo(id, motivo = "") {
  return $.ajax({
    url: `${state.BASE_URL}/materiais/listas/${id}/voltar`,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify({ motivo })
  });
}

export function duplicarListaMaterialOS(id) {
  return $.post(`${state.BASE_URL}/materiais/listas/${id}/duplicar`);
}

export function listarHistoricoListaMaterialOS(id) {
  return $.get(`${state.BASE_URL}/materiais/listas/${id}/historico`);
}

export function excluirListaMaterialOS(id) {
  return $.ajax({
    url: `${state.BASE_URL}/materiais/listas/${id}`,
    method: "DELETE"
  });
}
