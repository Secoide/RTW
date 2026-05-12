const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const controller = require('../controllers/material.controller');
const upload = require('../middlewares/uploudfotos.middleware');

// 🔹 catálogo
router.get('/', verificarAutenticacao, controller.getMateriais);

// 🔹 materiais por OS
router.get('/os/:idOS', verificarAutenticacao, controller.getMateriaisOS);
router.get('/variacoes', verificarAutenticacao, controller.getVariacoes);
router.get('/variacao/:id', verificarAutenticacao, controller.getVariacaoById);
router.get('/atributos/valores', verificarAutenticacao, controller.getValoresAtributo);

router.get('/os/:id/fornecedores', verificarAutenticacao, controller.getFornecedoresMaterialOS);
router.post('/os/fornecedores', verificarAutenticacao, controller.addFornecedorMaterialOS);
router.put('/os/fornecedores/:id/selecionar', verificarAutenticacao, controller.selecionarFornecedor);
router.get('/os/:id/custo', verificarAutenticacao, controller.getCustoOS);
router.get('/fornecedores', verificarAutenticacao, controller.getFornecedores);

router.put('/os/fornecedores/:id', controller.updateFornecedorMaterialOS);

// Upload de imagem
router.post('/upload-imagem', verificarAutenticacao, upload.single('imagemmaterial'), controller.uploadImagemMaterial);


router.post('/variacoes', verificarAutenticacao, controller.createVariacao);
router.post('/variacoes/atributos', verificarAutenticacao, controller.addAtributoVariacao);
router.post('/', verificarAutenticacao, controller.criarOuBuscarMaterial);

router.post('/os/cadastrar', verificarAutenticacao, controller.createMaterialOS);
router.put('/os/editar/:id', verificarAutenticacao, controller.updateMaterialOS);
router.delete('/os/excluir/:id', verificarAutenticacao, controller.deleteMaterialOS);

router.delete('/os/fornecedores/:id', verificarAutenticacao, controller.deleteFornecedorMaterialOS);

module.exports = router;