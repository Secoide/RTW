const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const uploadEpiPDF = require('../middlewares/uploadExame.middleware');
const epiController = require('../controllers/epi.controller');

// -------------------------------------------------------------
// 🔒 ROTAS INTERNAS (SOMENTE USUÁRIOS LOGADOS DA RTW)
// -------------------------------------------------------------
router.post('/cadastrar', verificarAutenticacao, epiController.createEPI);
router.get('/por-colaborador/:idFunc', verificarAutenticacao, epiController.getEPIsByColaborador);
router.put('/editar/:id', verificarAutenticacao, epiController.updateEPI);
router.get('/colaborador_contem/:idfcepi', epiController.getEPIsByColaboradorContem);
router.post('/upload', verificarAutenticacao, uploadEpiPDF.single('documento'), epiController.uploadEPI);

router.head('/download/:id', verificarAutenticacao, epiController.checkEPI);
router.get('/download/:id', verificarAutenticacao, epiController.downloadEPI);

router.get("/ficha-completa/:idColab", verificarAutenticacao, epiController.gerarFichaEPI);

// -------------------------------------------------------------
// 🔐 ROTAS PARA GERAR TOKEN DE ASSINATURA (APENAS RH)
// -------------------------------------------------------------
router.post(
  "/gerar-token/:idfcepi",
  verificarAutenticacao,
  epiController.gerarTokenAssinatura
);

// -------------------------------------------------------------
// 🌐 ROTAS PÚBLICAS PARA O COLABORADOR (NÃO PRECISA LOGIN)
// Sempre exigem ?token=xxxx ou { token } no body
// -------------------------------------------------------------
router.post('/por-colaborador/assinatura', epiController.uploadAssinatura);

router.get('/assinatura/:idfcepi', epiController.getAssinatura);

router.get('/assinatura/pdf/:idfcepi', epiController.gerarPDFComAssinatura);

// -------------------------------------------------------------
// CRUD GENÉRICO (logado)
// -------------------------------------------------------------
router.get('/', verificarAutenticacao, epiController.getEPIs);
router.get('/:id', verificarAutenticacao, epiController.getEPI);
router.delete('/excluir/:id', verificarAutenticacao, epiController.deleteEPI);
router.delete('/excluir/colaborador/:id', verificarAutenticacao, epiController.deleteEPIByColaborador);

module.exports = router;
