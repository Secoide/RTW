const OSService = require('../services/os.service');

async function getOrdemServico(req, res) {
  try {
    const ordemServico = await OSService.listarOrdemServico();
    res.json(ordemServico);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar Ordem de Servico' });
  }
}

async function getOrdemServicoById(req, res, next) {
  try {
    const ordemServico = await OSService.buscarOrdemServico(req.params.id);

    if (!ordemServico) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "OS não encontrada"
      });
    }

    res.json({
      sucesso: true,
      dados: ordemServico
    });
  } catch (err) {
    console.error("Erro em getOrdemServico:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar OS"
    });
    next(err); // se quiser logar no middleware global
  }
}

async function salvarOS(req, res) {
  try {
    const dados = req.body;
    const result = await OSService.salvarOS(dados);
    if (!result.sucesso) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error("Erro no controller salvarOS:", err);
    return res.status(500).json({ sucesso: false, mensagem: "Erro ao processar requisição." });
  }
}

// PUT /api/epi/:id
async function updateOS(req, res) {
  try {
    const ok = await OSService.atualizarOS(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar OS' });
  }
}




async function updateStatusOS(req, res) {
  try {
    const { id } = req.params; // vem da URL
    const atualizado = await OSService.atualizarStatusOS(id, req.body);

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

async function getStatusOS(req, res) {
  try {
    const { dataDia } = req.params;
    const ordemServico = await OSService.buscarStatusOS(dataDia);

    res.json(ordemServico); // 🔥 devolve array (ou vazio)
  } catch (err) {
    console.error("Erro em getStatusOS:", err);
    res.status(500).send("Erro ao buscar OS");
  }
}


async function deleteOS(req, res) {
  try {
    const ok = await OSService.deletarOS(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar supervisor' });
  }
}


module.exports = {
  getOrdemServico,
  getOrdemServicoById,
  salvarOS,
  updateOS,
  deleteOS,
  updateStatusOS,
  getStatusOS
};
