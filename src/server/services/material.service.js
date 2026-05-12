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
async function listarMateriaisOS(idOS) {
  return await MaterialOSModel.getMateriaisByOS(idOS);
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


// ================= UPDATE =================

async function atualizarMaterialOS(id, data) {

  // 🔥 busca item atual
  const lista = await MaterialOSModel.getMateriaisByOS(data.id_os);
  const itemAtual = lista.find(i => i.id == id);

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
  if (separado + comprado === total) return STATUS.SEPARADO;

  return STATUS.PENDENTE;
}


// ================= DELETE =================

async function deletarMaterialOS(id) {
  return await MaterialOSModel.deleteMaterialOS(id);
}


// ================= EXPORT =================

module.exports = {
  listarMateriais,
  listarVariacoes,
  listarVariacaoById,
  buscarPorNome,
  buscarMateriaisPorNome,
  getValoresAtributo,

  listarMateriaisOS,
  getCustoTotalOS,

  criarMaterial,
  criarVariacao,
  adicionarAtributo,
  criarOuBuscarMaterial,
  criarMaterialOS,

  atualizarMaterialOS,

  deletarMaterialOS,

  salvarImagemMaterial
};