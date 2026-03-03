const CargoModel = require('../models/cargo.model');

async function listarCargos() {
  return await CargoModel.getCargos();
}

async function listarCargosCBX(idSetor) {
  if (!idSetor) {
    throw new Error('Setor é obrigatório');
  }
  return await CargoModel.getCargosAtivosPorSetor(Number(idSetor));
}

async function criarCargo(data) {
  if (!data.nome) {
    throw new Error('Nome do cargo é obrigatório');
  }

  return await CargoModel.createCargo({
    nome: data.nome
  });
}


// Buscar um
async function buscarCargoIDSetor(idSetor) {
  return await CargoModel.getCargoByIdSetor(idSetor);
}

async function atualizarCargo(id, data) {
  if (!id) throw new Error('ID do cargo não enviado');
  return await CargoModel.updateCargo(Number(id), data);
}

async function excluirCargo(id) {
  if (!id) throw new Error('ID do cargo é obrigatório');

  const result = await CargoModel.deleteCargo(Number(id));

  if (result.affectedRows === 0) {
    throw new Error('Cargo não encontrado');
  }

  return true;
}

module.exports = {
  listarCargos,
  listarCargosCBX,
  criarCargo,
  atualizarCargo,
  excluirCargo,
  buscarCargoIDSetor
};
