const CursoModel = require('../models/cursos.model');
const supabase = require("../config/supabase");

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

  let nomeArquivo = null; // agora o PDF é opcional

  // Se o arquivo for enviado, faz upload
  if (file && file.buffer) {
    nomeArquivo = `${idfuncionario}_${idcurso}_${Date.now()}.pdf`;

    const buffer = file.buffer;

    const { data, error } = await supabase.storage
      .from("cursos")
      .upload(nomeArquivo, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error(error);
      throw new Error("Erro ao enviar PDF ao Supabase.");
    }
  }

  // Salva no banco com ou sem arquivo
  const insertId = await CursoModel.inserirCurso(
    datarealizadaCurso,
    venc,
    nomeArquivo, // null se não houver arquivo
    idfuncionario,
    idcurso
  );

  return { id: insertId, arquivo: nomeArquivo };
}


async function baixarCurso(id) {
  const curso = await CursoModel.buscarCursoPorId(id);
  // Retorna o objeto inteiro (nome colab, curso, data, anexo)
  return curso;
}

async function buscarHistoricoCursoColaborador(idFunc, idCurso) {
  return await CursoModel.getHistoricoCursoColaborador(idFunc, idCurso);
}

async function atualizarRegistroCurso(id, { datarealizadaCurso, vencimento, file }) {
  const registroAtual = await CursoModel.buscarCursoPorId(id);
  if (!registroAtual) {
    throw new Error("Registro de curso não encontrado.");
  }

  const dados = {
    datarealizado: datarealizadaCurso,
    vencimento: parseInt(vencimento, 10)
  };

  if (Number.isNaN(dados.vencimento)) {
    throw new Error("Vencimento inválido.");
  }

  if (file && file.buffer) {
    const nomeArquivo = `${id}_${Date.now()}.pdf`;

    const { error } = await supabase.storage
      .from("cursos")
      .upload(nomeArquivo, file.buffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (error) {
      console.error(error);
      throw new Error("Erro ao enviar PDF ao Supabase.");
    }

    if (registroAtual.anexoCursoPDF) {
      await supabase.storage
        .from("cursos")
        .remove([registroAtual.anexoCursoPDF]);
    }

    dados.anexoCursoPDF = nomeArquivo;
  }

  const ok = await CursoModel.atualizarRegistroCurso(id, dados);
  if (!ok) {
    throw new Error("Registro de curso não encontrado.");
  }

  return { message: "Curso atualizado com sucesso." };
}

async function removerAnexoRegistroCurso(id) {
  const registroAtual = await CursoModel.buscarCursoPorId(id);
  if (!registroAtual) {
    throw new Error("Registro de curso não encontrado.");
  }

  if (registroAtual.anexoCursoPDF) {
    await supabase.storage
      .from("cursos")
      .remove([registroAtual.anexoCursoPDF]);
  }

  const ok = await CursoModel.atualizarRegistroCurso(id, {
    anexoCursoPDF: null
  });

  if (!ok) {
    throw new Error("Registro de curso não encontrado.");
  }

  return { message: "Anexo removido com sucesso." };
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
  baixarCurso,
  buscarHistoricoCursoColaborador,
  atualizarRegistroCurso,
  removerAnexoRegistroCurso
};
