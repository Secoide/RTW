const EPIModel = require('../models/epi.model');
const supabase = require("../config/supabase");

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

// Deletar
async function deletarEPIByColaborador(id) {
  return await EPIModel.deleteEPIByColaborador(id);
}
// Buscar um
async function buscarEPIsByColaborador(idFunc) {
  return await EPIModel.getEPIsByColaborador(idFunc);
}
// Buscar um epi do colaborador
async function buscarEPIsByColaboradorContem(idfcepi) {
  return await EPIModel.getEPIsByColaboradorContem(idfcepi);
}


async function salvarEPI({ dataentregueEPI, nca, vencimento, idColab, epi, file }) {
  const idfuncionario = parseInt(idColab, 10);
  const idepi = parseInt(epi, 10);
  const venc = 0;

  if (Number.isNaN(idfuncionario) || Number.isNaN(idepi) || Number.isNaN(venc)) {
    throw new Error('IDs e vencimento devem ser numéricos.');
  }

  let nomeArquivo = null;
  if (file) {
    // renomeia para padrão {idfuncionario}_{idepi}_{timestamp}.pdf
    nomeArquivo = `${idfuncionario}_${idepi}_${Date.now()}.pdf`;
    const novoCaminho = path.join(file.destination, nomeArquivo);
    fs.renameSync(file.path, novoCaminho);
  }

  const insertId = await EPIModel.inserirEPI(dataentregueEPI, venc, nca, nomeArquivo, idfuncionario, idepi);
  return { id: insertId, arquivo: nomeArquivo };
}

async function baixarEPI(id) {
  const epi = await EPIModel.buscarEPIPorId(id);
  // Retorna o objeto inteiro (nome colab, epi, data, anexo)
  return epi;
}

async function salvarCaminhoAssinatura(idfcepi, filename) {
  return EPIModel.salvarCaminhoAssinatura(idfcepi, filename);
}


async function apagarAssinaturasAntigas(idfcepi) {
    try {
        const prefix = `assinatura_${idfcepi}_`;

        // Listar todos arquivos do bucket
        const { data: files, error: listError } = await supabase.storage
            .from("epi-assinaturas")
            .list("", { limit: 2000 });

        if (listError) {
            console.error("Erro listagem:", listError);
            return;
        }

        // Filtrar todos os que começam com assinatura_<id>_
        const arquivosParaExcluir = files
            .filter(f => f.name.startsWith(prefix))
            .map(f => f.name);

        if (arquivosParaExcluir.length === 0) {
            console.log("Nenhum arquivo antigo para excluir");
            return;
        }

        // Executar remoção
        const { data: removeData, error: removeError } = await supabase.storage
            .from("epi-assinaturas")
            .remove(arquivosParaExcluir);

    } catch (err) {
        console.error("Erro apagarAssinaturasAntigas:", err);
    }
}

async function gerarTokenAssinatura(idfcepi) {
  const crypto = require("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  await EPIModel.salvarTokenAssinatura(idfcepi, token);
  return token;
}

async function validarToken(idfcepi, token) {
  return await EPIModel.validarTokenAssinatura(idfcepi, token);
}

module.exports = {
  listarEPIs,
  buscarEPI,
  buscarEPIIDEmpresa,
  criarEPI,
  atualizarEPI,
  deletarEPI,
  buscarEPIsByColaborador,
  buscarEPIsByColaboradorContem,
  deletarEPIByColaborador,
  salvarEPI,
  baixarEPI,
  salvarCaminhoAssinatura,
  apagarAssinaturasAntigas,
  gerarTokenAssinatura,
  validarToken
};
