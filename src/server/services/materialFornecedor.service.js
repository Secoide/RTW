const MaterialFornecedorModel = require('../models/materialFornecedor.model');
const MaterialOSModel = require('../models/materialOS.model');

const STATUS = {
  PENDENTE: "pendente",
  PARCIAL: "parcial",
  SEPARADO: "separado",
  COMPRADO: "comprado"
};


// ================= GET =================

async function listarFornecedores(idMaterialOS) {
  return await MaterialFornecedorModel.getFornecedoresByMaterialOS(idMaterialOS);
}


// ================= ADD =================

async function adicionarFornecedor(data) {

  // ðŸ”¥ buscar material da OS
  const item = await MaterialOSModel.getMaterialOSById(data.id_material_os);

  if (!item) {
    throw new Error("Material da OS nÃ£o encontrado");
  }

  // ðŸ”¥ validaÃ§Ã£o
  validarFornecedor(data, item.quantidade);

  // ðŸ”¥ insert
  return await MaterialFornecedorModel.addFornecedor(data);
}


// ================= UPDATE =================

async function atualizarFornecedor(id, data) {
  return await MaterialFornecedorModel.updateFornecedor(id, data);
}

async function selecionarFornecedor(idFornecedor, options = {}) {
  const fornecedor = await MaterialFornecedorModel.getById(idFornecedor);
  if (!fornecedor) throw new Error("Fornecedor nao encontrado");

  const itemAtual = await MaterialOSModel.getMaterialOSById(fornecedor.id_material_os);
  if (!itemAtual) throw new Error("Material da OS nao encontrado");

  if (options.selecionado === false || options.selecionado === "false") {
    await MaterialFornecedorModel.deselecionarFornecedores(fornecedor.id_material_os);
    await MaterialOSModel.limparFornecedorMaterialOS(fornecedor.id_material_os, itemAtual);
    return true;
  }

  await MaterialFornecedorModel.selecionarFornecedor(idFornecedor, fornecedor.id_material_os);

  const materialAtualizado = {
    ...itemAtual,
    id_fornecedor: fornecedor.id_fornecedor,
    quantidade_comprada: fornecedor.quantidade || 0
  };

  await MaterialOSModel.updateMaterialOS(fornecedor.id_material_os, {
    id_fornecedor: materialAtualizado.id_fornecedor,
    quantidade_comprada: materialAtualizado.quantidade_comprada,
    status: calcularStatus(materialAtualizado)
  });

  return true;
}

// ================= CHECKS =================

function validarFornecedor(data, totalItem) {

  if (!data.valor || data.valor <= 0) {
    throw new Error("Valor invÃ¡lido");
  }

  if (data.icms !== undefined && data.icms < 0) {
    throw new Error("ICMS invÃ¡lido");
  }

  if (!data.quantidade || data.quantidade <= 0) {
    throw new Error("Quantidade invÃ¡lida");
  }

  if (data.quantidade > totalItem) {
    throw new Error(`Quantidade maior que o total (${totalItem})`);
  }

  if (!data.prazo || data.prazo <= 0) {
    throw new Error("Prazo invÃ¡lido");
  }
}

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


// ================= DELETE =================

async function deletarFornecedor(id) {
  return await MaterialFornecedorModel.deleteFornecedor(id);
}


// ================= EXPORT =================

module.exports = {
  listarFornecedores,
  adicionarFornecedor,
  atualizarFornecedor,
  selecionarFornecedor,
  deletarFornecedor
};
