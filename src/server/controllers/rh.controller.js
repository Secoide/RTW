const RHService = require('../services/rh.service');
// GET /api/supervisor
async function getListarColabsRH(req, res) {
    try {
        const colaboradores = await RHService.listarColabsGeralRH();
        res.json(colaboradores);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar colaboradores na tabela RH' });
    }
}

module.exports = {
    getListarColabsRH
};