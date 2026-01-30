const FeriasService = require('../services/ferias.service');

/* =====================================================
   GET /api/ferias
   Retorna férias + ciclos + saldo (front-ready)
===================================================== */
async function getFerias(req, res) {
  try {
    const { inicio, fim } = req.query;

    const dados = await FeriasService.listarFerias(
      inicio ? new Date(inicio) : null,
      fim ? new Date(fim) : null
    );
    return res.json(dados);
  } catch (error) {
    console.error('❌ Erro ao listar férias:', error.message);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar dados de férias.'
    });
  }
}

/* =====================================================
   PUT /api/ferias/:id
   Atualiza período (drag / ajuste manual)
===================================================== */
async function updateFerias(req, res) {
  try {
    const { id } = req.params;
    const { data_inicio, data_fim, descricao } = req.body;

    if (!data_inicio || !data_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Data inicial e final são obrigatórias.'
      });
    }

    const ok = await FeriasService.atualizarFerias(id, {
      data_inicio,
      data_fim,
      descricao
    });

    if (!ok) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Período de férias não encontrado.'
      });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Férias atualizadas com sucesso.'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar férias:', error.message);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar férias.'
    });
  }
}

async function criarFerias(req, res) {
  try {
    const { id_func, data_inicio, data_fim, status } = req.body;

    const id = await FeriasService.criarFerias({
      id_func,
      data_inicio,
      data_fim,
      status
    });

    return res.json({ sucesso: true, id });

  } catch (error) {
    console.error('❌ Erro ao criar férias:', error.message);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar férias.'
    });
  }
}




async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['avaliar', 'aprovado', 'reprovado'].includes(status)) {
      return res.status(400).json({ mensagem: 'Status inválido' });
    }

    const ok = await FeriasService.atualizarStatus(id, status);

    if (!ok) {
      return res.status(404).json({ mensagem: 'Período não encontrado' });
    }

    return res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: 'Erro ao atualizar status' });
  }
}

/* =====================================================
   DELETE /api/ferias/:id
===================================================== */
async function excluirFerias(req, res) {
  try {
    const { id } = req.params;

    const ok = await FeriasService.excluirFerias(id);

    if (!ok) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Período de férias não encontrado.'
      });
    }

    return res.json({
      sucesso: true,
      mensagem: 'Férias excluídas com sucesso.'
    });

  } catch (error) {
    console.error('❌ Erro ao excluir férias:', error.message);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir férias.'
    });
  }
}



module.exports = {
  getFerias,
  updateFerias,
  updateStatus,
  criarFerias,
  excluirFerias
};
