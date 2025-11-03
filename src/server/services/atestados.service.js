const atestadosModel = require('../models/atestados.model');

async function deleteAtestado(id) {
  const result = await atestadosModel.deleteAtestado(id);

  if (result.affectedRows === 0) {
    return { erro: true, status: 404, mensagem: 'Atestado não encontrado.' };
  }

  return { sucesso: true, status: 200, mensagem: 'Atestado excluído com sucesso.' };
}

module.exports = {
  deleteAtestado,
};
