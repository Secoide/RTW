const FeriadosModel = require('../models/feriados.model');

async function listarFeriados(ano) {
  return FeriadosModel.listarFeriados(ano);
}

async function criarFeriado(dados) {
  return FeriadosModel.criarFeriado(dados);
}

async function atualizarFeriado(id, dados) {
  return FeriadosModel.atualizarFeriado(id, dados);
}

async function excluirFeriado(id) {
  return FeriadosModel.excluirFeriado(id);
}

async function sugerirFeriados(ano) {
  const sugestoes = FeriadosModel.sugerirFeriados(ano);
  const cadastrados = await FeriadosModel.listarFeriados(ano);
  const datasCadastradas = new Set(cadastrados.map(item => item.data));

  return sugestoes.map(item => ({
    ...item,
    cadastrado: datasCadastradas.has(item.data)
  }));
}

module.exports = {
  listarFeriados,
  criarFeriado,
  atualizarFeriado,
  excluirFeriado,
  sugerirFeriados
};
