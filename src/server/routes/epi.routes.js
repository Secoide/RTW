const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const epiController = require('../controllers/epi.controller');

// Rotas específicas primeiro!
router.post('/cadastrar', verificarAutenticacao, epiController.createEPI);
router.get('/por-colaborador/:idFunc', verificarAutenticacao, epiController.getEPIsByColaborador);

router.put('/editar/:id', verificarAutenticacao, epiController.updateEPI);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, epiController.getEPIs);
router.get('/:id', verificarAutenticacao, epiController.getEPI);

router.delete('/excluir/:id', verificarAutenticacao, epiController.deleteEPI);

module.exports = router;
