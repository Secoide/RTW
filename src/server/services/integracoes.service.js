const IntegracaoModel = require('../models/integracoes.model');
const path = require('path');
const fs = require('fs');

// Listar todos
async function listarIntegracoes() {
  return await IntegracaoModel.getIntegracoes();
}

// Buscar um
async function buscarIntegracao(id) {
  return await IntegracaoModel.getIntegracaoById(id);
}

// Buscar um
async function buscarIntegracaoIDEmpresa(idEmpresa) {
  return await IntegracaoModel.getIntegracaoByIdEmpresa(idEmpresa);
}

// Criar
async function criarIntegracao(data) {
  if (!data.nomesupervisor || (!data.telefoneSup && !data.emailSup)) {
    throw new Error('Informe o nome e pelo menos um meio de contato (telefone ou e-mail)');
  }
  if (!data.idCliente) {
    throw new Error('Necessário informar cliente (Empresa responsavel do integracoes)');
  }
  const result = await IntegracaoModel.createIntegracao(data);

  return {
    message: "Integracao cadastrado com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarIntegracao(id, data) {
  return await IntegracaoModel.updateIntegracao(id, data);
}

// Deletar
async function deletarIntegracao(id) {
  return await IntegracaoModel.deleteIntegracao(id);
}

// Buscar um
async function buscarIntegracoesByColaborador(idFunc) {
  return await IntegracaoModel.getIntegracoesByColaborador(idFunc);
}
deletarIntegracao
async function salvarIntegracao({ datarealizadaIntegracao, vencimento, idColab, integracao, file }) {
  const idfuncionario = parseInt(idColab, 10);
  const idintegracao = parseInt(integracao, 10);
  const venc = parseInt(vencimento, 10);

  if (Number.isNaN(idfuncionario) || Number.isNaN(idintegracao) || Number.isNaN(venc)) {
    throw new Error('IDs e vencimento devem ser numéricos.');
  }

  let nomeArquivo = null;
  if (file) {
    // renomeia para padrão {idfuncionario}_{idintegracao}_{timestamp}.pdf
    nomeArquivo = `${idfuncionario}_${idintegracao}_${Date.now()}.pdf`;
    const novoCaminho = path.join(file.destination, nomeArquivo);
    fs.renameSync(file.path, novoCaminho);
  }

  const insertId = await IntegracaoModel.inserirIntegracao(datarealizadaIntegracao, venc, nomeArquivo, idfuncionario, idintegracao);
  return { id: insertId, arquivo: nomeArquivo };
}

async function baixarIntegracao(id) {
  const integracao = await IntegracaoModel.buscarIntegracaoPorId(id);
  // Retorna o objeto inteiro (nome colab, integracao, data, anexo)
  return integracao;
}


module.exports = {
  listarIntegracoes,
  buscarIntegracao,
  buscarIntegracaoIDEmpresa,
  criarIntegracao,
  atualizarIntegracao,
  deletarIntegracao,
  buscarIntegracoesByColaborador,
  salvarIntegracao,
  baixarIntegracao
};
