const ColabModel = require('../models/colaboradores.model');
const AprovacoesModel = require('../models/aprovacoes.model');
const SaasService = require('./saas.service');
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
  const colaborador = await ColabModel.getColaboradorById(id);
  if (!colaborador) return null;

  const pendente = await AprovacoesModel.buscarPendenteResponsavelOS(id);
  colaborador.gestor_obras_pendente = pendente
    ? Number(pendente.valor_solicitado || 0)
    : null;
  colaborador.gestor_obras_aprovacao_id = pendente?.id_aprovacao || null;

  return colaborador;
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

function textoLimpo(valor) {
  return String(valor || "").trim();
}

function validarTamanhoCampo(nomeCampo, valor, limite) {
  const texto = textoLimpo(valor);
  if (texto.length > limite) {
    throw new Error(`${nomeCampo} deve ter no maximo ${limite} caracteres.`);
  }
  return texto || null;
}

async function criarColaborador(data, options = {}) {
  if (!data.nome || !data.cpf || !data.email) {
    throw new Error('Nome, e-mail e CPF são obrigatórios');
  }

  // Normaliza CPF (remove pontuação)
  const cpfLimpo = data.cpf.replace(/\D/g, '').trim();
  const rgLimpo = data.rg ? String(data.rg).trim() : null;

  // Verifica se já existe CPF
  const existente = await ColabModel.findByCPF(cpfLimpo);
  if (existente) {
    throw new Error('CPF já cadastrado.');
  }

  // Verifica se já existe RG
  const existenterg = rgLimpo ? await ColabModel.findByRG(rgLimpo) : null;
  if (existenterg) {
    throw new Error('RG já cadastrado.');
  }

  // Define senha (default = "123" se não enviada)
  const senhaPlain = data.senha || '123';
  const senhaHash = await gerarHash(senhaPlain);

  const colaborador = {
    nome: textoLimpo(data.nome),
    sexo: data.genero,
    nascimento: data.dataNascimento,
    endereco: validarTamanhoCampo('Endereco', data.endereco, 255),
    telefone: textoLimpo(data.telefone),
    mail: textoLimpo(data.email),
    sobre: textoLimpo(data.sobre),
    cpf: cpfLimpo,
    rg: rgLimpo,
    senha: senhaHash,
    fotoperfil: data.fotoperfil || '/imagens/user-default.webp'
  };

  const novo = await ColabModel.createColaborador(colaborador);
  const retorno = { ...novo, senhaPadrao: data.senha ? undefined : '123' };
  const idEmpresaSaas = options.empresaSaas?.id_empresa_saas;

  if (!idEmpresaSaas) {
    return retorno;
  }
  console.log(idEmpresaSaas, '|', novo.id);
  try {
    await SaasService.vincularUsuarioEmpresa(idEmpresaSaas, novo.id);
    retorno.empresaSaasVinculada = true;
  } catch (err) {
    console.error('Erro ao vincular novo usuario a empresa SaaS:', err);
    retorno.empresaSaasVinculada = false;
    retorno.avisoSaas = 'Usuário criado, mas não foi possível vincular automaticamente à empresa logada.';
  }

  return retorno;
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
      nome: textoLimpo(data.nome),
      sexo: data.genero,
      nascimento: data.dataNascimento,
      endereco: validarTamanhoCampo('Endereco', data.endereco, 255),
      telefone: textoLimpo(data.telefone),
      mail: textoLimpo(data.email),
      sobre: textoLimpo(data.sobre),
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
      mensagem: error.message?.includes("maximo") || (error.message?.includes("Data too long") && error.message?.includes("'endereco'"))
        ? error.message
            .replace("Data too long for column 'endereco' at row 1", "Endereco muito longo. Reduza o endereco e tente novamente.")
        : "Erro interno ao atualizar colaborador.",
      detalhe: error.message
    };
  }
}

// ============================================================
// LISTAR COLABORADORES POR DATA
// ============================================================

async function listarColaboradoresPorData(dataDia) {

    return await ColabModel
        .listarColaboradoresPorData(
            dataDia
        );

}

// Atualizar dados profissional
async function atualizarProfissionalColab(id, data, usuario = {}) {
  if (!id) throw new Error('ID do colaborador é obrigatório');
  if (!data.setor || !data.cargo) throw new Error('Setor e Cargo são obrigatórios');
  const atualizado = await ColabModel.updateProfissionalColab(id, {
    setor: data.setor,
    cargo: data.cargo,
    vehicles_selected: data.vehicles_selected,
    empresacontrato: data.empresacontrato,
    data_experiencia: data.data_experiencia || null
  });

  if (!atualizado) {
    throw new Error('Colaborador não encontrado para atualização');
  }

  let aprovacaoGestorObras = null;
  const gestorObrasFoiEnviado = Object.prototype.hasOwnProperty.call(data, "gestor_obras_estado_enviado")
    || Object.prototype.hasOwnProperty.call(data, "gestor_obras");

  if (gestorObrasFoiEnviado) {
    const valorSolicitado = data.gestor_obras === "1"
      || data.gestor_obras === 1
      || data.gestor_obras === true
      ? 1
      : 0;

    aprovacaoGestorObras = await AprovacoesModel.solicitarResponsavelOS({
      idFuncionario: id,
      valorSolicitado,
      solicitadoPor: usuario?.id || 999
    });
  }

  return { id, ...data, aprovacaoGestorObras };
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

async function listarColaboradoresEmOS(
  dataDia,
  osID,
  nomeColaborador
) {
  try {
    const colaboradores = await ColabModel.buscarColaboradoresEmOS(
      dataDia,
      osID,
      nomeColaborador
    );
    return colaboradores;
  } catch (err) {
    console.error("❌ Erro no service listarColaboradoresEmOS:", err.message);
    throw err;
  }
}


// ============================================================
// BUSCAR COLABORADORES IA
// ============================================================

async function listarColaboradoresOSIA(
  dataDia,
  osID = null
) {

  return await ColabModel
    .buscarColaboradoresOSIA(
      dataDia,
      osID
    );

}

// ============================================================
// BUSCAR COLABORADOR IA
// ============================================================

async function listarColaboradorIA(
  dataDia,
  nomeColaborador
) {

  return await ColabModel
    .buscarColaboradorIA(
      dataDia,
      nomeColaborador
    );

}

async function listarRankingColaboradores(
  empresa
) {

  return await ColabModel
    .buscarRankingColaboradores(
      empresa
    );

}


// ============================================================
// LISTAR DISPONÍVEIS
// ============================================================

async function listarDisponiveis(
  dataDia
) {

  return await ColabModel
    .buscarDisponiveis(
      dataDia
    );

}

async function excluirColaboradorEmOS(osID, id, idNaOS, dataDia) {
  try {
    let result = idNaOS
      ? await ColabModel.excluirColaboradorNaOS(idNaOS)
      : { affectedRows: 0 };

    if (result.affectedRows === 0 && osID && id && dataDia) {
      result = await ColabModel.excluirColaboradorNaOSPorFuncionario(dataDia, id, osID);
    }

    if (result.affectedRows === 0) {
      throw new Error(`Nenhum colaborador encontrado na OS ${osID} para a data ${dataDia || "-"}`);
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

async function getHallExperienciaConnectPear() {
  return await ColabModel.getHallExperienciaConnectPear();
}

async function addConquista(
  dados
) {

  return await
    ColabModel
      .addConquista(
        dados
      );

}

async function getConquistasColaborador(
  idColaborador
) {

  return await ColabModel
    .getConquistasColaborador(
      idColaborador
    );

}

async function removerConquista(idColaborador, tipo) {

  return await ColabModel
    .removerConquista(
      idColaborador,
      tipo
    );

}

module.exports = {
  listarColaboradores,
  buscarColaborador,
  buscarStatusIntegracao,
  listarColaboradoresOSIA,
  listarColaboradorIA,
  listarRankingColaboradores,
  listarColaboradoresPorData,
  listarDisponiveis,
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
  salvarFotoPerfil,
  getHallExperienciaConnectPear,
  addConquista,
  getConquistasColaborador,
  removerConquista
};
