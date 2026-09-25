const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const controller = require('../controllers/projetos.controller');

router.use(verificarAutenticacao);
router.get('/painel', controller.listarPainel);
router.get('/responsaveis', controller.listarResponsaveis);
router.get('/os/:id/resumo', controller.buscarDetalheOS);

module.exports = router;
