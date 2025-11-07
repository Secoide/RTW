const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const uploadExamePDF = require('../middlewares/uploadExame.middleware');
const exameController = require('../controllers/exames.controller');

// Rotas específicas primeiro!
router.post('/cadastrar', verificarAutenticacao, exameController.createExame);
router.get('/por-colaborador/:idFunc', verificarAutenticacao, exameController.getExamesByColaborador);
router.put('/editar/:id', verificarAutenticacao, exameController.updateExame);

// Upload de exame (protegido)
router.post('/upload', verificarAutenticacao, uploadExamePDF.single('documento'), exameController.uploadExame);

// Download de exame (protegido)
router.head('/download/:id', verificarAutenticacao, exameController.checkExame);
router.get('/download/:id', verificarAutenticacao, exameController.downloadExame);



// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, exameController.getExames);
router.get('/:id', verificarAutenticacao, exameController.getExame);

router.delete('/excluir/:id', verificarAutenticacao, exameController.deleteExame);
router.delete('/excluir/colaborador/:id', verificarAutenticacao, exameController.deleteExameByColaborador)

module.exports = router;
