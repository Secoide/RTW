const SetorModel = require('../models/setor.model');

// Listar todos
async function listarSetores() {
  return await SetorModel.getSetores();
}

// Buscar um
async function buscarSetor(id) {
  return await SetorModel.getSetorById(id);
}

// Buscar um
async function buscarSetorIDCargo(idCargo) {
  return await SetorModel.getSetorByIdCargo(idCargo);
}

// Criar
async function criarSetor(data) {
  if (!data.nome) {
    throw new Error('Nome do setor é obrigatório');
  }
  const result = await SetorModel.createSetor(data);
  return {
    message: "Setor cadastrado com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarSetor(id, data) {
  return await SetorModel.updateSetor(id, data);
}

// Deletar
async function deletarSetor(id) {
  return await SetorModel.deleteSetor(id);
}

// Adicionar cargo
async function addCargo(idSetor, idCargo) {
  if (!idSetor || !idCargo) throw new Error('IDs inválidos');
  return await SetorModel.addCargoToSetor(idSetor, idCargo);
}

// Remover cargo
async function removeCargo(idSetor, idCargo) {
  if (!idSetor || !idCargo) throw new Error('IDs inválidos');
  return await SetorModel.removeCargoFromSetor(idSetor, idCargo);
}


module.exports = {
  listarSetores,
  buscarSetor,
  buscarSetorIDCargo,
  criarSetor,
  atualizarSetor,
  deletarSetor,
  addCargo,
  removeCargo
};
