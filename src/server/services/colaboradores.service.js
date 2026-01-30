const ColabModel = require('../models/colaboradores.model');
const bcrypt = require('bcrypt');
const fsPromises = require('fs').promises;
const path = require('path');
const supabase = require('../config/supabase');


// Listar todos
async function listarColaboradores() {
  return await ColabModel.getColaboradores();
}

// Buscar um
async function buscarColaborador(id) {
  return await ColabModel.getColaboradorById(id);
}

/**
 * Retorna o status de integração de um colaborador numa OS específica
 * @param {number} idfuncionario
 * @param {number} idOS
 * @param {string} dataDia - Data de referência (YYYY-MM-DD)
 */
async function buscarStatusIntegracao(idfuncionario, idOS, dataDia) {
  return await ColabModel.getStatusIntegracaoByColab(idfuncionario, idOS, dataDia);
}

// Criar

async function gerarHash(senha) {
  const saltRounds = 10;
  return await bcrypt.hash(senha, saltRounds);
}

async function criarColaborador(data) {
  if (!data.nome || !data.cpf || !data.email) {
    throw new Error('Nome, e-mail e CPF são obrigatórios');
  }

  // Normaliza CPF (remove pontuação)
  const cpfLimpo = data.cpf.replace(/\D/g, '').trim();

  // Verifica se já existe CPF
  const existente = await ColabModel.findByCPF(cpfLimpo);
  if (existente) {
    throw new Error('CPF já cadastrado.');
  }

  // Verifica se já existe RG
  const existenterg = await ColabModel.findByRG(data.rg);
  if (existenterg) {
    throw new Error('RG já cadastrado.');
  }

  // Define senha (default = "123" se não enviada)
  const senhaPlain = data.senha || '123';
  const senhaHash = await gerarHash(senhaPlain);

  const colaborador = {
    nome: data.nome,
    sexo: data.genero,
    nascimento: data.dataNascimento,
    endereco: data.endereco,
    telefone: data.telefone,
    mail: data.email,
    sobre: data.sobre,
    cpf: cpfLimpo,
    rg: data.rg,
    senha: senhaHash,
    fotoperfil: data.fotoperfil || '/imagens/user-default.webp'
  };


  const novo = await ColabModel.createColaborador(colaborador);
  return { ...novo, senhaPadrao: data.senha ? undefined : '123' };
}


// Atualizar (service.js)
async function atualizarColaborador(id, data) {
  try {
    // 🔍 Validações obrigatórias
    if (!id) {
      return { sucesso: false, mensagem: "ID do colaborador é obrigatório." };
    }

    if (!data.nome) {
      return { sucesso: false, mensagem: "Nome Completo é obrigatório." };
    }
    if (!data.cpf) {
      return { sucesso: false, mensagem: "CPF é obrigatório." };
    }
    if (!data.email) {
      return { sucesso: false, mensagem: "E-mail é obrigatório." };
    }

    // 🔧 Sanitização
    const payload = {
      nome: data.nome,
      sexo: data.genero,
      nascimento: data.dataNascimento,
      endereco: data.endereco,
      telefone: data.telefone,
      mail: data.email,
      sobre: data.sobre,
      cpf: data.cpf ? data.cpf.replace(/\D/g, "").trim() : null,
      rg: data.rg ? data.rg.trim() : null
    };

    // 🔄 Atualiza no banco
    const atualizado = await ColabModel.updateColaborador(id, payload);

    if (!atualizado) {
      return {
        sucesso: false,
        mensagem: "Colaborador não encontrado para atualização."
      };
    }

    // 🎉 Sucesso
    return {
      sucesso: true,
      mensagem: "Colaborador atualizado com sucesso!",
      dados: { id, ...payload }
    };

  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error);

    return {
      sucesso: false,
      mensagem: "Erro interno ao atualizar colaborador.",
      detalhe: error.message
    };
  }
}


// Atualizar dados profissional
async function atualizarProfissionalColab(id, data) {
  if (!id) throw new Error('ID do colaborador é obrigatório');
  if (!data.setor || !data.cargo) throw new Error('Setor e Cargo são obrigatórios');

  const atualizado = await ColabModel.updateProfissionalColab(id, {
    setor: data.setor,
    cargo: data.cargo,
    vehicles_selected: data.vehicles_selected,
    empresacontrato: data.empresacontrato
  });

  if (!atualizado) {
    throw new Error('Colaborador não encontrado para atualização');
  }

  return { id, ...data };
}

// Deletar
async function deletarColaborador(id) {
  return await ColabModel.deleteColaborador(id);
}

async function listarColaboradoresDisponiveis(dataDia) {
  try {
    const colaboradores = await ColabModel.buscarColaboradoresDisponiveis(dataDia);
    return colaboradores;
  } catch (err) {
    console.error("❌ Erro no service listarColaboradoresDisponiveis:", err.message);
    throw err;
  }
}

async function listarColaboradoresEmOS(dataDia) {
  try {
    const colaboradores = await ColabModel.buscarColaboradoresEmOS(dataDia);
    return colaboradores;
  } catch (err) {
    console.error("❌ Erro no service listarColaboradoresEmOS:", err.message);
    throw err;
  }
}

async function excluirColaboradorEmOS(osID, id, idNaOS) {
  try {
    const result = await ColabModel.excluirColaboradorNaOS(idNaOS);

    if (result.affectedRows === 0) {
      throw new Error(`Nenhum colaborador com idNaOS ${idNaOS}`);
    }

    console.log(`✅ Colaborador ID ${id} excluído da OS ${osID}`);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao excluir colaborador ${id} da OS ${osID}:`, err);
    throw err;
  }
}

async function alocarColaboradores(osID, dataDia, nomes) {
  const confirmacoes = [];

  for (const { nome, id } of nomes) {
    const idNaOS = await ColabModel.alocarColaboradorNaOS(dataDia, id, osID);

    confirmacoes.push({
      osID,
      nome,
      id,
      idNaOS,
      dataDia,
    });
  }

  return confirmacoes; // retorna lista com todos os confirmados
}

async function listarColaboradoresResponsavelOS() {
  try {
    const colaboradores = await ColabModel.getColaboradoresResponsavelOS();
    return colaboradores;
  } catch (err) {
    console.error("❌ Erro no service listarColaboradoresResponsavelOS:", err.message);
    throw err;
  }
}

async function listarColaboradoresCBX() {
  try {
    const colaboradores = await ColabModel.getColaboradoresCBX();
    return colaboradores;
  } catch (err) {
    console.error("❌ Erro no service listarColaboradoresCBX:", err.message);
    throw err;
  }
}


async function listarColaboradoresAniversariantes() {
  return await ColabModel.getColaboradoresAniversariantes();
}



async function setarSupervisor(idFno, osID, dataDia) {
  await ColabModel.removerSupervisorAtual(osID, dataDia);
  const updated = await ColabModel.definirSupervisor(idFno);

  if (!updated) {
    throw new Error("Colaborador não encontrado na OS/dia");
  }

  return { idFno, osID, dataDia };
}

async function removerSupervisorAtual(osID, dataDia) {
  return await ColabModel.removerSupervisorAtual(osID, dataDia);
}

async function cadastrarAtestado({ periodoinicial, periodofinal, atestado, descricaoatest, idColab }) {
  if (!periodoinicial || !periodofinal || !atestado || !idColab) {
    throw new Error('Campos obrigatórios não preenchidos.');
  }

  await ColabModel.inserirAtestado(periodoinicial, periodofinal, atestado, descricaoatest, idColab);

  return { sucesso: true };
}

// Buscar hitorico atestar
async function buscarHistoricoAtestar(id) {
  return await ColabModel.getHistoricoAtestar(id);
}

// Buscar dados CPF e RG
async function buscarDadosCPFRG(dataDia, osID) {
  return await ColabModel.getExportarDados(dataDia, osID);
}

// Buscar hitorico colab por empresa
async function buscarHistoricoColabPorEmpresa(id) {
  return await ColabModel, ColabModel.getHistoricoColabPorEmpresa(id);
}

async function salvarFotoPerfil(userId, file) {
  if (!file || !userId) {
    throw { status: 400, mensagem: 'Arquivo ou ID ausente.' };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const nomeArquivo = `${userId}${ext}`;
  const caminhoSupabase = `avatars/${nomeArquivo}`;

  // Upload para Supabase
  const { error } = await supabase.storage
    .from('fotos-perfil')
    .upload(caminhoSupabase, file.buffer, {
      contentType: file.mimetype,
      upsert: true // sobrescreve se já existir
    });

  if (error) {
    console.error('Erro Supabase Upload:', error);
    throw { status: 500, mensagem: 'Erro ao enviar para o Supabase.' };
  }

  // URL pública
  const publicURL = `${process.env.SUPABASE_URL}/storage/v1/object/public/fotos-perfil/${caminhoSupabase}`;

  // Atualiza no banco
  await ColabModel.atualizarFotoPerfil(userId, publicURL);

  return publicURL;
}

module.exports = {
  listarColaboradores,
  buscarColaborador,
  buscarStatusIntegracao,
  criarColaborador,
  atualizarColaborador,
  atualizarProfissionalColab,
  deletarColaborador,
  listarColaboradoresDisponiveis,
  listarColaboradoresEmOS,
  excluirColaboradorEmOS,
  alocarColaboradores,
  listarColaboradoresResponsavelOS,
  listarColaboradoresCBX,
  listarColaboradoresAniversariantes,
  setarSupervisor,
  removerSupervisorAtual,
  buscarHistoricoAtestar,
  buscarDadosCPFRG,
  cadastrarAtestado,
  buscarHistoricoColabPorEmpresa,
  salvarFotoPerfil
};
