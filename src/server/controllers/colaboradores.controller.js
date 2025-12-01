const ColabService = require('../services/colaboradores.service');

// GET /api/colaboradores
async function getColaboradores(req, res) {
    try {
        const colaboradores = await ColabService.listarColaboradores();
        res.json(colaboradores);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar colaboradores' });
    }
}

// GET /api/colaboradores/:id
async function getColaborador(req, res) {
    try {
        const colaborador = await ColabService.buscarColaborador(req.params.id);
        if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(colaborador);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar colaborador' });
    }
}

// POST /api/colaboradores
async function createColaborador(req, res) {
  console.log('REQ.BODY:', req.body);
  try {
    const novo = await ColabService.criarColaborador(req.body);

    res.status(201).json({
      sucesso: true,
      id: novo.id,
      senhaPadrao: novo.senhaPadrao || null
    });

  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}


// PUT /api/colaboradores/:id
async function updateColaborador(req, res) {
  try {
    const { id } = req.params; // vem da URL
    const atualizado = await ColabService.atualizarColaborador(id, req.body);

    res.status(200).json({
      sucesso: true,
      id: atualizado.id
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function updateProfissionalColab(req, res) {
  try {
    const { id } = req.params; // vem da URL
    const atualizado = await ColabService.atualizarProfissionalColab(id, req.body);

    res.status(200).json({
      sucesso: true,
      id: atualizado.id
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

// DELETE /api/colaboradores/:id
async function deleteColaborador(req, res) {
    try {
        const ok = await ColabService.deletarColaborador(req.params.id);
        if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao deletar' });
    }
}

// GET /api/colaboradores/:dia
async function getColaboradoresDisp(req, res) {
  try {

    const dataDia = req.query.dataDia;

    const colaboradores = await ColabService.listarColaboradoresDisponiveis(dataDia);

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradoresDisp:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaboradores" });
  }
}

async function getColaboradoresEmOS(req, res) {
  try {
    const dataDia = req.query.dataDia;

    const colaboradores = await ColabService.listarColaboradoresEmOS(dataDia);

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradoresEmOS:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaboradores em OS" });
  }
}

async function excluirColaboradorEmos(req, res, next) {
  try {
    const { osID, id, idNaOS } = req.body;

    const result = await ColabService.excluirColaboradorEmOS(osID, id, idNaOS);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/colaborador/responsavel/cbx
async function getColaboradorResponsavelOS(req, res) {
  try {
    const colaboradores = await ColabService.listarColaboradoresResponsavelOS();

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradorResponsavelOS:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaborador responsavel OS" });
  }
}

// GET /api/colaborador/cbx
async function getColaboradorCBX(req, res) {
  try {
    const colaboradores = await ColabService.listarColaboradoresCBX();

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradorCBX:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaboradores CBX" });
  }
}

async function getColaboradoresAniversariantes(req, res) {
    try {
        const colaboradores = await ColabService.listarColaboradoresAniversariantes();
        res.json(colaboradores);
    } catch (err) {
        console.error("Erro ao buscar aniversariantes:", err.message);
        res.status(500).json({ erro: "Erro ao buscar aniversariantes" });
    }
}


async function setColaboradorSupervisor(req, res, next) {
  try {
    const { idFno } = req.params;   // aqui pega só o valor
    const { osID, dataDia } = req.body;

    if (!idFno || !osID || !dataDia) {
      return res.status(400).json({ sucesso: false, mensagem: "idFno, osID e dataDia são obrigatórios" });
    }

    const result = await ColabService.setarSupervisor(idFno, osID, dataDia);
    res.json({ sucesso: true, ...result });
  } catch (err) {
    next(err);
  }
}

// Remover supervisor
async function removerSupervisorAtual(req, res, next) {
  try {
    const { osID, dataDia } = req.params;

    if (!osID || !dataDia) {
      return res.status(400).json({ sucesso: false, mensagem: "osID e dataDia são obrigatórios" });
    }

    const result = await ColabService.removerSupervisorAtual(osID, dataDia);

    if (result === 0) {
      return res.status(404).json({ sucesso: false, mensagem: "Nenhum supervisor encontrado para remover." });
    }

    res.json({ sucesso: true, mensagem: "Supervisor removido com sucesso." });
  } catch (err) {
    next(err);
  }
}

async function cadastrarAtestado(req, res) {
  try {
    const resultado = await ColabService.cadastrarAtestado(req.body);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro ao cadastrar atestado:', err.message);
    if (err.message === 'Campos obrigatórios não preenchidos.') {
      return res.status(400).json({ sucesso: false, mensagem: err.message });
    }
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar atestado.' });
  }
}


async function getHistoricoAtestar(req, res) {
    try {
        const colaborador = await ColabService.buscarHistoricoAtestar(req.params.id);
        if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(colaborador);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar historico de atestados do colaborador' });
    }
}

async function getDadosCPFRG(req, res) {
    try {
        const { dataDia, osID } = req.params;
        const colaborador = await ColabService.buscarDadosCPFRG(dataDia, osID);
        if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(colaborador);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar dados do colaborador' });
    }
}

async function getHistoricoColabPorEmpresas(req, res) {
    try {
        const colaborador = await ColabService.buscarHistoricoColabPorEmpresa(req.params.idFuncionario);
        if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
        res.json(colaborador);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar historico de colaborador por empresas' });
    }
}

async function uploadFoto(req, res) {
  try {
    const { id } = req.body;
    const caminhoFoto = await ColabService.salvarFotoPerfil(id, req.file);
    res.json({ novaFotoURL: caminhoFoto });
  } catch (err) {
    console.error('Erro no upload da foto:', err);
    res.status(err.status || 500).json({ error: err.mensagem || 'Erro no upload da foto.' });
  }
}

module.exports = {
    getColaboradores,
    getColaborador,
    createColaborador,
    updateColaborador,
    updateProfissionalColab,
    deleteColaborador,
    getColaboradoresDisp,
    getColaboradoresEmOS,
    excluirColaboradorEmos,
    getColaboradorResponsavelOS,
    getColaboradorCBX,
    getColaboradoresAniversariantes,
    setColaboradorSupervisor,
    removerSupervisorAtual,
    getHistoricoAtestar,
    getDadosCPFRG,
    cadastrarAtestado,
    getHistoricoColabPorEmpresas,
    uploadFoto
};
