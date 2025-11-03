const OSModel = require('../models/os.model');

// Listar todas as OS
 async function listarOrdemServico() {
   return await OSModel.getOrdemServico();
}

// Buscar um
async function buscarOrdemServico(id) {
  return await OSModel.getOrdemServicoById(id);
}

async function salvarOS(dados) {
  if (dados.acao === "editOS") {
    await OSModel.atualizarOS(dados);
    return { sucesso: true };
  }

  if (dados.acao === "cadOS") {
    const existente = await OSModel.verificarOSExistente(dados.idos);
    if (existente.length > 0) {
      return { sucesso: false, mensagem: "OS já cadastrada." };
    }
    await OSModel.inserirOS(dados);
    return { sucesso: true };
  }

  return { sucesso: false, mensagem: "Ação inválida." };
}

// services/OSService.js
async function atualizarOS(id, data) {
  const camposValidos = {};
  if (data.status !== undefined) camposValidos.status = data.status;
  if (data.descricao !== undefined) camposValidos.descricao = data.descricao;
  if (data.orçado !== undefined) camposValidos.orçado = data.orçado;
  if (data.concluido !== undefined) camposValidos.concluido = data.concluido;
  if (data.criado !== undefined) camposValidos.criado = data.criado;
  if (data.empresa !== undefined) camposValidos.empresa = data.empresa;
  if (data.supervisor !== undefined) camposValidos.supervisor = data.supervisor;
  if (data.cidade !== undefined) camposValidos.cidade = data.cidade;

  if (Object.keys(camposValidos).length === 0) return false;

  // Passa só os campos válidos pro model
  return await OSModel.updateOS(id, camposValidos);
}




async function atualizarStatusOS(id, data) {
  if (!id) throw new Error('ID da OS é obrigatório');

  const atualizado = await OSModel.updateStatusOS(id, {
    statusOS: data.statusOS
  });

  if (!atualizado) {
    throw new Error('OS não encontrado para atualização');
  }

  return { id, ...data };
}


async function buscarStatusOS(dataDia) {
  return await OSModel.getStatusOS(dataDia);
}

// Deletar
async function deletarOS(id) {
  return await OSModel.deleteOS(id);
}


module.exports = {
  listarOrdemServico,
  buscarOrdemServico,
  salvarOS,
  atualizarOS,
  atualizarStatusOS,
  buscarStatusOS,
  deletarOS
};
