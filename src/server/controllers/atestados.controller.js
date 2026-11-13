const atestadosService = require('../services/atestados.service');

async function deleteAtestado(req, res) {
  if (![4, 5, 99].includes(Number(req.user?.role)) && Number(req.user?.id) !== 999) {
    return res.status(403).json({
      erro: true,
      mensagem: 'Somente RH, Diretoria e ADM podem excluir registros de ausência.'
    });
  }
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
