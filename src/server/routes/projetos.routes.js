const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const controller = require('../controllers/projetos.controller');
const PermissoesService = require('../services/permissoes.service');

async function autorizarMetas(req, res, next) {
  try {
    const permissoes = await PermissoesService.listarMinhasPermissoes(req.user.id);
    const permissao = permissoes['menu.projetos'];
    const acao = req.method === 'GET' ? 'visualizar' : req.method === 'POST' ? 'adicionar' : 'editar';
    if (permissao?.configurado && (!permissao.visualizar || !permissao[acao])) {
      return res.status(403).json({ sucesso: false, mensagem: 'Sem permissão para esta ação em Projetos.' });
    }
    next();
  } catch (err) { next(err); }
}

router.use(verificarAutenticacao);
router.get('/painel', controller.listarPainel);
router.get('/responsaveis', controller.listarResponsaveis);
router.get('/metas', autorizarMetas, controller.consultarMetas);
router.post('/metas', autorizarMetas, controller.gravarMetas);
router.put('/metas', autorizarMetas, controller.gravarMetas);
router.put('/metas/responsaveis/:id', autorizarMetas, controller.gravarMetas);
router.get('/os/:id/resumo', controller.buscarDetalheOS);
router.post('/os/:id/expectativas', autorizarMetas, controller.cadastrarExpectativa);

module.exports = router;
