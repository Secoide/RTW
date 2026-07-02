const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const uploadCursoPDF = require('../middlewares/uploadCurso.middleware');
const cursoController = require('../controllers/cursos.controller');

// Rotas específicas primeiro!
router.post('/cadastrar', verificarAutenticacao, cursoController.createCurso);
router.get('/por-colaborador/:idFunc', verificarAutenticacao, cursoController.getCursosByColaborador);
router.get('/historico/:idFunc/:idCurso', verificarAutenticacao, cursoController.getHistoricoCursoColaborador);
router.get("/cbx", verificarAutenticacao, cursoController.getCursosCBX);
router.put('/registro/:id', verificarAutenticacao, uploadCursoPDF.single('documento'), cursoController.updateRegistroCurso);
router.delete('/registro/:id/anexo', verificarAutenticacao, cursoController.deleteAnexoRegistroCurso);

// Upload de curso (protegido)
router.post('/upload', verificarAutenticacao, uploadCursoPDF.single('documento'), cursoController.uploadCurso);

// Download de curso (protegido)
router.head('/download/:id', verificarAutenticacao, cursoController.checkCurso);
router.get('/download/:id', verificarAutenticacao, cursoController.downloadCurso);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, cursoController.getCursos);
router.get('/:id', verificarAutenticacao, cursoController.getCurso);
router.put('/editar/:id', verificarAutenticacao, cursoController.updateCurso);
router.put('/:id', verificarAutenticacao, cursoController.updateCurso);

router.delete('/excluir/:id', verificarAutenticacao, cursoController.deleteCurso);
router.delete('/excluir/colaborador/:id', verificarAutenticacao, cursoController.deleteCursoByColaborador);

module.exports = router;
