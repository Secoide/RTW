const FornecedorService = require('../services/fornecedor.service');
// GET /api/fornecedor
async function getFornecedores(req, res) {
    try {
        const fornecedores = await FornecedorService.listarFornecedores();
        res.json(fornecedores);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar fornecedores' });
    }
}

// GET /api/fornecedor/:id
async function getFornecedor(req, res) {
    try {
        const fornecedor = await FornecedorService.buscarFornecedor(req.params.id);
        if (!fornecedor) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(fornecedor);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar fornecedor' });
    }
}


// POST /api/fornecedor
async function createFornecedor(req, res) {
    try {
        const novo = await FornecedorService.criarFornecedor(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

// PUT /api/fornecedor/:id
async function updateFornecedor(req, res) {
    try {
        const ok = await FornecedorService.atualizarFornecedor(req.params.id, req.body);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar fornecedor' });
    }
}

// DELETE /api/fornecedor/:id
async function deleteFornecedor(req, res) {
    try {
        const ok = await FornecedorService.deletarFornecedor(req.params.id);
        
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar fornecedor' });
    }
}


module.exports = {
    getFornecedores,
    getFornecedor,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor
};
