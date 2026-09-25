const PermissoesService = require('../services/permissoes.service');

async function listarConfiguracao(req, res) {
  try {
    res.json(await PermissoesService.listarConfiguracao(req.user));
  } catch (erro) {
    res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.message });
  }
}

async function listarMinhasPermissoes(req, res) {
  try {
    const permissoes = await PermissoesService.listarMinhasPermissoes(req.user.id);
    res.json({ sucesso: true, permissoes });
  } catch (erro) {
    res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.message });
  }
}

async function salvarVinculo(req, res) {
  try {
    const vinculo = await PermissoesService.salvarVinculo(req.user, req.body);
    res.json({ sucesso: true, vinculo, mensagem: 'Permissão salva com sucesso.' });
  } catch (erro) {
    res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.message });
  }
}

async function excluirVinculo(req, res) {
  try {
    await PermissoesService.excluirVinculo(req.user, req.body);
    res.json({ sucesso: true, mensagem: 'Vínculo removido. A regra antiga volta a valer.' });
  } catch (erro) {
    res.status(erro.status || 500).json({ sucesso: false, mensagem: erro.message });
  }
}

module.exports = {
  listarConfiguracao,
  listarMinhasPermissoes,
  salvarVinculo,
  excluirVinculo
};
