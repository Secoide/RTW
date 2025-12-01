const ExameService = require('../services/exames.service');
const supabase = require("../config/supabase");


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

// DELETE /api/curso/:id
async function deleteExameByColaborador(req, res) {
    try {
        const ok = await ExameService.deletarExameByColaborador(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar Exame' });
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
  const { id } = req.params;
  const exame = await ExameService.baixarExame(id);

  if (!exame) return res.status(404).json({ error: "Exame não encontrado" });
  if (!exame.anexoExamePDF) return res.status(400).json({ error: "Nenhum PDF anexado" });

  const { data, error } = await supabase.storage
    .from("exames")
    .download(exame.anexoExamePDF);

  if (error || !data) {
    return res.status(404).json({ error: "Arquivo não encontrado no Supabase" });
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${exame.anexoExamePDF}"`);

  res.send(buffer);
}


async function checkExame(req, res) {
  try {
    const { id } = req.params;
    const exame = await ExameService.baixarExame(id);

    if (!exame) return res.sendStatus(404);
    if (!exame.anexoExamePDF) return res.sendStatus(400);

    // Testa existência no Supabase
    const { data, error } = await supabase.storage
      .from("exames")
      .list("", { search: exame.anexoExamePDF });

    if (error || !data || data.length === 0) {
      return res.sendStatus(404);
    }

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
  deleteExameByColaborador,
  uploadExame,
  downloadExame,
  checkExame
};
