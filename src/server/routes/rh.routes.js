const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const rhController = require('../controllers/rh.controller');

// Rotas específicas primeiro!

// Rotas CRUD (protegidas por autenticação)
router.get('/listar-geral', verificarAutenticacao, rhController.getListarColabsRH);

module.exports = router;
