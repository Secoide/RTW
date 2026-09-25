const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const controller = require('../controllers/permissoes.controller');

router.use(verificarAutenticacao);
router.get('/minhas', controller.listarMinhasPermissoes);
router.get('/configuracao', controller.listarConfiguracao);
router.put('/vinculo', controller.salvarVinculo);
router.delete('/vinculo', controller.excluirVinculo);

module.exports = router;
