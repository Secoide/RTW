const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const setorController = require('../controllers/setor.controller');

// Rotas específicas primeiro!
router.get('/idCargo/:idCargo', verificarAutenticacao, setorController.getSetorByIdCargo);
router.post('/cadastrar', verificarAutenticacao, setorController.createSetor);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, setorController.getSetores);
router.get('/:id', verificarAutenticacao, setorController.getSetor);

// 🔹 Associação de cidades
router.post('/:id/cargos', verificarAutenticacao, setorController.addCargo);
router.delete('/:id/cargos/:idCargo', verificarAutenticacao, setorController.removeCargo);

router.put('/editar/:id', verificarAutenticacao, setorController.updateSetor);

router.delete('/excluir/:id', verificarAutenticacao, setorController.deleteSetor);

module.exports = router;
