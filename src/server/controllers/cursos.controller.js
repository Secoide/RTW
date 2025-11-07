const CursoService = require('../services/cursos.service');
const path = require('path');
const fs = require('fs');

// GET /api/curso
async function getCursos(req, res) {
    try {
        const cursos = await CursoService.listarCursos();
        res.json(cursos);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar cursos' });
    }
}

// GET /api/curso/:id
async function getCurso(req, res) {
    try {
        const curso = await CursoService.buscarCurso(req.params.id);
        if (!curso) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(curso);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar curso' });
    }
}

async function getCursosCBX(req, res) {
  try {
    const cursos = await CursoService.listarCursosCBX();

    res.json(cursos);
  } catch (err) {
    console.error("❌ Erro no controller getCursosCBX:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar cursos CBX" });
  }
}



// POST /api/cursos
async function createCurso(req, res) {
    try {
        const novo = await CursoService.criarCurso(req.body);
        res.status(201).json(novo);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
}

// PUT /api/curso/:id
async function updateCurso(req, res) {
    try {
        const ok = await CursoService.atualizarCurso(req.params.id, req.body);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar curso' });
    }
}

// DELETE /api/curso/:id
async function deleteCurso(req, res) {
    try {
        const ok = await CursoService.deletarCurso(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar curso' });
    }
}

// DELETE /api/curso/:id
async function deleteCursoByColaborador(req, res) {
    try {
        const ok = await CursoService.deletarCursosByColaborador(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar curso' });
    }
}

// GET /api/cursos/:id
async function getCursosByColaborador(req, res) {
    try {
        const curso = await CursoService.buscarCursosByColaborador(req.params.idFunc);
        if (!curso) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(curso);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar curso' });
    }
}

async function uploadCurso(req, res) {
  try {
    const { datarealizadaCurso, vencimento, idColab, curso } = req.body;
    const result = await CursoService.salvarCurso({
      datarealizadaCurso,
      vencimento,
      idColab,
      curso,
      file: req.file
    });

    res.status(201).json({
      id: result.id,
      message: 'Curso anexado com sucesso.'
    });
  } catch (err) {
    console.error('Erro ao salvar curso:', err);
    res.status(400).json({ error: err.message });
  }
}

async function downloadCurso(req, res) {
  try {
    const { id } = req.params;
    const curso = await CursoService.baixarCurso(id);

    if (!curso) return res.status(404).json({ error: "Curso não encontrado" });
    if (!curso.anexoCursoPDF) return res.status(400).json({ error: "Nenhum PDF anexado para este curso." });

    const filePath = path.join(__dirname, "..", "storage", "cursos", curso.anexoCursoPDF);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });

    const nomeColab = curso.colaborador.replace(/\s+/g, "_");
    const nomeCurso = curso.curso.replace(/\s+/g, "_");
    const data = new Date(curso.datarealizada);
    const dataFinal = `${String(data.getDate()).padStart(2, "0")}-${String(data.getMonth() + 1).padStart(2, "0")}-${data.getFullYear()}`;
    const nomeFinal = `${nomeColab}_${nomeCurso}_${dataFinal}.pdf`;

    // headers certos
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nomeFinal}"`);

    // stream manual → garante o filename
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

  } catch (err) {
    console.error("Erro ao baixar curso:", err);
    res.status(500).json({ error: "Erro interno ao baixar curso." });
  }
}

async function checkCurso(req, res) {
  try {
    const { id } = req.params;
    const curso = await CursoService.baixarCurso(id);

    if (!curso) return res.sendStatus(404);
    if (!curso.anexoCursoPDF) return res.sendStatus(400);

    const filePath = path.join(__dirname, "..", "storage", "cursos", curso.anexoCursoPDF);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);

    // Se chegou aqui, está OK
    return res.sendStatus(200);
  } catch (err) {
    console.error("Erro no HEAD do curso:", err);
    return res.sendStatus(500);
  }
}




module.exports = {
    getCursos,
    getCurso,
    getCursosCBX,
    createCurso,
    updateCurso,
    deleteCurso,
    getCursosByColaborador,
    deleteCursoByColaborador,
    uploadCurso,
    downloadCurso,
    checkCurso
};
