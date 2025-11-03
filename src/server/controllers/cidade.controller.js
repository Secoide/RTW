const CidadeService = require('../services/cidade.service');
// GET /api/supervisor
async function getCidades(req, res) {
    try {
        const cidades = await CidadeService.listarCidades();
        res.json(cidades);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar cidades' });
    }
}

// GET /api/supervisor/:id
async function getCidade(req, res) {
    try {
        const supervisor = await CidadeService.buscarCidade(req.params.id);
        if (!supervisor) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(supervisor);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar supervisor' });
    }
}

// GET /api/supervisor/:idEmpresa
async function getCidadeByIdEmpresa(req, res) {
  try {
    const { idEmpresa } = req.params;
    const cidades = await CidadeService.buscarCidadeIDEmpresa(idEmpresa);

    res.json(Array.isArray(cidades) ? cidades : []);
  } catch (err) {
    console.error("❌ Erro em getCidadeByIdEmpresa:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar cidades" });
  }
}

// POST /api/supervisor
async function createCidade(req, res) {
    try {
        const novo = await CidadeService.criarCidade(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

// PUT /api/supervisor/:id
async function updateCidade(req, res) {
    try {
        const ok = await CidadeService.atualizarCidade(req.params.id, req.body);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar supervisor' });
    }
}

// DELETE /api/supervisor/:id
async function deleteCidade(req, res) {
    try {
        const ok = await CidadeService.deletarCidade(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar supervisor' });
    }
}


module.exports = {
    getCidades,
    getCidade,
    getCidadeByIdEmpresa,
    createCidade,
    updateCidade,
    deleteCidade
};
