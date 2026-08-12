import { carregarCusto, carregarListasMateriaisOS, carregarMateriais } from "../services/api/material.api.js";
import { renderTabela } from "../utils/dom/material-render.js";
import { atualizarResumo } from "../utils/dom/material-resumo.js";
import { aplicarModoMaterial, calcularResumoMateriais, getTituloEstagio, renderKanbanMateriais } from "../utils/dom/material-kanban.render.js";
import { materialState as state } from "../state/material.state.js";
import { aplicarFiltros, atualizarFiltroCategoriasMaterial } from "../services/filter/material.filter.js";

export async function carregarMateriaisCompleto() {
  if (!state.osSelecionada) {
    state.modoVisualizacao = "kanban";
    state.listaSelecionada = null;
  }

  const listas = await carregarListasMateriaisOS();
  const listaFoco = sessionStorage.getItem("material_focus_lista");

  if (listaFoco && listas.some(lista => Number(lista.id) === Number(listaFoco))) {
    state.listaSelecionada = listaFoco;
    state.modoVisualizacao = "detalhe";
    sessionStorage.removeItem("material_focus_lista");
  }

  if (state.osSelecionada && state.modoVisualizacao === "detalhe" && !state.listaSelecionada && listas.length) {
    state.listaSelecionada = listas[0].id;
  }

  renderKanbanMateriais(listas, state.osSelecionada);

  const dados = await carregarMateriais();

  aplicarModoMaterial(state.modoVisualizacao);

  if (!dados) return;

  await carregarCusto();
  atualizarFiltroCategoriasMaterial();
  const listaVisivel = aplicarFiltros();
  await renderTabela(listaVisivel);
  atualizarResumo(listaVisivel);

  const resumo = calcularResumoMateriais(dados);
  const listaAtual = state.listasOS.find(lista => Number(lista.id) === Number(state.listaSelecionada));
  aplicarColunasPorEstagio(listaAtual?.status);

  $("#materialDetalheTitulo").text(listaAtual?.titulo || "Lista de materiais");
  $("#materialDetalheResumo").text(`${getTituloEstagio(listaAtual?.status)} | ${resumo.itens} item(ns) | Qtd. ${resumo.quantidade} | ${resumo.status}`);

  const valorSalvo = localStorage.getItem("mostrarImagemMaterial");

  if (valorSalvo !== null) {
    const isChecked = valorSalvo === "true";

    $("#chkMostrarImagemMaterial").prop("checked", isChecked);
    $(".tb_imgMaterial").toggleClass("mostrar-imagens", isChecked);
  }
}

function aplicarColunasPorEstagio(status) {
  const estagio = String(status || "").toLowerCase();
  const classes = [
    "material-estagio-orcamento",
    "material-estagio-engenharia",
    "material-estagio-estoque",
    "material-estagio-compras",
    "material-estagio-finalizado"
  ];

  $("#listaMaterial")
    .removeClass(classes.join(" "))
    .addClass(`material-estagio-${estagio || "orcamento"}`);
}
