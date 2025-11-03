const EmpresaModel = require('../models/empresas.model');

// Listar todos
async function listarEmpresas() {
  return await EmpresaModel.getEmpresa();
}

// Buscar um
async function buscarEmpresa(id) {
  return await EmpresaModel.getEmpresaById(id);
}

// Criar
async function criarEmpresa(data) {
  if (!data.nome) {
    throw new Error('Nome é obrigatório');
  }
  return await EmpresaModel.createEmpresa(data);
}

// Atualizar
async function atualizarEmpresa(id, data) {
  return await EmpresaModel.updateEmpresa(id, data);
}

// Deletar
async function deletarEmpresa(id) {
  return await EmpresaModel.deleteEmpresa(id);
}

// Adicionar supervisor
async function addSupervisor(idEmpresa, idSupervisor) {
  if (!idEmpresa || !idSupervisor) throw new Error('IDs inválidos');
  return await EmpresaModel.addSupervisorToEmpresa(idEmpresa, idSupervisor);
}

// Remover supervisor
async function removeSupervisor(idEmpresa, idSupervisor) {
  if (!idEmpresa || !idSupervisor) throw new Error('IDs inválidos');
  return await EmpresaModel.removeSupervisorFromEmpresa(idEmpresa, idSupervisor);
}

// Adicionar cidade
async function addCidade(idEmpresa, idCidade) {
  if (!idEmpresa || !idCidade) throw new Error('IDs inválidos');
  return await EmpresaModel.addCidadeToEmpresa(idEmpresa, idCidade);
}

// Remover cidade
async function removeCidade(idEmpresa, idCidade) {
  if (!idEmpresa || !idCidade) throw new Error('IDs inválidos');
  return await EmpresaModel.removeCidadeFromEmpresa(idEmpresa, idCidade);
}

module.exports = {
  listarEmpresas,
  buscarEmpresa,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  addSupervisor,
  removeSupervisor,
  addCidade,
  removeCidade
};
