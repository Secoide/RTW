const ComunicadosModel = require("../models/comunicados.model");

// ============================
// MÉTODOS
// ============================

async function listarTodos() {
    return await ComunicadosModel.getComunicados();
}

async function listarPorCategoria(categoria) {
    return await ComunicadosModel.getComunicadosPorCategoria(categoria);
}

async function novo(data) {
    return await ComunicadosModel.criarComunicado(data);
}

async function buscarPorId(id) {
    return await ComunicadosModel.getComunicadoById(id);
}

async function editar(id, data) {
    return await ComunicadosModel.updateComunicado(id, data);
}

async function excluir(id) {
    return await ComunicadosModel.excluirComunicado(id);
}

// ============================
// EXPORTS
// ============================

module.exports = {
    listarTodos,
    listarPorCategoria,
    novo,
    buscarPorId,
    editar,
    excluir
};
