const SupervisorModel = require('../models/supervisor.model');

// Listar todos
async function listarSuperivores() {
  return await SupervisorModel.getSupervisores();
}

// Buscar um
async function buscarSupervisor(id) {
  return await SupervisorModel.getSupervisorById(id);
}

// Buscar um
async function buscarSupervisorIDEmpresa(idEmpresa) {
  return await SupervisorModel.getSupervisorByIdEmpresa(idEmpresa);
}

// Criar
async function criarSupervisor(data) {
  if (!data.nome || (!data.telefone && !data.email)) {
    throw new Error('Informe o nome e pelo menos um meio de contato (telefone ou e-mail)');
  }
  const result = await SupervisorModel.createSupervisor(data);

  return {
    message: "Supervisor cadastrado com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarSupervisor(id, data) {
  return await SupervisorModel.updateSupervisor(id, data);
}

// Deletar
async function deletarSupervisor(id) {
  return await SupervisorModel.deleteSupervisor(id);
}

module.exports = {
  listarSuperivores,
  buscarSupervisor,
  buscarSupervisorIDEmpresa,
  criarSupervisor,
  atualizarSupervisor,
  deletarSupervisor
};
