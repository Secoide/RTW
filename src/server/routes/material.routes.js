const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const controller = require('../controllers/material.controller');
const upload = require('../middlewares/uploudfotos.middleware');
const { exigirPermissaoLista } = require("../services/material-lista-permissoes.service");
const gerenciarLista = exigirPermissaoLista("pode_gerenciar");
const mudarEstagioLista = exigirPermissaoLista("pode_mudar_estagio");

// 🔹 catálogo
router.get('/', verificarAutenticacao, controller.getMateriais);

// 🔹 materiais por OS
router.get('/listas/estoque/pendentes', verificarAutenticacao, controller.getListasEstoque);
router.get('/listas/conferencia/finalizadas', verificarAutenticacao, controller.getListasConferencia);
router.get('/listas/setor/pendentes', verificarAutenticacao, controller.getListasSetorUsuario);
router.get('/listas/os/:idOS', verificarAutenticacao, controller.getListasOS);
router.get('/listas/:id/historico', verificarAutenticacao, controller.getHistoricoListaOS);
router.delete('/listas/:id/historico/:historicoId', verificarAutenticacao, controller.excluirHistoricoListaOS);
router.get('/listas/:id/fluxo', verificarAutenticacao, controller.obterDestinoListaOS);
router.get('/listas/:id/exportar', verificarAutenticacao, gerenciarLista, controller.exportarListaOS);
router.post('/listas', verificarAutenticacao, controller.createListaOS);
router.post('/listas/importar', verificarAutenticacao,
  express.text({ type: 'application/vnd.connectpear.lista-materiais+json', limit: '16mb' }),
  controller.importarListaOS);
router.put('/listas/:id', verificarAutenticacao, gerenciarLista, controller.updateListaOS);
router.put('/listas/:id/avancar', verificarAutenticacao, mudarEstagioLista, controller.avancarListaOS);
router.put('/listas/:id/voltar', verificarAutenticacao, mudarEstagioLista, controller.voltarListaOS);
router.post('/listas/:id/duplicar', verificarAutenticacao, gerenciarLista, controller.duplicarListaOS);
router.post('/listas/:id/mover-os', verificarAutenticacao, gerenciarLista, controller.moverListaOS);
router.delete('/listas/:id', verificarAutenticacao, gerenciarLista, controller.deleteListaOS);

router.get('/os/:idOS', verificarAutenticacao, controller.getMateriaisOS);
router.get('/catalogo', verificarAutenticacao, controller.getCatalogoMateriais);
router.get('/catalogo/exportar', verificarAutenticacao, controller.exportarCatalogoMateriais);
router.post('/catalogo/importar', verificarAutenticacao,
  express.text({ type: 'application/vnd.connectpear.catalogo-materiais+json', limit: '16mb' }),
  controller.importarCatalogoMateriais, (erro, req, res, next) => {
    if (erro.type !== "entity.too.large") return next(erro);
    res.status(413).json({ erro: "O arquivo excede o limite de 16 MB." });
  });
router.put('/catalogo/:id', verificarAutenticacao, controller.updateCatalogoVariacao);
router.get('/variacoes', verificarAutenticacao, controller.getVariacoes);
router.get('/variacao/:id', verificarAutenticacao, controller.getVariacaoById);
router.get('/variacao/:id/relacionados', verificarAutenticacao, controller.getRelacionados);
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
