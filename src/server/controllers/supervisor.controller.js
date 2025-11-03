const SupervisorService = require('../services/supervisor.service');
// GET /api/supervisor
async function getSupervisores(req, res) {
    try {
        const supervisores = await SupervisorService.listarSuperivores();
        res.json(supervisores);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar supervisores' });
    }
}

// GET /api/supervisor/:id
async function getSupervisor(req, res) {
    try {
        const supervisor = await SupervisorService.buscarSupervisor(req.params.id);
        if (!supervisor) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(supervisor);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar supervisor' });
    }
}

// GET /api/supervisor/:idEmpresa
async function getSupervisorByIdEmpresa(req, res) {
  try {
    const { idEmpresa } = req.params;
    const supervisores = await SupervisorService.buscarSupervisorIDEmpresa(idEmpresa);

    res.json(Array.isArray(supervisores) ? supervisores : []);
  } catch (err) {
    console.error("❌ Erro em getSupervisorByIdEmpresa:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar supervisores" });
  }
}

// POST /api/supervisor
async function createSupervisor(req, res) {
    try {
        const novo = await SupervisorService.criarSupervisor(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

// PUT /api/supervisor/:id
async function updateSupervisor(req, res) {
    try {
        const ok = await SupervisorService.atualizarSupervisor(req.params.id, req.body);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar supervisor' });
    }
}

// DELETE /api/supervisor/:id
async function deleteSupervisor(req, res) {
    try {
        const ok = await SupervisorService.deletarSupervisor(req.params.id);
        
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar supervisor' });
    }
}


module.exports = {
    getSupervisores,
    getSupervisor,
    getSupervisorByIdEmpresa,
    createSupervisor,
    updateSupervisor,
    deleteSupervisor
};
