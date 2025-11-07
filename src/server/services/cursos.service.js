const CursoModel = require('../models/cursos.model');
const path = require('path');
const fs = require('fs');

// Listar todos
async function listarCursos() {
  return await CursoModel.getCursos();
}

// Buscar um
async function buscarCurso(id) {
  return await CursoModel.getCursoById(id);
}

async function listarCursosCBX() {
  try {
    const cursos = await CursoModel.getCursosCBX();
    return cursos;
  } catch (err) {
    console.error("❌ Erro no service listarCursosCBX:", err.message);
    throw err;
  }
}


// Buscar um
async function buscarCursoIDEmpresa(idEmpresa) {
  return await CursoModel.getCursoByIdEmpresa(idEmpresa);
}

// Criar
async function criarCurso(data) {
  if (!data.nome) {
    throw new Error('Informe pelo menos o nome do curso');
  }
  const result = await CursoModel.createCurso(data);

  return {
    message: "Curso cadastrado com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarCurso(id, data) {
  return await CursoModel.updateCurso(id, data);
}

// Deletar
async function deletarCurso(id) {
  return await CursoModel.deleteCurso(id);
}

// Deletar
async function deletarCursosByColaborador(id) {
  return await CursoModel.deleteCursosByColaborador(id);
}

// Buscar um
async function buscarCursosByColaborador(idFunc) {
  return await CursoModel.getCursosByColaborador(idFunc);
}


async function salvarCurso({ datarealizadaCurso, vencimento, idColab, curso, file }) {
  const idfuncionario = parseInt(idColab, 10);
  const idcurso = parseInt(curso, 10);
  const venc = parseInt(vencimento, 10);

  if (Number.isNaN(idfuncionario) || Number.isNaN(idcurso) || Number.isNaN(venc)) {
    throw new Error('IDs e vencimento devem ser numéricos.');
  }

  let nomeArquivo = null;
  if (file) {
    // renomeia para padrão {idfuncionario}_{idcurso}_{timestamp}.pdf
    nomeArquivo = `${idfuncionario}_${idcurso}_${Date.now()}.pdf`;
    const novoCaminho = path.join(file.destination, nomeArquivo);
    fs.renameSync(file.path, novoCaminho);
  }

  const insertId = await CursoModel.inserirCurso(datarealizadaCurso, venc, nomeArquivo, idfuncionario, idcurso);
  return { id: insertId, arquivo: nomeArquivo };
}

async function baixarCurso(id) {
  const curso = await CursoModel.buscarCursoPorId(id);
  // Retorna o objeto inteiro (nome colab, curso, data, anexo)
  return curso;
}


module.exports = {
  listarCursos,
  buscarCurso,
  listarCursosCBX,
  buscarCursoIDEmpresa,
  criarCurso,
  atualizarCurso,
  deletarCurso,
  buscarCursosByColaborador,
  deletarCursosByColaborador,
  salvarCurso,
  baixarCurso
};
