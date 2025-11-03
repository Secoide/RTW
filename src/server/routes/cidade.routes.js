const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const cidadeController = require('../controllers/cidade.controller');

// Rotas específicas primeiro!
router.get('/idEmpresa/:idEmpresa', verificarAutenticacao, cidadeController.getCidadeByIdEmpresa);
router.post('/cadastrar', verificarAutenticacao, cidadeController.createCidade);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, cidadeController.getCidades);
router.get('/:id', verificarAutenticacao, cidadeController.getCidade);

router.put('/editar/:id', verificarAutenticacao, cidadeController.updateCidade);

router.delete('/excluir/:id', verificarAutenticacao, cidadeController.deleteCidade);

module.exports = router;
