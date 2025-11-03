const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const OSController = require('../controllers/os.controller');

// Rotas específicas primeiro!
router.post("/cad_OS", verificarAutenticacao, OSController.salvarOS);
router.get("/status/:dataDia", verificarAutenticacao, OSController.getStatusOS);

router.put('/editar/:id', verificarAutenticacao, OSController.updateOS);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, OSController.getOrdemServico);
router.get('/:id', verificarAutenticacao, OSController.getOrdemServicoById);
router.put('/editar-status/:id', verificarAutenticacao, OSController.updateStatusOS);


router.delete('/excluir/:id', verificarAutenticacao, OSController.deleteOS);


module.exports = router;
