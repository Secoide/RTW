const CargoService = require('../services/cargo.service');

async function getCargos(req, res) {
    try {
        const cargos = await CargoService.listarCargos();
        res.json(cargos);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar cargos' });
    }
}

async function getCargosCBX(req, res) {
    try {
        const { setor } = req.query;
        const cargos = await CargoService.listarCargosCBX(setor);
        res.json(cargos);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

async function createCargo(req, res) {
    try {
        const result = await CargoService.criarCargo(req.body);
        res.status(201).json({
            sucesso: true,
            id: result.insertId
        });
    } catch (err) {
        res.status(400).json({
            sucesso: false,
            mensagem: err.message
        });
    }
}




// GET /api/supervisor/:idSetor
async function getCargoByIdSetor(req, res) {
  try {
    const { idSetor } = req.params;
    const cargos = await CargoService.buscarCargoIDSetor(idSetor);

    res.json(Array.isArray(cargos) ? cargos : []);
  } catch (err) {
    console.error("❌ Erro em getCargoByIdSetor:", err);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar cargos" });
  }
}

async function updateCargo(req, res) {
    try {
        const { id } = req.params;
        await CargoService.atualizarCargo(id, req.body);
        res.json({
            sucesso: true,
            mensagem: 'Cargo atualizado com sucesso'
        });
    } catch (err) {
        res.status(400).json({
            sucesso: false,
            mensagem: err.message
        });
    }
}

async function deleteCargo(req, res) {
    try {
        const { id } = req.params;
        await CargoService.excluirCargo(id);
        res.json({
            sucesso: true,
            mensagem: 'Cargo excluído com sucesso'
        });
    } catch (err) {
        res.status(400).json({
            sucesso: false,
            mensagem: err.message
        });
    }
}

module.exports = {
    getCargos,
    getCargosCBX,
    createCargo,
    updateCargo,
    deleteCargo,
    getCargoByIdSetor
};
