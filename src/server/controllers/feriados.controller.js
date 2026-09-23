const FeriadosService = require('../services/feriados.service');

async function listarFeriados(req, res) {
  try {
    res.json(await FeriadosService.listarFeriados(req.query.ano));
  } catch (erro) {
    console.error('Erro ao listar feriados:', erro);
    res.status(500).json({ erro: 'Erro ao listar feriados.' });
  }
}

async function sugerirFeriados(req, res) {
  try {
    const ano = Number(req.query.ano || new Date().getFullYear());
    res.json(await FeriadosService.sugerirFeriados(ano));
  } catch (erro) {
    console.error('Erro ao sugerir feriados:', erro);
    res.status(500).json({ erro: 'Erro ao sugerir feriados.' });
  }
}

async function criarFeriado(req, res) {
  try {
    res.status(201).json(await FeriadosService.criarFeriado(req.body));
  } catch (erro) {
    res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao cadastrar feriado.' });
  }
}

async function atualizarFeriado(req, res) {
  try {
    const atualizado = await FeriadosService.atualizarFeriado(req.params.id, req.body);
    if (!atualizado) return res.status(404).json({ erro: 'Feriado nao encontrado.' });
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao atualizar feriado.' });
  }
}

async function excluirFeriado(req, res) {
  try {
    const excluido = await FeriadosService.excluirFeriado(req.params.id);
    if (!excluido) return res.status(404).json({ erro: 'Feriado nao encontrado.' });
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir feriado.' });
  }
}

module.exports = {
  listarFeriados,
  sugerirFeriados,
  criarFeriado,
  atualizarFeriado,
  excluirFeriado
};
