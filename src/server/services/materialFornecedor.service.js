const MaterialFornecedorModel = require('../models/materialFornecedor.model');
const MaterialOSModel = require('../models/materialOS.model');


// ================= GET =================

async function listarFornecedores(idMaterialOS) {
  return await MaterialFornecedorModel.getFornecedoresByMaterialOS(idMaterialOS);
}


// ================= ADD =================

async function adicionarFornecedor(data) {

  // 🔥 buscar material da OS
  const item = await MaterialOSModel.getMateriaisByOS(data.id_material_os);

  if (!item) {
    throw new Error("Material da OS não encontrado");
  }

  // 🔥 validação
  validarFornecedor(data, item.quantidade);

  // 🔥 insert
  return await MaterialFornecedorModel.addFornecedor(data);
}


// ================= UPDATE =================

async function atualizarFornecedor(id, data) {
  return await MaterialFornecedorModel.updateFornecedor(id, data);
}

async function selecionarFornecedor(idFornecedor) {

  const fornecedor = await MaterialFornecedorModel.getById(idFornecedor);

  if (!fornecedor) throw new Error("Fornecedor não encontrado");

  // 🔥 marca selecionado
  await MaterialFornecedorModel.selecionarFornecedor(
    idFornecedor,
    fornecedor.id_material_os
  );

  // 🔥 atualiza material principal
  await MaterialOSModel.updateMaterialOS(fornecedor.id_material_os, {
    id_fornecedor: fornecedor.id_fornecedor,
    quantidade_comprada: fornecedor.quantidade || 0
  });

  return true;
}


// ================= CHECKS =================

function validarFornecedor(data, totalItem) {

  if (!data.valor || data.valor <= 0) {
    throw new Error("Valor inválido");
  }

  if (data.icms !== undefined && data.icms < 0) {
    throw new Error("ICMS inválido");
  }

  if (!data.quantidade || data.quantidade <= 0) {
    throw new Error("Quantidade inválida");
  }

  if (data.quantidade > totalItem) {
    throw new Error(`Quantidade maior que o total (${totalItem})`);
  }

  if (!data.prazo || data.prazo <= 0) {
    throw new Error("Prazo inválido");
  }
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