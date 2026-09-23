const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const empresasController = require('../controllers/empresas.controller');

// Rotas específicas primeiro!
router.post('/cadastrar', verificarAutenticacao, empresasController.createEmpresa);

// 🔹 Associação de supervisores
router.post('/:id/supervisores', verificarAutenticacao, empresasController.addSupervisor);
router.delete('/:id/supervisores/:supervisorId', verificarAutenticacao, empresasController.removeSupervisor);

// 🔹 Associação de cidades
router.post('/:id/cidades', verificarAutenticacao, empresasController.addCidade);
router.delete('/:id/cidades/:cidadeId', verificarAutenticacao, empresasController.removeCidade);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, empresasController.getEmpresas);
router.get('/:id/colaboradores', verificarAutenticacao, empresasController.getColaboradoresIntegrados);
router.get('/:id', verificarAutenticacao, empresasController.getEmpresa);

router.put('/editar/:id', verificarAutenticacao, empresasController.updateEmpresa);

router.delete('/excluir/:id', verificarAutenticacao, empresasController.deleteEmpresa);

module.exports = router;

