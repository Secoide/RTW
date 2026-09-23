const router = require('express').Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const FeriadosController = require('../controllers/feriados.controller');

router.get('/sugestoes', verificarAutenticacao, FeriadosController.sugerirFeriados);
router.get('/', verificarAutenticacao, FeriadosController.listarFeriados);
router.post('/cadastrar', verificarAutenticacao, FeriadosController.criarFeriado);
router.put('/editar/:id', verificarAutenticacao, FeriadosController.atualizarFeriado);
router.delete('/excluir/:id', verificarAutenticacao, FeriadosController.excluirFeriado);

module.exports = router;
