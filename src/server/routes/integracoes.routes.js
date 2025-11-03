const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const uploadIntegracaoPDF = require('../middlewares/uploadIntegracao.middleware.js');
const integracaoController = require('../controllers/integracoes.controller');

// Rotas específicas primeiro!
router.post('/cadastrar', verificarAutenticacao, integracaoController.createIntegracao);
router.get('/por-colaborador/:idFunc', verificarAutenticacao, integracaoController.getIntegracoesByColaborador);
router.put('/editar/:id', verificarAutenticacao, integracaoController.updateIntegracao);

// Upload de integracao (protegido)
router.post('/upload', verificarAutenticacao, uploadIntegracaoPDF.single('documento'), integracaoController.uploadIntegracao);

// Download de integracao (protegido)
router.head('/download/:id', verificarAutenticacao, integracaoController.checkIntegracao);
router.get('/download/:id', verificarAutenticacao, integracaoController.downloadIntegracao);



// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, integracaoController.getIntegracoes);
router.get('/:id', verificarAutenticacao, integracaoController.getIntegracao);

router.delete('/excluir/:id', verificarAutenticacao, integracaoController.deleteIntegracao);

module.exports = router;
