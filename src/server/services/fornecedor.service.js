const FornecedorModel = require('../models/fornecedor.model');


// Listar todos
async function listarFornecedores() {
  return await FornecedorModel.getFornecedores();
}

// Buscar um
async function buscarFornecedor(id) {
  return await FornecedorModel.getFornecedorById(id);
}

// Buscar um
async function buscarFornecedorIDEmpresa(idEmpresa) {
  return await FornecedorModel.getFornecedorByIdEmpresa(idEmpresa);
}

// Criar
async function criarFornecedor(data) {
  if (!data.nome) {
    return {
      message: "Informe o nome do fornecedor"
    };
  }
  const result = await FornecedorModel.createFornecedor(data);

  return {
    message: "Fornecedor cadastrado com sucesso!",
    id: result.insertId
  };
}

// Atualizar
async function atualizarFornecedor(id, data) {
  return await FornecedorModel.updateFornecedor(id, data);
}

// Deletar
async function deletarFornecedor(id) {
  return await FornecedorModel.deleteFornecedor(id);
}

module.exports = {
  listarFornecedores,
  buscarFornecedor,
  buscarFornecedorIDEmpresa,
  criarFornecedor,
  atualizarFornecedor,
  deletarFornecedor
};
