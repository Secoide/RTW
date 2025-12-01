const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const colaboradoresController = require('../controllers/colaboradores.controller');
const upload = require('../middlewares/uploudfotos.middleware');

// Rotas específicas
router.get("/disponiveis", verificarAutenticacao, colaboradoresController.getColaboradoresDisp);
router.get("/emOS", verificarAutenticacao, colaboradoresController.getColaboradoresEmOS);
router.post("/excluir", verificarAutenticacao, colaboradoresController.excluirColaboradorEmos);
router.put('/setar-supervisor/:idFno', verificarAutenticacao, colaboradoresController.setColaboradorSupervisor);
router.delete('/remover-supervisor/:osID/:dataDia', verificarAutenticacao, colaboradoresController.removerSupervisorAtual);
router.get("/responsavel/cbx", verificarAutenticacao, colaboradoresController.getColaboradorResponsavelOS);
router.get("/historico-atestar/:id", verificarAutenticacao, colaboradoresController.getHistoricoAtestar);
router.get("/dadosCPFRG/:osID/:dataDia", verificarAutenticacao, colaboradoresController.getDadosCPFRG);
router.post('/atestar', verificarAutenticacao, colaboradoresController.cadastrarAtestado);
router.get("/historico-empresas/:idFuncionario", verificarAutenticacao, colaboradoresController.getHistoricoColabPorEmpresas);
router.get("/cbx", verificarAutenticacao, colaboradoresController.getColaboradorCBX);
router.get("/aniversariantes", verificarAutenticacao, colaboradoresController.getColaboradoresAniversariantes);

// Upload de foto
router.post('/upload-foto', verificarAutenticacao, upload.single('fotoperfil'), colaboradoresController.uploadFoto);

// CRUD
router.get('/', verificarAutenticacao, colaboradoresController.getColaboradores);
router.get('/:id', verificarAutenticacao, colaboradoresController.getColaborador);
router.post('/cadastrar', verificarAutenticacao, colaboradoresController.createColaborador);
router.put('/editar/:id', verificarAutenticacao, colaboradoresController.updateColaborador);
router.put('/editar-profissional/:id', verificarAutenticacao, colaboradoresController.updateProfissionalColab);
router.delete('/:id', verificarAutenticacao, colaboradoresController.deleteColaborador);

module.exports = router;
