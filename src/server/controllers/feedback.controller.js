const FeedbackModel = require("../models/feedback.model");

function tratarErro(res, err) {
  const status = err?.status || 500;
  const mensagem = err?.mensagem || err?.message || "Erro ao processar relato.";
  console.error("Erro Feedback:", err);
  res.status(status).json({ sucesso: false, mensagem });
}

async function criar(req, res) {
  try {
    const feedback = await FeedbackModel.criarFeedback(req.user, req.body);
    res.status(201).json({ sucesso: true, feedback });
  } catch (err) {
    tratarErro(res, err);
  }
}

async function listarMeus(req, res) {
  try {
    const feedbacks = await FeedbackModel.listarMeusFeedbacks(req.user.id);
    res.json({ sucesso: true, feedbacks });
  } catch (err) {
    tratarErro(res, err);
  }
}

async function atualizarMeu(req, res) {
  try {
    const feedback = await FeedbackModel.atualizarMeuFeedback(req.params.id, req.user.id, req.body);
    res.json({ sucesso: true, feedback });
  } catch (err) {
    tratarErro(res, err);
  }
}

async function excluirMeu(req, res) {
  try {
    res.json(await FeedbackModel.excluirMeuFeedback(req.params.id, req.user.id));
  } catch (err) {
    tratarErro(res, err);
  }
}

module.exports = {
  criar,
  listarMeus,
  atualizarMeu,
  excluirMeu
};
