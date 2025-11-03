const EmpresaService = require('../services/empresas.service');
// GET /api/empresas
async function getEmpresas(req, res) {
    try {
        const empresas = await EmpresaService.listarEmpresas();
        res.json(empresas);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar empresas' });
    }
}

// GET /api/empresas/:id
async function getEmpresa(req, res) {
    try {
        const empresa = await EmpresaService.buscarEmpresa(req.params.id);
        if (!empresa) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(empresa);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar empresa' });
    }
}

// POST /api/empresas
async function createEmpresa(req, res) {
    try {
        const novo = await EmpresaService.criarEmpresa(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

async function createEmpresaPorGestao(req, res) {
    try {
        const novo = await EmpresaService.criarEmpresaPorGestao(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

// PUT /api/empresas/:id
async function updateEmpresa(req, res) {
    try {
        const ok = await EmpresaService.atualizarEmpresa(req.params.id, req.body);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar empresa' });
    }
}

// DELETE /api/empresas/:id
async function deleteEmpresa(req, res) {
    try {
        const ok = await EmpresaService.deletarEmpresa(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar empresa' });
    }
}


// POST /api/empresas/:id/supervisores
async function addSupervisor(req, res) {
  try {
    const { id } = req.params; // id da empresa
    const { supervisorId } = req.body;
    const result = await EmpresaService.addSupervisor(Number(id), supervisorId);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}
// DELETE /api/empresas/:id/supervisores/:supervisorId
async function removeSupervisor(req, res) {
  try {
    const { id, supervisorId } = req.params;
    const result = await EmpresaService.removeSupervisor(Number(id), Number(supervisorId));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function addCidade(req, res) {
  try {
    const { id } = req.params; // id da empresa
    const { cidadeId } = req.body;
    const result = await EmpresaService.addCidade(Number(id), cidadeId);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}
// DELETE /api/empresas/:id/supervisores/:supervisorId
async function removeCidade(req, res) {
  try {
    const { id, cidadeId } = req.params;
    const result = await EmpresaService.removeCidade(Number(id), Number(cidadeId));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

module.exports = {
    getEmpresas,
    getEmpresa,
    createEmpresa,
    createEmpresaPorGestao,
    updateEmpresa,
    deleteEmpresa,
    addSupervisor,
    removeSupervisor,
    addCidade,
    removeCidade
};
