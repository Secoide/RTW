const CidadeModel = require('../models/cidade.model');

// Listar todos
async function listarCidades() {
  return await CidadeModel.getCidades();
}

// Buscar um
async function buscarCidade(id) {
  return await CidadeModel.getCidadeById(id);
}

// Buscar um
async function buscarCidadeIDEmpresa(idEmpresa) {
  return await CidadeModel.getCidadeByIdEmpresa(idEmpresa);
}

// Criar
async function criarCidade(data) {
  const result = await CidadeModel.createCidade(data);
  return {
    message: "Cidade cadastrada com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarCidade(id, data) {
  return await CidadeModel.updateCidade(id, data);
}

// Deletar
async function deletarCidade(id) {
  return await CidadeModel.deleteCidade(id);
}

module.exports = {
  listarCidades,
  buscarCidade,
  buscarCidadeIDEmpresa,
  criarCidade,
  atualizarCidade,
  deletarCidade
};
