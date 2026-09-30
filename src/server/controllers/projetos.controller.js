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

async function consultarMetas(req, res) {
  try {
    res.json({ sucesso: true, ...await ProjetosModel.consultarMetas(req.query.mes) });
  } catch (err) {
    console.error('Erro ao consultar metas:', err);
    res.status(err.status || 500).json({ sucesso: false, mensagem: err.status ? err.message : 'Não foi possível consultar as metas.' });
  }
}

async function gravarMetas(req, res) {
  try {
    await ProjetosModel.gravarMetas(req.body, req.method === 'PUT', req.params.id ? Number(req.params.id) : null);
    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao salvar metas:', err);
    res.status(err.status || 500).json({ sucesso: false, mensagem: err.status ? err.message : 'Não foi possível salvar as metas.' });
  }
}

async function cadastrarExpectativa(req, res) {
  try {
    await ProjetosModel.cadastrarExpectativa(req.params.id, req.body);
    res.status(201).json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao cadastrar expectativa:', err);
    res.status(err.status || 500).json({ sucesso: false, mensagem: err.status ? err.message : 'Não foi possível salvar a expectativa.' });
  }
}

module.exports = { listarPainel, buscarDetalheOS, listarResponsaveis, consultarMetas, gravarMetas, cadastrarExpectativa };
