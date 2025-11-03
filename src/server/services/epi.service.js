const EPIModel = require('../models/epi.model');

// Listar todos
async function listarEPIs() {
  return await EPIModel.getEPIs();
}

// Buscar um
async function buscarEPI(id) {
  return await EPIModel.getEPIById(id);
}

// Buscar um
async function buscarEPIIDEmpresa(idEmpresa) {
  return await EPIModel.getEPIByIdEmpresa(idEmpresa);
}

// Criar
async function criarEPI(data) {
  if (!data.nome) {
    throw new Error('Nome é obrigatório');
  }
  const result = await EPIModel.createEPI(data);

  return {
    message: "EPI cadastrado com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarEPI(id, data) {
  return await EPIModel.updateEPI(id, data);
}

// Deletar
async function deletarEPI(id) {
  return await EPIModel.deleteEPI(id);
}


// Buscar um
async function buscarEPIsByColaborador(idFunc) {
  return await EPIModel.getEPIsByColaborador(idFunc);
}


module.exports = {
  listarEPIs,
  buscarEPI,
  buscarEPIIDEmpresa,
  criarEPI,
  atualizarEPI,
  deletarEPI,
  buscarEPIsByColaborador
};
