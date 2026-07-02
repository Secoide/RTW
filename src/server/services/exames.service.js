const ExameModel = require('../models/exames.model');
const supabase = require("../config/supabase");

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
  if (!data.nome) {
    throw new Error('Informe pelo menos o nome do exame');
  }
  const result = await ExameModel.createExame(data);

  return {
    message: "Exame cadastrado com sucesso!",
    id: result.insertId
  };
}

async function agendaExame(data) {

  if (!data.datamarcadoExame) {
    throw new Error("Data e horário são obrigatórios.");
  }

  // Remove o T e adiciona segundos
  const horarioFormatado =
    data.datamarcadoExame.replace("T", " ") + ":00";

  const result = await ExameModel.agendarExame({
    ...data,
    horarioFormatado
  });

  if (result.affectedRows === 0) {
    throw new Error("Registro não encontrado.");
  }

  return {
    message: "Exame agendado com sucesso!"
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

async function cancelarAgendaExame(id) {
  return await ExameModel.cancelarAgendamentoExame(id);
}


// Buscar um
async function buscarExamesByColaborador(idFunc) {
  return await ExameModel.getExameByColaborador(idFunc);
}

async function salvarExame({ datarealizadaExame, vencimento, idColab, exame, file }) {
  const idfuncionario = parseInt(idColab, 10);
  const idexame = parseInt(exame, 10);
  const venc = parseInt(vencimento, 10);

  let nomeArquivo = null; // assume que pode não ter arquivo

  // Se veio arquivo, faz upload
  if (file && file.buffer) {
    nomeArquivo = `${idfuncionario}_${idexame}_${Date.now()}.pdf`;

    const buffer = file.buffer;

    // Upload para Supabase
    const { data, error } = await supabase.storage
      .from("exames")
      .upload(nomeArquivo, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error(error);
      throw new Error("Erro ao enviar PDF ao Supabase.");
    }
  }

  // Salva no banco (com ou sem arquivo)
  const insertId = await ExameModel.inserirExame(
    datarealizadaExame,
    venc,
    nomeArquivo, // será null se não enviou arquivo
    idfuncionario,
    idexame
  );

  return { id: insertId, arquivo: nomeArquivo };
}



async function baixarExame(id) {
  const exame = await ExameModel.buscarExamePorId(id);
  // Retorna o objeto inteiro (nome colab, exame, data, anexo)
  return exame;
}

async function buscarHistoricoExameColaborador(idFunc, idExame) {
  return await ExameModel.getHistoricoExameColaborador(idFunc, idExame);
}

async function atualizarRegistroExame(id, { datarealizadaExame, vencimento, file }) {
  const registroAtual = await ExameModel.buscarExamePorId(id);
  if (!registroAtual) {
    throw new Error("Registro de exame não encontrado.");
  }

  const dados = {
    data: datarealizadaExame,
    vencimento: parseInt(vencimento, 10)
  };

  if (Number.isNaN(dados.vencimento)) {
    throw new Error("Vencimento inválido.");
  }

  if (file && file.buffer) {
    const nomeArquivo = `${id}_${Date.now()}.pdf`;

    const { error } = await supabase.storage
      .from("exames")
      .upload(nomeArquivo, file.buffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (error) {
      console.error(error);
      throw new Error("Erro ao enviar PDF ao Supabase.");
    }

    if (registroAtual.anexoExamePDF) {
      await supabase.storage
        .from("exames")
        .remove([registroAtual.anexoExamePDF]);
    }

    dados.anexoExamePDF = nomeArquivo;
  }

  const ok = await ExameModel.atualizarRegistroExame(id, dados);
  if (!ok) {
    throw new Error("Registro de exame não encontrado.");
  }

  return { message: "Exame atualizado com sucesso." };
}

async function removerAnexoRegistroExame(id) {
  const registroAtual = await ExameModel.buscarExamePorId(id);
  if (!registroAtual) {
    throw new Error("Registro de exame não encontrado.");
  }

  if (registroAtual.anexoExamePDF) {
    await supabase.storage
      .from("exames")
      .remove([registroAtual.anexoExamePDF]);
  }

  const ok = await ExameModel.atualizarRegistroExame(id, {
    anexoExamePDF: null
  });

  if (!ok) {
    throw new Error("Registro de exame não encontrado.");
  }

  return { message: "Anexo removido com sucesso." };
}


module.exports = {
  listarExames,
  buscarExame,
  buscarExameIDEmpresa,
  criarExame,
  agendaExame,
  cancelarAgendaExame,
  atualizarExame,
  deletarExame,
  buscarExamesByColaborador,
  deletarExameByColaborador,
  salvarExame,
  baixarExame,
  buscarHistoricoExameColaborador,
  atualizarRegistroExame,
  removerAnexoRegistroExame
};
