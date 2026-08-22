const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const controller = require('../controllers/material.controller');
const upload = require('../middlewares/uploudfotos.middleware');

// 🔹 catálogo
router.get('/', verificarAutenticacao, controller.getMateriais);

// 🔹 materiais por OS
router.get('/listas/estoque/pendentes', verificarAutenticacao, controller.getListasEstoque);
router.get('/listas/conferencia/finalizadas', verificarAutenticacao, controller.getListasConferencia);
router.get('/listas/os/:idOS', verificarAutenticacao, controller.getListasOS);
router.get('/listas/:id/historico', verificarAutenticacao, controller.getHistoricoListaOS);
router.post('/listas', verificarAutenticacao, controller.createListaOS);
router.put('/listas/:id', verificarAutenticacao, controller.updateListaOS);
router.put('/listas/:id/avancar', verificarAutenticacao, controller.avancarListaOS);
router.put('/listas/:id/voltar', verificarAutenticacao, controller.voltarListaOS);
router.post('/listas/:id/duplicar', verificarAutenticacao, controller.duplicarListaOS);
router.post('/listas/:id/mover-os', verificarAutenticacao, controller.moverListaOS);
router.delete('/listas/:id', verificarAutenticacao, controller.deleteListaOS);

router.get('/os/:idOS', verificarAutenticacao, controller.getMateriaisOS);
router.get('/catalogo', verificarAutenticacao, controller.getCatalogoMateriais);
router.put('/catalogo/:id', verificarAutenticacao, controller.updateCatalogoVariacao);
router.get('/variacoes', verificarAutenticacao, controller.getVariacoes);
router.get('/variacao/:id', verificarAutenticacao, controller.getVariacaoById);
router.get('/atributos/valores', verificarAutenticacao, controller.getValoresAtributo);

router.get('/os/:id/fornecedores', verificarAutenticacao, controller.getFornecedoresMaterialOS);
router.post('/os/fornecedores', verificarAutenticacao, controller.addFornecedorMaterialOS);
router.put('/os/fornecedores/:id/selecionar', verificarAutenticacao, controller.selecionarFornecedor);
router.get('/os/:id/custo', verificarAutenticacao, controller.getCustoOS);
router.get('/fornecedores', verificarAutenticacao, controller.getFornecedores);

router.put('/os/fornecedores/:id', verificarAutenticacao, controller.updateFornecedorMaterialOS);

// Upload de imagem
router.post('/upload-imagem', verificarAutenticacao, upload.single('imagemmaterial'), controller.uploadImagemMaterial);


router.post('/variacoes', verificarAutenticacao, controller.createVariacao);
router.put('/variacoes/:id/imagem-existente', verificarAutenticacao, controller.vincularImagemExistente);
router.put('/variacoes/:id', verificarAutenticacao, controller.updateVariacao);
router.delete('/variacoes/:id', verificarAutenticacao, controller.deleteVariacaoMaterial);
router.post('/variacoes/atributos', verificarAutenticacao, controller.addAtributoVariacao);
router.post('/', verificarAutenticacao, controller.criarOuBuscarMaterial);

router.post('/os/cadastrar', verificarAutenticacao, controller.createMaterialOS);
router.put('/os/editar/:id', verificarAutenticacao, controller.updateMaterialOS);
router.put('/os/conferencia/:id', verificarAutenticacao, controller.updateConferenciaMaterialOS);
router.delete('/os/excluir/:id', verificarAutenticacao, controller.deleteMaterialOS);

router.delete('/os/fornecedores/:id', verificarAutenticacao, controller.deleteFornecedorMaterialOS);

module.exports = router;
