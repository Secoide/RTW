const NotificacoesModel = require("../models/notificacoes.model");

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

module.exports = {
  listar,
  marcarLida,
  marcarTodasLidas
};
