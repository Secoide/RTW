const router = require('express').Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const FeriasController = require('../controllers/ferias.controller');

function exigirFeriasAdmin(req, res, next) {
  if (Number(req.user?.role) === 99) return next();

  return res.status(403).json({
    sucesso: false,
    mensagem: 'Sem permissao para gerenciar ferias.'
  });
}

router.get('/', verificarAutenticacao, exigirFeriasAdmin, FeriasController.getFerias);
router.post('/', verificarAutenticacao, exigirFeriasAdmin, FeriasController.criarFerias);
router.put('/:id', verificarAutenticacao, exigirFeriasAdmin, FeriasController.updateFerias);
router.patch('/:id/status', verificarAutenticacao, exigirFeriasAdmin, FeriasController.updateStatus);
router.delete('/:id', verificarAutenticacao, exigirFeriasAdmin, FeriasController.excluirFerias);

module.exports = router;
