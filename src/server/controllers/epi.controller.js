const EPIService = require('../services/epi.service');
// GET /api/epi
async function getEPIs(req, res) {
    try {
        const epis = await EPIService.listarEPIs();
        res.json(epis);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar EPIs' });
    }
}

// GET /api/epis/:id
async function getEPI(req, res) {
  try {
    const { id } = req.params;
    console.log("📦 [DEBUG] Iniciando busca de EPI. ID recebido:", id);

    const epi = await EPIService.buscarEPI(id);

    if (!epi) {
      console.warn("⚠️ [AVISO] Nenhum EPI encontrado para ID:", id);
      return res.status(404).json({ erro: "EPI não encontrado" });
    }

    console.log("✅ [SUCESSO] EPI encontrado:", epi);
    res.json(epi);
  } catch (err) {
    console.error("❌ [ERRO getEPI]:", err);
    res.status(500).json({
      erro: "Erro ao buscar EPI",
      detalhe: err.message || err,
    });
  }
}



// POST /api/epis
async function createEPI(req, res) {
    try {
        const novo = await EPIService.criarEPI(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

// PUT /api/epi/:id
async function updateEPI(req, res) {
    try {
        const ok = await EPIService.atualizarEPI(req.params.id, req.body);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar EPI' });
    }
}

// DELETE /api/epi/:id
async function deleteEPI(req, res) {
    try {
        const ok = await EPIService.deletarEPI(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar EPI' });
    }
}

// GET /api/epis/:id
async function getEPIsByColaborador(req, res) {
    try {
        const epi = await EPIService.buscarEPIsByColaborador(req.params.idFunc);
        if (!epi) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(epi);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar EPI' });
    }
}


module.exports = {
    getEPIs,
    getEPI,
    createEPI,
    updateEPI,
    deleteEPI,
    getEPIsByColaborador
};
