const ExameService = require('../services/exames.service');
const path = require('path');
const fs = require('fs');

// GET /api/exame
async function getExames(req, res) {
  try {
    const exames = await ExameService.listarExames();
    res.json(exames);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar exames' });
  }
}

// GET /api/exame/:id
async function getExame(req, res) {
  try {
    const exame = await ExameService.buscarExame(req.params.id);
    if (!exame) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(exame);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar exame' });
  }
}

// POST /api/exame
async function createExame(req, res) {
  try {
    const novo = await ExameService.criarExame(req.body);
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
}

// PUT /api/exame/:id
async function updateExame(req, res) {
  try {
    const ok = await ExameService.atualizarExame(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar exame' });
  }
}

// DELETE /api/exame/:id
async function deleteExame(req, res) {
  try {
    const ok = await ExameService.deletarExame(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar exame' });
  }
}

// GET /api/exame/:id
async function getExamesByColaborador(req, res) {
  try {
    const exame = await ExameService.buscarExamesByColaborador(req.params.idFunc);
    if (!exame) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(exame);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar exame' });
  }
}

async function uploadExame(req, res) {
  try {
    const { datarealizadaExame, vencimento, idColab, exame } = req.body;
    const result = await ExameService.salvarExame({
      datarealizadaExame,
      vencimento,
      idColab,
      exame,
      file: req.file
    });

    res.status(201).json({
      id: result.id,
      message: 'Exame anexado com sucesso.'
    });
  } catch (err) {
    console.error('Erro ao salvar exame:', err);
    res.status(400).json({ error: err.message });
  }
}

async function downloadExame(req, res) {
  try {
    const { id } = req.params;
    const exame = await ExameService.baixarExame(id);

    if (!exame) return res.status(404).json({ error: "Exame não encontrado" });
    if (!exame.anexoExamePDF) return res.status(400).json({ error: "Nenhum PDF anexado para este exame." });

    const filePath = path.join(__dirname, "..", "storage", "exames", exame.anexoExamePDF);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });

    const nomeColab = exame.colaborador.replace(/\s+/g, "_");
    const nomeExame = exame.exame.replace(/\s+/g, "_");
    const data = new Date(exame.datarealizada);
    const dataFinal = `${String(data.getDate()).padStart(2, "0")}-${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;
    const nomeFinal = `${nomeColab}_${nomeExame}_${dataFinal}.pdf`;

    // headers certos
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nomeFinal}"`);

    // stream manual → garante o filename
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (err) {
    console.error("Erro ao baixar exame:", err);
    res.status(500).json({ error: "Erro interno ao baixar exame." });
  }
}

async function checkExame(req, res) {
  try {
    const { id } = req.params;
    const exame = await ExameService.baixarExame(id);

    if (!exame) return res.sendStatus(404);
    if (!exame.anexoExamePDF) return res.sendStatus(400);

    const filePath = path.join(__dirname, "..", "storage", "exames", exame.anexoExamePDF);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);

    // Se chegou aqui, está OK
    return res.sendStatus(200);
  } catch (err) {
    console.error("Erro no HEAD do exame:", err);
    return res.sendStatus(500);
  }
}




module.exports = {
  getExames,
  getExame,
  createExame,
  updateExame,
  deleteExame,
  getExamesByColaborador,
  uploadExame,
  downloadExame,
  checkExame
};
