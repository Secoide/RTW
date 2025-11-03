const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const supervisorController = require('../controllers/supervisor.controller');

// Rotas específicas primeiro!
router.get('/idEmpresa/:idEmpresa', verificarAutenticacao, supervisorController.getSupervisorByIdEmpresa);
router.post('/cadastrar', verificarAutenticacao, supervisorController.createSupervisor);


router.put('/editar/:id', verificarAutenticacao, supervisorController.updateSupervisor);
router.delete('/excluir/:id', verificarAutenticacao, supervisorController.deleteSupervisor);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, supervisorController.getSupervisores);
router.get('/:id', verificarAutenticacao, supervisorController.getSupervisor);

module.exports = router;
