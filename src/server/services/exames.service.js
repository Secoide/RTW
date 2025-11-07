const ExameModel = require('../models/exames.model');
const path = require('path');
const fs = require('fs');

// Listar todos
async function listarExames() {
  return await ExameModel.getExames();
}

// Buscar um
async function buscarExame(id) {
  return await ExameModel.getExameById(id);
}

// Buscar um
async function buscarExameIDEmpresa(idEmpresa) {
  return await ExameModel.getExameByIdEmpresa(idEmpresa);
}

// Criar
async function criarExame(data) {
  if (!data.nomesupervisor || (!data.telefoneSup && !data.emailSup)) {
    throw new Error('Informe o nome e pelo menos um meio de contato (telefone ou e-mail)');
  }
  if (!data.idCliente) {
    throw new Error('Necessário informar cliente (Empresa responsavel do exames)');
  }
  const result = await ExameModel.createExame(data);

  return {
    message: "Exame cadastrado com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarExame(id, data) {
  return await ExameModel.updateExame(id, data);
}

// Deletar
async function deletarExame(id) {
  return await ExameModel.deleteExame(id);
}

// Deletar
async function deletarExameByColaborador(id) {
  return await ExameModel.deleteExameByColaborador(id);
}

// Buscar um
async function buscarExamesByColaborador(idFunc) {
  return await ExameModel.getExameByColaborador(idFunc);
}

async function salvarExame({ datarealizadaExame, vencimento, idColab, exame, file }) {
  const idfuncionario = parseInt(idColab, 10);
  const idexame = parseInt(exame, 10);
  const venc = parseInt(vencimento, 10);

  if (Number.isNaN(idfuncionario) || Number.isNaN(idexame) || Number.isNaN(venc)) {
    throw new Error('IDs e vencimento devem ser numéricos.');
  }

  let nomeArquivo = null;
  if (file) {
    // renomeia para padrão {idfuncionario}_{idexame}_{timestamp}.pdf
    nomeArquivo = `${idfuncionario}_${idexame}_${Date.now()}.pdf`;
    const novoCaminho = path.join(file.destination, nomeArquivo);
    fs.renameSync(file.path, novoCaminho);
  }

  const insertId = await ExameModel.inserirExame(datarealizadaExame, venc, nomeArquivo, idfuncionario, idexame);
  return { id: insertId, arquivo: nomeArquivo };
}

async function baixarExame(id) {
  const exame = await ExameModel.buscarExamePorId(id);
  // Retorna o objeto inteiro (nome colab, exame, data, anexo)
  return exame;
}


module.exports = {
  listarExames,
  buscarExame,
  buscarExameIDEmpresa,
  criarExame,
  atualizarExame,
  deletarExame,
  buscarExamesByColaborador,
  deletarExameByColaborador,
  salvarExame,
  baixarExame
};
