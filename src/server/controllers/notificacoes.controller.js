const NotificacoesModel = require("../models/notificacoes.model");
const AprovacoesModel = require("../models/aprovacoes.model");

async function listar(req, res) {
  try {
    const notificacoes = await NotificacoesModel.listarNaoLidas(req.user.id);
    res.json({ sucesso: true, notificacoes });
  } catch (err) {
    console.error("Erro ao listar notificacoes:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao carregar notificacoes."
    });
  }
}

async function marcarLida(req, res) {
  try {
    await NotificacoesModel.marcarLida(req.user.id, req.params.id);
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao marcar notificacao como lida:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar notificacao."
    });
  }
}

async function marcarTodasLidas(req, res) {
  try {
    await NotificacoesModel.marcarTodasLidas(req.user.id);
    res.json({ sucesso: true });
  } catch (err) {
    console.error("Erro ao limpar notificacoes:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao limpar notificacoes."
    });
  }
}

async function aprovar(req, res) {
  try {
    const resultado = await AprovacoesModel.decidirResponsavelOS({
      idAprovacao: req.params.id,
      aprovado: true,
      aprovadorId: req.user.id,
      aprovadorRole: req.user.role
    });

    res.json({
      sucesso: true,
      mensagem: "Solicitação aprovada com sucesso.",
      resultado
    });
  } catch (err) {
    console.error("Erro ao aprovar solicitacao:", err);
    res.status(err.status || 500).json({
      sucesso: false,
      mensagem: err.message || "Erro ao aprovar solicitação."
    });
  }
}

async function reprovar(req, res) {
  try {
    const resultado = await AprovacoesModel.decidirResponsavelOS({
      idAprovacao: req.params.id,
      aprovado: false,
      aprovadorId: req.user.id,
      aprovadorRole: req.user.role
    });

    res.json({
      sucesso: true,
      mensagem: "Solicitação reprovada.",
      resultado
    });
  } catch (err) {
    console.error("Erro ao reprovar solicitacao:", err);
    res.status(err.status || 500).json({
      sucesso: false,
      mensagem: err.message || "Erro ao reprovar solicitação."
    });
  }
}

module.exports = {
  listar,
  marcarLida,
  marcarTodasLidas,
  aprovar,
  reprovar
};
