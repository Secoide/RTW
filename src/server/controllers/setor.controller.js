const SetorService = require('../services/setor.service');
// GET /api/setor
async function getSetores(req, res) {
    try {
        const setores = await SetorService.listarSetores();
        res.json(setores);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar setores' });
    }
}

// GET /api/setor/:id
async function getSetor(req, res) {
    try {
        const setor = await SetorService.buscarSetor(req.params.id);
        if (!setor) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(setor);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar setor' });
    }
}

// GET /api/setor/:idCargo
async function getSetorByIdCargo(req, res) {
  try {
    const { idCargo } = req.params;
    const setores = await SetorService.buscarSetorIDCargo(idCargo);

    res.json(Array.isArray(setores) ? setores : []);
  } catch (err) {
    console.error("❌ Erro em getSetorByIdCargo:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar setores" });
  }
}

// POST /api/setor
async function createSetor(req, res) {
    try {
        const novo = await SetorService.criarSetor(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

// PUT /api/setor/:id
async function updateSetor(req, res) {
    try {
        const ok = await SetorService.atualizarSetor(req.params.id, req.body);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar setor' });
    }
}

// DELETE /api/setor/:id
async function deleteSetor(req, res) {
    try {
        const ok = await SetorService.deletarSetor(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar setor' });
    }
}


async function addCargo(req, res) {
  try {
    const { id } = req.params; // id do setor
    const { idCargo } = req.body;
    const result = await SetorService.addCargo(Number(id), idCargo);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

async function removeCargo(req, res) {
  try {
    const { id, idCargo } = req.params;
    const result = await SetorService.removeCargo(Number(id), Number(idCargo));
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}


module.exports = {
    getSetores,
    getSetor,
    getSetorByIdCargo,
    createSetor,
    updateSetor,
    deleteSetor,
    addCargo,
    removeCargo
};
