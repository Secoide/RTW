const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const uploadEpiPDF = require('../middlewares/uploadExame.middleware');
const epiController = require('../controllers/epi.controller');

// Rotas específicas primeiro!
router.post('/cadastrar', verificarAutenticacao, epiController.createEPI);
router.get('/por-colaborador/:idFunc', verificarAutenticacao, epiController.getEPIsByColaborador);
router.put('/editar/:id', verificarAutenticacao, epiController.updateEPI);
router.get('/colaborador_contem/:idfcepi', verificarAutenticacao, epiController.getEPIsByColaboradorContem);

// 🔥 ROTAS DE ASSINATURA – MUITO IMPORTANTE ESTAREM AQUI EM CIMA
router.post('/por-colaborador/assinatura', verificarAutenticacao, epiController.uploadAssinatura);
router.get('/assinatura/:idfcepi', verificarAutenticacao, epiController.getAssinatura);
router.get('/assinatura/pdf/:idfcepi', verificarAutenticacao, epiController.gerarPDFComAssinatura);
router.get("/ficha-completa/:idColab", verificarAutenticacao, epiController.gerarFichaEPI);


// Upload de epi (protegido)
router.post('/upload', verificarAutenticacao, uploadEpiPDF.single('documento'), epiController.uploadEPI);

// Download de epi (protegido)
router.head('/download/:id', verificarAutenticacao, epiController.checkEPI);
router.get('/download/:id', verificarAutenticacao, epiController.downloadEPI);

// ⚠️ CRUD GENÉRICO – sempre por último!
router.get('/', verificarAutenticacao, epiController.getEPIs);
router.get('/:id', verificarAutenticacao, epiController.getEPI);
router.delete('/excluir/:id', verificarAutenticacao, epiController.deleteEPI);
router.delete('/excluir/colaborador/:id', verificarAutenticacao, epiController.deleteEPIByColaborador);

module.exports = router;
