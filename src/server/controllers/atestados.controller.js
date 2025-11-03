const atestadosService = require('../services/atestados.service');

async function deleteAtestado(req, res) {
  try {
    const { id } = req.params;
    const resultado = await atestadosService.deleteAtestado(id);

    return res.status(resultado.status).json(resultado);
  } catch (err) {
    console.error('Erro no controller:', err);
    return res.status(500).json({ erro: true, mensagem: 'Erro interno no servidor.' });
  }
}

module.exports = {
  deleteAtestado,
};
