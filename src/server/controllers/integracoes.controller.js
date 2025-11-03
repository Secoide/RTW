const IntegracaoService = require('../services/integracoes.service');
const path = require('path');
const fs = require('fs');

// GET /api/integracao
async function getIntegracoes(req, res) {
  try {
    const integracoes = await IntegracaoService.listarIntegracoes();
    res.json(integracoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar integracoes' });
  }
}

// GET /api/integracao/:id
async function getIntegracao(req, res) {
  try {
    const integracao = await IntegracaoService.buscarIntegracao(req.params.id);
    if (!integracao) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(integracao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar integracao' });
  }
}

// POST /api/integracao
async function createIntegracao(req, res) {
  try {
    const novo = await IntegracaoService.criarIntegracao(req.body);
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

// PUT /api/integracao/:id
async function updateIntegracao(req, res) {
  try {
    const ok = await IntegracaoService.atualizarIntegracao(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar integracao' });
  }
}

// DELETE /api/integracao/:id
async function deleteIntegracao(req, res) {
  try {
    const ok = await IntegracaoService.deletarIntegracao(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar integracao' });
  }
}

// GET /api/integracao/:id
async function getIntegracoesByColaborador(req, res) {
  try {
    const integracao = await IntegracaoService.buscarIntegracoesByColaborador(req.params.idFunc);
    if (!integracao) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(integracao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar integracao' });
  }
}

async function uploadIntegracao(req, res) {
  try {
    const { datarealizadaIntegracao, vencimento, idColab, integracao } = req.body;
    const result = await IntegracaoService.salvarIntegracao({
      datarealizadaIntegracao,
      vencimento,
      idColab,
      integracao,
      file: req.file
    });

    res.status(201).json({
      id: result.id,
      message: 'Integracao anexado com sucesso.'
    });
  } catch (err) {
    console.error('Erro ao salvar integracao:', err);
    res.status(400).json({ error: err.message });
  }
}

async function downloadIntegracao(req, res) {
  try {
    const { id } = req.params;
    const integracao = await IntegracaoService.baixarIntegracao(id);

    if (!integracao) return res.status(404).json({ error: "Integracao não encontrado" });
    if (!integracao.anexoIntegracaoPDF) return res.status(400).json({ error: "Nenhum PDF anexado para este integracao." });

    const filePath = path.join(__dirname, "..", "storage", "integracoes", integracao.anexoIntegracaoPDF);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });

    const nomeColab = integracao.colaborador.replace(/\s+/g, "_");
    const nomeIntegracao = integracao.integracao.replace(/\s+/g, "_");
    const data = new Date(integracao.datarealizada);
    const dataFinal = `${String(data.getDate()).padStart(2, "0")}-${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;
    const nomeFinal = `${nomeColab}_${nomeIntegracao}_${dataFinal}.pdf`;

    // headers certos
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nomeFinal}"`);

    // stream manual → garante o filename
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (err) {
    console.error("Erro ao baixar integracao:", err);
    res.status(500).json({ error: "Erro interno ao baixar integracao." });
  }
}

async function checkIntegracao(req, res) {
  try {
    const { id } = req.params;
    const integracao = await IntegracaoService.baixarIntegracao(id);

    if (!integracao) return res.sendStatus(404);
    if (!integracao.anexoIntegracaoPDF) return res.sendStatus(400);

    const filePath = path.join(__dirname, "..", "storage", "integracoes", integracao.anexoIntegracaoPDF);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);

    // Se chegou aqui, está OK
    return res.sendStatus(200);
  } catch (err) {
    console.error("Erro no HEAD do integracao:", err);
    return res.sendStatus(500);
  }
}




module.exports = {
  getIntegracoes,
  getIntegracao,
  createIntegracao,
  updateIntegracao,
  deleteIntegracao,
  getIntegracoesByColaborador,
  uploadIntegracao,
  downloadIntegracao,
  checkIntegracao
};
