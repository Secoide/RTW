const MaterialModel = require('../models/material.model');
const MaterialOSModel = require('../models/materialOS.model');

const path = require('path');
const supabase = require('../config/supabase');

// ================= GET =================

// ===== CATÁLOGO =====
async function listarMateriais() {
  return await MaterialModel.getMateriais();
}

async function listarVariacoes() {
  return await MaterialModel.getVariacoes();
}

async function listarCatalogoMateriais(params) {
  return await MaterialModel.getCatalogoMateriais(params);
}

async function listarVariacaoById(idMaterial) {
  return await MaterialModel.getVariacaoByID(idMaterial);
}

async function buscarPorNome(nome) {
  return await MaterialModel.findMaterialByNome(nome);
}

async function buscarMateriaisPorNome(nome) {
  return await MaterialModel.buscarMateriaisPorNome(nome);
}

async function getValoresAtributo(atributo) {
  return await MaterialModel.getValoresAtributo(atributo);
}


// ===== OS =====
async function listarMateriaisOS(idOS, idLista = null) {
  return await MaterialOSModel.getMateriaisByOS(idOS, idLista);
}

async function getCustoTotalOS(idOS) {
  return await MaterialOSModel.getCustoTotalOS(idOS);
}


// ================= ADD =================

async function criarMaterial(data) {
  const result = await MaterialModel.createMaterial(data);
  return {
    message: "Material cadastrado!",
    id: result.insertId
  };
}

async function criarVariacao(data) {
  return await MaterialModel.createVariacao(data);
}

async function adicionarAtributo(data) {
  return await MaterialModel.addAtributoVariacao(data);
}

async function criarOuBuscarMaterial(data) {

  const existente = await MaterialModel.findMaterialByNome(data.nome);

  if (existente) return existente;

  const novo = await MaterialModel.createMaterial(data);
  return { id: novo.insertId };
}

async function criarMaterialOS(data) {
  const result = await MaterialOSModel.createMaterialOS(data);
  return {
    message: "Material adicionado à OS!",
    id: result.insertId
  };
}

async function listarListasOS(idOS) {
  return await MaterialOSModel.getListasByOS(idOS);
}

async function listarListasEstoque() {
  return await MaterialOSModel.getListasEstoque();
}

async function listarListasConferencia() {
  return await MaterialOSModel.getListasConferencia();
}

async function criarListaOS(data, usuario) {
  return await MaterialOSModel.createLista({
    ...data,
    criado_por: usuario?.id || null
  });
}

async function atualizarListaOS(id, data) {
  return await MaterialOSModel.updateLista(id, data);
}

async function avancarListaOS(id, usuario = null, data = {}) {
  const lista = await MaterialOSModel.getListaById(id);
  if (!lista) return false;

  if (data.confirmado !== true) {
    const erro = new Error("Confirmação obrigatória para avançar a lista.");
    erro.status = 400;
    throw erro;
  }

  const proximo = getProximoStatusLista(lista.status);
  return await MaterialOSModel.avancarLista(id, proximo, {
    acao: "avancou",
    usuario_id: usuario?.id || null
  });
}

async function voltarListaOS(id, data = {}, usuario = null) {
  const lista = await MaterialOSModel.getListaById(id);
  if (!lista) return false;

  const anterior = getStatusAnteriorLista(lista.status);
  return await MaterialOSModel.avancarLista(id, anterior, {
    acao: "voltou",
    usuario_id: usuario?.id || null,
    motivo: data.motivo || null
  });
}

async function duplicarListaOS(id, usuario) {
  return await MaterialOSModel.duplicarLista(id, usuario?.id || null);
}

async function copiarListaParaOS(id, idOSDestino, usuario) {
  return await MaterialOSModel.duplicarLista(id, usuario?.id || null, idOSDestino);
}

async function transferirListaParaOS(id, idOSDestino, usuario) {
  return await MaterialOSModel.transferirLista(id, idOSDestino, usuario?.id || null);
}

async function listarHistoricoListaOS(id) {
  return await MaterialOSModel.listarHistoricoLista(id);
}


// ================= UPDATE =================

async function atualizarMaterialOS(id, data) {

  // 🔥 busca item atual
  const itemAtual = await MaterialOSModel.getMaterialOSById(id);

  if (!itemAtual) return false;

  // 🔥 junta dados
  const novoItem = {
    ...itemAtual,
    ...data
  };

  // 🔥 calcula status
  const status = calcularStatus(novoItem);

  // 🔥 salva
  return await MaterialOSModel.updateMaterialOS(id, {
    ...data,
    status
  });
}

async function atualizarConferenciaMaterialOS(id, data) {
  return await MaterialOSModel.updateConferenciaMaterialOS(id, data);
}

async function atualizarVariacao(id, data) {
  const atual = await MaterialModel.getVariacaoByID(id);
  if (!atual) return false;

  if (data.nome) {
    await MaterialModel.updateMaterial(atual.id_material, {
      nome: data.nome,
      categoria: data.categoria || null
    });
  }

  await MaterialModel.updateVariacao(id, {
    codigo: data.codigo,
    fabricante: data.fabricante,
    unidade: data.unidade || atual.unidade || "un"
  });

  if (Array.isArray(data.atributos)) {
    await MaterialModel.deleteAtributosVariacao(id);
    for (const attr of data.atributos) {
      await MaterialModel.addAtributoVariacao({
        id_variacao: id,
        atributo: attr.atributo,
        valor: attr.valor
      });
    }
  }

  return true;
}

async function atualizarCatalogoVariacao(id, data) {
  return await MaterialModel.updateCatalogoVariacao(id, data);
}

async function salvarImagemMaterial(userId, file) {
  if (!file || !userId) {
    throw { status: 400, mensagem: 'Arquivo ou ID ausente.' };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const nomeArquivo = `${userId}${ext}`;
  const caminhoSupabase = `materiais/${nomeArquivo}`;

  // Upload para Supabase
  const { error } = await supabase.storage
    .from('fotos-material')
    .upload(caminhoSupabase, file.buffer, {
      contentType: file.mimetype,
      upsert: true // sobrescreve se já existir
    });

  if (error) {
    console.error('Erro Supabase Upload:', error);
    throw { status: 500, mensagem: 'Erro ao enviar para o Supabase.' };
  }

  // URL pública
  const publicURL = `${process.env.SUPABASE_URL}/storage/v1/object/public/fotos-material/${caminhoSupabase}`;

  // Atualiza no banco
  await MaterialModel.atualizarImagemMaterial(userId, publicURL);

  return publicURL;
}

async function vincularImagemExistente(idDestino, idOrigem) {
  if (!idDestino || !idOrigem) {
    throw { status: 400, mensagem: 'Material de destino ou origem ausente.' };
  }

  if (Number(idDestino) === Number(idOrigem)) {
    throw { status: 400, mensagem: 'Selecione uma imagem de outro material.' };
  }

  const origem = await MaterialModel.getVariacaoByID(idOrigem);
  if (!origem?.imagem) {
    throw { status: 404, mensagem: 'Material de origem não possui imagem cadastrada.' };
  }

  await MaterialModel.atualizarImagemMaterial(idDestino, origem.imagem);

  return {
    imagem: origem.imagem,
    versao_foto: origem.versao_foto || 0
  };
}



// ================= CHECKS =================

const STATUS = {
  PENDENTE: "pendente",
  PARCIAL: "parcial",
  SEPARADO: "separado",
  COMPRADO: "comprado"
};

function calcularStatus(item) {
  const total = Number(item.quantidade || 0);
  const separado = Number(item.quantidade_separada || 0);
  const comprado = Number(item.quantidade_comprada || 0);

  if (item.id_fornecedor && comprado > 0) return STATUS.COMPRADO;
  if (separado === 0 && comprado === 0) return STATUS.PENDENTE;
  if (separado + comprado < total) return STATUS.PARCIAL;
  if (separado + comprado >= total) return STATUS.SEPARADO;

  return STATUS.PENDENTE;
}

function getProximoStatusLista(statusAtual) {
  const fluxo = {
    orcamento: "engenharia",
    engenharia: "estoque",
    estoque: "compras",
    compras: "finalizado",
    finalizado: "finalizado"
  };

  return fluxo[statusAtual] || "engenharia";
}

function getStatusAnteriorLista(statusAtual) {
  const fluxo = {
    orcamento: "orcamento",
    engenharia: "orcamento",
    estoque: "engenharia",
    compras: "estoque",
    finalizado: "compras"
  };

  return fluxo[statusAtual] || "orcamento";
}


// ================= DELETE =================

async function deletarMaterialOS(id) {
  return await MaterialOSModel.deleteMaterialOS(id);
}

async function deletarListaOS(id) {
  return await MaterialOSModel.deleteLista(id);
}

async function deletarVariacaoMaterial(id) {
  return await MaterialModel.deleteVariacao(id);
}


// ================= EXPORT =================

module.exports = {
  listarMateriais,
  listarVariacoes,
  listarCatalogoMateriais,
  listarVariacaoById,
  buscarPorNome,
  buscarMateriaisPorNome,
  getValoresAtributo,

  listarMateriaisOS,
  listarListasOS,
  listarListasEstoque,
  listarListasConferencia,
  getCustoTotalOS,

  criarMaterial,
  criarVariacao,
  adicionarAtributo,
  criarOuBuscarMaterial,
  criarMaterialOS,
  criarListaOS,

  atualizarMaterialOS,
  atualizarConferenciaMaterialOS,
  atualizarVariacao,
  atualizarCatalogoVariacao,
  atualizarListaOS,
  avancarListaOS,
  voltarListaOS,
  duplicarListaOS,
  copiarListaParaOS,
  transferirListaParaOS,
  listarHistoricoListaOS,

  deletarMaterialOS,
  deletarListaOS,
  deletarVariacaoMaterial,

  salvarImagemMaterial,
  vincularImagemExistente
};
