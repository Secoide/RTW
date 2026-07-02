const PaineisService = require("../services/paineisEletricos.service");

function tratarErro(res, err) {
  if (err?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ erro: "Número de série já cadastrado." });
  }

  const status = err?.status || 500;
  const mensagem = err?.mensagem || err?.message || "Erro ao processar painel elétrico.";

  console.error("Erro Painéis Elétricos:", err);
  return res.status(status).json({ erro: mensagem });
}

async function listar(req, res) {
  try {
    const paineis = await PaineisService.listarPaineis();
    res.json(paineis);
  } catch (err) {
    tratarErro(res, err);
  }
}

async function proximoNumeroSerie(req, res) {
  try {
    const result = await PaineisService.gerarProximoNumeroSerie(req.query.ano);
    res.json(result);
  } catch (err) {
    tratarErro(res, err);
  }
}

async function criar(req, res) {
  try {
    const result = await PaineisService.criarPainel(req.body);
    res.status(201).json(result);
  } catch (err) {
    tratarErro(res, err);
  }
}

async function atualizar(req, res) {
  try {
    const result = await PaineisService.atualizarPainel(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    tratarErro(res, err);
  }
}

async function atualizarChecklist(req, res) {
  try {
    const result = await PaineisService.atualizarChecklist(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    tratarErro(res, err);
  }
}

async function uploadImagem(req, res) {
  try {
    const files = req.files?.length ? req.files : (req.file ? [req.file] : []);
    const result = await PaineisService.salvarImagensPainel(req.params.id, files);
    res.json(result);
  } catch (err) {
    tratarErro(res, err);
  }
}

async function deletarImagem(req, res) {
  try {
    const result = await PaineisService.deletarImagemPainel(req.params.idImagem);
    res.json(result);
  } catch (err) {
    tratarErro(res, err);
  }
}

async function deletar(req, res) {
  try {
    const result = await PaineisService.deletarPainel(req.params.id);
    res.json(result);
  } catch (err) {
    tratarErro(res, err);
  }
}

module.exports = {
  listar,
  proximoNumeroSerie,
  criar,
  atualizar,
  atualizarChecklist,
  uploadImagem,
  deletarImagem,
  deletar
};
