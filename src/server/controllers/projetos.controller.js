const ProjetosModel = require('../models/projetos.model');

async function listarPainel(req, res) {
  try {
    const dados = await ProjetosModel.listarPainel({
      mes: req.query.mes,
      idResponsavel: req.query.responsavel,
      busca: req.query.busca
    });
    res.json({ sucesso: true, ...dados });
  } catch (err) {
    console.error('Erro ao carregar painel de projetos:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Não foi possível carregar o painel de projetos.' });
  }
}

async function buscarDetalheOS(req, res) {
  try {
    const dados = await ProjetosModel.buscarDetalheOS(req.params.id, req.query.mes);
    if (!dados.os) return res.status(404).json({ sucesso: false, mensagem: 'OS não encontrada.' });
    res.json({ sucesso: true, ...dados });
  } catch (err) {
    console.error('Erro ao carregar detalhe do projeto:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Não foi possível carregar os detalhes da OS.' });
  }
}

async function listarResponsaveis(req, res) {
  try {
    res.json({ sucesso: true, responsaveis: await ProjetosModel.listarResponsaveis() });
  } catch (err) {
    console.error('Erro ao carregar responsáveis dos projetos:', err);
    res.status(500).json({ sucesso: false, mensagem: 'Não foi possível carregar os responsáveis.' });
  }
}

module.exports = { listarPainel, buscarDetalheOS, listarResponsaveis };
