const router = require('express').Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const FeriasController = require('../controllers/ferias.controller');

router.get('/', verificarAutenticacao, FeriasController.getFerias);
router.post('/', verificarAutenticacao, FeriasController.criarFerias);
router.put('/:id', verificarAutenticacao, FeriasController.updateFerias);
router.patch('/:id/status', verificarAutenticacao, FeriasController.updateStatus);
router.delete('/:id', verificarAutenticacao, FeriasController.excluirFerias);

module.exports = router;
